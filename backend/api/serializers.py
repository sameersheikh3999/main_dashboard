from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Conversation, Message, SchoolData, SectorData, TeacherData

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'school_name', 'sector', 'emis']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(source='userprofile', read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'profile', 'is_superuser', 'is_staff']

class ConversationSerializer(serializers.ModelSerializer):
    aeo = UserSerializer()
    principal = UserSerializer()
    emis = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'school_name', 'aeo', 'principal', 'created_at', 'last_message_at', 'emis']
    
    def get_emis(self, obj):
        # Try to get EMIS from AEO's profile first, then from principal's profile
        if hasattr(obj.aeo, 'userprofile') and obj.aeo.userprofile.emis:
            return obj.aeo.userprofile.emis
        elif hasattr(obj.principal, 'userprofile') and obj.principal.userprofile.emis:
            return obj.principal.userprofile.emis
        return None

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer()
    receiver = UserSerializer()
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'receiver', 'school_name', 'message_text', 'timestamp', 'is_read']

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(max_length=32)
    school_name = serializers.CharField(max_length=128, required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already exists')
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )
        UserProfile.objects.create(
            user=user,
            role=validated_data['role'],
            school_name=validated_data.get('school_name', '')
        )
        return user

class SchoolDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolData
        fields = ['school_name', 'sector', 'emis', 'teacher_count', 'avg_lp_ratio']

class SectorDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectorData
        fields = ['sector', 'teacher_count', 'avg_lp_ratio', 'school_count']

class TeacherDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherData
        fields = ['user_id', 'teacher', 'sector', 'emis', 'school', 'lp_ratio']