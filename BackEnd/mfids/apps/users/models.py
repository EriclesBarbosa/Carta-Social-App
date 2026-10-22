import uuid
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils.translation import gettext_lazy as _
from .managers import UserManager
from django.db import models
#from django.contrib.auth.models import User as User_
from django.contrib.auth.models import User


# Create your models here.


ROLE_CHOICES = (
    ('admin'  , 'Admin'),
    ('user'  , 'User'),
)


"""class User(AbstractUser):

   
    USER_TYPE_CHOICES = (
        ('admin', 'Administrador'),
        ('mfids', 'MFIDS'),
        ('gestor_equipamento', 'Gestor de Equipamento'),
        ('proprietario_equipamento', 'Proprietário de Equipamento'),
        ('agente', 'Agente'),
    )

    username = models.CharField(max_length=150, unique=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    user_type = models.CharField(max_length=50 ,choices=USER_TYPE_CHOICES)
    municipio = models.CharField(max_length=100, blank=True, null=True)
    

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []    

    objects = UserManager() 

    groups = models.ManyToManyField(
    Group,
    verbose_name=_('groups'),
    blank=True,
    help_text=_(
        'The groups this user belongs to. A user will get all permissions '
        'granted to each of their groups.'
            ),
            related_name="custom_user_set",  # Unique related_name
            related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Specific permissions for this user.'),
        related_name="custom_user_set",  # Unique related_name
        related_query_name="user",
    )
   
    def __str__(self):
        return self.email

"""
def avatar_with_id(instance, filename):
    return "{}/avatar/{}".format(f"{instance.user.id}", filename)

class Profile(models.Model):
    user      = models.OneToOneField(User, on_delete=models.CASCADE,null=True, blank=True)
    role      = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    full_name = models.CharField(max_length=255, null=True, blank=True)
    country   = models.CharField(max_length=255, null=True, blank=True, default='Cabo Verde')
    city      = models.CharField(max_length=255, null=True, blank=True)
    zip_code  = models.CharField(max_length=255, null=True, blank=True)
    address   = models.CharField(max_length=255, null=True, blank=True)
    phone     = models.CharField(max_length=255, null=True, blank=True)
    avatar    = models.ImageField(upload_to=avatar_with_id, null=True, blank=True)
    municipio = models.CharField(max_length=255, null=True, blank=True)

   


    def __str__(self):
        return self.user.username

class PasswordResetCode(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=timezone.now() + timedelta(hours=1))  # Expira em 1 hora
    status = models.IntegerField(blank=False, null=False)

    def __str__(self):
        return f"Código de {self.user.email} - {self.code}"

    def is_expired(self):
        return timezone.now() > self.expires_at
        

