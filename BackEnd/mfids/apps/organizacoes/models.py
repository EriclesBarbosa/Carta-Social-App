
from django.db import models
from django.utils import timezone

from django.contrib.auth.models import User


class Organizacao(models.Model):

    choice_status = [
        (1,'Pedente'),
        (2,'Aceitar'),
        (3,'Rejeitar'),
    ]
    
    id = models.AutoField(db_column='id', primary_key=True)   
    nome = models.CharField(max_length=255, blank=True, null=True, db_comment='Nome completo (sem abreviaturas)')
    nif = models.CharField(max_length=9, blank=True, null=True, db_comment='NIF da entidade')
    natureza_juridica = models.CharField(max_length=50, blank=True, null=True, db_comment='Ex: ONG, Fundação, Autarquia')
    contato = models.ForeignKey('Contato', models.DO_NOTHING, blank=True, null=True)
    geografia = models.ForeignKey('Geografia', models.DO_NOTHING, blank=True, null=True)
    tipo_organizacao = models.CharField(max_length=2, blank=True, null=True, db_comment='Tipo organizacao (P - Proprietario, G - Gestor PG - Proprietario/Gestor)')
    parent_id = models.IntegerField(db_comment='proprietario', blank=True, null=True)  
    codigo_proprietario =  models.CharField(max_length=9, blank=True, null=True, db_comment='codigo proprietario')
    codigo_gestor = models.CharField(max_length=9, blank=True, null=True, db_comment='codigo gestor')
    natureza_juridica_outro =  models.CharField(max_length=80, blank=True, null=True)

    #latitude = models.CharField(max_length=100, blank=True, null=True, db_comment='Latitude/Longitude (WGS84)')
    #longitude = models.CharField(max_length=100, blank=True, null=True, db_comment='Latitude/Longitude (WGS84)')
    #altura = models.CharField(max_length=100, blank=True, null=True, db_comment='Altura')
    #ponto_referencia = models.CharField(max_length=100, blank=True, null=True, db_comment='Ponto Referencia')

    #is_proprietaria = models.BooleanField(blank=True, null=True, db_comment='É entidade proprietária?')
    #is_gestora = models.BooleanField(blank=True, null=True, db_comment='É entidade gestora?')

    alterado_por = models.IntegerField( blank=True, null=True)
    criado_por = models.IntegerField( blank=True, null=True)
    alter_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True, default = timezone.now)
    status = models.IntegerField(blank=True, null=True,choices= choice_status, default=1)


    class Meta:
        managed = False
        db_table = 'organizacao'
        verbose_name = 'Organização'
        verbose_name_plural = 'Organizações'
        permissions = [
            # Apenas permissões personalizadas (não as padrão)
            ('gerenciar_organizacao', 'Pode gerenciar todas as organizações'),
            ('relatorio_organizacao', 'Pode gerar relatórios de organizações'),
            ('exportar_organizacao', 'Pode exportar dados de organizações'),
        ]


class Contato(models.Model):
    endereco = models.CharField(max_length=255, blank=True, null=True)
    caixa_postal = models.CharField(max_length=20, blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    telemovel = models.CharField(max_length=20, blank=True, null=True)
    email = models.CharField(max_length=100, blank=True, null=True)
    website = models.CharField(max_length=100, blank=True, null=True)

    alterado_por = models.IntegerField( blank=True, null=True)
    criado_por = models.IntegerField( blank=True, null=True)
    alter_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True, default = timezone.now)

    class Meta:
        managed = False
        db_table = 'contato'


class Localizacao(models.Model):
    ilha = models.CharField(max_length=50, blank=True, null=True)
    concelho = models.CharField(max_length=50, blank=True, null=True)
    freguesia = models.CharField(max_length=50, blank=True, null=True)
    cidade = models.CharField(max_length=50, blank=True, null=True)
    vila = models.CharField(max_length=50, blank=True, null=True)
    zona = models.CharField(max_length=50, blank=True, null=True)
    latitude = models.CharField(max_length=100, blank=True, null=True, db_comment='Latitude/Longitude (WGS84)')
    longitude = models.CharField(max_length=100, blank=True, null=True, db_comment='Latitude/Longitude (WGS84)')
    altura = models.CharField(max_length=100, blank=True, null=True, db_comment='Altura')
    ponto_referencia = models.CharField(max_length=100, blank=True, null=True, db_comment='Ponto Referencia')

    class Meta:
        managed = False
        db_table = 'localizacao'

class Geografia(models.Model):
    id = models.AutoField(db_column='id', primary_key=True)  
    ilha = models.CharField(max_length=50, blank=True, null=True)
    concelho = models.CharField(max_length=100, blank=True, null=True)
    freguesia = models.CharField(max_length=100, blank=True, null=True)
    zona = models.CharField(max_length=100, blank=True, null=True)
    lugar = models.CharField(max_length=100, blank=True, null=True)
    pais = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'geografia'
       


class UserOrganizacoes(models.Model):
    choice_status = [
        (1,'Ativado'),
        (2,'Inativado'),
    ]

    organizacao = models.ForeignKey(Organizacao, models.DO_NOTHING, blank=True, null=True) 
    user = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)
    status = models.IntegerField(choices= choice_status, default=1)
    alterado_por = models.ForeignKey(User, models.DO_NOTHING,related_name='alterado_por_user_organizacoes', blank=True, null=True)
    criado_por = models.ForeignKey(User, models.DO_NOTHING,related_name='criado_por_user_organizacoes', blank=True, null=True)
    alter_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True, default = timezone.now)

    class Meta:
        managed = False
        db_table = 'user_organizacao'


class OrganizacaoSemUtilizador(models.Model):
    organization_id = models.IntegerField(primary_key=True)
    organization_name = models.CharField(max_length=255)
    user_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField()
    criado_por = models.IntegerField()
    username = models.CharField(max_length=255)
    userorg_id = models.IntegerField()
    
    class Meta:
        managed = False  
        db_table = 'organizacao_sem_utilizador'  
        verbose_name = 'Organização sem Utilizador'
        verbose_name_plural = 'Organizações sem Utilizadores'

    def __str__(self):
        return self.organization_name


class EquipamentoOrganizacaoUtilizador(models.Model):
    id_equi = models.IntegerField(primary_key=True)
    id_ges = models.IntegerField()
    id_pro = models.IntegerField()
    users_ges = models.IntegerField()
    users_pro = models.IntegerField()

    class Meta:
        managed = False  
        db_table = 'equipamento_organizacao_utilizador'  
        
    def __str__(self):
        return f"Equipment {self.id_equi} - Gestor {self.id_ges} - Pro {self.id_pro}"
    
class OrganizacaoUserDetalhe(models.Model):
    organizacao_id = models.IntegerField(primary_key=True)
    user_id = models.IntegerField()
    tipo_organizacao = models.CharField(max_length=2)
    parent_id = models.IntegerField()
   

    class Meta:
        managed = False  
        db_table = 'organizacao_user_detalhe'  
        
    def __str__(self):
        return f"organizaacao {self.organizacao_id} - User {self.user_id} - tipo organizacao {self.tipo_organizacao}"


class ListOrganizacaoModel(models.Model):
    id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255)
    nif = models.CharField(max_length=20, blank=True, null=True)
    natureza_juridica = models.CharField(max_length=100, blank=True, null=True)
    contato_id = models.IntegerField(blank=True, null=True)
    tipo_organizacao = models.CharField(max_length=2, blank=True, null=True)
    geografia_id = models.IntegerField(blank=True, null=True)
    parent_id = models.IntegerField(blank=True, null=True)
    alter_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)
    criado_por = models.CharField(max_length=100, blank=True, null=True)
    alterado_por = models.CharField(max_length=100, blank=True, null=True)
    codigo_proprietario = models.CharField(max_length=50, blank=True, null=True)
    codigo_gestor = models.CharField(max_length=50, blank=True, null=True)
    natureza_juridica_outro = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=50, blank=True, null=True)
    proprietario_nome = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False  
        db_table = 'lista_organizacao'

    def __str__(self):
        return self.nome