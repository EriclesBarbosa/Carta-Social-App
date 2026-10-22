from django_filters import rest_framework as filters
from .models import Dominio

class DominioFilter(filters.FilterSet):
    domain_name = filters.CharFilter(lookup_expr='icontains') 
    domain_code = filters.CharFilter(lookup_expr='exact')      

    class Meta:
        model = Dominio
        fields = ['domain_name', 'domain_code']