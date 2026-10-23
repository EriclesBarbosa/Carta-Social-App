from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone
from django.db.models import Q
from datetime import datetime
from django.contrib.auth.models import User, Permission
from apps.users.models import Profile

from rest_framework.exceptions import APIException
from rest_framework import serializers
from apps.users.forms import SignupForm
from .models import Organizacao, Contato, Localizacao, Geografia, UserOrganizacoes,ListOrganizacaoModel
from apps.shared.fields import GeografiaField, GestorField
from apps.shared.exceptions import CustomResponse 
from apps.shared.serializers import  ContatoSerializer
from apps.shared.send_welcome_email import send_welcome_email

from rest_framework.exceptions import APIException

class GeografiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Geografia
        fields = '__all__'

class OrganizacaoSerializerDetail(serializers.ModelSerializer):
    class Meta:
        model = Organizacao
        fields = '__all__'

class OrganizacaoSerializer(serializers.ModelSerializer):
    
    contato = ContatoSerializer()  
    geografia = serializers.PrimaryKeyRelatedField(queryset=Geografia.objects.all(), write_only=True)

    geografia = GeografiaField(queryset=Geografia.objects.all())
   

    class Meta:
        model = Organizacao
        fields = ['nome','nif','natureza_juridica','contato','geografia','tipo_organizacao','parent_id','id','natureza_juridica_outro','status']

   
    def validate(self, data):
        tipo_organizacao = data.get('tipo_organizacao')
        proprietario_id = data.get('parent_id')
        geografia_id = data.get('geografia')
        codigo_gestor = data.get('codigo_gestor')
        codigo_proprietario = data.get('codigo_proprietario')

        request = self.context.get('request')

        """
        if tipo_organizacao == 'G' and not codigo_gestor:
            raise CustomResponse(
                detail="O campo código gestor é obrigatório para organizações do tipo G",
                status_code=400,
                operation_status="0",
                operation_type="Error"
            )
    

        if tipo_organizacao == 'P' and not codigo_proprietario:
            raise CustomResponse(
                detail="O campo código proprietário é obrigatório para organizações do tipo P",
                status_code=400,
                operation_status="0",
                operation_type="Error"
            )
        
        if tipo_organizacao == 'PG':
            if not codigo_gestor or not codigo_proprietario:
                raise CustomResponse(
                    detail="Para organizações do tipo PG, ambos os campos (código gestor e código proprietário) são obrigatórios",
                    status_code=400,
                    operation_status="0",
                    operation_type="Error"
                )
            else:
                if codigo_gestor and codigo_proprietario and codigo_gestor == codigo_proprietario:
                    raise CustomResponse(
                        detail="Código gestor e proprietário não pode ser iguais",
                        status_code=400,
                        operation_status="0",
                        operation_type="Error"
                    )
            
        
        if request.method  not in ['PUT', 'PATCH']:
            if codigo_gestor and Organizacao.objects.filter(
                Q(codigo_gestor=codigo_gestor) | 
                Q(codigo_proprietario=codigo_gestor)
            ).exists():
                raise CustomResponse(
                    detail=f"O código {codigo_gestor} já está em uso (como gestor ou proprietário)",
                    status_code=400,
                    operation_status="0",
                    operation_type="Error"
                )

            
            if codigo_proprietario and Organizacao.objects.filter(
                Q(codigo_gestor=codigo_proprietario) | 
                Q(codigo_proprietario=codigo_proprietario)
            ).exists():
                raise CustomResponse(
                    detail=f"O código {codigo_proprietario} já está em uso (como gestor ou proprietário)",
                    status_code=400,
                    operation_status="0",
                    operation_type="Error"
                )

        """
        if tipo_organizacao in ['G'] and not proprietario_id:
            error_response = CustomResponse(
                detail="O campo proprietário é obrigatório quando o tipo de organização é G.",
                status_code=400,
                operation_status="0",
                operation_type="Error"
            )
            raise error_response
        elif tipo_organizacao in ['G']:
            try: 
                orga = Organizacao.objects.get(id=proprietario_id)
            except Organizacao.DoesNotExist:
                error_response = CustomResponse(
                    detail="Proprietário não encontrada.",
                    status_code=400,
                    operation_status="0",
                    operation_type="Error"
                )
                raise error_response
            
        return data
      
    def to_representation(self, instance):
        representation = super().to_representation(instance)

        
        
        if instance.tipo_organizacao == 'P':
            
            list_gestor = Organizacao.objects.filter(parent_id=instance.id)
            representation['gestor'] = OrganizacaoSerializerDetail(list_gestor, many=True).data 
           
        elif instance.tipo_organizacao == 'G' and instance.parent_id:  
            try:
                propre = Organizacao.objects.get(id=instance.parent_id)
                representation['proprietario'] = OrganizacaoSerializerDetail(propre).data
            except Organizacao.DoesNotExist:
                pass
            
        elif instance.tipo_organizacao == 'PG' and instance.parent_id:  
            try:
                propre = Organizacao.objects.get(id=instance.parent_id)
                representation['proprietario'] = OrganizacaoSerializerDetail(propre).data
            except Organizacao.DoesNotExist:
                pass

            try:
                list_gestor = Organizacao.objects.filter(parent_id=instance.id)
                representation['gestor'] = OrganizacaoSerializerDetail(list_gestor, many=True).data
            except Organizacao.DoesNotExist:
                pass

        if instance.contato:  
            representation['contato'] = ContatoSerializer(instance.contato).data
        if instance.geografia:  
            representation['geografia'] = GeografiaSerializer(instance.geografia).data

        return representation
    
    def create(self, validated_data):
        data = datetime.now()
        password = "@$%teste"
        contato_data = validated_data.pop('contato', None)
        localizacao_data = validated_data.pop('localizacao', None)

        validated_data['criado_por'] = self.context['request'].user.pk 

        """
            * criar user * enviar email mas con link do frontend
            * criar perfil 
        """
        nome = validated_data['nome']
        email = contato_data['email']
        tipo_organizacao = validated_data['tipo_organizacao']


        # Este funcionalidade foi descontinuado 
        """
        form_data = {
            'email': email,
            'is_superuser': False,
            'groups_val': False
        }

        user = None
        form = SignupForm(data=form_data)
        if form.is_valid():
            user, password = form.save()
            send_welcome_email(user = user, nome = nome, password = password, is_staff = False,request = None)
        else:
            pass
           
        """

        contato = Contato.objects.create(**contato_data) if contato_data else None

        if tipo_organizacao == "PG":
            organizacao_p = Organizacao.objects.create(
                contato=contato,
                **validated_data
            )

            pre = "PR"
            id_org = organizacao_p.pk
            username = str(f"{pre}-{id_org}-{data.month}{data.year}")

            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(username=username, password=password
                                                ,first_name=nome.split(' ')[0]  
                                                ,last_name=' '.join(nome.split(' ')[1:]) if len(nome.split(' ')) > 1 else '' 
                                                )
                user.groups.set([4])
                user.email = email
                user.save()
                try:
                    perm = Permission.objects.get(codename='can_access_frontend')
                    user.user_permissions.add(perm)
                except Permission.DoesNotExist:
                    pass
                Profile.objects.filter(user=user).update(municipio='all')
                try:
                    send_welcome_email(user=user, nome=nome, password=password, is_staff=False, request=None)
                except Exception:
                    pass

            organizacao_p.tipo_organizacao = "P"
            organizacao_p.codigo_proprietario = username

            organizacao_p.save()

            organizacao_g = Organizacao.objects.create(
                contato=contato,
                **validated_data
            )

            if user is None:
                UserOrganizacoes.objects.create( organizacao = organizacao_p, criado_por = self.context['request'].user )
            else:
                UserOrganizacoes.objects.create( organizacao = organizacao_p, criado_por = self.context['request'].user, user=user)

            
            pre = "GS"
            id_org = organizacao_g.pk
            username = str(f"{pre}-{id_org}-{data.month}{data.year}")

            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(username=username, password=password
                                                ,first_name=nome.split(' ')[0]  
                                                ,last_name=' '.join(nome.split(' ')[1:]) if len(nome.split(' ')) > 1 else '' 
                                                )
                user.groups.set([3])
                user.email = email
                user.save()
                try:
                    perm = Permission.objects.get(codename='can_access_frontend')
                    user.user_permissions.add(perm)
                except Permission.DoesNotExist:
                    pass
                Profile.objects.filter(user=user).update(municipio='all')
                try:
                    send_welcome_email(user=user, nome=nome, password=password, is_staff=False, request=None)
                except Exception:
                    pass

            organizacao_g.parent_id = organizacao_p.pk
            organizacao_g.tipo_organizacao = "G"
            organizacao_p.codigo_gestor = username

            organizacao_g.save()

            if user is None:
                UserOrganizacoes.objects.create( organizacao = organizacao_g, criado_por = self.context['request'].user )
            else:
                UserOrganizacoes.objects.create( organizacao = organizacao_g, criado_por = self.context['request'].user, user=user)

        elif tipo_organizacao == "P":
            organizacao_p = Organizacao.objects.create(
                contato=contato,
                **validated_data
            )

            pre = "PR"
            id_org = organizacao_p.pk
            username = str(f"{pre}-{id_org}-{data.month}{data.year}")

            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(username=username, password=password
                                                ,first_name=nome.split(' ')[0]  
                                                ,last_name=' '.join(nome.split(' ')[1:]) if len(nome.split(' ')) > 1 else '' 
                                                
                                                )
                user.groups.set([4])
                user.email = email
                user.save()
                try:
                    perm = Permission.objects.get(codename='can_access_frontend')
                    user.user_permissions.add(perm)
                except Permission.DoesNotExist:
                    pass
                Profile.objects.filter(user=user).update(municipio='all')
                try:
                    send_welcome_email(user=user, nome=nome, password=password, is_staff=False, request=None)
                except Exception:
                    pass

            organizacao_p.tipo_organizacao = "P"
            organizacao_p.codigo_proprietario = username

            organizacao_p.save()


            if user is None:
                UserOrganizacoes.objects.create( organizacao = organizacao_p, criado_por = self.context['request'].user )
            else:
                UserOrganizacoes.objects.create( organizacao = organizacao_p, criado_por = self.context['request'].user, user=user)

        elif tipo_organizacao == "G":
            organizacao_g = Organizacao.objects.create(
                contato=contato,
                **validated_data
            )

            pre = "GS"
            id_org = organizacao_g.pk
            username = str(f"{pre}-{id_org}-{data.month}{data.year}")

            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(username=username, password=password
                                                ,first_name=nome.split(' ')[0]  
                                                ,last_name=' '.join(nome.split(' ')[1:]) if len(nome.split(' ')) > 1 else '' 
                                                )
                user.groups.set([3])
                user.email = email
                user.save()
                try:
                    perm = Permission.objects.get(codename='can_access_frontend')
                    user.user_permissions.add(perm)
                except Permission.DoesNotExist:
                    pass
                Profile.objects.filter(user=user).update(municipio='all')
                try:
                    send_welcome_email(user=user, nome=nome, password=password, is_staff=False, request=None)
                except Exception:
                    pass

            organizacao_g.tipo_organizacao = "G"
            organizacao_g.codigo_gestor = username

            organizacao_g.save()

            if user is None:
                UserOrganizacoes.objects.create( organizacao = organizacao_g, criado_por = self.context['request'].user )
            else:
                UserOrganizacoes.objects.create( organizacao = organizacao_g, criado_por = self.context['request'].user, user=user)

        

        
        raise CustomResponse(
                detail=f"Entidade registrada com sucesso.",
                status_code=201,
                operation_status="1",
                operation_type="Success",
                return_id= 0
            )
    

    def update(self, instance, validated_data):
        request = self.context['request']
        user = request.user.pk
        validated_data['alter_at'] = timezone.now()
        validated_data['alterado_por'] = user 
        tipo_organizacao = validated_data.pop('tipo_organizacao', None)
        #tipo_organizacao = instance.tipo_organizacao
        #validated_data.pop('codigo_gestor', None)
        #validated_data.pop('codigo_proprietario', None)
        password = "@$%teste"
        data = datetime.now()

        if tipo_organizacao == 'PG':

            organizacao_g = Organizacao.objects.create(
                contato=instance.contato,
                geografia= instance.geografia,
                nome = instance.nome,
                tipo_organizacao='G',
                parent_id = instance.id,
                nif = instance.nif,
                natureza_juridica =instance.natureza_juridica,
                natureza_juridica_outro = instance.natureza_juridica_outro
            )

            pre = "GS"
            id_org = organizacao_g.pk
            username = str(f"{pre}-{id_org}-{data.month}{data.year}")

            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(username=username, password=password
                                                ,first_name=instance.nome.split(' ')[0]  
                                                ,last_name=' '.join(instance.nome.split(' ')[1:]) if len(instance.nome.split(' ')) > 1 else '' 
                                                )
                user.groups.set([3])
                user.email = instance.contato.email if instance.contato else ''
                user.save()
                try:
                    perm = Permission.objects.get(codename='can_access_frontend')
                    user.user_permissions.add(perm)
                except Permission.DoesNotExist:
                    pass
                Profile.objects.filter(user=user).update(municipio='all')
                try:
                    send_welcome_email(user=user, nome=instance.nome, password=password, is_staff=False, request=None)
                except Exception:
                    pass

            organizacao_g.codigo_gestor = username
            organizacao_g.save()

            if user is None:
                UserOrganizacoes.objects.create( organizacao = organizacao_g, criado_por = self.context['request'].user )
            else:
                UserOrganizacoes.objects.create( organizacao = organizacao_g, criado_por = self.context['request'].user, user=user)

        
        for attr, value in validated_data.items():
            if attr not in ['contato', 'localizacao']:
                setattr(instance, attr, value)

        contato_data = validated_data.get('contato')
        
        if contato_data:
            
            contato_serializer = ContatoSerializer(instance.contato, data=contato_data, partial=True, context={'user': user,'request': request,'local':'Organization'})
          
            contato_serializer.is_valid(raise_exception=True)
            contato_serializer.save()

        instance.save()
        return instance

class ListByTypeOrganizationSerializerDetail(serializers.ModelSerializer):
    class Meta:
        model = Organizacao
        fields = '__all__'

class ListByTypeOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListOrganizacaoModel #Organizacao
        fields = '__all__'
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        gestor_count = Organizacao.objects.filter(parent_id=instance.id).count()
        representation['gestor_count'] = gestor_count
        return representation

class AddGestorToProprietarioSerializer(serializers.Serializer):
    IdProprietarioToGestor = serializers.IntegerField(required=True)
    idProprietario = serializers.IntegerField(required=True)
    status = serializers.IntegerField(required=True)

    def validate(self, data):
        IdProprietarioToGestor = data['IdProprietarioToGestor']
        idProprietario = data['idProprietario']

        try:
            newGestor = Organizacao.objects.get(id=IdProprietarioToGestor)
            proprietario = Organizacao.objects.get(id=idProprietario)
        except ObjectDoesNotExist:
            error_response = CustomResponse(
                detail="Um dos proprietários não existe.",
                status_code=400,
                operation_status="0",
                operation_type="Error"
            )
            raise error_response

        data['newGestor'] = newGestor
        data['proprietario'] = proprietario

        return data

    def create(self, validated_data):
        newGestor = validated_data['newGestor']
        proprietario = validated_data['proprietario']
        status = validated_data['status']

        if status == 1:
            if newGestor.tipo_organizacao == 'P':
                newType = 'PG'
            else:
                newType = 'PG'
            newGestor.tipo_organizacao = newType
            newGestor.parent_id = proprietario.id
            newGestor.save()

            success_response = CustomResponse(
                detail="Gestor adicionado com sucesso",
                status_code=200,
                operation_status="1",
                operation_type="Success"
            )
            raise success_response
        else:
            error_response = CustomResponse(
                    detail="Neste momento ainda não podes remover um gestor.",
                    status_code=400,
                    operation_status="0",
                    operation_type="Error"
                )
            raise error_response

class IlhaSerializer(serializers.Serializer):
    ilha = serializers.CharField()

class ConcelhoSerializer(serializers.Serializer):
    concelho = serializers.CharField()

class FreguesiaSerializer(serializers.Serializer):
    freguesia = serializers.CharField()

class ZonaSerializer(serializers.Serializer):
    #id = serializers.IntegerField()
    zona = serializers.CharField()

class LugarSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    lugar = serializers.CharField()