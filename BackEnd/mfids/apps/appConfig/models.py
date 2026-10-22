from django.db import models
from django.contrib.auth.models import User

class Configuration(models.Model):
    email_send = models.EmailField("Email de envio", max_length=254)

    used_type = models.BooleanField(
        "Usar para envio de email", 
        default=True,
        help_text="Endereço de email utilizado para o envio automático de mensagens durante a criação de utilizadores e recuperação de palavra-passe."
    )

    frontend_url = models.URLField(
        verbose_name="URL do Frontend",
        help_text="Endereço do frontend utilizado nos redirecionamentos.",
        blank=False,
        null=False
    )

    created_at = models.DateTimeField("Criado em", db_column='created_at',auto_now_add=True)
    updated_at = models.DateTimeField("Atualizado em", db_column='updated_at', auto_now=True)

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='config_created_by',
        verbose_name="Criado por",
        db_column='created_by'  # corresponde ao nome real da coluna
    )

    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='config_updated_by',
        verbose_name="Atualizado por",
        db_column='updated_by'  # corresponde ao nome real da coluna
    )

    class Meta:
        verbose_name = "Configuração"
        verbose_name_plural = "Configurações"
        managed = False
        db_table = 'config'

    def save(self, *args, **kwargs):
        if not self.pk and Configuration.objects.exists():
            raise Exception("Só pode existir uma única configuração.")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.email_send} ({'Ativo' if self.used_type else 'Desativado'})"


    
