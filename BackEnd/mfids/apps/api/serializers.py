from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Dominio
from apps.users.models import Profile

try:

    from apps.common.models import Sales

except:
    pass 


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['full_name', 'phone', 'municipio', 'country', 'city', 'zip_code', 'address', 'avatar']
        read_only_fields = ['municipio']


class SalesSerializer(serializers.ModelSerializer):
    class Meta:

        try:
            model = Sales
        except:
            pass    
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
   
    class Meta:
        model = User
        fields = ['id','last_name','first_name','username', 'email', 'profile']

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        try:
            profile = Profile.objects.get(user_id=instance.pk)
            representation['profile'] = ProfileSerializer(profile).data
        except Profile.DoesNotExist:
            pass
        
        return representation


class DominioSerializer(serializers.ModelSerializer):  
    class Meta:  
        model = Dominio  
        fields = '__all__'



class ConcelhoSerializer(serializers.Serializer):
    concelho = serializers.CharField()


class ValidarEquipamentoSerializer(serializers.Serializer):
    id = serializers.IntegerField(allow_null=False)
    status = serializers.IntegerField(allow_null=False)

class ValidarOrganizacaoSerializer(serializers.Serializer):
    id = serializers.IntegerField(allow_null=False)
    status = serializers.IntegerField(allow_null=False)

class PorTipoFaixaEtariaSerializer(serializers.Serializer):
    tipo_resposta =  serializers.CharField()
    