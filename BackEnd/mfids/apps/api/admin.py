from django.contrib import admin
from .models import Dominio
from .forms import DominioForm

@admin.register(Dominio)
class DominioAdmin(admin.ModelAdmin):
    form = DominioForm
    list_display = ('domain_code', 'domain_name', 'domain_status', 'created_at')
    list_filter = ('domain_status',)
    search_fields = ('domain_code', 'domain_name')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
