from django.db import migrations
from django.contrib.contenttypes.management import create_contenttypes
from django.apps import apps

def create_contenttype_and_permissions(apps, schema_editor):
    # 1. Criar ContentTypes para todos os modelos não gerenciados
    create_contenttypes(apps.get_app_config('organizacoes'))
    
    # 2. Agora criar as permissões
    ContentType = apps.get_model('contenttypes', 'ContentType')
    Permission = apps.get_model('auth', 'Permission')
    
    try:
        content_type = ContentType.objects.get(
            app_label='organizacoes',
            model='organizacao'
        )
        
        # Permissões padrão
        Permission.objects.get_or_create(
            codename='add_organizacao',
            name='Can add organização',
            content_type=content_type,
        )
        Permission.objects.get_or_create(
            codename='change_organizacao',
            name='Can change organização',
            content_type=content_type,
        )
        Permission.objects.get_or_create(
            codename='delete_organizacao',
            name='Can delete organização',
            content_type=content_type,
        )
        Permission.objects.get_or_create(
            codename='view_organizacao',
            name='Can view organização',
            content_type=content_type,
        )
        
        # Permissões personalizadas
        Permission.objects.get_or_create(
            codename='gerenciar_organizacao',
            name='Pode gerenciar todas as organizações',
            content_type=content_type,
        )
    except ContentType.DoesNotExist:
        print("Ainda não foi possível criar o ContentType")

class Migration(migrations.Migration):
    dependencies = [
        ('contenttypes', '__latest__'),  # Garante que contenttypes está atualizado
        ('organizacoes', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_contenttype_and_permissions),
    ]