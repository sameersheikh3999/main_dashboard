#!/usr/bin/env python
import os
import django
from django.utils import timezone
from datetime import timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_api.settings')
django.setup()

from api.models import User, UserProfile, Conversation, Message, SchoolData, TeacherData, AggregatedData, FilterOptions, DataSyncLog

def create_sample_data():
    print("Creating sample data for admin panel...")
    
    # Create sample users if they don't exist
    users_data = [
        {'username': 'fde_user1', 'role': 'FDE', 'school_name': 'ICB G-6/3', 'sector': 'Urban-I'},
        {'username': 'fde_user2', 'role': 'FDE', 'school_name': 'ICG, F-6/2', 'sector': 'Urban-I'},
        {'username': 'aeo_nilore', 'role': 'AEO', 'school_name': 'Nilore Sector', 'sector': 'Nilore'},
        {'username': 'aeo_tarnol', 'role': 'AEO', 'school_name': 'Tarnol Sector', 'sector': 'Tarnol'},
        {'username': 'principal1', 'role': 'Principal', 'school_name': 'IMCB G-13/2', 'sector': 'Tarnol'},
        {'username': 'principal2', 'role': 'Principal', 'school_name': 'IMCB G-15', 'sector': 'Tarnol'},
    ]
    
    created_users = []
    for user_data in users_data:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={'email': f"{user_data['username']}@example.com"}
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f"Created user: {user.username}")
        
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'role': user_data['role'],
                'school_name': user_data['school_name'],
                'sector': user_data['sector'],
                'emis': f"EMIS{random.randint(1000, 9999)}"
            }
        )
        if created:
            print(f"Created profile for: {user.username}")
        
        created_users.append(user)
    
    # Create sample conversations and messages
    sample_messages = [
        "Hello, I need to discuss the teacher performance data for this week.",
        "The LP ratio has improved significantly in our school.",
        "We need to schedule a meeting to review the latest assessment results.",
        "The new teaching methodology is showing positive results.",
        "Please provide the updated attendance records.",
        "The infrastructure improvements are progressing well.",
        "We have some concerns about the recent performance metrics.",
        "The training session was very helpful for our teachers.",
        "Can you share the latest sector-wise comparison data?",
        "The student feedback has been very positive this month."
    ]
    
    # Create conversations between FDEs and AEOs
    fde_users = [u for u in created_users if u.userprofile.role == 'FDE']
    aeo_users = [u for u in created_users if u.userprofile.role == 'AEO']
    principal_users = [u for u in created_users if u.userprofile.role == 'Principal']
    
    for fde in fde_users:
        for aeo in aeo_users:
            if fde.userprofile.sector == aeo.userprofile.sector:
                conv, created = Conversation.objects.get_or_create(
                    school_name=f"{fde.userprofile.school_name} - {aeo.userprofile.school_name}",
                    aeo=aeo,
                    principal=fde,
                    defaults={'id': f"conv_{fde.id}_{aeo.id}"}
                )
                
                if created:
                    print(f"Created conversation: {conv.school_name}")
                
                # Add some messages to the conversation
                for i in range(random.randint(2, 5)):
                    sender = fde if i % 2 == 0 else aeo
                    receiver = aeo if i % 2 == 0 else fde
                    
                    message = Message.objects.create(
                        id=f"msg_{conv.id}_{i}",
                        conversation=conv,
                        sender=sender,
                        receiver=receiver,
                        school_name=conv.school_name,
                        message_text=random.choice(sample_messages),
                        timestamp=timezone.now() - timedelta(hours=random.randint(1, 168)),
                        is_read=random.choice([True, False])
                    )
                    print(f"Created message: {message.id}")
    
    # Create conversations between AEOs and Principals
    for aeo in aeo_users:
        for principal in principal_users:
            if aeo.userprofile.sector == principal.userprofile.sector:
                conv, created = Conversation.objects.get_or_create(
                    school_name=f"{aeo.userprofile.school_name} - {principal.userprofile.school_name}",
                    aeo=aeo,
                    principal=principal,
                    defaults={'id': f"conv_{aeo.id}_{principal.id}"}
                )
                
                if created:
                    print(f"Created conversation: {conv.school_name}")
                
                # Add some messages to the conversation
                for i in range(random.randint(1, 3)):
                    sender = aeo if i % 2 == 0 else principal
                    receiver = principal if i % 2 == 0 else aeo
                    
                    message = Message.objects.create(
                        id=f"msg_{conv.id}_{i}",
                        conversation=conv,
                        sender=sender,
                        receiver=receiver,
                        school_name=conv.school_name,
                        message_text=random.choice(sample_messages),
                        timestamp=timezone.now() - timedelta(hours=random.randint(1, 72)),
                        is_read=random.choice([True, False])
                    )
                    print(f"Created message: {message.id}")
    
    # Create sample school data if it doesn't exist
    if SchoolData.objects.count() == 0:
        schools_data = [
            {'school_name': 'ICB G-6/3', 'sector': 'Urban-I', 'emis': 'EMIS1001', 'teacher_count': 56, 'avg_lp_ratio': 75.5},
            {'school_name': 'ICG, F-6/2', 'sector': 'Urban-I', 'emis': 'EMIS1002', 'teacher_count': 44, 'avg_lp_ratio': 82.3},
            {'school_name': 'IMCB G-13/2', 'sector': 'Tarnol', 'emis': 'EMIS1003', 'teacher_count': 10, 'avg_lp_ratio': 68.7},
            {'school_name': 'IMCB G-15', 'sector': 'Tarnol', 'emis': 'EMIS1004', 'teacher_count': 9, 'avg_lp_ratio': 71.2},
            {'school_name': 'IMCB Maira Begwal', 'sector': 'B.K', 'emis': 'EMIS1005', 'teacher_count': 1, 'avg_lp_ratio': 65.0},
        ]
        
        for school_data in schools_data:
            school = SchoolData.objects.create(**school_data)
            print(f"Created school: {school.school_name}")
    
    # Create sample teacher data if it doesn't exist
    if TeacherData.objects.count() == 0:
        teachers_data = [
            {'teacher': 'AMIR ALI', 'grade': 'Grade 5', 'subject': 'Mathematics', 'school': 'ICB G-6/3', 'sector': 'Urban-I', 'lp_ratio': 80.0},
            {'teacher': 'FATIMA KHAN', 'grade': 'Grade 6', 'subject': 'Science', 'school': 'ICB G-6/3', 'sector': 'Urban-I', 'lp_ratio': 75.5},
            {'teacher': 'AHMED HASSAN', 'grade': 'Grade 4', 'subject': 'English', 'school': 'ICG, F-6/2', 'sector': 'Urban-I', 'lp_ratio': 85.2},
            {'teacher': 'SARA AHMED', 'grade': 'Grade 7', 'subject': 'Social Studies', 'school': 'IMCB G-13/2', 'sector': 'Tarnol', 'lp_ratio': 70.3},
            {'teacher': 'MUHAMMAD ALI', 'grade': 'Grade 8', 'subject': 'Physics', 'school': 'IMCB G-15', 'sector': 'Tarnol', 'lp_ratio': 72.8},
        ]
        
        for teacher_data in teachers_data:
            teacher = TeacherData.objects.create(**teacher_data)
            print(f"Created teacher data: {teacher.teacher}")
    
    # Create sample sync logs
    sync_types = ['teacher_data', 'school_data', 'aggregated_data']
    statuses = ['completed', 'failed', 'in_progress']
    
    for i in range(5):
        sync_log = DataSyncLog.objects.create(
            sync_type=random.choice(sync_types),
            status=random.choice(statuses),
            records_processed=random.randint(100, 1000),
            started_at=timezone.now() - timedelta(hours=random.randint(1, 24)),
            completed_at=timezone.now() - timedelta(hours=random.randint(0, 23)) if random.choice([True, False]) else None,
            error_message="Sample error message" if random.choice([True, False]) else None
        )
        print(f"Created sync log: {sync_log.sync_type}")
    
    print("\n✅ Sample data creation completed!")
    print(f"📊 Created {UserProfile.objects.count()} user profiles")
    print(f"💬 Created {Conversation.objects.count()} conversations")
    print(f"📝 Created {Message.objects.count()} messages")
    print(f"🏫 Created {SchoolData.objects.count()} schools")
    print(f"👨‍🏫 Created {TeacherData.objects.count()} teacher records")
    print(f"📋 Created {DataSyncLog.objects.count()} sync logs")

if __name__ == '__main__':
    create_sample_data() 