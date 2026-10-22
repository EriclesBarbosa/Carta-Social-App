
from rest_framework import serializers
from .models import Equipamento, FonteFinanciamento
from apps.organizacoes.models import Contato, Geografia, Organizacao
from apps.servicos.models import ListaServico
from datetime import datetime

from django.utils import timezone
from apps.shared.exceptions import * 
from apps.shared.utilFunctions import get_domain_by_id 
from apps.servicos.serializers import *

class FonteFinanciamentoSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)  # Explicitly declare id as optional
    
    class Meta:
        model = FonteFinanciamento
        fields = ['id', 'fonte', 'contexto', 'domain_fonte_fin']
        
    def validate_id(self, value):
        """Custom validation for the id field"""
        if value is not None:
            if value and not FonteFinanciamento.objects.filter(id=value).exists():
                raise serializers.ValidationError("Fonte financiamento com este ID não existe.")
            return value

class GeografiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Geografia
        fields = '__all__'

class EquipamentoSerializer(serializers.ModelSerializer):
    # Campos do modelo Equipamento
    #codigo = serializers.CharField(max_length=50, allow_null=True, allow_blank=True, required=False)
    codigo = serializers.CharField(read_only=True)
    nome = serializers.CharField(max_length=255, allow_null=True, allow_blank=True, required=False)
    estado = serializers.CharField(max_length=50, allow_null=True, allow_blank=True, required=False)
    tipo_construcao_outro = serializers.CharField(max_length=50, allow_null=True, allow_blank=True, required=False)
    tipo_edificacao_outro = serializers.CharField(max_length=50, allow_null=True, allow_blank=True, required=False)
    data_oficializacao = serializers.DateField(allow_null=True, required=False)
    possui_eletricidade = serializers.BooleanField(allow_null=True, required=False)
    agua_canalizada = serializers.CharField(max_length=50, allow_null=True, allow_blank=True, required=False)
    sistema_esgoto = serializers.CharField(max_length=50, allow_null=True, allow_blank=True, required=False)
    latitude = serializers.CharField(max_length=100, allow_null=True, allow_blank=True, required=False)
    longitude = serializers.CharField(max_length=100, allow_null=True, allow_blank=True, required=False)
    altura = serializers.CharField(max_length=100, allow_null=True, allow_blank=True, required=False)
    ponto_referencia = serializers.CharField(max_length=100, allow_null=True, allow_blank=True, required=False)
    #domain_situacao_equipamento = serializers.IntegerField(allow_null=True, required=False)
    situacao_equipamento_outro = serializers.CharField(max_length=80, allow_null=True, allow_blank=True, required=False)
    #domain_situacao_juridica = serializers.IntegerField(allow_null=True, required=False)
    #domain_regime_propriedade = serializers.IntegerField(allow_null=True, required=False)
    regime_propriedade_outro = serializers.CharField(max_length=80, allow_null=True, allow_blank=True, required=False)
    #domain_tipo_edificacao = serializers.IntegerField(allow_null=True, required=False)
    #domain_estado_conservacao = serializers.IntegerField(allow_null=True, required=False)
    #domain_tipo_construcao_outro = serializers.IntegerField(allow_null=True, required=False) # este campo eh texto
    fonte_financiamento_outro = serializers.CharField(max_length=80, allow_null=True, allow_blank=True, required=False)
    #domain_fonte_financiamento = serializers.IntegerField(allow_null=True, required=False) # ver com Yma e Vady 
    remodelado = serializers.BooleanField(allow_null=True, required=False)
    #domain_fonte_fin_remodelacao = serializers.IntegerField(allow_null=True, required=False)
    fonte_fin_remodelacao_outro = serializers.CharField(max_length=80, allow_null=True, allow_blank=True, required=False)
    #domain_ligacao_rede_publica = serializers.IntegerField(allow_null=True, required=False)
    #domain_sanita_latrina = serializers.IntegerField(allow_null=True, required=False)
    banheiro_poliban = serializers.BooleanField(allow_null=True, required=False)
    #domain_evacuacao_agua = serializers.IntegerField(allow_null=True, required=False)
    #domain_possui_cozinha = serializers.IntegerField(allow_null=True, required=False)
    #domain_colecta_lixo = serializers.IntegerField(allow_null=True, required=False)
    colecta_lixo_outro = serializers.CharField(max_length=80, allow_null=True, allow_blank=True, required=False)
    acesso_a_deficiente = serializers.BooleanField(allow_null=True, required=False)

    domain_fonte_fin_outros = serializers.CharField(required=False, allow_blank=True, write_only=True)
    status = serializers.IntegerField(allow_null=True, required=False)

  

    # Relacionamentos
    geografia = serializers.PrimaryKeyRelatedField(
        queryset=Geografia.objects.all(), 
        required=False, 
        allow_null=True
    )
    contato = ContatoSerializer(required=False, allow_null=True)
    gestor = serializers.PrimaryKeyRelatedField(
        queryset=Organizacao.objects.all(), 
        required=False, 
        allow_null=True
    )
    fontes_financiamento = FonteFinanciamentoSerializer(many=True, required=False)

    class Meta:
        model = Equipamento
        fields = [
            'id', 'codigo','nome', 'estado', 'tipo_construcao_outro', 'tipo_edificacao_outro',
            'data_oficializacao', 'possui_eletricidade', 'agua_canalizada', 'sistema_esgoto',
            'latitude', 'longitude', 'altura', 'ponto_referencia', 'geografia', 'contato', 'gestor',
            'domain_situacao_equipamento', 'situacao_equipamento_outro', 'domain_situacao_juridica',
            'domain_regime_propriedade', 'regime_propriedade_outro', 'domain_tipo_edificacao',
            'domain_estado_conservacao', 'domain_tipo_construcao_outro', 'fonte_financiamento_outro',
             'remodelado',
            'fonte_fin_remodelacao_outro', 'domain_ligacao_rede_publica', 'domain_sanita_latrina',
            'banheiro_poliban', 'domain_evacuacao_agua', 'domain_possui_cozinha', 'domain_colecta_lixo',
            'colecta_lixo_outro', 'acesso_a_deficiente', 'fontes_financiamento','domain_fonte_fin_outros','status','data_encerramento','n_andar'
        ]

    def create(self, validated_data):
        data = datetime.now()
        fontes_financiamento_data = validated_data.pop('fontes_financiamento', [])
        domain_fonte_fin_outros_data = validated_data.pop('domain_fonte_fin_outros', None)

        contato_data = validated_data.pop('contato', None)

        user = self.context['request'].user.pk

        validated_data['criado_por'] = user
        

        contato = Contato.objects.create(**contato_data) if contato_data else None

        equipamento = Equipamento.objects.create(contato=contato, **validated_data)

        
        pre = "EQ"
        id_eq = equipamento.pk
        code = str(f"{pre}-{id_eq}-{data.month}{data.year}")
        equipamento.codigo = code
        equipamento.save()

       
        for fontes_financiamento_data in fontes_financiamento_data:
            FonteFinanciamento.objects.create(equipamento=equipamento, **fontes_financiamento_data)

        if domain_fonte_fin_outros_data:
             FonteFinanciamento.objects.create(equipamento=equipamento, 
                                              domain_fonte_fin_outros = domain_fonte_fin_outros_data,
                                              criado_por = user )


        raise CustomResponse(
            detail="Equipamento criado com sucesso.",
            status_code=200,
            operation_status="1",
            operation_type="Success",
            return_id = equipamento.pk
        )

        
    def update(self, instance, validated_data):
        request = self.context['request']
        user = request.user.pk
        validated_data['alterado_por'] = user
        validated_data['alter_at'] = timezone.now()

        fontes_financiamento_data = validated_data.pop('fontes_financiamento', [])
        contato_data = validated_data.pop('contato', None)


        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        """
        if instance.status in (2,3):
            error_response = CustomResponse(
                detail="Este equipamento não pode ser atualizado.",
                status_code=400,
                operation_status="0",
                operation_type="Error"
            )
            raise error_response
        """

        if contato_data:
            contato_data['alterado_por'] = user
            contato_serializer = ContatoSerializer(instance.contato, data=contato_data, partial=True,context={'user': user,'request': request,'local':'Equipamento'})
            contato_serializer.is_valid(raise_exception=True)
            contato_serializer.save()

        if fontes_financiamento_data:
            

            #novas_fontes_ids = {fonte_data.get('id') for fonte_data in fontes_financiamento_data if fonte_data.get('id')}

      
            #antigas_fontes_ids = set(instance.fontes_financiamento.values_list('id', flat=True))

            for fonte_data in fontes_financiamento_data:
                fonte_id = fonte_data.get('id')
                
                if fonte_id is not None:
                    
                  
                    FonteFinanciamento.objects.filter(id=fonte_id, equipamento=instance).update(**fonte_data)
                else:
              
                    FonteFinanciamento.objects.create(equipamento=instance, **fonte_data)
                
        instance.save()

        raise CustomResponse(
            detail="Equipamento atualizado com sucesso.",
            status_code=200,
            operation_status="1",
            operation_type="Success",
            return_id=instance.pk
        )

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        domain_fields = [
        'domain_situacao_equipamento',
        'domain_situacao_juridica',
        'domain_regime_propriedade',
        'domain_estado_conservacao',
        'domain_ligacao_rede_publica',
        'domain_sanita_latrina',
        'domain_evacuacao_agua',
        'domain_colecta_lixo',
        'domain_possui_cozinha',
        'domain_tipo_construcao_outro',
        'domain_tipo_edificacao'
        ]
        
        for field in domain_fields:
            domain_id = getattr(instance, field)
            representation[field] = get_domain_by_id(domain_id)



        if instance.contato:
            representation['contato'] = ContatoSerializer(instance.contato).data

        try:
            fontes_financiamento = FonteFinanciamento.objects.filter(equipamento=instance.pk)
            representation['fontes_financiamento'] = FonteFinanciamentoDetailSerializer(
                fontes_financiamento, many=True
            ).data
        except FonteFinanciamento.DoesNotExist:
            pass

        return representation


class EquipamentoDetailSerializer(serializers.ModelSerializer):

    codigo = serializers.CharField(max_length=50,  allow_null=True, required=False)
    nome = serializers.CharField(max_length=255, allow_null=True, required=False)
    estado = serializers.CharField(max_length=50, allow_null=True, required=False)
    tipo_construcao_outro = serializers.CharField(max_length=50, allow_null=True, required=False)
    tipo_edificacao_outro = serializers.CharField(max_length=50, allow_null=True, required=False)
    data_oficializacao = serializers.DateField(allow_null=True, required=False)
    possui_eletricidade = serializers.BooleanField(allow_null=True, required=False)
    agua_canalizada = serializers.CharField(max_length=50, allow_null=True, required=False)
    sistema_esgoto = serializers.CharField(max_length=50, allow_null=True, required=False)
    latitude = serializers.CharField(max_length=100, allow_null=True, required=False)
    longitude = serializers.CharField(max_length=100, allow_null=True, required=False)
    altura = serializers.CharField(max_length=100, allow_null=True, required=False)
    ponto_referencia = serializers.CharField(max_length=100, allow_null=True, required=False)
    #domain_situacao_equipamento = serializers.IntegerField(allow_null=True, required=False)
    situacao_equipamento_outro = serializers.CharField(max_length=80, allow_null=True, required=False)
    #domain_situacao_juridica = serializers.IntegerField(allow_null=True, required=False)
    #domain_regime_propriedade = serializers.IntegerField(allow_null=True, required=False)
    regime_propriedade_outro = serializers.CharField(max_length=80, allow_null=True, required=False)
    #domain_tipo_edificacao = serializers.IntegerField(allow_null=True, required=False)
    #domain_estado_conservacao = serializers.IntegerField(allow_null=True, required=False)
    #domain_tipo_construcao_outro = serializers.IntegerField(allow_null=True, required=False)
    fonte_financiamento_outro = serializers.CharField(max_length=80, allow_null=True, required=False)
    #domain_fonte_financiamento = serializers.IntegerField(allow_null=True, required=False)
    remodelado = serializers.BooleanField(allow_null=True, required=False)
    #domain_fonte_fin_remodelacao = serializers.IntegerField(allow_null=True, required=False)
    fonte_fin_remodelacao_outro = serializers.CharField(max_length=80, allow_null=True, required=False)
    #domain_ligacao_rede_publica = serializers.IntegerField(allow_null=True, required=False)
    #domain_sanita_latrina = serializers.IntegerField(allow_null=True, required=False)
    banheiro_poliban = serializers.BooleanField(allow_null=True, required=False)
    #domain_evacuacao_agua = serializers.IntegerField(allow_null=True, required=False)
    #domain_possui_cozinha = serializers.IntegerField(allow_null=True, required=False)
    #domain_colecta_lixo = serializers.IntegerField(allow_null=True, required=False)
    colecta_lixo_outro = serializers.CharField(max_length=80, allow_null=True, required=False)
    acesso_a_deficiente = serializers.BooleanField(allow_null=True, required=False)

    contato = ContatoSerializer()
    servico = ServicoSerializer(required=False)
    fontes_financiamento = FonteFinanciamentoSerializer(many=False, required=False)

    operacoes = OperacaoServicoSerializer(many=True, required=False)
    demografias = ServicoDemografiaSerializer(many=False, required=False)
    servicos_oferecidos = ServicoOferecidoSerializer(many=True, required=False)
    status = serializers.IntegerField(allow_null=True, required=False)
    n_andar = serializers.IntegerField(allow_null=True, required=False)

    class Meta:
        model = Equipamento
        fields = '__all__' 


    
    def to_representation(self, instance):
        representation = super().to_representation(instance)

        domain_fields = [
        'domain_situacao_equipamento',
        'domain_situacao_juridica',
        'domain_regime_propriedade',
        'domain_estado_conservacao',
       
        'domain_ligacao_rede_publica',
        'domain_sanita_latrina',
        'domain_evacuacao_agua',
        'domain_colecta_lixo',
        'domain_possui_cozinha',
        'domain_tipo_construcao_outro',
        'domain_tipo_edificacao'
        ]
        
        for field in domain_fields:
            domain_id = getattr(instance, field)
            a = get_domain_by_id(domain_id)
          
            representation[field] = get_domain_by_id(domain_id)

       


        if instance.contato:
            representation['contato'] = ContatoSerializer(instance.contato).data
        
        if instance.geografia:  
            representation['geografia'] = GeografiaSerializer(instance.geografia).data


        try:
            servicosCore = Servico.objects.filter(equipamento=instance.id) 
            
            servicos_list = []
            for servicoCore in servicosCore:
                servico_data = ServicoSerializer(servicoCore).data
                servicos_list.append(servico_data)

            if servicos_list:  
                representation['servicos'] = servicos_list  

        except Servico.DoesNotExist:
            pass

        try:
            fontes_financiamento = FonteFinanciamento.objects.filter(equipamento=instance.pk)
            representation['fontes_financiamento'] = FonteFinanciamentoDetailSerializer(
                fontes_financiamento, many=True
            ).data


        except FonteFinanciamento.DoesNotExist:
            pass

        return representation

