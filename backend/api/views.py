from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListCreateAPIView, ListAPIView, CreateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import UserProfile, Conversation, Message
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
            
            # Try to find receiver in local database first
            try:
                receiver = User.objects.get(id=receiver_id)
            except User.DoesNotExist:
                # If not found in local DB, check if it's a BigQuery principal
                # The receiver_id might be a hash of the school name
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
                        CONCAT('principal_', LOWER(REPLACE(REPLACE(e.Institute, ' ', '_'), '-', '_'))) as username
                    FROM `tbproddb.FDE_Schools` e
                    WHERE e.Institute = @school_name
                    LIMIT 1
                    """
                    
                    # Execute query with parameter
                    query_job = client.query(query, job_config=bigquery.QueryJobConfig(
                        query_parameters=[
                            bigquery.ScalarQueryParameter("school_name", "STRING", school_name),
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
                    
                    if principal_data and principal_data['id'] == int(receiver_id):
                        # This is a valid BigQuery principal, create a virtual receiver
                        # For messaging purposes, we'll use the sender as both sender and receiver
                        # since we can't create a User object for BigQuery data
                        receiver = sender  # Use sender as receiver for BigQuery principals
                    else:
                        return Response({'error': 'Receiver user not found'}, status=status.HTTP_404_NOT_FOUND)
                        
                except Exception as e:
                    print(f"BigQuery principal lookup error: {e}")
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
                # For FDE to Principal messaging (if needed)
                elif sender_role == 'FDE' and receiver_role == 'Principal':
                    aeo_user = None  # Need to find the AEO for this school
                    principal_user = receiver
                elif sender_role == 'Principal' and receiver_role == 'FDE':
                    aeo_user = None  # Need to find the AEO for this school
                    principal_user = sender
                else:
                    # Default fallback
                    aeo_user = sender if sender_role == 'AEO' else receiver
                    principal_user = sender if sender_role == 'Principal' else receiver
                
                # If we need to find an AEO for FDE-Principal conversations
                if aeo_user is None:
                    # Find AEO based on school sector
                    try:
                        # Get school sector from BigQuery
                        client = bigquery.Client()
                        query = """
                        SELECT DISTINCT e.Sector
                        FROM `tbproddb.FDE_Schools` e
                        WHERE e.Institute = @school_name
                        LIMIT 1
                        """
                        query_job = client.query(query, job_config=bigquery.QueryJobConfig(
                            query_parameters=[
                                bigquery.ScalarQueryParameter("school_name", "STRING", school_name),
                            ]
                        ))
                        results = query_job.result()
                        
                        sector = None
                        for row in results:
                            sector = row.Sector
                            break
                        
                        if sector:
                            # Create a virtual AEO user for this sector
                            aeo_user = User.objects.filter(userprofile__role='AEO').first()
                            if not aeo_user:
                                # Create a placeholder AEO user if none exists
                                aeo_user = User.objects.create_user(
                                    username=f'aeo_{sector.lower().replace(" ", "_")}',
                                    password='placeholder'
                                )
                                UserProfile.objects.create(
                                    user=aeo_user,
                                    role='AEO',
                                    sector=sector
                                )
                    except Exception as e:
                        print(f"Error finding AEO for school {school_name}: {e}")
                        # Fallback to using sender as AEO
                        aeo_user = sender
                
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
            # Initialize BigQuery client
            client = bigquery.Client()
            
            # Query to get all principals from BigQuery
            query = """
            SELECT DISTINCT
                e.Institute as school_name,
                e.EMIS,
                e.Sector,
                'Principal' as role,
                CONCAT('principal_', LOWER(REPLACE(REPLACE(e.Institute, ' ', '_'), '-', '_'))) as username,
                CONCAT('principal_', LOWER(REPLACE(REPLACE(e.Institute, ' ', '_'), '-', '_'))) as display_name
            FROM `tbproddb.FDE_Schools` e
            ORDER BY e.Institute
            """
            
            # Execute query
            query_job = client.query(query)
            results = query_job.result()
            
            # Convert to list of dictionaries
            data = []
            for row in results:
                data.append({
                    'id': hash(row.school_name) % 1000000,  # Generate a consistent ID
                    'username': row.username,
                    'school_name': row.school_name,
                    'role': row.role,
                    'emis': row.EMIS,
                    'sector': row.Sector,
                    'display_name': row.display_name
                })
            
            return Response(data)
            
        except Exception as e:
            print(f"BigQuery principals list error: {e}")
            return Response({'error': f'Error fetching principals from BigQuery: {str(e)}'}, status=500)

class PrincipalDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        schoolName = request.query_params.get('schoolName')
        if not schoolName:
            return Response({'error': 'schoolName parameter is required'}, status=400)
        
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
            principal_data = None
            for row in results:
                principal_data = {
                    'id': hash(row.school_name) % 1000000,  # Generate a consistent ID
                    'username': row.username,
                    'school_name': row.school_name,
                    'role': row.role,
                    'emis': row.EMIS,
                    'sector': row.Sector,
                    'display_name': row.display_name
                }
                break
            
            if principal_data:
                return Response(principal_data)
            else:
                return Response({'error': f'School not found in BigQuery: {schoolName}'}, status=404)
                
        except Exception as e:
            print(f"BigQuery principal lookup error: {e}")
            return Response({'error': f'Error fetching principal data from BigQuery: {str(e)}'}, status=500)

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

# BigQuery endpoints (now using Django database)
class BigQueryTeacherDataView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get user info
            user = request.user
            user_profile = user.userprofile
            
            # Get filter parameters
            grade_filter = request.query_params.get('grade', '')
            subject_filter = request.query_params.get('subject', '')
            
            # Get data from Django database
            data = DataService.get_teacher_data(
                user_profile=user_profile,
                grade_filter=grade_filter,
                subject_filter=subject_filter,
                limit=1000
            )
            
            return Response(data)
            
        except Exception as e:
            print(f"Database error: {e}")
            return Response({'error': 'Unable to fetch teacher data from database'}, status=500)

class BigQueryAggregatedDataView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            period = request.query_params.get('period', 'weekly')
            user = request.user
            user_profile = user.userprofile
            
            # Get filter parameters
            grade_filter = request.query_params.get('grade', '')
            subject_filter = request.query_params.get('subject', '')
            
            # Get data from Django database
            data = DataService.get_aggregated_data(
                user_profile=user_profile,
                period=period,
                grade_filter=grade_filter,
                subject_filter=subject_filter,
                limit=100
            )
            
            return Response(data)
            
        except Exception as e:
            print(f"Database aggregation error: {e}")
            return Response({'error': 'Unable to fetch aggregated data from database'}, status=500)

class BigQueryFilterOptionsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            user_profile = user.userprofile
            
            # Get filter options from Django database
            data = DataService.get_filter_options(user_profile)
            
            return Response(data)
            
        except Exception as e:
            print(f"Database filter options error: {e}")
            return Response({'error': 'Unable to fetch filter options from database'}, status=500)

class BigQuerySummaryStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            user_profile = user.userprofile
            
            # Get filter parameters
            grade_filter = request.query_params.get('grade', '')
            subject_filter = request.query_params.get('subject', '')
            sector_filter = request.query_params.get('sector', '')
            
            # If sector filter is provided, temporarily override user's sector
            original_sector = user_profile.sector
            if sector_filter:
                user_profile.sector = sector_filter
            
            # Get summary stats from Django database
            data = DataService.get_summary_stats(
                user_profile=user_profile,
                grade_filter=grade_filter,
                subject_filter=subject_filter
            )
            
            # Restore original sector
            if sector_filter:
                user_profile.sector = original_sector
            
            return Response(data)
            
        except Exception as e:
            print(f"Database summary stats error: {e}")
            return Response({'error': 'Unable to fetch summary statistics from database'}, status=500)

class BigQueryAllSchoolsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            user_profile = user.userprofile
            
            # Get school data from Django database
            data = DataService.get_school_data(user_profile)
            
            return Response(data)
            
        except Exception as e:
            print(f"Database all schools error: {e}")
            return Response({'error': 'Unable to fetch school data from database'}, status=500)

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
