from django.urls import path
from . import views

app_name = 'servico'

urlpatterns = [
      path("lista", views.servico_dashboard, name="servico_list"),
      path('create-filter/', views.create_filter, name="create_filter"),
      path('create-page-items/', views.create_page_items, name="create_page_items"),
      path('create-hide-show-items/', views.create_hide_show_filter, name="create_hide_show_filter"),
      path('delete-filter/<int:id>/', views.delete_filter, name="delete_filter"),
      path('export-csv/', views.ExportExcelView.as_view(), name='export_csv'),
      path("dashboard_resposta_social", views.resposta_social_dash, name="resposta_social_dash"),
]