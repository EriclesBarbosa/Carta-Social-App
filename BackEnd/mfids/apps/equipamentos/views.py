import json
import csv
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from django.views import View
from django.urls import reverse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import DashEquipamento,CountEquipamentoPorLocalizacao,CountEquipamentoPorConcelho
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from apps.tables.models import HideShowFilter, ModelFilter, PageItems,ModelChoices
from apps.equipamentos.utils import sales_filter

from apps.servicos.models import ListaServico
from apps.servicos.serializers import ListaServicoSerializer
from openpyxl import Workbook


def create_filter(request):
    if request.method == "POST":
        keys = request.POST.getlist('key')
        values = request.POST.getlist('value')
        
        for i in range(len(keys)):
            key = keys[i]
            value = values[i]

            ModelFilter.objects.update_or_create(
                parent=ModelChoices.DashEquipamento,
                key=key,
                defaults={'value': value}
            )

        return redirect(reverse('equipamento_list'))

def create_page_items(request):
    if request.method == 'POST':
        items = request.POST.get('items')
        page_items, created = PageItems.objects.update_or_create(
            parent=ModelChoices.DashEquipamento,
            defaults={'items_per_page':items}
        )
        return redirect(reverse('equipamento_dashboard'))
    

def create_page_items(request):
    if request.method == 'POST':
       
        items = request.POST.get('items')
        print(items)
        page_items, created = PageItems.objects.update_or_create(
            parent=ModelChoices.DashEquipamento,
            defaults={'items_per_page':items}
        )
        return redirect(reverse('equipamento_list'))

def create_hide_show_filter(request):
    if request.method == "POST":
        data_str = list(request.POST.keys())[0]
        data = json.loads(data_str)

        HideShowFilter.objects.update_or_create(
            parent=ModelChoices.DashEquipamento,
            key=data.get('key'),
            defaults={'value': data.get('value')}
        )

        response_data = {'message': 'Model updated successfully'}
        return JsonResponse(response_data)

    return JsonResponse({'error': 'Invalid request'}, status=400)

def delete_filter(request, id):
    filter_instance = ModelFilter.objects.get(id=id, parent=ModelChoices.DashEquipamento)
    filter_instance.delete()
    return redirect(reverse('equipamento_list'))


class ExportExcelView(View):
    permission_classes = [IsAuthenticated]
    def get(self, request):

        db_field_names = [field.name for field in DashEquipamento._meta.get_fields()]
        fields = []

        show_fields = HideShowFilter.objects.filter(value=False, parent=ModelChoices.DashEquipamento)
        for field in show_fields:
            fields.append(field.key)

 
        headers = [
            DashEquipamento._meta.get_field(field).verbose_name.title()
            for field in fields
        ]


        wb = Workbook()
        ws = wb.active
        ws.title = "Equipamentos"

        ws.append(headers)


        filter_string = {}
        filter_instance = ModelFilter.objects.filter(parent=ModelChoices.DashEquipamento)
        for filter_data in filter_instance:
            filter_string[f'{filter_data.key}__icontains'] = filter_data.value

        order_by = request.GET.get('order_by', 'id')
        queryset = DashEquipamento.objects.filter(**filter_string).order_by(order_by)

        sales = sales_filter(request, queryset, db_field_names)

    
        for sale in sales:
            row_data = [getattr(sale, field) for field in fields]
            ws.append(row_data)

        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="equipamentos.xlsx"'
        wb.save(response)

        return response
    
@login_required(login_url='/users/signin/')
def equipamento_dashboard(request):
    db_field_names_tem = [(field.name, field.verbose_name) for field in DashEquipamento._meta.get_fields() 
             if hasattr(field, 'verbose_name') and field.verbose_name] #[field.verbose_name for field in DashEquipamento._meta.get_fields() if hasattr(field, 'verbose_name')]
   
    db_field_names = [field.name for field in DashEquipamento._meta.get_fields()]

    

    dados_equi_ilha = CountEquipamentoPorLocalizacao.objects.all().values('ilha', 'quantidade_equipamentos')
    dados_equi_conelho = CountEquipamentoPorConcelho.objects.all().values('concelhos', 'quantidade_equipamentos')
    # hide show column
    field_names = []
    for field_name in db_field_names:
        fields, created = HideShowFilter.objects.get_or_create(key=field_name, parent=ModelChoices.DashEquipamento)
        field_names.append(fields)

    # model filter
    filter_string = {}
    filter_instance = ModelFilter.objects.filter(parent=ModelChoices.DashEquipamento)
    for filter_data in filter_instance:
        filter_string[f'{filter_data.key}__icontains'] = filter_data.value


    try:
      
        queryset = DashEquipamento.objects.filter(**filter_string).order_by('id')
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

        data_points = [
            {"label": item['ilha'], "y": item['quantidade_equipamentos']}
            for item in dados_equi_ilha
        ]

        data_equi_concelho = [
            {"label": item['concelhos'], "y": item['quantidade_equipamentos']}
            for item in dados_equi_conelho
        ]

        
        context = {
            'segment'  : 'equipamento',
           # 'parent'   : 'dashboard',
            'page_obj': page_obj,
            'db_field_names': db_field_names,
            'filter_instance': filter_instance,
            'total_items': DashEquipamento.objects.count(),
            'field_names': field_names,
            'items': items,
            'db_field_names_tem': json.dumps(db_field_names_tem),
            'db_field_names_tp': db_field_names_tem,
            "data_points" : data_points,
            'data_equi_concelho': data_equi_concelho 
            
        }

        return render(request, 'apps/equipamento_dash.html', context)
    
    except Exception as e:
        print(e)
        return redirect(request.META.get('HTTP_REFERER', '/'))
    

class ServicosPorEquipamentoAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, id_equipamento):
        try:
           
            servicos = ListaServico.objects.filter(id_equipamento=id_equipamento)
            count = servicos.count()
            
            serializer = ListaServicoSerializer(servicos, many=True)
            
            response_data = {
                'count': count,
                'results': serializer.data,
                'status': True
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )