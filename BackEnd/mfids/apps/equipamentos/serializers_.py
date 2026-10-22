from rest_framework import serializers
from .models import Equipamento
from apps.organizacoes.models import Localizacao, Contato, Organizacao, Geografia
from apps.organizacoes.serializers import CustomResponse

from apps.shared.fields import GeografiaField, GestorField


class LocalizacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Localizacao
        fields = '__all__'

class ContatoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contato
        fields = '__all__'


class EquipamentoSerializer(serializers.ModelSerializer):
    contato = ContatoSerializer()
    geografia = GeografiaField(queryset=Geografia.objects.all())
    gestor = GestorField(queryset=Organizacao.objects.all())

    class Meta:
        model = Equipamento
        fields = '__all__'

    def validate(self, attrs):
        geografia_id = attrs.get('geografia', None)
        gestor_id = attrs.get('gestor', None)
        return attrs

    def create(self, validated_data):
        contato_data = validated_data.pop('contato', None)
        geografia_id = validated_data.pop('geografia', None)
        gestor_id = validated_data.pop('gestor', None)

        contato = Contato.objects.create(**contato_data) if contato_data else None

        equipamento = Equipamento.objects.create(
            contato=contato,
            geografia=geografia_id,
            gestor=gestor_id,
            **validated_data
        )

        raise CustomResponse(
            detail="Equipamento criado com sucesso.",
            status_code=201,
            operation_status="1",
            operation_type="Success"
        )

    def update(self, instance, validated_data):
  
        for attr, value in validated_data.items():
            if attr not in ['contato', 'geografia', 'gestor']:
                setattr(instance, attr, value)


        contato_data = validated_data.get('contato')
        if contato_data:
            for attr, value in contato_data.items():
                setattr(instance.contato, attr, value)
            instance.contato.save()
        instance.save()

        raise CustomResponse(
            detail="Equipamento atualizado com sucesso.",
            status_code=200,
            operation_status="1",
            operation_type="Success"
        )