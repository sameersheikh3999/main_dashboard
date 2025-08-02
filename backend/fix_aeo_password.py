from django.contrib.auth.models import User

# Fix password for aeo_nilore
user = User.objects.get(username='aeo_nilore')
user.set_password('pass123')
user.save()
print(f"✅ Password updated for {user.username}")

# Test the password
if user.check_password('pass123'):
    print(f"✅ Password test successful for {user.username}")
else:
    print(f"❌ Password test failed for {user.username}") 