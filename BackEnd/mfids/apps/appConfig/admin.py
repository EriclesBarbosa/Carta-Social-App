from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from .models import Configuration
from django.utils import timezone


from allauth.socialaccount.models import SocialAccount, SocialApp, SocialToken
from allauth.account.models import EmailAddress
from django_celery_results.models import GroupResult, TaskResult
from rest_framework.authtoken.models import Token,TokenProxy


@admin.register(Configuration)
class ConfigurationAdmin(admin.ModelAdmin):
    list_display = ('email_send', 'used_type', 'frontend_url', 'created_at', 'created_by', 'updated_by', 'updated_at')
    readonly_fields = ('created_at', 'created_by', 'updated_at', 'updated_by')

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        obj.updated_by = request.user
        obj.updated_at = timezone.now()  
        super().save_model(request, obj, form, change)

    def has_delete_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request):
        return not Configuration.objects.exists()


for model in [SocialAccount, EmailAddress, GroupResult, TaskResult, Token, SocialApp, SocialToken]:
    try:
        admin.site.unregister(model)
    except admin.sites.NotRegistered:
        pass

class CustomUserAdmin(UserAdmin):
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_add_permission(self, request):
        return False

    def get_actions(self, request):
        actions = super().get_actions(request)
        if not request.user.is_superuser:
            if "delete_selected" in actions:
                del actions["delete_selected"]
        return actions

admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)



