from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import UserProfile, Conversation, Message
from .serializers import UserSerializer, ConversationSerializer, MessageSerializer
import uuid

class UserProfileModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        self.user_profile = UserProfile.objects.create(
            user=self.user,
            role='Principal',
            school_name='Test School'
        )

    def test_user_profile_creation(self):
        self.assertEqual(self.user_profile.user.username, 'testuser')
        self.assertEqual(self.user_profile.role, 'Principal')
        self.assertEqual(self.user_profile.school_name, 'Test School')

    def test_user_profile_str_representation(self):
        expected_str = f"{self.user.username} (Principal)"
        self.assertEqual(str(self.user_profile), expected_str)

class ConversationModelTest(TestCase):
    def setUp(self):
        self.aeo = User.objects.create_user(username='aeo', password='testpass123')
        self.principal = User.objects.create_user(username='principal', password='testpass123')
        self.conversation = Conversation.objects.create(
            id=str(uuid.uuid4()),
            school_name='Test School',
            aeo=self.aeo,
            principal=self.principal
        )

    def test_conversation_creation(self):
        self.assertEqual(self.conversation.school_name, 'Test School')
        self.assertEqual(self.conversation.aeo, self.aeo)
        self.assertEqual(self.conversation.principal, self.principal)

class MessageModelTest(TestCase):
    def setUp(self):
        self.sender = User.objects.create_user(username='sender', password='testpass123')
        self.receiver = User.objects.create_user(username='receiver', password='testpass123')
        self.conversation = Conversation.objects.create(
            id=str(uuid.uuid4()),
            school_name='Test School',
            aeo=self.sender,
            principal=self.receiver
        )
        self.message = Message.objects.create(
            id=str(uuid.uuid4()),
            conversation=self.conversation,
            sender=self.sender,
            receiver=self.receiver,
            school_name='Test School',
            message_text='Hello, this is a test message'
        )

    def test_message_creation(self):
        self.assertEqual(self.message.message_text, 'Hello, this is a test message')
        self.assertEqual(self.message.sender, self.sender)
        self.assertEqual(self.message.receiver, self.receiver)
        self.assertFalse(self.message.is_read)

class AuthenticationAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        self.user_profile = UserProfile.objects.create(
            user=self.user,
            role='Principal',
            school_name='Test School'
        )

    def test_login_success(self):
        url = reverse('login')
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

    def test_login_invalid_credentials(self):
        url = reverse('login')
        data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_success(self):
        url = reverse('register')
        data = {
            'username': 'newuser',
            'password': 'newpass123',
            'email': 'new@example.com',
            'role': 'Principal',
            'school_name': 'New School'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())
        self.assertTrue(UserProfile.objects.filter(user__username='newuser').exists())

class ConversationAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.aeo = User.objects.create_user(username='aeo', password='testpass123')
        self.principal = User.objects.create_user(username='principal', password='testpass123')
        
        UserProfile.objects.create(user=self.aeo, role='AEO')
        UserProfile.objects.create(user=self.principal, role='Principal', school_name='Test School')
        
        self.conversation = Conversation.objects.create(
            id=str(uuid.uuid4()),
            school_name='Test School',
            aeo=self.aeo,
            principal=self.principal
        )

    def test_get_conversations_authenticated(self):
        self.client.force_authenticate(user=self.aeo)
        url = reverse('conversation-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_conversations_unauthenticated(self):
        url = reverse('conversation-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_conversation(self):
        self.client.force_authenticate(user=self.aeo)
        url = reverse('conversation-list')
        data = {
            'aeo_id': self.aeo.id,
            'principal_id': self.principal.id,
            'school_name': 'New School'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

class MessageAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.sender = User.objects.create_user(username='sender', password='testpass123')
        self.receiver = User.objects.create_user(username='receiver', password='testpass123')
        
        UserProfile.objects.create(user=self.sender, role='AEO')
        UserProfile.objects.create(user=self.receiver, role='Principal', school_name='Test School')
        
        self.conversation = Conversation.objects.create(
            id=str(uuid.uuid4()),
            school_name='Test School',
            aeo=self.sender,
            principal=self.receiver
        )

    def test_send_message(self):
        self.client.force_authenticate(user=self.sender)
        url = reverse('message-create')
        data = {
            'receiverId': self.receiver.id,
            'school_name': 'Test School',
            'message_text': 'Hello, this is a test message'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Message.objects.count(), 1)

    def test_get_messages(self):
        message = Message.objects.create(
            id=str(uuid.uuid4()),
            conversation=self.conversation,
            sender=self.sender,
            receiver=self.receiver,
            school_name='Test School',
            message_text='Test message'
        )
        
        self.client.force_authenticate(user=self.sender)
        url = reverse('message-list', kwargs={'pk': self.conversation.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

class PrincipalAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        UserProfile.objects.create(user=self.user, role='FDE')
        
        self.principal = User.objects.create_user(username='principal', password='testpass123')
        UserProfile.objects.create(user=self.principal, role='Principal', school_name='Test School')

    def test_get_all_principals(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('principal-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_principal_detail(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('principal-detail')
        response = self.client.get(url, {'schoolName': 'Test School'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['school_name'], 'Test School')

class HealthCheckAPITest(APITestCase):
    def test_health_check(self):
        url = reverse('health-check')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')
