from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=32)
    school_name = models.CharField(max_length=128, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

class Conversation(models.Model):
    id = models.CharField(primary_key=True, max_length=64)  # UUID
    school_name = models.CharField(max_length=128)
    aeo = models.ForeignKey(User, related_name='aeo_conversations', on_delete=models.CASCADE)
    principal = models.ForeignKey(User, related_name='principal_conversations', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(auto_now=True)

class Message(models.Model):
    id = models.CharField(primary_key=True, max_length=64)  # UUID
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='received_messages', on_delete=models.CASCADE)
    school_name = models.CharField(max_length=128)
    message_text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
