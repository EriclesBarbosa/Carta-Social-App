from django.urls import path, re_path
from django.views.decorators.csrf import csrf_exempt
from rest_framework.routers import DefaultRouter

from apps.api.views import *

router = DefaultRouter()  
#router.register(r'dominio', DominioViewSet, basename='dominio')

urlpatterns = [
	re_path("sales/((?P<pk>\d+)/)?", csrf_exempt(SalesView.as_view())),

	# User Authentication Endpoints
    path('register/', UserRegisterView.as_view(), name='api_register'),
    path('login/', UserLoginView.as_view(), name='api_login'),
    path('profile/', UserProfileView.as_view(), name='api_profile'),
    path('logout/', UserLogoutView.as_view(), name='api_logout'),
    path('dominios/', DominioList.as_view(), name='dominio_list'),
    path('dominios/tipo_faixa_etaria', PorTipoFaixaEtariaView.as_view(), name='tipo_faixa_etaria'),
    path('dominios/<int:id>/', DominioUpdateView.as_view(), name='dominio-update'),
     #path('dominios/create', DominioViewSet.as_view(), name='dominio_create'),
    #organizacao
    path('organizacoes/', OrganizacaoListCreateView.as_view(), name='organizacao_list_create'),
    path('organizacoes/<int:pk>/', OrganizacaoDetailView.as_view(), name='organizacao_detail'),
    path('organizacoes/proprietarios/', ProprietarioListView.as_view(), name='proprietarios_list'),
    path('organizacoes/gestores/', GestorListView.as_view(), name='gestores_list'),
    path('organizacoes/proprietarios/free', ProprietarioFreeListView.as_view(), name='proprietario_free'),
    path('organizacoes/proprietarios/add', AddGestorToProprietarioView.as_view(), name='proprietario_add'),
    path('validarorganizacao/',     ValidarOrganizacaoView.as_view(), name='validarorganizacao'),
    #Equipamento
    path('equipamentos/', EquipamentoListView.as_view(), name='equipamento_list'),
    path('equipamentos/create', EquipamentoCreateView.as_view(), name='equipamento_list_create'),
    path('equipamentos/<int:pk>/', EquipamentoDetailView.as_view(), name='equipamento_detail'),
    path('equipamentosById/<int:pk>/', EquipamentoGetDetailView.as_view(), name='equipamento_detail'),
    path('fonteFinanciamento/',     FonteFinanciamentoListView.as_view(), name='fonteFinanciamento_list'),
    path('validarEquipamento/',     ValidarEquipamentoView.as_view(), name='validarEquipamento'),
    #Geografia
    path('geografia/ilhas/', IlhaList.as_view(), name='ilha_list'),
    path('geografia/concelhos/<str:ilha>/', ConcelhoList.as_view(), name='concelho_list'),
    path('geografia/freguesias/<str:concelho>/', FreguesiaList.as_view(), name='freguesia_list'),
    path('geografia/zonas/<str:freguesia>/', ZonaList.as_view(), name='zona_list'),
    path('geografia/lugar/<str:zona>/', LugarList.as_view(), name='lugar_list'),
     # serviços
    path('servicos/', ServicoListCreateView.as_view(), name='servico_list_create'),
    path('servicos/<int:pk>/', ServicoDetailView.as_view(), name='servico_detail'),
    # profile
    path('profile/', ProfileListView.as_view(), name='profile'),
    path('profile/update/', ProfileUpdateView.as_view(), name='profile-update'),
    #lista concelho
    path('concelhos/', ConcelhosAPIView.as_view(), name='concelhos-list'),
]
