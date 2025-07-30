from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/login', views.CustomLoginView.as_view(), name='custom_login'),
    path('auth/register', views.RegisterView.as_view(), name='register'),
    # Conversations
    path('conversations', views.ConversationListCreateView.as_view(), name='conversations'),
    path('conversations/<str:pk>/messages', views.MessageListView.as_view(), name='conversation-messages'),
    # Messaging
    path('messages', views.MessageCreateView.as_view(), name='send-message'),
    # Principals
    path('principals', views.PrincipalListView.as_view(), name='principals'),
    path('principals/detail', views.PrincipalDetailView.as_view(), name='principal-detail'),
    # AEOs
    path('aeos', views.AEOListView.as_view(), name='aeos'),
    # BigQuery endpoints
    path('bigquery/teacher-data', views.BigQueryTeacherDataView.as_view(), name='bigquery-teacher-data'),
    path('bigquery/aggregated-data', views.BigQueryAggregatedDataView.as_view(), name='bigquery-aggregated-data'),
    path('bigquery/filter-options', views.BigQueryFilterOptionsView.as_view(), name='bigquery-filter-options'),
    path('bigquery/summary-stats', views.BigQuerySummaryStatsView.as_view(), name='bigquery-summary-stats'),
    path('bigquery/all-schools', views.BigQueryAllSchoolsView.as_view(), name='bigquery-all-schools'),
    # Health check
    path('health', views.HealthCheckView.as_view(), name='health-check'),
]