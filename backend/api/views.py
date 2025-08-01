from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListCreateAPIView, ListAPIView, CreateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import models
from .models import UserProfile, Conversation, Message, TeacherData, AggregatedData, FilterOptions, SchoolData
from .serializers import UserSerializer, ConversationSerializer, MessageSerializer, RegisterSerializer
from .services import DataService
from rest_framework import status
from uuid import uuid4
import os
from google.cloud import bigquery

# Conversations
class ConversationListCreateView(ListCreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_role = user.userprofile.role if hasattr(user, 'userprofile') else 'Unknown'
        
        # Use select_related to prefetch user and userprofile data
        base_queryset = Conversation.objects.select_related(
            'aeo__userprofile', 
            'principal__userprofile'
        )
        
        if user_role == 'FDE':
            # FDE users see conversations where they are the principal
            return base_queryset.filter(principal=user)
        elif user_role == 'AEO':
            # AEO users see conversations where they are the AEO
            return base_queryset.filter(aeo=user)
        elif user_role == 'Principal':
            # Principal users see conversations where they are the principal
            return base_queryset.filter(principal=user)
        else:
            # Fallback for unknown roles
            return base_queryset.filter(aeo=user) | base_queryset.filter(principal=user)

    def perform_create(self, serializer):
        # Expecting aeo_id, principal_id, school_name in request.data
        aeo_id = self.request.data.get('aeo_id')
        principal_id = self.request.data.get('principal_id')
        school_name = self.request.data.get('school_name')
        aeo = User.objects.get(id=aeo_id)
        principal = User.objects.get(id=principal_id)
        serializer.save(id=str(uuid4()), aeo=aeo, principal=principal, school_name=school_name)

class MessageListView(ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs['pk']
        return Message.objects.select_related(
            'sender__userprofile', 
            'receiver__userprofile'
        ).filter(conversation_id=conversation_id).order_by('timestamp')

class UserMessagesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        """Get all messages between current user and specified user"""
        try:
            current_user = request.user
            other_user = User.objects.get(id=user_id)
            
            # Find conversations between these two users
            conversations = Conversation.objects.filter(
                (models.Q(aeo=current_user) & models.Q(principal=other_user)) |
                (models.Q(aeo=other_user) & models.Q(principal=current_user))
            )
            
            if not conversations.exists():
                return Response([], status=status.HTTP_200_OK)
            
            # Get all messages from these conversations
            conversation_ids = [conv.id for conv in conversations]
            messages = Message.objects.select_related(
                'sender__userprofile', 
                'receiver__userprofile'
            ).filter(
                conversation_id__in=conversation_ids
            ).order_by('timestamp')
            
            serializer = MessageSerializer(messages, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserConversationsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all conversations for the current user with message previews"""
        try:
            current_user = request.user
            
            # Get all conversations where current user is involved
            conversations = Conversation.objects.filter(
                models.Q(aeo=current_user) | models.Q(principal=current_user)
            ).select_related('aeo__userprofile', 'principal__userprofile')
            
            conversation_data = []
            
            for conversation in conversations:
                # Get the other user in the conversation
                if conversation.aeo == current_user:
                    other_user = conversation.principal
                    other_user_role = 'Principal'
                else:
                    other_user = conversation.aeo
                    other_user_role = 'AEO'
                
                # Get the latest message in this conversation
                latest_message = Message.objects.filter(
                    conversation=conversation
                ).order_by('-timestamp').first()
                
                # Get unread count for current user
                unread_count = Message.objects.filter(
                    conversation=conversation,
                    receiver=current_user,
                    is_read=False
                ).count()
                
                # Safely get userprofile data
                try:
                    other_user_profile = other_user.userprofile
                    other_user_school_name = other_user_profile.school_name if other_user_profile else None
                    other_user_emis = other_user_profile.emis if other_user_profile else None
                except:
                    other_user_school_name = None
                    other_user_emis = None
                
                conversation_data.append({
                    'conversation_id': conversation.id,
                    'school_name': conversation.school_name,
                    'other_user': {
                        'id': other_user.id,
                        'username': other_user.username,
                        'role': other_user_role,
                        'school_name': other_user_school_name,
                        'emis': other_user_emis,
                    },
                    'latest_message': {
                        'text': latest_message.message_text if latest_message else '',
                        'timestamp': latest_message.timestamp if latest_message else conversation.created_at,
                        'sender_id': latest_message.sender.id if latest_message else None,
                        'is_own': latest_message.sender == current_user if latest_message else False,
                    },
                    'unread_count': unread_count,
                    'created_at': conversation.created_at,
                    'last_message_at': conversation.last_message_at,
                })
            
            # Sort by last message timestamp (most recent first)
            conversation_data.sort(key=lambda x: x['last_message_at'], reverse=True)
            
            return Response(conversation_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MarkMessagesReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, conversation_id):
        """Mark all messages in a conversation as read for the current user"""
        try:
            current_user = request.user
            
            # Mark all unread messages in this conversation as read
            Message.objects.filter(
                conversation_id=conversation_id,
                receiver=current_user,
                is_read=False
            ).update(is_read=True)
            
            return Response({'success': True}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Messaging
class MessageCreateView(CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Expecting receiverId, school_name, message_text (conversation_id is optional)
        conversation_id = request.data.get('conversation_id')
        receiver_id = request.data.get('receiverId')  # Frontend sends receiverId
        school_name = request.data.get('school_name')
        message_text = request.data.get('message_text')
        
        if not all([receiver_id, school_name, message_text]):
            return Response({
                'error': 'Missing required fields: receiverId, school_name, message_text'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            sender = request.user
            
            # Try to find receiver in local database
            try:
                receiver = User.objects.get(id=receiver_id)
            except User.DoesNotExist:
                return Response({'error': 'Receiver user not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Find or create conversation
            if conversation_id:
                # Use existing conversation
                conversation = Conversation.objects.get(id=conversation_id)
            else:
                # Determine AEO and Principal based on roles
                sender_role = sender.userprofile.role
                receiver_role = receiver.userprofile.role if hasattr(receiver, 'userprofile') else 'Unknown'
                
                # For FDE to AEO messaging
                if sender_role == 'FDE' and receiver_role == 'AEO':
                    aeo_user = receiver
                    principal_user = sender
                elif sender_role == 'AEO' and receiver_role == 'FDE':
                    aeo_user = sender
                    principal_user = receiver
                # For AEO to Principal messaging
                elif sender_role == 'AEO' and receiver_role == 'Principal':
                    aeo_user = sender
                    principal_user = receiver
                elif sender_role == 'Principal' and receiver_role == 'AEO':
                    aeo_user = receiver
                    principal_user = sender
                else:
                    # Default fallback - use sender as AEO, receiver as Principal
                    aeo_user = sender
                    principal_user = receiver
                
                # Find existing conversation or create new one
                conversation, created = Conversation.objects.get_or_create(
                    school_name=school_name,
                    aeo=aeo_user,
                    principal=principal_user,
                    defaults={'id': str(uuid4())}
                )
                if created:
                    print(f"Created new conversation: {conversation.id}")
            
            message = Message.objects.create(
                id=str(uuid4()),
                conversation=conversation,
                sender=sender,
                receiver=receiver,
                school_name=school_name,
                message_text=message_text
            )
            serializer = self.get_serializer(message)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Conversation.DoesNotExist:
            return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Principals
class PrincipalListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get principals from local database
            principal_users = User.objects.filter(userprofile__role='Principal').select_related('userprofile')
            
            data = []
            for user in principal_users:
                data.append({
                    'id': user.id,
                    'username': user.username,
                    'school_name': user.userprofile.school_name or 'Unknown School',
                    'role': 'Principal',
                    'emis': user.userprofile.emis,
                    'sector': user.userprofile.sector,
                    'display_name': user.username
                })
            
            return Response(data)
            
        except Exception as e:
            print(f"Principals list error: {e}")
            return Response({'error': f'Error fetching principals: {str(e)}'}, status=500)

class PrincipalDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        schoolName = request.query_params.get('schoolName')
        if not schoolName:
            return Response({'error': 'schoolName parameter is required'}, status=400)
        
        try:
            # First try to find the principal in our local database
            principal_profile = UserProfile.objects.filter(
                role='Principal',
                school_name=schoolName
            ).select_related('user').first()
            
            if principal_profile:
                # Return the actual user data from our database
                principal_data = {
                    'id': principal_profile.user.id,  # Use actual user ID
                    'username': principal_profile.user.username,
                    'school_name': principal_profile.school_name,
                    'role': principal_profile.role,
                    'emis': principal_profile.emis,
                    'sector': principal_profile.sector,
                    'display_name': f"Principal {principal_profile.school_name}"
                }
                return Response(principal_data)
            
            # If not found in local database, try BigQuery as fallback
            try:
                # Initialize BigQuery client
                client = bigquery.Client()
                
                # Query to get principal information from BigQuery
                query = """
                SELECT DISTINCT
                    e.Institute as school_name,
                    e.EMIS,
                    e.Sector,
                    'Principal' as role,
                    CONCAT('principal_', LOWER(REPLACE(REPLACE(e.Institute, ' ', '_'), '-', '_'))) as username,
                    CONCAT('principal_', LOWER(REPLACE(REPLACE(e.Institute, ' ', '_'), '-', '_'))) as display_name
                FROM `tbproddb.FDE_Schools` e
                WHERE e.Institute = @school_name
                LIMIT 1
                """
                
                # Execute query with parameter
                query_job = client.query(query, job_config=bigquery.QueryJobConfig(
                    query_parameters=[
                        bigquery.ScalarQueryParameter("school_name", "STRING", schoolName),
                    ]
                ))
                
                results = query_job.result()
                
                # Check if we got any results
                for row in results:
                    # Try to find the user in our database by username
                    try:
                        user = User.objects.get(username=row.username)
                        principal_data = {
                            'id': user.id,  # Use actual user ID
                            'username': user.username,
                            'school_name': row.school_name,
                            'role': row.role,
                            'emis': row.EMIS,
                            'sector': row.Sector,
                            'display_name': row.display_name
                        }
                        return Response(principal_data)
                    except User.DoesNotExist:
                        # User doesn't exist in our database
                        return Response({'error': f'Principal user not found in database for school: {schoolName}'}, status=404)
                
                return Response({'error': f'School not found in BigQuery: {schoolName}'}, status=404)
                
            except Exception as e:
                print(f"BigQuery principal lookup error: {e}")
                return Response({'error': f'Error fetching principal data from BigQuery: {str(e)}'}, status=500)
                
        except Exception as e:
            print(f"Principal detail lookup error: {e}")
            return Response({'error': f'Error fetching principal data: {str(e)}'}, status=500)

# AEOs
class AEOListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Initialize BigQuery client
            client = bigquery.Client()
            
            # Query to get all AEOs from BigQuery (based on sectors)
            query = """
            SELECT DISTINCT
                e.Sector as sector_name,
                'AEO' as role,
                CONCAT('aeo_', LOWER(REPLACE(e.Sector, ' ', '_'))) as username,
                CONCAT('AEO ', e.Sector) as display_name
            FROM `tbproddb.FDE_Schools` e
            WHERE e.Sector IS NOT NULL AND e.Sector != ''
            ORDER BY e.Sector
            """
            
            # Execute query
            query_job = client.query(query)
            results = query_job.result()
            
            # Convert to list of dictionaries
            data = []
            for row in results:
                data.append({
                    'id': hash(row.sector_name) % 1000000,  # Generate a consistent ID
                    'username': row.username,
                    'sector_name': row.sector_name,
                    'role': row.role,
                    'display_name': row.display_name
                })
            
            return Response(data)
            
        except Exception as e:
            print(f"BigQuery AEOs list error: {e}")
            return Response({'error': f'Error fetching AEOs from BigQuery: {str(e)}'}, status=500)

# FDEs
class FDEListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get all FDE users from local database
            fde_users = User.objects.filter(userprofile__role='FDE')
            
            # Convert to list of dictionaries
            data = []
            for user in fde_users:
                data.append({
                    'id': user.id,
                    'username': user.username,
                    'school_name': user.userprofile.school_name or 'Unknown School',
                    'role': 'FDE',
                    'display_name': user.username
                })
            
            return Response(data)
            
        except Exception as e:
            print(f"FDEs list error: {e}")
            return Response({'error': f'Error fetching FDEs: {str(e)}'}, status=500)

# Local database endpoints (replacing BigQuery)
class LocalTeacherDataView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            user_profile = user.userprofile
            
            # Get filter parameters
            grade_filter = request.query_params.get('grade', '')
            subject_filter = request.query_params.get('subject', '')
            sector_filter = request.query_params.get('sector', '')
            
            # Build query
            queryset = TeacherData.objects.all()
            
            # Apply filters based on user role
            if user_profile.role == 'AEO' and user_profile.sector:
                queryset = queryset.filter(sector=user_profile.sector)
            elif user_profile.role == 'Principal' and user_profile.school_name:
                queryset = queryset.filter(school=user_profile.school_name)
            
            # Apply additional filters
            if grade_filter:
                queryset = queryset.filter(grade=grade_filter)
            if subject_filter:
                queryset = queryset.filter(subject=subject_filter)
            if sector_filter:
                queryset = queryset.filter(sector=sector_filter)
            
            # Limit results
            queryset = queryset.order_by('-week_start')[:1000]
            
            # Convert to list of dictionaries
            data = []
            for item in queryset:
                data.append({
                    'user_id': item.user_id,
                    'teacher': item.teacher,
                    'grade': item.grade,
                    'subject': item.subject,
                    'sector': item.sector,
                    'emis': item.emis,
                    'school': item.school,
                    'week_start': item.week_start,
                    'week_end': item.week_end,
                    'week_number': item.week_number,
                    'lp_ratio': item.lp_ratio,
                })
            
            return Response(data)
            
        except Exception as e:
            print(f"Local teacher data error: {e}")
            return Response({'error': f'Error fetching teacher data: {str(e)}'}, status=500)

class LocalAggregatedDataView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            user_profile = user.userprofile
            period = request.query_params.get('period', 'weekly')
            
            # Get filter parameters
            grade_filter = request.query_params.get('grade', '')
            subject_filter = request.query_params.get('subject', '')
            sector_filter = request.query_params.get('sector', '')
            
            # Build query
            queryset = AggregatedData.objects.filter(period_type=period)
            
            # Apply filters based on user role
            if user_profile.role == 'AEO' and user_profile.sector:
                queryset = queryset.filter(sector=user_profile.sector)
            elif user_profile.role == 'Principal' and user_profile.school_name:
                queryset = queryset.filter(school=user_profile.school_name)
            
            # Apply additional filters
            if sector_filter:
                queryset = queryset.filter(sector=sector_filter)
            
            # Limit results
            queryset = queryset.order_by('-period')[:100]
            
            # Convert to list of dictionaries
            data = []
            for item in queryset:
                data.append({
                    'school': item.school,
                    'sector': item.sector,
                    'period': item.period,
                    'teacher_count': item.teacher_count,
                    'avg_lp_ratio': item.avg_lp_ratio,
                    'period_type': item.period_type,
                })
            
            return Response(data)
            
        except Exception as e:
            print(f"Local aggregated data error: {e}")
            return Response({'error': f'Error fetching aggregated data: {str(e)}'}, status=500)

class LocalFilterOptionsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            user_profile = user.userprofile
            
            # Get all filter options
            filter_options = FilterOptions.objects.all()
            
            # Group by option type
            options = {}
            for option in filter_options:
                if option.option_type not in options:
                    options[option.option_type] = []
                options[option.option_type].append(option.option_value)
            
            # Filter based on user role
            if user_profile.role == 'AEO' and user_profile.sector:
                # For AEO, only show options for their sector
                if 'sectors' in options:
                    options['sectors'] = [user_profile.sector]
            
            return Response(options)
            
        except Exception as e:
            print(f"Local filter options error: {e}")
            return Response({'error': f'Error fetching filter options: {str(e)}'}, status=500)

class LocalSummaryStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            user_profile = user.userprofile
            
            # Get filter parameters
            sector_filter = request.query_params.get('sector', '')
            
            # Build query for school data
            queryset = SchoolData.objects.all()
            
            # Apply filters based on user role
            if user_profile.role == 'AEO' and user_profile.sector:
                queryset = queryset.filter(sector=user_profile.sector)
            elif user_profile.role == 'Principal' and user_profile.school_name:
                queryset = queryset.filter(school_name=user_profile.school_name)
            
            # Apply additional filters
            if sector_filter:
                queryset = queryset.filter(sector=sector_filter)
            
            # Calculate summary statistics
            total_schools = queryset.count()
            total_teachers = queryset.aggregate(total=models.Sum('teacher_count'))['total'] or 0
            avg_lp_ratio = queryset.aggregate(avg=models.Avg('avg_lp_ratio'))['avg'] or 0
            
            # Get recent teacher data for additional stats
            teacher_queryset = TeacherData.objects.all()
            if user_profile.role == 'AEO' and user_profile.sector:
                teacher_queryset = teacher_queryset.filter(sector=user_profile.sector)
            elif user_profile.role == 'Principal' and user_profile.school_name:
                teacher_queryset = teacher_queryset.filter(school=user_profile.school_name)
            
            if sector_filter:
                teacher_queryset = teacher_queryset.filter(sector=sector_filter)
            
            recent_teachers = teacher_queryset.order_by('-week_start')[:100]
            active_teachers = recent_teachers.count()
            
            # Calculate performance breakdown before slicing
            excellent_count = teacher_queryset.filter(lp_ratio__gte=80).count()
            good_count = teacher_queryset.filter(lp_ratio__gte=60, lp_ratio__lt=80).count()
            needs_improvement_count = teacher_queryset.filter(lp_ratio__lt=60).count()
            
            summary_stats = {
                'total_schools': total_schools,
                'total_teachers': total_teachers,
                'active_teachers': active_teachers,
                'overall_avg_lp_ratio': round(avg_lp_ratio, 2),
                'performance_breakdown': {
                    'excellent': excellent_count,
                    'good': good_count,
                    'needs_improvement': needs_improvement_count,
                }
            }
            
            return Response(summary_stats)
            
        except Exception as e:
            print(f"Local summary stats error: {e}")
            return Response({'error': f'Error fetching summary stats: {str(e)}'}, status=500)

class LocalAllSchoolsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            user_profile = user.userprofile
            
            # Get filter parameters
            sector_filter = request.query_params.get('sector', '')
            
            # Build query
            queryset = SchoolData.objects.all()
            
            # Apply filters based on user role
            if user_profile.role == 'AEO' and user_profile.sector:
                queryset = queryset.filter(sector=user_profile.sector)
            elif user_profile.role == 'Principal' and user_profile.school_name:
                queryset = queryset.filter(school_name=user_profile.school_name)
            
            # Apply additional filters
            if sector_filter:
                queryset = queryset.filter(sector=sector_filter)
            
            # Order by school name
            queryset = queryset.order_by('school_name')
            
            # Convert to list of dictionaries
            data = []
            for item in queryset:
                data.append({
                    'emis': item.emis,
                    'school_name': item.school_name,
                    'sector': item.sector,
                    'teacher_count': item.teacher_count,
                    'avg_lp_ratio': item.avg_lp_ratio,
                    'wifi_status': 'Available',  # Default value
                    'wifi_available': True,  # Default value
                    'avg_infrastructure_score': 4.0,  # Default value
                    'teachers_with_mobile_access': item.teacher_count,  # Default value
                    'mobile_phone_percentage': 100.0,  # Default value
                    'teachers_with_observations': item.teacher_count,  # Default value
                })
            
            return Response(data)
            
        except Exception as e:
            print(f"Local all schools error: {e}")
            return Response({'error': f'Error fetching schools data: {str(e)}'}, status=500)

class EnhancedSchoolsDataView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Initialize BigQuery client
            client = bigquery.Client()
            
            # Query to get enhanced school data with WiFi and mobile phone information
            query = """
            SELECT  
                c.EMIS, 
                c.Institute as school_name, 
                c.Sector as sector,
                COUNT(DISTINCT d.user_id) as teacher_count,
                AVG(LEAST(IFNULL(a.lp_started, 0) / a.max_classes, 1) * 100) as avg_lp_ratio,
                
                -- WiFi and infrastructure data from teacher observations
                COUNT(DISTINCT CASE 
                    WHEN obs.supp_learn_envi_supp_learn_envi_score IS NOT NULL 
                    THEN obs.user_id 
                END) as teachers_with_observations,
                
                AVG(CAST(obs.supp_learn_envi_supp_learn_envi_score AS FLOAT64)) as avg_infrastructure_score,
                
                -- WiFi status based on infrastructure score
                CASE 
                    WHEN AVG(CAST(obs.supp_learn_envi_supp_learn_envi_score AS FLOAT64)) >= 4.0 THEN 'Available'
                    WHEN AVG(CAST(obs.supp_learn_envi_supp_learn_envi_score AS FLOAT64)) >= 3.0 THEN 'Limited'
                    ELSE 'Not Available'
                END as wifi_status,
                
                -- Mobile phone access estimation
                COUNT(DISTINCT CASE 
                    WHEN CAST(obs.supp_learn_envi_supp_learn_envi_score AS FLOAT64) >= 3.5 
                    THEN obs.user_id 
                END) as teachers_with_mobile_access
                
            FROM `tbproddb.FDE_Schools` c
            LEFT JOIN `tbproddb.user_school_profiles` d ON c.EMIS = d.emis_1
            LEFT JOIN `tbproddb.weekly_time_table_NF` a ON d.user_id = a.user_id AND a.max_classes != 0
            LEFT JOIN `tbproddb.TEACH_TOOL_OBSERVATION` obs ON d.user_id = obs.user_id 
                AND obs.supp_learn_envi_supp_learn_envi_score IS NOT NULL 
                AND obs.supp_learn_envi_supp_learn_envi_score != ''
            GROUP BY c.EMIS, c.Institute, c.Sector
            ORDER BY c.Institute
            """
            
            query_job = client.query(query)
            results = query_job.result()
            
            # Convert results to list of dictionaries
            data = []
            for row in results:
                total_teachers = int(row.teacher_count) if row.teacher_count else 0
                mobile_access = int(row.teachers_with_mobile_access) if row.teachers_with_mobile_access else 0
                
                data.append({
                    'emis': row.EMIS,
                    'school_name': row.school_name,
                    'sector': row.sector,
                    'teacher_count': total_teachers,
                    'avg_lp_ratio': float(row.avg_lp_ratio) if row.avg_lp_ratio else 0,
                    'wifi_status': row.wifi_status or 'Not Available',
                    'wifi_available': row.wifi_status == 'Available',
                    'avg_infrastructure_score': float(row.avg_infrastructure_score) if row.avg_infrastructure_score else 0,
                    'teachers_with_mobile_access': mobile_access,
                    'mobile_phone_percentage': round((mobile_access / total_teachers * 100) if total_teachers > 0 else 0, 1),
                    'teachers_with_observations': int(row.teachers_with_observations) if row.teachers_with_observations else 0
                })
            
            return Response(data)
            
        except Exception as e:
            print(f"Error fetching enhanced schools data: {e}")
            return Response({'error': str(e)}, status=500)

class SchoolTeachersDataView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user_profile = request.user.userprofile
            
            # Only principals can access this endpoint
            if user_profile.role != 'Principal':
                return Response({'error': 'Access denied. Only principals can view school teachers data.'}, status=403)
            
            school_name = user_profile.school_name
            if not school_name:
                return Response({'error': 'School name not found in user profile'}, status=400)
            
            data = DataService.get_school_teachers_data(school_name)
            return Response(data)
        except Exception as e:
            print(f"Error fetching school teachers data: {e}")
            return Response({'error': str(e)}, status=500)

class TeacherObservationDataView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user_profile = request.user.userprofile
            school_name = request.query_params.get('school_name')
            
            # If no school_name provided, use user's school
            if not school_name and hasattr(user_profile, 'school_name'):
                school_name = user_profile.school_name
            
            if not school_name:
                return Response({'error': 'School name is required'}, status=400)
            
            # Initialize BigQuery client
            client = bigquery.Client()
            
            # Query to get teacher observation data
            query = """
            SELECT  
                a.date, 
                a.user_id, 
                c.EMIS, 
                c.Institute as School, 
                c.Sector,  
                CAST(supp_learn_envi_supp_learn_envi_score AS FLOAT64) AS supp_learn_envi_score,  
                CAST(pos_behav_expec_pos_behav_expec_score AS FLOAT64) AS pos_behav_expec_score,  
                CAST(lesson_facilitation_lesson_facilitation_score AS FLOAT64) AS lesson_facilitation_score,  
                CAST(cfu_cfu_score AS FLOAT64) AS cfu_score,  
                CAST(feedback_feedback_score AS FLOAT64) AS feedback_score,  
                CAST(ct_ct_score AS FLOAT64) AS ct_score,  
                CAST(autonomy_autonomy_score AS FLOAT64) AS autonomy_score,  
                CAST(perseverance_perseverance_score AS FLOAT64) AS perseverance_score,  
                CAST(social_social_score AS FLOAT64) AS social_score,
                
                -- Overall average across the 9 indicators
                ROUND((
                    CAST(supp_learn_envi_supp_learn_envi_score AS FLOAT64) +  
                    CAST(pos_behav_expec_pos_behav_expec_score AS FLOAT64) +  
                    CAST(lesson_facilitation_lesson_facilitation_score AS FLOAT64) +  
                    CAST(cfu_cfu_score AS FLOAT64) +  
                    CAST(feedback_feedback_score AS FLOAT64) +  
                    CAST(ct_ct_score AS FLOAT64) +  
                    CAST(autonomy_autonomy_score AS FLOAT64) +  
                    CAST(perseverance_perseverance_score AS FLOAT64) +  
                    CAST(social_social_score AS FLOAT64)
                ) / 9.0, 2) AS overall_average_score
                
            FROM `tbproddb.TEACH_TOOL_OBSERVATION` a 
            INNER JOIN `tbproddb.user_school_profiles` b ON a.user_id = b.user_id 
            INNER JOIN `tbproddb.FDE_Schools` c ON b.emis_1 = c.EMIS
            WHERE c.Institute = @school_name
                AND supp_learn_envi_supp_learn_envi_score IS NOT NULL 
                AND supp_learn_envi_supp_learn_envi_score != ''
            ORDER BY a.date DESC
            LIMIT 1000
            """
            
            # Execute query with parameter
            query_job = client.query(query, job_config=bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("school_name", "STRING", school_name),
                ]
            ))
            
            results = query_job.result()
            
            # Convert results to list of dictionaries
            data = []
            for row in results:
                data.append({
                    'date': row.date.isoformat() if row.date else None,
                    'user_id': row.user_id,
                    'emis': row.EMIS,
                    'school': row.School,
                    'sector': row.Sector,
                    'supp_learn_envi_score': float(row.supp_learn_envi_score) if row.supp_learn_envi_score else None,
                    'pos_behav_expec_score': float(row.pos_behav_expec_score) if row.pos_behav_expec_score else None,
                    'lesson_facilitation_score': float(row.lesson_facilitation_score) if row.lesson_facilitation_score else None,
                    'cfu_score': float(row.cfu_score) if row.cfu_score else None,
                    'feedback_score': float(row.feedback_score) if row.feedback_score else None,
                    'ct_score': float(row.ct_score) if row.ct_score else None,
                    'autonomy_score': float(row.autonomy_score) if row.autonomy_score else None,
                    'perseverance_score': float(row.perseverance_score) if row.perseverance_score else None,
                    'social_score': float(row.social_score) if row.social_score else None,
                    'overall_average_score': float(row.overall_average_score) if row.overall_average_score else None
                })
            
            return Response({
                'school_name': school_name,
                'total_observations': len(data),
                'observations': data
            })
            
        except Exception as e:
            print(f"Error fetching teacher observation data: {e}")
            return Response({'error': str(e)}, status=500)

class SchoolInfrastructureDataView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user_profile = request.user.userprofile
            school_name = request.query_params.get('school_name')
            
            # If no school_name provided, use user's school
            if not school_name and hasattr(user_profile, 'school_name'):
                school_name = user_profile.school_name
            
            if not school_name:
                return Response({'error': 'School name is required'}, status=400)
            
            # Initialize BigQuery client
            client = bigquery.Client()
            
            # Query to get school infrastructure data including WiFi and mobile phone usage
            query = """
            SELECT  
                c.EMIS, 
                c.Institute as School, 
                c.Sector,
                COUNT(DISTINCT a.user_id) as total_teachers,
                
                -- WiFi availability (from teacher observations - supportive learning environment)
                COUNT(DISTINCT CASE 
                    WHEN CAST(supp_learn_envi_supp_learn_envi_score AS FLOAT64) >= 4.0 
                    THEN a.user_id 
                END) as teachers_with_good_infrastructure,
                
                -- Mobile phone usage (estimated from teacher data)
                COUNT(DISTINCT CASE 
                    WHEN CAST(supp_learn_envi_supp_learn_envi_score AS FLOAT64) >= 3.5 
                    THEN a.user_id 
                END) as teachers_with_mobile_access,
                
                -- Average infrastructure score
                AVG(CAST(supp_learn_envi_supp_learn_envi_score AS FLOAT64)) as avg_infrastructure_score,
                
                -- WiFi status based on infrastructure score
                CASE 
                    WHEN AVG(CAST(supp_learn_envi_supp_learn_envi_score AS FLOAT64)) >= 4.0 THEN 'Available'
                    WHEN AVG(CAST(supp_learn_envi_supp_learn_envi_score AS FLOAT64)) >= 3.0 THEN 'Limited'
                    ELSE 'Not Available'
                END as wifi_status
                
            FROM `tbproddb.TEACH_TOOL_OBSERVATION` a 
            INNER JOIN `tbproddb.user_school_profiles` b ON a.user_id = b.user_id 
            INNER JOIN `tbproddb.FDE_Schools` c ON b.emis_1 = c.EMIS
            WHERE c.Institute = @school_name
                AND supp_learn_envi_supp_learn_envi_score IS NOT NULL 
                AND supp_learn_envi_supp_learn_envi_score != ''
            GROUP BY c.EMIS, c.Institute, c.Sector
            """
            
            # Execute query with parameter
            query_job = client.query(query, job_config=bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("school_name", "STRING", school_name),
                ]
            ))
            
            results = query_job.result()
            
            # Convert results to dictionary
            data = {}
            for row in results:
                data = {
                    'emis': row.EMIS,
                    'school': row.School,
                    'sector': row.Sector,
                    'total_teachers': int(row.total_teachers) if row.total_teachers else 0,
                    'teachers_with_good_infrastructure': int(row.teachers_with_good_infrastructure) if row.teachers_with_good_infrastructure else 0,
                    'teachers_with_mobile_access': int(row.teachers_with_mobile_access) if row.teachers_with_mobile_access else 0,
                    'avg_infrastructure_score': float(row.avg_infrastructure_score) if row.avg_infrastructure_score else 0,
                    'wifi_status': row.wifi_status,
                    'wifi_available': row.wifi_status == 'Available',
                    'mobile_phone_percentage': round((int(row.teachers_with_mobile_access) / int(row.total_teachers) * 100) if row.total_teachers and row.total_teachers > 0 else 0, 1)
                }
            
            # If no data found, return default structure
            if not data:
                data = {
                    'emis': '',
                    'school': school_name,
                    'sector': '',
                    'total_teachers': 0,
                    'teachers_with_good_infrastructure': 0,
                    'teachers_with_mobile_access': 0,
                    'avg_infrastructure_score': 0,
                    'wifi_status': 'Not Available',
                    'wifi_available': False,
                    'mobile_phone_percentage': 0
                }
            
            return Response(data)
            
        except Exception as e:
            print(f"Error fetching school infrastructure data: {e}")
            return Response({'error': str(e)}, status=500)

# Health check
class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response({'status': 'ok'})

# Data sync management
class DataSyncStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get the status of data sync and freshness"""
        try:
            freshness = DataService.check_data_freshness()
            sync_status = DataService.get_sync_status()
            
            return Response({
                'data_freshness': freshness,
                'recent_syncs': [
                    {
                        'sync_type': sync.sync_type,
                        'status': sync.status,
                        'records_processed': sync.records_processed,
                        'started_at': sync.started_at,
                        'completed_at': sync.completed_at,
                        'error_message': sync.error_message
                    }
                    for sync in sync_status
                ]
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class TriggerDataSyncView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Trigger a manual data sync from BigQuery"""
        try:
            from django.core.management import call_command
            from django.core.management.base import CommandError
            
            data_type = request.data.get('data_type', 'all')
            force = request.data.get('force', False)
            
            # Run the sync command
            call_command('sync_bigquery_data', data_type=data_type, force=force)
            
            return Response({
                'message': f'Data sync triggered successfully for {data_type}',
                'data_type': data_type,
                'force': force
            })
        except CommandError as e:
            return Response({'error': str(e)}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class CustomLoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        role = request.data.get('role', '')  # Get role from request
        
        if not username or not password:
            return Response({'error': 'Username and password required'}, status=400)
        
        # Check if username looks like an EMIS number (numeric) and password is pass123
        # Role can be 'Principal' or empty (for backward compatibility)
        if username.isdigit() and password == 'pass123' and (role == 'Principal' or role == ''):
            # This might be a principal trying to login with EMIS
            try:
                # Initialize BigQuery client
                client = bigquery.Client()
                
                # Query to find principal by EMIS
                query = """
                SELECT DISTINCT
                    e.Institute as school_name,
                    e.EMIS,
                    e.Sector,
                    'Principal' as role,
                    CONCAT('principal_', LOWER(REPLACE(REPLACE(e.Institute, ' ', '_'), '-', '_'))) as username
                FROM `tbproddb.FDE_Schools` e
                WHERE e.EMIS = @emis
                LIMIT 1
                """
                
                # Execute query with parameter
                query_job = client.query(query, job_config=bigquery.QueryJobConfig(
                    query_parameters=[
                        bigquery.ScalarQueryParameter("emis", "INT64", int(username)),
                    ]
                ))
                
                results = query_job.result()
                
                # Check if we got any results
                principal_data = None
                for row in results:
                    principal_data = {
                        'id': hash(row.school_name) % 1000000,  # Generate a consistent ID
                        'username': row.username,
                        'school_name': row.school_name,
                        'role': row.role,
                        'emis': row.EMIS,
                        'sector': row.Sector
                    }
                    break
                
                if principal_data:
                    # Create or get a virtual principal user
                    try:
                        # Try to find existing user with this username
                        user = User.objects.get(username=principal_data['username'])
                    except User.DoesNotExist:
                        # Create a new user for this principal
                        user = User.objects.create_user(
                            username=principal_data['username'],
                            password='pass123',  # Set default password
                            email=f"{principal_data['username']}@school.edu.pk"
                        )
                        
                        # Create user profile
                        UserProfile.objects.create(
                            user=user,
                            role='Principal',
                            school_name=principal_data['school_name']
                        )
                        print(f"Created new principal user: {principal_data['username']}")
                    
                    # Generate JWT token
                    refresh = RefreshToken.for_user(user)
                    user_data = UserSerializer(user).data
                    return Response({
                        'token': str(refresh.access_token),
                        'user': user_data
                    })
                else:
                    return Response({'error': 'EMIS not found or invalid'}, status=401)
                    
            except Exception as e:
                print(f"BigQuery EMIS lookup error: {e}")
                return Response({'error': 'Error looking up EMIS'}, status=500)
        
        # Regular authentication for existing users
        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=401)
        
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        return Response({
            'token': str(refresh.access_token),
            'user': user_data
        })

class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Generate JWT token for the new user
            refresh = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data
            return Response({
                'token': str(refresh.access_token),
                'user': user_data
            }, status=201)
        return Response(serializer.errors, status=400)

class UnreadMessageCountView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get unread messages count for the current user
            unread_count = Message.objects.filter(
                receiver=request.user,
                is_read=False
            ).count()
            
            return Response({
                'unread_count': unread_count
            })
        except Exception as e:
            print(f"Error getting unread message count: {e}")
            return Response({'error': f'Error getting unread message count: {str(e)}'}, status=500)

class AEOsBySectorView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            sector = request.query_params.get('sector')
            if not sector:
                return Response({'error': 'sector parameter is required'}, status=400)
            
            # Get AEOs for the specified sector
            aeos = UserProfile.objects.filter(
                role='AEO',
                sector=sector,
                user__is_active=True
            ).select_related('user')
            
            aeo_list = []
            for aeo in aeos:
                aeo_list.append({
                    'id': aeo.user.id,
                    'username': aeo.user.username,
                    'sector': aeo.sector,
                    'school_name': aeo.school_name,
                    'display_name': f"AEO {aeo.sector}" if aeo.sector else f"AEO {aeo.user.username}"
                })
            
            return Response(aeo_list)
        except Exception as e:
            print(f"Error getting AEOs by sector: {e}")
            return Response({'error': f'Error getting AEOs by sector: {str(e)}'}, status=500)
