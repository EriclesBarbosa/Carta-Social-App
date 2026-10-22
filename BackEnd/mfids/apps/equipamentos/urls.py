from django.urls import path
from . import views

urlpatterns = [
      path("lista", views.equipamento_dashboard, name="equipamento_list"),
      path('create-filter/', views.create_filter, name="create_filter"),
      path('create-page-items/', views.create_page_items, name="create_page_items"),
      path('create-hide-show-items/', views.create_hide_show_filter, name="create_hide_show_filter"),
      path('delete-filter/<int:id>/', views.delete_filter, name="delete_filter"),
      path('export-csv/', views.ExportExcelView.as_view(), name='export_csv'),
      path('equipamento_servicos/<int:id_equipamento>/', views.ServicosPorEquipamentoAPIView.as_view(), name='servicos_por_equipamento')
]