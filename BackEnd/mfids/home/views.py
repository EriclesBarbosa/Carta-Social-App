from django.shortcuts import render
from django.db.models import Sum
from .models import *
from apps.equipamentos.models import DashEquipamento,CountEquipamentoPorLocalizacao,CountEquipamentoPorConcelho,CountEquipamentoPorAgentes,CountEquipamentoPorSemanaAtual
from apps.servicos.models import CountServicoPorLocalizacao,Servico
from django.contrib.auth.decorators import login_required

@login_required(login_url='/users/signin/')
def index(request):

  dados_equi_ilha = CountEquipamentoPorLocalizacao.objects.all().values('ilha', 'quantidade_equipamentos')
  dados_equi_conelho = CountEquipamentoPorConcelho.objects.all().values('concelhos', 'quantidade_equipamentos')
  dados_servico_ilha = CountServicoPorLocalizacao.objects.all().values('ilha', 'total_servicos')
  dados_equipamento_agente = CountEquipamentoPorAgentes.objects.all()[:5]

  dia_semana = list(CountEquipamentoPorSemanaAtual.objects.values_list('dia_semana', flat=True))


  equi_por_dia = list(CountEquipamentoPorSemanaAtual.objects.values_list('total_equipamentos', flat=True))
  soma_total_equi_por_semana = CountEquipamentoPorSemanaAtual.objects.aggregate(total=Sum('total_equipamentos') )['total'] or 0


  labels_equi_ilha = [item['ilha'] for item in dados_equi_ilha]
  data_equi_ilha = [item['quantidade_equipamentos'] for item in dados_equi_ilha]

  labels_equi_consel = [item['concelhos'] for item in dados_equi_conelho]
  data_equi_consel = [item['quantidade_equipamentos'] for item in dados_equi_conelho]

  labels_servico_ilha = [item['ilha'] for item in dados_servico_ilha]
  data_servico_ilha = [item['total_servicos'] for item in dados_servico_ilha]

  print(labels_equi_ilha)
  
  context = {
    'segment': 'homeindex',
    
   
    'total_items': DashEquipamento.objects.count(),
    
    'total_items_servico_ilha': Servico.objects.count(),
    'dados_equipamento_agente':dados_equipamento_agente,
    'dia_semana':dia_semana,
    'equi_por_dia':equi_por_dia,
    'soma_total_equi_por_semana':soma_total_equi_por_semana,
    
    'labels_equi_ilha': labels_equi_ilha,
    'data_equi_ilha': data_equi_ilha,
    'labels_equi_consel': labels_equi_consel,
    'data_equi_consel': data_equi_consel,
    'labels_servico_ilha': labels_servico_ilha,
    'data_servico_ilha': data_servico_ilha
  }
  return render(request, "dashboard/index.html", context)







def starter(request):

  context = {}
  return render(request, "pages/starter.html", context)


# Layout
def stacked(request):
  context = {
    'segment': 'stacked',
    'parent': 'layouts'
  }
  return render(request, 'pages/layouts/stacked.html', context)

def sidebar(request):
  context = {
    'segment': 'sidebar',
    'parent': 'layouts'
  }
  return render(request, 'pages/layouts/sidebar.html', context)


# CRUD
def products(request):
  context = {
    'segment': 'products',
    'parent': 'crud'
  }
  return render(request, 'pages/CRUD/products.html', context)

def users(request):
  context = {
    'segment': 'users',
    'parent': 'crud'
  }
  return render(request, 'pages/CRUD/users.html', context)


# Pages
def pricing(request):
  return render(request, 'pages/pricing.html')

def maintenance(request):
  return render(request, 'pages/maintenance.html')

def error_404(request):
  return render(request, 'pages/404.html')

def error_500(request):
  return render(request, 'pages/500.html')

def settings_view(request):
  context = {
    'segment': 'settings',
  }
  return render(request, 'pages/settings.html', context)


# Playground
def stacked_playground(request):
  return render(request, 'pages/playground/stacked.html')


def sidebar_playground(request):
  context = {
    'segment': 'sidebar_playground',
    'parent': 'playground'
  }
  return render(request, 'pages/playground/sidebar.html', context)


# i18n
def i18n_view(request):
  context = {
    'segment': 'i18n'
  }
  return render(request, 'pages/i18n.html', context)
