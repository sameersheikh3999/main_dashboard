from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=32)
    school_name = models.CharField(max_length=128, null=True, blank=True)
    sector = models.CharField(max_length=100, null=True, blank=True)
    emis = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

class Conversation(models.Model):
    id = models.CharField(primary_key=True, max_length=64)  # UUID
    school_name = models.CharField(max_length=128)
    aeo = models.ForeignKey(User, related_name='aeo_conversations', on_delete=models.CASCADE)
    principal = models.ForeignKey(User, related_name='principal_conversations', on_delete=models.CASCADE, null=True, blank=True)
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

# New models for BigQuery data caching
class TeacherData(models.Model):
    user_id = models.IntegerField()
    teacher = models.CharField(max_length=255)
    grade = models.CharField(max_length=50)
    subject = models.CharField(max_length=100)
    sector = models.CharField(max_length=100)
    emis = models.CharField(max_length=50)
    school = models.CharField(max_length=255)
    week_start = models.DateField()
    week_end = models.DateField()
    week_number = models.IntegerField()
    lp_ratio = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['school']),
            models.Index(fields=['sector']),
            models.Index(fields=['grade']),
            models.Index(fields=['subject']),
            models.Index(fields=['week_start']),
        ]

class AggregatedData(models.Model):
    school = models.CharField(max_length=255)
    sector = models.CharField(max_length=100)
    period = models.DateField()
    teacher_count = models.IntegerField()
    avg_lp_ratio = models.FloatField()
    period_type = models.CharField(max_length=20, default='weekly')  # weekly, monthly
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['school']),
            models.Index(fields=['sector']),
            models.Index(fields=['period']),
            models.Index(fields=['period_type']),
        ]

class SchoolData(models.Model):
    school_name = models.CharField(max_length=255)
    sector = models.CharField(max_length=100)
    emis = models.CharField(max_length=50)
    teacher_count = models.IntegerField()
    avg_lp_ratio = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['school_name']),
            models.Index(fields=['sector']),
        ]

class FilterOptions(models.Model):
    option_type = models.CharField(max_length=20)  # schools, sectors, grades, subjects
    option_value = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['option_type', 'option_value']
        indexes = [
            models.Index(fields=['option_type']),
        ]

class DataSyncLog(models.Model):
    sync_type = models.CharField(max_length=50)  # teacher_data, aggregated_data, school_data, filter_options
    status = models.CharField(max_length=20)  # success, failed
    records_processed = models.IntegerField(default=0)
    error_message = models.TextField(blank=True, null=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.sync_type} - {self.status} - {self.started_at}"

class UserSchoolProfile(models.Model):
    user_id = models.IntegerField()
    teacher = models.CharField(max_length=255)
    sector = models.CharField(max_length=100)
    emis = models.CharField(max_length=50)
    school = models.CharField(max_length=255)

    class Meta:
        indexes = [
            models.Index(fields=['user_id']),
            models.Index(fields=['school']),
            models.Index(fields=['sector']),
        ]
