
from django.db import models
from django.utils import timezone
from apps.servicos.models import Servico


class Dominio(models.Model):
    domain_code = models.CharField(max_length=30)
    domain_description = models.CharField(max_length=150)
    domain_name = models.CharField(max_length=80)
    domain_status = models.CharField(max_length=255, blank=True, null=True)

    alterado_por = models.IntegerField( blank=True, null=True)
    criado_por = models.IntegerField( blank=True, null=True)
    alter_at = models.DateTimeField(blank=True, null=True,auto_now=True)
    created_at = models.DateTimeField(blank=True, null=True, default = timezone.now)

    
    class Meta:
        managed = False
        db_table = 'dominio'


class Equipamento(models.Model):

    choice_status = [
        (1,'Pedente'),
        (2,'Aceitar'),
        (3,'Rejeitar'),
    ]

    codigo = models.CharField(max_length=50, blank=True, null=True)
    nome = models.CharField(max_length=255, blank=True, null=True)
    estado = models.CharField(max_length=50, blank=True, null=True, db_comment='Ex: Em funcionamento, Encerrado')
    tipo_construcao_outro = models.CharField(max_length=50, blank=True, null=True, db_comment='Ex: De raiz, Adaptado')
    tipo_edificacao_outro = models.CharField(max_length=50, blank=True, null=True)
    #localizacao = models.ForeignKey('Localizacao', models.DO_NOTHING, blank=True, null=True)
    #contato = models.ForeignKey('Contato', models.DO_NOTHING, blank=True, null=True)
    #proprietario = models.ForeignKey('Organizacao', models.DO_NOTHING, blank=True, null=True)
    #gestor = models.ForeignKey('Organizacao', models.DO_NOTHING, related_name='equipamento_gestor_set', blank=True, null=True)
    data_oficializacao = models.DateField(blank=True, null=True, db_comment='DD/MM/AAAA')
    possui_eletricidade = models.BooleanField(blank=True, null=True)
    agua_canalizada = models.CharField(max_length=50, blank=True, null=True, db_comment='Ex: Sim (interior), Sim (exterior), Não')
    sistema_esgoto = models.CharField(max_length=50, blank=True, null=True, db_comment='Ex: Rede pública, Fossa séptica')
    geografia = models.ForeignKey('Geografia', models.DO_NOTHING, blank=True, null=True)
    latitude = models.CharField(max_length=100, blank=True, null=True)
    longitude = models.CharField(max_length=100, blank=True, null=True)
    altura = models.CharField(max_length=100, blank=True, null=True)
    ponto_referencia = models.CharField(max_length=100, blank=True, null=True)
    #alter_at = models.DateTimeField(blank=True, null=True)
    #created_at = models.DateTimeField(blank=True, null=True)
    #criado_por = models.BigIntegerField(blank=True, null=True)
    #alterado_por = models.BigIntegerField(blank=True, null=True)
    domain_situacao_equipamento = models.IntegerField(blank=True, null=True)
    situacao_equipamento_outro = models.CharField(max_length=80, blank=True, null=True)
    domain_situacao_juridica = models.IntegerField(blank=True, null=True)
    domain_regime_propriedade = models.IntegerField(blank=True, null=True)
    regime_propriedade_outro = models.CharField(max_length=80, blank=True, null=True)
    domain_tipo_edificacao = models.IntegerField(blank=True, null=True)
    domain_estado_conservacao = models.IntegerField(blank=True, null=True)
    domain_tipo_construcao_outro = models.IntegerField(blank=True, null=True)
    fonte_financiamento_outro = models.CharField(max_length=80, blank=True, null=True)
    #domain_fonte_financiamento = models.IntegerField(blank=True, null=True)
    remodelado = models.BooleanField(blank=True, null=True, db_comment='Se o equipamento foi remodelado: Sim ou Nao')
    #domain_fonte_fin_remodelacao = models.IntegerField(blank=True, null=True, db_comment='Fonte financiamento da ultima remodelacao')
    fonte_fin_remodelacao_outro = models.CharField(max_length=80, blank=True, null=True)
    domain_ligacao_rede_publica = models.IntegerField(blank=True, null=True)
    domain_sanita_latrina = models.IntegerField(blank=True, null=True)
    banheiro_poliban = models.BooleanField(blank=True, null=True)
    domain_evacuacao_agua = models.IntegerField(blank=True, null=True)
    domain_possui_cozinha = models.IntegerField(blank=True, null=True)
    domain_colecta_lixo = models.IntegerField(blank=True, null=True)
    colecta_lixo_outro = models.CharField(max_length=80, blank=True, null=True)
    acesso_a_deficiente = models.BooleanField(blank=True, null=True)
    data_encerramento = models.DateField(blank=True, null=True, db_comment='DD/MM/AAAA')
    n_andar = models.IntegerField(blank=True, null=True)

    geografia = models.ForeignKey(
        'organizacoes.Geografia', 
        on_delete= models.DO_NOTHING
    )
    contato = models.ForeignKey(
        'organizacoes.Contato', 
        on_delete=models.CASCADE, 
        null=True, blank=True
    )
    gestor = models.ForeignKey(
        'organizacoes.Organizacao', 
        related_name="gestor", 
        on_delete=models.CASCADE
    )

    alterado_por = models.IntegerField( blank=True, null=True)
    criado_por = models.IntegerField( blank=True, null=True)
    alter_at = models.DateTimeField(blank=True, null=True,auto_now=True)
    created_at = models.DateTimeField(blank=True, null=True, default = timezone.now)
    status = models.IntegerField(blank=True, null=True,choices= choice_status, default=1)


    class Meta:
        managed = False
        db_table = 'equipamento'

class FonteFinanciamento(models.Model):
    #id = models.IntegerField(db_column='id',primary_key=True)  
    fonte = models.CharField(max_length=50, blank=True, null=True)
    contexto = models.CharField(max_length=20, blank=True, null=True)
    equipamento = models.ForeignKey('Equipamento', models.DO_NOTHING, blank=True, null=True,related_name='fontes_financiamento_equipamentos',)
    servico = models.ForeignKey(Servico, models.DO_NOTHING, blank=True, null=True,related_name='fontes_financiamento_servico',)
    domain_fonte_fin = models.IntegerField(blank=True, null=True)
    
    alterado_por = models.IntegerField( blank=True, null=True)
    criado_por = models.IntegerField( blank=True, null=True)
    alter_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True, default = timezone.now)
   
    domain_fonte_fin_outros = models.CharField(max_length=80, blank=True, null=True)
    # add label servico 
    class Meta:
        managed = False
        db_table = 'fonte_financiamento'


class DashEquipamento(models.Model):
   
    id = models.IntegerField(primary_key=True, db_column='id', verbose_name='ID')
    codigo_gestor = models.CharField(max_length=255, blank=True, null=True, verbose_name='Código do Gestor')
    codigo_proprietario = models.CharField(max_length=255, blank=True, null=True, verbose_name='Código do Proprietário')
    nome = models.CharField(max_length=255, blank=True, null=True, verbose_name='Nome do Equipamento')
    local = models.CharField(max_length=255, blank=True, null=True, verbose_name='Localização')
    gestor_name = models.CharField(max_length=255, blank=True, null=True, verbose_name='Nome do Gestor')
    pro_name = models.CharField(max_length=255, blank=True, null=True, verbose_name='Nome do Proprietário')
   
    estado_equipamento = models.CharField(max_length=255, blank=True, null=True, verbose_name='Estado do Equipamento')
    user_create = models.CharField(max_length=255, blank=True, null=True, verbose_name='Criado por')
    alterado_por = models.CharField(max_length=255, blank=True, null=True,verbose_name="Alterado Por" )
    created_at = models.DateTimeField(blank=True, null=True, default = timezone.now,verbose_name="Criado Em")
    alter_at = models.DateTimeField(blank=True, null=True,verbose_name="Alterado Em")
    

    class Meta:
        managed = False  
        db_table = 'detalhes_equipamento'  

    def __str__(self):
        return f"{self.nome} - {self.local}"

class CountEquipamentoPorLocalizacao(models.Model):
    ilha = models.CharField(max_length=100)
    quantidade_equipamentos = models.IntegerField()
    
    
    class Meta:
        managed = False  
        db_table = 'count_equipamento_por_localizacao'

class CountEquipamentoPorConcelho(models.Model):
    concelhos = models.CharField(max_length=100)
    quantidade_equipamentos = models.IntegerField()
    
    
    class Meta:
        managed = False  
        db_table = 'count_equipamento_por_concelho'


class CountEquipamentoPorAgentes(models.Model):
    user_id = models.IntegerField(primary_key=True)
    email = models.EmailField()
    user_name = models.CharField(max_length=255)
    total_equipamentos = models.IntegerField()
    avatar_user = models.CharField(max_length=255)

    class Meta:
        db_table = 'count_equipamento_por_agentes'
        verbose_name = 'Contagem de Equipamentos por Agente'
        verbose_name_plural = 'Contagens de Equipamentos por Agentes'
        managed = False  

    def __str__(self):
        return f"{self.user_name} ({self.total_equipamentos} equipamentos)"


class CountEquipamentoPorSemanaAtual(models.Model):
    dia_semana = models.CharField(max_length=20, verbose_name="Dia da Semana")
    dia_numero = models.IntegerField(verbose_name="Número do Dia")
    total_equipamentos = models.IntegerField(verbose_name="Total de Equipamentos")

    class Meta:
        managed = False 
        db_table = 'count_equipamento_por_semana_atual'
        verbose_name = 'Contagem de Equipamentos por Semana Atual'
       

    def __str__(self):
        return f"{self.dia_semana} - {self.total_equipamentos} equipamentos"