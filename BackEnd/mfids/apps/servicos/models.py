from django.db import models
#from apps.equipamentos.models import Equipamento
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone

class Servico(models.Model):
    #equipamento = models.ForeignKey('Equipamento', models.DO_NOTHING, blank=True, null=True)
    equipamento = models.ForeignKey(
        'equipamentos.Equipamento', 
        on_delete=models.CASCADE
    )
    nome = models.CharField(max_length=255, blank=True, null=True, db_comment='Nome da resposta social')
    licenciado = models.BooleanField(blank=True, null=True)
    data_licenciamento = models.DateField(blank=True, null=True, db_comment='DD/MM/AAAA')
    capacidade_instalada = models.IntegerField(blank=False, null=False)
    meses_operacionais = models.IntegerField(blank=True, null=True,db_comment='Nº de meses/ano em funcionamento') #ArrayField(models.CharField(), default=list, blank=True, null=True, db_comment='Nº de meses/ano em funcionamento')
    #acesso_gratuito = models.BooleanField(blank=True, null=True)
    domain_acesso_gratuito = models.IntegerField(blank=True, null=True)
    mensalidade_min = models.DecimalField(max_digits=10, decimal_places=0, blank=True, null=True, db_comment='Em escudos')
    mensalidade_max = models.DecimalField(max_digits=10, decimal_places=0, blank=True, null=True)
    nr_valencia = models.CharField(max_length=100, blank=True, null=True)
    codigo_tipo_resposta = models.CharField(max_length=10, blank=True, null=True)
    nr_alvara = models.CharField(max_length=100, blank=True, null=True)
    resposta_social_financiada = models.BooleanField(blank=True, null=True)
    data_inicio_funcionamento = models.DateField(blank=True, null=True)
    encerra_ferias = models.BooleanField(blank=True, null=True)
    domain_periodo_funcionamento = models.IntegerField(blank=True, null=True)
    nr_medio_utente_dia = models.IntegerField(blank=False, null=False)
    nr_utente_frequenta = models.IntegerField(blank=False, null=False)
    nr_utente_abranger = models.IntegerField(blank=False, null=False)
    nr_funcionario = models.IntegerField(blank=False, null=False)
    #dias_funcionamento = models.IntegerField(blank=True, null=True)
    domain_dias_funcionamento = models.IntegerField(blank=True, null=True)
    domain_meses_funcionamento = ArrayField(models.CharField(), default=list, blank=True, null=True)

    servicos_oferecidos_outros = models.CharField(max_length=80, blank=True, null=True)
    domain_fonte_fin_outros = models.CharField(max_length=80, blank=True, null=True)

    alterado_por = models.IntegerField( blank=True, null=True)
    criado_por = models.IntegerField( blank=True, null=True)
    alter_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True, default = timezone.now)

    def clean(self):
        if self.data_licenciamento == "":
            self.data_licenciamento = None

        if self.data_inicio_funcionamento == "":
            self.data_inicio_funcionamento = None

    class Meta:
        managed = False
        db_table = 'servico'


class OperacaoServico(models.Model):
    servico = models.ForeignKey(Servico, models.DO_NOTHING, blank=True, null=True)
    dias_funcionamento = models.CharField(max_length=50, blank=True, null=True)
    horario_abertura = models.TimeField(blank=True, null=True)
    horario_fechamento = models.TimeField(blank=True, null=True)

    alterado_por = models.IntegerField( blank=True, null=True)
    criado_por = models.IntegerField( blank=True, null=True)
    alter_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True, default = timezone.now)

    class Meta:
        managed = False
        db_table = 'operacao_servico'


class ServicoDemografia(models.Model):
    servico = models.ForeignKey(Servico, models.DO_NOTHING, blank=True, null=True)
    total_masculino = models.IntegerField(blank=True, null=True)
    total_feminino = models.IntegerField(blank=True, null=True)
    deficientes_masculino = models.IntegerField(blank=True, null=True)
    deficientes_feminino = models.IntegerField(blank=True, null=True)
    domain_faixa_etaria = models.IntegerField(blank=True, null=True)
    
    alterado_por = models.IntegerField( blank=True, null=True)
    criado_por = models.IntegerField( blank=True, null=True)
    alter_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True, default = timezone.now)

    class Meta:
        managed = False
        db_table = 'servico_demografia'


class ServicoOferecido(models.Model):
    servico = models.ForeignKey(Servico, models.DO_NOTHING, blank=True, null=True)
    domain_tipo_servico = models.IntegerField(blank=True, null=True)
    servicos_oferecidos_outros = models.CharField(max_length=80, blank=True, null=True)

    alterado_por = models.IntegerField( blank=True, null=True)
    criado_por = models.IntegerField( blank=True, null=True)
    alter_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True, default = timezone.now)

    class Meta:
        managed = False
        db_table = 'servico_oferecido'


    # forma de cria gestor - proprietario

    # cria domanin (apenas update)

class ListaServico(models.Model):
    servico_name = models.CharField(max_length=255, verbose_name="Service Name")
    email = models.EmailField(verbose_name="Email")
    id_equipamento = models.IntegerField(verbose_name="Equipment ID")
    id_servico = models.AutoField(primary_key=True, verbose_name="Service ID")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Created At")
    user_name = models.CharField(max_length=255, verbose_name="User Name")

    class Meta:
        db_table = 'lista_servico'
        verbose_name = 'Service List'
        verbose_name_plural = 'Service Lists'
        ordering = ['-created_at']
        managed = False

    def __str__(self):
        return f"{self.servico_name} - {self.user_name}"



class CountServicoPorLocalizacao(models.Model):
    ilha = models.CharField(max_length=100, primary_key=True)
    total_servicos = models.IntegerField()

    class Meta:
        db_table = 'count_servico_por_localizacao'
        verbose_name = 'Contagem de Serviços por Localização'
        verbose_name_plural = 'Contagens de Serviços por Localização'
        managed = False

    def __str__(self):
        return f"{self.ilha} - {self.total_servicos} serviços"
    

class ListaValencias(models.Model):
    id = models.IntegerField(primary_key=True, db_column='id', verbose_name='id')
    equipamento_nome = models.CharField(max_length=255, verbose_name='Nome do Equipamento' )
    servico_nome = models.CharField(max_length=255,verbose_name='Tipo de Resposta Social')
    data_licenciamento = models.DateField(verbose_name='Data de Licenciamento')
    capacidade_instalada = models.DecimalField(max_digits=10, decimal_places=0, verbose_name='Capacidade Instalada')
    data_inicio_funcionamento = models.DateField(verbose_name='Data de Início do Funcionamento')
    nr_funcionario = models.IntegerField(verbose_name='Número de Funcionários')

    criado_por = models.IntegerField( blank=True, null=True,verbose_name='Criado Por')
    created_at = models.DateTimeField(blank=True, null=True, default = timezone.now,verbose_name='Criado Em')
    alterado_por = models.IntegerField( blank=True, null=True,verbose_name='Alterado Por')
    alter_at = models.DateTimeField(blank=True, null=True, verbose_name='Alterado Em')
    


    class Meta:
        db_table = 'lista_valencias'
        verbose_name = 'Valencia List'
        verbose_name_plural = 'Valencia Lists'
        managed = False

    def __str__(self):
        return f"{self.equipamento_nome} - {self.servico_nome}"
    
class FaixaEtariaAtendida(models.Model):
    id = models.IntegerField(primary_key=True, db_column='id', verbose_name='id')
    total = models.IntegerField(db_column='total')
    faixa_etaria = models.CharField(max_length=20, verbose_name='Faixa Etária',db_column='domain_description' )

    class Meta:
        db_table = 'faixa_etaria_atendida'
        managed = False

    def __str__(self):
        return f"{self.faixa_etaria} - {self.faixa_etaria} Faixa Etária"

class DistribuicaoTipoRespostaSocial(models.Model):
    id = models.IntegerField(primary_key=True, db_column='id', verbose_name='id')
    total = models.IntegerField(db_column='total')
    codigo_tipo_resposta = models.CharField(max_length=20, verbose_name='codigo tipo resposta',db_column='codigo_tipo_resposta' )
    tipo_resposta_desc =  models.CharField(max_length=250, verbose_name='resposta desc',db_column='tipo_resposta_desc' )

    class Meta:
        db_table = 'distribuicao_tipo_resposta_social'
        managed = False

    def __str__(self):
        return f"{self.tipo_resposta_desc} - {self.tipo_resposta_desc} Tipo resposta social"

class TaxaOcupacaoEquipamento(models.Model):
    id = models.IntegerField(primary_key=True, db_column='id', verbose_name='id')
    total = models.IntegerField(db_column='total_geral')
    capacidade_instalada = models.IntegerField(db_column='capacidade_instalada')
    nome_equipamento =  models.CharField(max_length=250, verbose_name='Nome equipamento',db_column='nome_equipamento' )

    class Meta:
        db_table = 'taxa_ocupacao_equipamento'
        managed = False

    def __str__(self):
        return f"{self.nome_equipamento} - {self.nome_equipamento} Nome equipamento"

class NumeroTotalFuncionario(models.Model):
    id = models.IntegerField(primary_key=True, db_column='id', verbose_name='id')
    total = models.IntegerField(db_column='total')

    class Meta:
        db_table = 'numero_total_funcionario'
        managed = False

    def __str__(self):
        return f"{self.total} - {self.total} total de funcionario"