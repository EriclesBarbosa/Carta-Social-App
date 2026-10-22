from rest_framework import serializers
from apps.organizacoes.models import Contato
from django.utils import timezone
from apps.equipamentos.models import FonteFinanciamento,Dominio
from apps.servicos.models import ServicoOferecido
from apps.shared.exceptions import CustomResponse 

class ContatoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contato
        fields = ['endereco', 'caixa_postal', 'telefone', 'telemovel', 'email', 'website','id']

    def create(self, validated_data):
        validated_data['criado_por'] = self.context['user']  
        

        email = validated_data['email'] 
        contato = Contato.objects.create(**validated_data)
        return contato

    def validate(self, data):
        email = data.get('email')
        request = self.context.get('request')
        local = self.context.get('local')

        if local == "Organization":

            if request.method  in ['PUT', 'PATCH']:
                return data
            
            if not email:
                raise CustomResponse(
                    detail="O campo email no contato é obrigatório",
                    status_code=400,
                    operation_status="0",
                    operation_type="Error"
                )
            else:
                
                if Contato.objects.filter(email = email).exists():
                    raise CustomResponse(
                    detail=f"Este email {email} já se encontra registado no sistema",
                    status_code=400,
                    operation_status="0",
                    operation_type="Error"
                )
                
        return data


    def update(self, instance, validated_data):
        validated_data['alterado_por'] = self.context['user']
        validated_data['alter_at'] = timezone.now()  
        validated_data.pop('email', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance

class DominioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dominio
        fields = ['id','domain_code','domain_description','domain_name']

class FonteFinanciamentoSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    class Meta:
        model = FonteFinanciamento
        fields = ['fonte', 'contexto','domain_fonte_fin','id']


class FonteFinanciamentoDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = FonteFinanciamento
        fields = ['id','fonte', 'contexto','domain_fonte_fin','servico','equipamento']

    """
    def to_representation(self, instance):
        representation = super().to_representation(instance)

        domain_fields = [
            'domain_fonte_fin',
            ]
        
        for field in domain_fields:
            domain_id = getattr(instance, field)
            representation[field] = get_domain_by_id(domain_id)
        
        return representation 
    """

class ServicoOferecidoDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicoOferecido
        fields = ['domain_tipo_servico','id']

    """
    def to_representation(self, instance):
        representation = super().to_representation(instance)

        domain_fields = [
            'domain_tipo_servico',
            ]
        
        for field in domain_fields:
            domain_id = getattr(instance, field)
            representation[field] = get_domain_by_id(domain_id)
        
        return representation 
    """

"""def get_domain_by_id(pk):
    try:
        
        print
        dominio = Dominio.objects.get(id=pk)

        return DominioSerializer(dominio).data
    except (Dominio.DoesNotExist, ValueError):
        return None

"""