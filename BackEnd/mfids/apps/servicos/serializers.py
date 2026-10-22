from rest_framework import serializers
from .models import Servico, OperacaoServico, ServicoDemografia, ServicoOferecido,ListaServico,ListaValencias,DistribuicaoTipoRespostaSocial
from apps.shared.serializers import *
from apps.organizacoes.models import Contato
from django.utils import timezone
from apps.shared.exceptions import CustomResponse 
#from apps.shared.serializers import FonteFinanciamentoSerializer,FonteFinanciamentoDetailSerializer
from apps.equipamentos.models import FonteFinanciamento
from apps.api.models import Dominio
#from apps.shared.utilFunctions import get_domain_by_id 


class DominioSerializer(serializers.ModelSerializer):
    #domain_status = serializers.CharField(source='get_domain_status_display')
    created_by = serializers.StringRelatedField()
    updated_by = serializers.StringRelatedField()
    
    class Meta:
        model = Dominio
        fields = [
            'id',
            'domain_code',
            'domain_name',
            'domain_description',
            'domain_status',
            'created_by',
            'updated_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'updated_by', 'created_at', 'updated_at']

class OperacaoServicoSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    class Meta:
        model = OperacaoServico
        fields = ['dias_funcionamento', 'horario_abertura', 'horario_fechamento', 'id']

    def create(self, validated_data):
        validated_data['criado_por'] = self.context['request'].user.pk
        operacao_servico = OperacaoServico.objects.create(**validated_data)
        return operacao_servico

    def update(self, instance, validated_data):
        print("teste")
        validated_data['alterado_por'] = self.context['request'].user.pk
        validated_data['alter_at'] = timezone.now()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance

class ServicoDemografiaSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    class Meta:
        model = ServicoDemografia
        fields = ['domain_faixa_etaria', 'total_masculino', 'total_feminino', 'deficientes_masculino', 'deficientes_feminino', 'id']

    def create(self, validated_data):
        validated_data['criado_por'] = self.context['request'].user.pk
        validated_data['created_at'] = timezone.now()

        demografia = ServicoDemografia.objects.create(**validated_data)
        return demografia

    def update(self, instance, validated_data):
        validated_data['alterado_por'] = self.context['request'].user.pk

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance

class ServicoOferecidoSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    class Meta:
        model = ServicoOferecido
        fields = ['id','domain_tipo_servico']

    def create(self, validated_data):
        validated_data['criado_por'] = self.context['request'].user.pk
        servico_oferecido = ServicoOferecido.objects.create(**validated_data)
        return servico_oferecido

    def update(self, instance, validated_data):
        validated_data['alterado_por'] = self.context['request'].user.pk
        validated_data['alter_at'] = timezone.now()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
    
    



class ServicoSerializer(serializers.ModelSerializer):
    #servicos_oferecidos_outros = serializers.CharField(required=False, allow_blank=True, write_only=True)
    operacoes = OperacaoServicoSerializer(many=True, required=False)
    demografias = ServicoDemografiaSerializer(many=True, required=False)
    servicos_oferecidos = ServicoOferecidoSerializer(many=True, required=False)
    fontes_financiamento = FonteFinanciamentoSerializer(many=True, required=False)
    #domain_fonte_fin_outros = serializers.CharField(required=False, allow_blank=True, write_only=True)
    

    class Meta:
        model = Servico
        fields = [
            'id', 'nome', 'licenciado', 'data_licenciamento', 'capacidade_instalada', 'meses_operacionais',
             'mensalidade_min', 'mensalidade_max', 'nr_valencia', 'codigo_tipo_resposta',
            'nr_alvara', 'resposta_social_financiada', 'data_inicio_funcionamento', 'encerra_ferias',
            'domain_periodo_funcionamento', 'nr_medio_utente_dia', 'nr_utente_frequenta', 'nr_utente_abranger','nr_funcionario',
            'domain_dias_funcionamento', 'domain_meses_funcionamento', 'operacoes', 'demografias', 'servicos_oferecidos',
            'equipamento','domain_acesso_gratuito','fontes_financiamento','servicos_oferecidos_outros','domain_fonte_fin_outros'
        ]
    

    def create(self, validated_data):
        operacoes_data = validated_data.pop('operacoes', [])
        demografias_data = validated_data.pop('demografias', [])
        servicos_oferecidos_data = validated_data.pop('servicos_oferecidos', [])
        fontes_financiamento_data = validated_data.pop('fontes_financiamento', [])
        #servicos_oferecidos_outros_data = validated_data.pop('servicos_oferecidos_outros', None)

        #domain_fonte_fin_outros_data = validated_data.pop('domain_fonte_fin_outros', None)

  

        user = self.context['request'].user.pk

        validated_data['criado_por'] = user


        servico = Servico.objects.create(**validated_data)

        for fontes_financiamento_data in fontes_financiamento_data:
            FonteFinanciamento.objects.create(servico=servico, **fontes_financiamento_data)

        for operacao_data in operacoes_data:
            OperacaoServico.objects.create(servico=servico, **operacao_data)

        for demografia_data in demografias_data:
            ServicoDemografia.objects.create(servico=servico, **demografia_data)

        for servico_oferecido_data in servicos_oferecidos_data:
            ServicoOferecido.objects.create(servico=servico, **servico_oferecido_data)

        """if servicos_oferecidos_outros_data:
            ServicoOferecido.objects.create(servico=servico, servicos_oferecidos_outros = servicos_oferecidos_outros_data, criado_por = user )
        """
        """if domain_fonte_fin_outros_data:
            # deve alterar equipamento para servico
             FonteFinanciamento.objects.create(servico=servico,  
                                              domain_fonte_fin_outros = domain_fonte_fin_outros_data,
                                              criado_por = user )
        """
        
        raise CustomResponse(
            detail="Serviço criado com sucesso.",
            status_code=200,
            operation_status="1",
            operation_type="Success",
            return_id = servico.pk
        )

    def update(self, instance, validated_data):
        operacoes_data = validated_data.pop('operacoes', [])
        demografias_data = validated_data.pop('demografias', [])
        servicos_oferecidos_data = validated_data.pop('servicos_oferecidos', [])

        validated_data['alterado_por'] = self.context['request'].user.pk
        validated_data['alter_at'] = timezone.now()

        fontes_financiamento_data = validated_data.pop('fontes_financiamento', [])
        print(f"fonte_id: {fontes_financiamento_data}")

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if fontes_financiamento_data:
            for fonte_data in fontes_financiamento_data:
                fonte_id = fonte_data.get('id')
                
                if fonte_id is not None:
                    FonteFinanciamento.objects.filter(id=fonte_id, servico=instance).update(**fonte_data)
                else:
                    FonteFinanciamento.objects.create(servico=instance, **fonte_data)

  
        for operacao_data in operacoes_data:
            operacao_id = operacao_data.get('id')
            print(operacao_id)
            if operacao_id is not None:
                OperacaoServico.objects.filter(id=operacao_id, servico=instance).update(**operacao_data)
            else:
                OperacaoServico.objects.create(servico=instance, **operacao_data)

    

        for demografia_data in demografias_data:
            demografia_id = demografia_data.get('id')
            if demografia_id is not None:
                ServicoDemografia.objects.filter(id=demografia_id, servico=instance).update(**demografia_data)
            else:
                ServicoDemografia.objects.create(servico=instance, **demografia_data)


     
        for servico_oferecido_data in servicos_oferecidos_data:
            servico_id = servico_oferecido_data.get('id')
            if servico_id is not None:
                ServicoOferecido.objects.filter(id=servico_id, servico=instance).update(**servico_oferecido_data)
            else:
                ServicoOferecido.objects.create(servico=instance, **servico_oferecido_data)
           
        instance.save()

        raise CustomResponse(
            detail="Serviço atualizado com sucesso.",
            status_code=200,
            operation_status="1",
            operation_type="Success",
            return_id = instance.pk
        )

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        operacoes = OperacaoServico.objects.filter(servico=instance)
        operacoes_data = OperacaoServicoSerializer(operacoes, many=True).data if operacoes.exists() else []

        demografias = ServicoDemografia.objects.filter(servico=instance)
        demografias_data = ServicoDemografiaSerializer(demografias, many=True).data if demografias.exists() else []

        servicos_oferecidos = ServicoOferecido.objects.filter(servico=instance)
        servicos_oferecidos_data = ServicoOferecidoDetailSerializer(servicos_oferecidos, many=True).data if servicos_oferecidos.exists() else []

        if instance.codigo_tipo_resposta:
           trs =  Dominio.objects.filter(domain_code=instance.codigo_tipo_resposta, domain_name = 'TIPO_RESPOSTA_SOCIAL').values('domain_description').first()
           
        representation['operacoes'] = operacoes_data
        representation['demografias'] = demografias_data
        representation['servicos_oferecidos'] = servicos_oferecidos_data
        representation['tipo_resposta_social_desc'] = trs['domain_description']
        #domain_periodo_funcionamento  domain_dias_funcionamento 
        
        try:
            fontes_financiamento = FonteFinanciamento.objects.filter(servico=instance.pk)
            representation['fontes_financiamento'] = FonteFinanciamentoDetailSerializer(
                fontes_financiamento, many=True
            ).data
        except FonteFinanciamento.DoesNotExist:
            pass

        return representation 
    

class ListaServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListaServico
        fields = ['servico_name', 'email', 'id_equipamento', 'id_servico', 'created_at', 'user_name']

class ListaValenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListaValencias
        fields = '__all__'


class DistribuicaoTipoRespostaSocialSerializer(serializers.ModelSerializer):
    class Meta:
        model = DistribuicaoTipoRespostaSocial
        fields = '__all__'