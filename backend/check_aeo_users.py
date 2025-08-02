from django.contrib.auth.models import User
from api.models import UserProfile

# Check all AEO users
aeo_users = User.objects.filter(userprofile__role='AEO')
print(f"📋 Found {aeo_users.count()} AEO users in local database:")

for user in aeo_users:
    profile = user.userprofile
    print(f"  - ID: {user.id}, Username: {user.username}, Sector: {profile.sector}")

# Check specifically for aeo_nilore
try:
    nilore_user = User.objects.get(username='aeo_nilore')
    print(f"\n✅ Found aeo_nilore:")
    print(f"   ID: {nilore_user.id}")
    print(f"   Username: {nilore_user.username}")
    print(f"   Role: {nilore_user.userprofile.role}")
    print(f"   Sector: {nilore_user.userprofile.sector}")
    print(f"   Active: {nilore_user.is_active}")
except User.DoesNotExist:
    print(f"\n❌ aeo_nilore not found in local database") 