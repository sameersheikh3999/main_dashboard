from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from google.cloud import bigquery
from api.models import UserProfile

class Command(BaseCommand):
    help = 'Create local User records for AEOs from BigQuery'

    def handle(self, *args, **options):
        self.stdout.write("🚀 Creating AEO users in local database...")
        
        try:
            # Initialize BigQuery client
            client = bigquery.Client()
            
            # Query to get all AEOs from BigQuery
            query = """
            SELECT DISTINCT
                e.Sector as sector_name,
                CONCAT('aeo_', LOWER(REPLACE(e.Sector, ' ', '_'))) as username,
                CONCAT('AEO ', e.Sector) as display_name
            FROM `tbproddb.FDE_Schools` e
            WHERE e.Sector IS NOT NULL AND e.Sector != ''
            ORDER BY e.Sector
            """
            
            # Execute query
            query_job = client.query(query)
            results = query_job.result()
            
            created_count = 0
            updated_count = 0
            
            for row in results:
                username = row.username
                sector_name = row.sector_name
                display_name = row.display_name
                
                # Check if user already exists
                user, created = User.objects.get_or_create(
                    username=username,
                    defaults={
                        'email': f'{username}@example.com',
                        'first_name': display_name,
                        'last_name': '',
                        'is_active': True
                    }
                )
                
                if created:
                    # Set a default password for AEO users
                    user.set_password('aeo123')
                    user.save()
                    self.stdout.write(
                        self.style.SUCCESS(f"✅ Created user: {username} (Sector: {sector_name})")
                    )
                    created_count += 1
                else:
                    self.stdout.write(f"ℹ️  User already exists: {username}")
                    updated_count += 1
                
                # Create or update UserProfile
                profile, profile_created = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'role': 'AEO',
                        'sector': sector_name,
                        'school_name': f'{sector_name} Sector'
                    }
                )
                
                if not profile_created:
                    # Update existing profile
                    profile.role = 'AEO'
                    profile.sector = sector_name
                    profile.school_name = f'{sector_name} Sector'
                    profile.save()
                    self.stdout.write(f"  Updated profile for: {username}")
            
            self.stdout.write(f"\n📊 Summary:")
            self.stdout.write(f"  Created users: {created_count}")
            self.stdout.write(f"  Updated users: {updated_count}")
            self.stdout.write(f"  Total AEOs: {created_count + updated_count}")
            
            # List all AEO users
            self.stdout.write(f"\n📋 All AEO users in local database:")
            aeo_users = User.objects.filter(userprofile__role='AEO')
            for user in aeo_users:
                profile = user.userprofile
                self.stdout.write(f"  - {user.username} (Sector: {profile.sector})")
            
            # Test login
            self.stdout.write(f"\n🔐 Testing AEO login...")
            test_username = 'aeo_nilore'
            test_password = 'aeo123'
            
            try:
                user = User.objects.get(username=test_username)
                if user.check_password(test_password):
                    self.stdout.write(
                        self.style.SUCCESS(f"✅ Login test successful for {test_username}")
                    )
                    self.stdout.write(f"  User ID: {user.id}")
                    self.stdout.write(f"  Role: {user.userprofile.role}")
                    self.stdout.write(f"  Sector: {user.userprofile.sector}")
                else:
                    self.stdout.write(
                        self.style.ERROR(f"❌ Password check failed for {test_username}")
                    )
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"❌ User {test_username} not found")
                )
            
            self.stdout.write(
                self.style.SUCCESS(f"\n✅ AEO user creation completed!")
            )
            self.stdout.write(f"📝 AEO users can now log in with:")
            self.stdout.write(f"   Username: aeo_<sector_name>")
            self.stdout.write(f"   Password: aeo123")
            self.stdout.write(f"   Example: aeo_nilore / aeo123")
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Error creating AEO users: {e}")
            ) 