from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/login/', views.CustomLoginView.as_view(), name='custom_login'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    # Conversations
    path('conversations/', views.UserConversationsView.as_view(), name='user-conversations'),
    path('conversations/<str:pk>/messages/', views.MessageListView.as_view(), name='conversation-messages'),
    path('conversations/<str:conversation_id>/mark-read/', views.MarkMessagesReadView.as_view(), name='mark-messages-read'),
    # Messaging
    path('messages/', views.MessageCreateView.as_view(), name='send-message'),
    path('users/<int:user_id>/messages/', views.UserMessagesView.as_view(), name='user-messages'),
    # Principals
    path('principals/', views.PrincipalListView.as_view(), name='principals'),
    path('principals/detail/', views.PrincipalDetailView.as_view(), name='principal-detail'),
    # AEOs
    path('aeos/', views.AEOListView.as_view(), name='aeos'),
    # FDEs
    path('fdes/', views.FDEListView.as_view(), name='fdes'),
    # Local database endpoints (replacing BigQuery)
    path('bigquery/teacher-data/', views.LocalTeacherDataView.as_view(), name='bigquery-teacher-data'),
    path('bigquery/aggregated-data/', views.LocalAggregatedDataView.as_view(), name='bigquery-aggregated-data'),
    path('bigquery/filter-options/', views.LocalFilterOptionsView.as_view(), name='bigquery-filter-options'),
    path('bigquery/summary-stats/', views.LocalSummaryStatsView.as_view(), name='bigquery-summary-stats'),
    path('bigquery/all-schools/', views.LocalAllSchoolsView.as_view(), name='bigquery-all-schools'),
    path('school-teachers/', views.SchoolTeachersDataView.as_view(), name='school-teachers'),
    # Teacher observation data
    path('teacher-observations/', views.TeacherObservationDataView.as_view(), name='teacher-observations'),
    # School infrastructure data
    path('school-infrastructure/', views.SchoolInfrastructureDataView.as_view(), name='school-infrastructure'),
    # Enhanced schools data with WiFi and mobile info
    path('enhanced-schools/', views.EnhancedSchoolsDataView.as_view(), name='enhanced-schools'),
    # Schools with infrastructure data (internet + student-teacher ratio)
    path('schools-with-infrastructure/', views.SchoolsWithInfrastructureDataView.as_view(), name='schools-with-infrastructure'),
           # Health check
    path('health/', views.HealthCheckView.as_view(), name='health-check'),
    # Data sync management
    path('data-sync/status/', views.DataSyncStatusView.as_view(), name='data-sync-status'),
    path('data-sync/trigger/', views.TriggerDataSyncView.as_view(), name='trigger-data-sync'),
    # Message count
    path('messages/unread-count/', views.UnreadMessageCountView.as_view(), name='unread-message-count'),
    # AEOs by sector
    path('aeos/by-sector/', views.AEOsBySectorView.as_view(), name='aeos-by-sector'),
    # AEO sector schools with WiFi and activity data
    path('aeos/sector-schools/', views.AEOSectorSchoolsView.as_view(), name='aeo-sector-schools'),
    # Admin dashboard endpoints
    path('admin/dashboard/', views.AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/data/<str:data_type>/', views.AdminDetailedDataView.as_view(), name='admin-detailed-data'),
    path('admin/login-timestamps/', views.UserLoginTimestampView.as_view(), name='admin-login-timestamps'),
    # Admin messaging endpoint
    path('admin/messages/', views.AdminMessageCreateView.as_view(), name='admin-messages'),
    # Lesson plan usage distribution
    path('lesson-plan-usage-distribution/', views.LessonPlanUsageDistributionView.as_view(), name='lesson-plan-usage-distribution'),
    # LP Data endpoints
    path('lp-data/schools/', views.SchoolLPDataView.as_view(), name='school-lp-data'),
    path('lp-data/sectors/', views.SectorLPDataView.as_view(), name='sector-lp-data'),
    path('lp-data/teachers/', views.TeacherLPDataView.as_view(), name='teacher-lp-data'),
    path('lp-data/summary/', views.LPDataSummaryView.as_view(), name='lp-data-summary'),
    # Password management endpoints
    path('auth/password/change/', views.PasswordChangeView.as_view(), name='password-change'),
    path('auth/password/reset/request/', views.PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('auth/password/reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('auth/password/validate/', views.PasswordValidationView.as_view(), name='password-validation'),
    # User profile management
    path('auth/profile/', views.UserProfileView.as_view(), name='user-profile'),
]