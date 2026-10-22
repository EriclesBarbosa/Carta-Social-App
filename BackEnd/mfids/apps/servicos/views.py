import json

from django.shortcuts import render
from django.urls import reverse
from django.shortcuts import render, redirect
from django.views import View
from rest_framework import viewsets
from rest_framework.response import Response
from django.http import HttpResponse, JsonResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny, IsAuthenticated

from rest_framework import filters
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Sum
from django.db.models import F, ExpressionWrapper, FloatField
from openpyxl import Workbook
from .models import ListaValencias,FaixaEtariaAtendida,DistribuicaoTipoRespostaSocial,TaxaOcupacaoEquipamento,NumeroTotalFuncionario,CountServicoPorLocalizacao,Servico
from apps.tables.models import HideShowFilter, ModelFilter, PageItems,ModelChoices
from apps.servicos.utils import sales_filter
from django.db.models import FloatField, F, Func, ExpressionWrapper
from .serializers import DistribuicaoTipoRespostaSocialSerializer
import re

def create_filter(request):
    if request.method == "POST":
        print("in --------")
        keys = request.POST.getlist('key')
        values = request.POST.getlist('value')
        
        for i in range(len(keys)):
            key = keys[i]
            value = values[i]

            ModelFilter.objects.update_or_create(
                parent=ModelChoices.DashServico,
                key=key,
                defaults={'value': value}
            )

        return redirect(reverse('servico:servico_list'))
     

def create_page_items(request):
    if request.method == 'POST':
        items = request.POST.get('items')
        page_items, created = PageItems.objects.update_or_create(
            parent=ModelChoices.DashServico,
            defaults={'items_per_page':items}
        )
        return redirect(reverse('servico_dashboard'))
    
def create_page_items(request):
    if request.method == 'POST':
        print("--innn")
       
        items = request.POST.get('items')
        print(items)
        page_items, created = PageItems.objects.update_or_create(
            parent=ModelChoices.DashServico,
            defaults={'items_per_page':items}
        )
        return redirect(reverse('servico:servico_list'))
    
def create_hide_show_filter(request):
    if request.method == "POST":
        data_str = list(request.POST.keys())[0]
        data = json.loads(data_str)

        HideShowFilter.objects.update_or_create(
            parent=ModelChoices.DashServico,
            key=data.get('key'),
            defaults={'value': data.get('value')}
        )

        response_data = {'message': 'Model updated successfully'}
        return JsonResponse(response_data)

    return JsonResponse({'error': 'Invalid request'}, status=400)

def delete_filter(request, id):
    filter_instance = ModelFilter.objects.get(id=id, parent=ModelChoices.DashServico)
    filter_instance.delete()
    return redirect(reverse('servico:servico_list'))

class ExportExcelView(View):
    permission_classes = [IsAuthenticated]
    def get(self, request):
      
        db_field_names = [field.name for field in ListaValencias._meta.get_fields()]
        fields = []

    
        show_fields = HideShowFilter.objects.filter(value=False, parent=ModelChoices.DashServico)
        for field in show_fields:
            fields.append(field.key)

        headers = [
            ListaValencias._meta.get_field(field).verbose_name.title()
            for field in fields
        ]

    
        wb = Workbook()
        ws = wb.active
        ws.title = "Valências"

    
        ws.append(headers)


        filter_string = {}
        filter_instance = ModelFilter.objects.filter(parent=ModelChoices.DashServico)
        for filter_data in filter_instance:
            filter_string[f'{filter_data.key}__icontains'] = filter_data.value

        order_by = request.GET.get('order_by', 'id')
        queryset = ListaValencias.objects.filter(**filter_string).order_by(order_by)

      
        sales = sales_filter(request, queryset, db_field_names)

        for sale in sales:
            row_data = [getattr(sale, field) for field in fields]
            ws.append(row_data)


        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="valencias.xlsx"'
        wb.save(response)

        return response
    
@login_required(login_url='/users/signin/')
def servico_dashboard(request):
   
    db_field_names_tem = [(field.name, field.verbose_name) for field in ListaValencias._meta.get_fields() 
             if hasattr(field, 'verbose_name') and field.verbose_name] #[field.verbose_name for field in DashEquipamento._meta.get_fields() if hasattr(field, 'verbose_name')]
   
    db_field_names = [field.name for field in ListaValencias._meta.get_fields()]

    
    # hide show column
    field_names = []
    for field_name in db_field_names:
        fields, created = HideShowFilter.objects.get_or_create(key=field_name, parent=ModelChoices.DashServico)
        field_names.append(fields)

    # model filter
    filter_string = {}
    filter_instance = ModelFilter.objects.filter(parent=ModelChoices.DashServico)
    for filter_data in filter_instance:
        filter_string[f'{filter_data.key}__icontains'] = filter_data.value


    try:
      
        queryset = ListaValencias.objects.filter(**filter_string).order_by('id')
        equipamentos = sales_filter(request, queryset, db_field_names)

        page_items = PageItems.objects.filter(parent=ModelChoices.DashEquipamento).last()
        items = 10
        if page_items:
            items = page_items.items_per_page

        paginator = Paginator(equipamentos, items)
        page_number = request.GET.get('page')
        
        try:
            page_obj = paginator.page(page_number)
        except PageNotAnInteger:
   
            page_obj = paginator.page(1)
        except EmptyPage:
          
            page_obj = paginator.page(paginator.num_pages)

        context = {
            'segment'  : 'servico',
            #'parent'   : 'dashboard',
            'page_obj': page_obj,
            'db_field_names': db_field_names,
            'filter_instance': filter_instance,
            'total_items': ListaValencias.objects.count(),
            'field_names': field_names,
            'items': items,
            'db_field_names_tem': json.dumps(db_field_names_tem),
            'db_field_names_tp': db_field_names_tem,
        }

        return render(request, 'apps/servico_dash.html', context)
    
    except Exception as e:
        print(e)
        return redirect(request.META.get('HTTP_REFERER', '/'))   

def extrair_numero_inicial(faixa):
    numeros = re.findall(r'\d+', faixa)
    return int(numeros[0]) if numeros else 9999

@login_required(login_url='/users/signin/')
def resposta_social_dash(request):
    total_funcionarios = ListaValencias.objects.aggregate(
        total=Sum('nr_funcionario')
    )['total'] or 0

    total_geral = FaixaEtariaAtendida.objects.aggregate(
        total_geral=Sum('total')
    )['total_geral'] or 1 
    
   
    total_por_faixa = FaixaEtariaAtendida.objects.annotate(
        percentagem=Func(
            ExpressionWrapper(
                F('total') * 100.0 / total_geral,
                output_field=FloatField()
            ),
            function='ROUND',
            template='%(function)s(%(expressions)s, 2)',
            output_field=FloatField()
        )
    )

    dados_servico_ilha = CountServicoPorLocalizacao.objects.all().values('ilha', 'total_servicos')
    total_geral_dtrs = DistribuicaoTipoRespostaSocial.objects.aggregate(
        total_geral=Sum('total')
    )['total_geral'] or 1  # Avoid division by zero
    
    # Get all age groups and annotate with percentage
    total_por_dtrs = DistribuicaoTipoRespostaSocial.objects.annotate(
       percentagem=Func(
            ExpressionWrapper(
                F('total') * 100.0 / total_geral_dtrs,
                output_field=FloatField()
            ),
            function='ROUND',
            template='%(function)s(%(expressions)s, 2)',
            output_field=FloatField()
        )
    )
    
    

    taxa_ocupacao_equipamento = TaxaOcupacaoEquipamento.objects.annotate(
        percentagem=Func(
            ExpressionWrapper(
                F('total') * 100.0 / F('capacidade_instalada'),
                output_field=FloatField()
            ),
            function='ROUND',
            template='%(function)s(%(expressions)s, 2)',
            output_field=FloatField()
        )
        
        
        
   
    )

    labels_servico_ilha = [item['ilha'] for item in dados_servico_ilha]
    data_servico_ilha = [item['total_servicos'] for item in dados_servico_ilha]

    numero_total_funcionario = NumeroTotalFuncionario.objects.all().first()

    context ={
        'total_por_faixa': total_por_faixa,
        'segment':'rps_dash',
        'total_funcionarios':total_funcionarios,
        'total_por_dtrs':total_por_dtrs,
        'taxa_ocupacao_equipamento':taxa_ocupacao_equipamento,
        'numero_total_funcionario':numero_total_funcionario,
        'data_servico_ilha': data_servico_ilha,
        'total_items_servico_ilha': Servico.objects.count(),
        'labels_servico_ilha': labels_servico_ilha,
        'data_servico_ilha': data_servico_ilha
    }
    return render(request, 'apps/resposta_social_dash.html', context)
    
class DistribuicaoTipoRespostaSocialViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = DistribuicaoTipoRespostaSocial.objects.all()
    serializer_class = DistribuicaoTipoRespostaSocialSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['tipo_resposta_desc']  
    filterset_fields = ['faixa_etaria', 'codigo_tipo_resposta']  

    def get_queryset(self):
        queryset = super().get_queryset()
        search_term = self.request.query_params.get('search', None)
        
        if search_term:
            queryset = queryset.filter(tipo_resposta_desc__icontains=search_term)
        
        return queryset