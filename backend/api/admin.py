from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import (
    UserProfile, Conversation, Message, TeacherData, 
    AggregatedData, SchoolData, FilterOptions, DataSyncLog, UserSchoolProfile
)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'school_name', 'sector', 'emis')
    list_filter = ('role', 'sector')
    search_fields = ('user__username', 'user__email', 'school_name', 'emis')
    readonly_fields = ('user',)
    ordering = ('user__username',)

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'school_name', 'aeo', 'principal', 'created_at', 'last_message_at', 'message_count')
    list_filter = ('school_name', 'created_at', 'last_message_at')
    search_fields = ('school_name', 'aeo__username', 'principal__username')
    readonly_fields = ('id', 'created_at', 'last_message_at')
    ordering = ('-last_message_at',)
    
    def message_count(self, obj):
        return obj.message_set.count()
    message_count.short_description = 'Messages'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation_link', 'sender', 'receiver', 'school_name', 'message_preview', 'timestamp', 'is_read')
    list_filter = ('is_read', 'timestamp', 'school_name')
    search_fields = ('message_text', 'sender__username', 'receiver__username', 'school_name')
    readonly_fields = ('id', 'timestamp')
    ordering = ('-timestamp',)
    list_per_page = 50
    
    def conversation_link(self, obj):
        url = reverse('admin:api_conversation_change', args=[obj.conversation.id])
        return format_html('<a href="{}">{}</a>', url, obj.conversation.id)
    conversation_link.short_description = 'Conversation'
    
    def message_preview(self, obj):
        return obj.message_text[:100] + '...' if len(obj.message_text) > 100 else obj.message_text
    message_preview.short_description = 'Message Preview'

@admin.register(TeacherData)
class TeacherDataAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'grade', 'subject', 'school', 'sector', 'week_start', 'week_end', 'lp_ratio')
    list_filter = ('grade', 'subject', 'sector', 'week_start', 'week_end')
    search_fields = ('teacher', 'school', 'emis')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-week_start', 'teacher')
    list_per_page = 100

@admin.register(AggregatedData)
class AggregatedDataAdmin(admin.ModelAdmin):
    list_display = ('school', 'sector', 'period', 'teacher_count', 'avg_lp_ratio', 'period_type')
    list_filter = ('sector', 'period_type', 'period')
    search_fields = ('school', 'sector')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-period', 'school')

@admin.register(SchoolData)
class SchoolDataAdmin(admin.ModelAdmin):
    list_display = ('school_name', 'sector', 'emis', 'teacher_count', 'avg_lp_ratio')
    list_filter = ('sector',)
    search_fields = ('school_name', 'emis')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('school_name',)

@admin.register(FilterOptions)
class FilterOptionsAdmin(admin.ModelAdmin):
    list_display = ('option_type', 'option_value', 'created_at')
    list_filter = ('option_type', 'created_at')
    search_fields = ('option_value',)
    readonly_fields = ('created_at',)
    ordering = ('option_type', 'option_value')

@admin.register(DataSyncLog)
class DataSyncLogAdmin(admin.ModelAdmin):
    list_display = ('sync_type', 'status', 'records_processed', 'started_at', 'completed_at', 'duration')
    list_filter = ('sync_type', 'status', 'started_at')
    search_fields = ('sync_type', 'error_message')
    readonly_fields = ('started_at', 'completed_at')
    ordering = ('-started_at',)
    
    def duration(self, obj):
        if obj.completed_at:
            duration = obj.completed_at - obj.started_at
            return f"{duration.total_seconds():.2f}s"
        return "In Progress"
    duration.short_description = 'Duration'

@admin.register(UserSchoolProfile)
class UserSchoolProfileAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'teacher', 'school', 'sector', 'emis')
    list_filter = ('sector',)
    search_fields = ('teacher', 'school', 'emis')
    ordering = ('user_id', 'teacher')

# Customize admin site
admin.site.site_header = "Dashboard Admin Panel"
admin.site.site_title = "Dashboard Admin"
admin.site.index_title = "Welcome to Dashboard Administration"

# Add custom admin actions
@admin.action(description="Mark selected messages as read")
def mark_messages_as_read(modeladmin, request, queryset):
    queryset.update(is_read=True)
    modeladmin.message_user(request, f"{queryset.count()} messages marked as read.")

@admin.action(description="Mark selected messages as unread")
def mark_messages_as_unread(modeladmin, request, queryset):
    queryset.update(is_read=False)
    modeladmin.message_user(request, f"{queryset.count()} messages marked as unread.")

# Add actions to MessageAdmin
MessageAdmin.actions = [mark_messages_as_read, mark_messages_as_unread]
