from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
#from django.contrib.auth import get_user_model

#User = get_user_model()
class Dominio(models.Model):

    STATUS_CHOICES = [
        (1, 'Ativo'),
        (2, 'Inativo')
    ]

    id = models.AutoField(primary_key=True)
    domain_code = models.CharField(max_length=30)
    domain_name = models.CharField(max_length=80)
    domain_description = models.CharField(max_length=150)
    domain_status = models.IntegerField( max_length=1, choices=STATUS_CHOICES, default=1)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, null=True,blank=True, related_name='dominios_criados',verbose_name='Criado por')
    updated_by = models.ForeignKey(User, on_delete=models.PROTECT, null=True,blank=True,related_name='dominios_atualizados',verbose_name='Atualizado por')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')

    def __str__(self):
        return f"{self.domain_name} - {self.domain_code}"

    def clean(self):
     
        if not self.domain_code:
            raise ValidationError({'domain_code': 'O código do domínio é obrigatório.'})
        if not self.domain_name:
            raise ValidationError({'domain_name': 'O nome do domínio é obrigatório.'})
        if not self.domain_description:
            raise ValidationError({'domain_description': 'A descrição do domínio é obrigatória.'})

        
       # if Dominio.objects.filter(domain_code=self.domain_code).exclude(pk=self.pk).exists():
           # raise ValidationError({'domain_code': 'Este código de domínio já está em uso.'})

        
        #if Dominio.objects.filter(domain_name=self.domain_name).exclude(pk=self.pk).exists():
          #  raise ValidationError({'domain_name': 'Este nome de domínio já está em uso.'})

    def delete(self, *args, **kwargs):
        self.domain_status = 2
        self.save()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Domínio"
        verbose_name_plural = "Domínios"
        #db_table = 'MFIDS_T_DOMAIN'

class TipoFaixaEtaria(models.Model):
    tipo_resposta = models.CharField(max_length=30)
    id_dominio = models.IntegerField()

    class Meta:
        managed = False  
        db_table = 'resposta_social_faixa_etaria'  


