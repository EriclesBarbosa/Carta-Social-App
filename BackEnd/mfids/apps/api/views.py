from http import HTTPStatus
from django.http import Http404
from django_filters import rest_framework as filters

from django.core.validators import validate_email
from django.core.exceptions import ValidationError

from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework import viewsets
from rest_framework import generics

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Q

from .models import Dominio,TipoFaixaEtaria
from .serializers import DominioSerializer

from apps.organizacoes.models import Organizacao, Geografia, EquipamentoOrganizacaoUtilizador,OrganizacaoUserDetalhe
from apps.organizacoes.serializers import *

from apps.equipamentos.models import Equipamento,FonteFinanciamento
from apps.equipamentos.serializers import EquipamentoSerializer,EquipamentoDetailSerializer,FonteFinanciamentoSerializer

from apps.api.serializers import *

from .filters import DominioFilter
from apps.shared.exceptions import CustomResponse 
from apps.shared.permissions import * 

from apps.users.models import Profile

from apps.servicos.models import Servico
from apps.servicos.serializers import ServicoSerializer



try:

    from apps.common.models import Sales

except:
    pass


class SalesView(APIView):

    permission_classes = (IsAuthenticatedOrReadOnly,)

    def post(self, request):
        serializer = SalesSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(data={
                **serializer.errors,
                'success': False
            }, status=HTTPStatus.BAD_REQUEST)
        serializer.save()
        return Response(data={
            'message': 'Record Created.',
            'success': True
        }, status=HTTPStatus.OK)

    def get(self, request, pk=None):
        if not pk:
            return Response({
                'data': [SalesSerializer(instance=obj).data for obj in Sales.objects.all()],
                'success': True
            }, status=HTTPStatus.OK)
        try:
            obj = get_object_or_404(Sales, pk=pk)
        except Http404:
            return Response(data={
                'message': 'object with given id not found.',
                'success': False
            }, status=HTTPStatus.NOT_FOUND)
        return Response({
            'data': SalesSerializer(instance=obj).data,
            'success': True
        }, status=HTTPStatus.OK)

    def put(self, request, pk):
        try:
            obj = get_object_or_404(Sales, pk=pk)
        except Http404:
            return Response(data={
                'message': 'object with given id not found.',
                'success': False
            }, status=HTTPStatus.NOT_FOUND)
        serializer = SalesSerializer(instance=obj, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(data={
                **serializer.errors,
                'success': False
            }, status=HTTPStatus.BAD_REQUEST)
        serializer.save()
        return Response(data={
            'message': 'Record Updated.',
            'success': True
        }, status=HTTPStatus.OK)

    def delete(self, request, pk):
        try:
            obj = get_object_or_404(Sales, pk=pk)
        except Http404:
            return Response(data={
                'message': 'object with given id not found.',
                'success': False
            }, status=HTTPStatus.NOT_FOUND)
        obj.delete()
        return Response(data={
            'message': 'Record Deleted.',
            'success': True
        }, status=HTTPStatus.OK)

class UserRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)
        token, _ = Token.objects.get_or_create(user=user)

        return Response({"message": "User registered", "token": token.key}, status=status.HTTP_201_CREATED)

class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def user_has_explicit_perm(self,user, perm):
        return (
            user.user_permissions.filter(codename=perm.split('.')[1]).exists() or  
            user.groups.filter(permissions__codename=perm.split('.')[1]).exists() 
        )

    def post(self, request):
        username_or_email = request.data.get("email")  
        password = request.data.get("password")

        try:
            validate_email(username_or_email)
            kwargs = {"email": username_or_email}  
           
        except ValidationError:
            
            kwargs = {"username": username_or_email}  

       
        try:
           
            user = User.objects.get(**kwargs)
           
           

        except User.DoesNotExist:
            return Response(
                {"error": "Credenciais inválidas"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.is_active is False:
            return Response(
                {"error": "Você não tem permissão explícita para acessar."},
                status=status.HTTP_403_FORBIDDEN
            )

        if not self.user_has_explicit_perm(user, 'auth.can_access_frontend'):
            return Response(
                {"error": "Você não tem permissão explícita para acessar o frontend."},
                status=status.HTTP_403_FORBIDDEN
            )

        authenticated_user = authenticate(username=user.username, password=password)
        
        if authenticated_user:
            token, _ = Token.objects.get_or_create(user=authenticated_user)
            permission = get_user_permissions(user)  
            #tipo_organizacao = OrganizacaoUserDetalhe.objects.filter(user_id =user.pk).values('tipo_organizacao')
            tipo_org = OrganizacaoUserDetalhe.objects.filter(user_id=user.pk).first()

    
            user_data = {
                'data': UserSerializer(authenticated_user).data,
                'permission': permission,
                'user_type': {
                        'tipo_organizacao': tipo_org.tipo_organizacao if tipo_org else None,
                        'id_organizacao': tipo_org.organizacao_id if tipo_org else None
                    }
            }
            
            return Response({
                "operationStatus": 1,
                "operationType": "Sucesso",
                "operationDesc": "Sucesso",
                "token": token.key,
                "user": user_data
            })

        return Response(
            {"error": "Credenciais inválidas"}, 
            status=status.HTTP_400_BAD_REQUEST
        )


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

class UserLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.auth.delete()
        return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)

class DominioUpdateView(generics.UpdateAPIView):
    queryset = Dominio.objects.all()
    serializer_class = DominioSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


"""
class DominioViewSet(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Dominio.objects.all()
    serializer_class = DominioSerializer
    #permission_classes = [IsAuthenticated]
"""
class DominioList(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Dominio.objects.filter(domain_status=1).all()
    serializer_class = DominioSerializer
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = DominioFilter

#Organizacao init
class OrganizacaoListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, CanViewCreateUpdateOrganizacao]
    queryset = Organizacao.objects.all()
    serializer_class = OrganizacaoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.has_perm("organizacoes.can_view_all_organizacao"):
            return queryset  
        if self.request.user.has_perm("organizacoes.can_view_only_my_organizacao"):
            org_ids = OrganizacaoUserDetalhe.objects.filter(
                user_id=self.request.user.pk
            ).values_list('organizacao_id', flat=True)

            return queryset.filter(id__in=org_ids)  
        return queryset.none() 
    

class OrganizacaoDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, CanViewCreateUpdateOrganizacao]
    serializer_class = OrganizacaoSerializer
    
    def get_queryset(self):
        base_queryset = Organizacao.objects.all()
        
        if self.request.method == 'GET':
            if self.request.user.has_perm("organizacoes.can_view_all_organizacao"):
                return base_queryset
            if self.request.user.has_perm("organizacoes.can_view_only_my_organizacao"):
                return base_queryset

        elif self.request.method in ['PUT', 'PATCH']: 
            if self.request.user.has_perm("organizacoes.can_edit_all_organization"): 
                return base_queryset
            elif self.request.user.has_perm("organizacoes.can_alter_organization_pg"): 
                return base_queryset
            else:
                org_ids = OrganizacaoUserDetalhe.objects.filter(
                    user_id=self.request.user.pk
                ).values_list('organizacao_id', flat=True)
            
                return base_queryset.filter(id__in=org_ids)
            
        return base_queryset.none()

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        organizacao_id = self.kwargs.get('pk')

        try:
            obj = queryset.get(id=organizacao_id)
            self.check_object_permissions(self.request, obj)

            return obj
            
        except Organizacao.DoesNotExist:
            raise CustomResponse(
                detail="Entidade não encontrada ou acesso não autorizado.",
                status_code=status.HTTP_404_NOT_FOUND,
                operation_status="0",
                operation_type="Error"
            )

class ProprietarioListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated,CanViewCreateUpdateOrganizacao]
    #queryset = Organizacao.objects.filter(tipo_organizacao__in=['P', 'PG'])
    serializer_class = ListByTypeOrganizationSerializer


    def get_queryset(self):
        base_queryset = Organizacao.objects.filter(tipo_organizacao__in=['P'])#Organizacao.objects.all()
        
        if self.request.user.has_perm("organizacoes.can_view_all_organizacao"):
            
            return base_queryset
        if self.request.user.has_perm("organizacoes.can_view_only_my_organizacao"):
            
            
            tipo_org = OrganizacaoUserDetalhe.objects.filter(
                user_id=self.request.user.id
            ).first()

            if tipo_org.tipo_organizacao == 'P':
                org_ids = OrganizacaoUserDetalhe.objects.filter(
                    user_id=self.request.user.pk
                ).values_list('organizacao_id', flat=True)

            elif tipo_org.tipo_organizacao == 'G':
                org_ids = [tipo_org.parent_id] #Organizacao.objects.filter(parent_id=tipo_org.parent_id,id=tipo_org.organizacao_id).values_list('id', flat=True)
               
                

            return base_queryset.filter(id__in=org_ids) 
        return base_queryset.none()

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        organizacao_id = self.kwargs.get('pk')

        try:
            obj = queryset.get(id=organizacao_id)
            self.check_object_permissions(self.request, obj)

            return obj
            
        except Organizacao.DoesNotExist:
            raise CustomResponse(
                detail="Entidade não encontrada ou acesso não autorizado.",
                status_code=status.HTTP_404_NOT_FOUND,
                operation_status="0",
                operation_type="Error"
            )

class GestorListView(generics.ListAPIView):
    #permission_classes = [IsAuthenticated,CanViewCreateUpdateOrganizacao]
    permission_classes = [IsAuthenticated]
    #queryset = Organizacao.objects.filter(tipo_organizacao__in=['G', 'PG'])
    serializer_class = ListByTypeOrganizationSerializer

    def get_queryset(self):
        base_queryset = ListOrganizacaoModel.objects.filter(tipo_organizacao__in=['G'])#Organizacao.objects.all()
        
        if self.request.user.has_perm("organizacoes.can_view_all_organizacao"):
            return base_queryset
        if self.request.user.has_perm("organizacoes.can_view_only_my_organizacao"):
            
            tipo_org = OrganizacaoUserDetalhe.objects.filter(
                user_id=self.request.user.id
            ).first()

            if tipo_org.tipo_organizacao == 'G':
                org_ids = OrganizacaoUserDetalhe.objects.filter(
                    user_id=self.request.user.pk
                ).values_list('organizacao_id', flat=True)

            elif tipo_org.tipo_organizacao == 'P':
                org_ids = Organizacao.objects.filter(parent_id=tipo_org.organizacao_id).values_list('id', flat=True)
            
                

            return base_queryset.filter(id__in=org_ids) 
        return base_queryset.none()

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        organizacao_id = self.kwargs.get('pk')

        try:
            obj = queryset.get(id=organizacao_id)
            self.check_object_permissions(self.request, obj)

            return obj
            
        except Organizacao.DoesNotExist:
            raise CustomResponse(
                detail="Entidade não encontrada ou acesso não autorizado.",
                status_code=status.HTTP_404_NOT_FOUND,
                operation_status="0",
                operation_type="Error"
            )


class ProprietarioFreeListView(generics.ListAPIView):
    #permission_classes = [IsAuthenticated,CanViewCreateUpdateOrganizacao]
    permission_classes = [IsAuthenticated]
    queryset = Organizacao.objects.filter(tipo_organizacao__in=['P'], parent_id__isnull=True)
    serializer_class = OrganizacaoSerializerDetail

class AddGestorToProprietarioView(generics.CreateAPIView):
    #permission_classes = [IsAuthenticated,CanViewCreateUpdateOrganizacao]
    permission_classes = [IsAuthenticated]
    queryset = Organizacao.objects.all()
    serializer_class = AddGestorToProprietarioSerializer


class ValidarOrganizacaoView(APIView):
    def post(self, request):
        serializer = ValidarOrganizacaoSerializer(data=request.data)

        if serializer.is_valid():
            id = serializer.validated_data('id')
            status = serializer.validated_data('status')

            if status not in(1,2,3):
                raise CustomResponse(
                    detail="Estado desconhecido.",
                    status_code=status.HTTP_404_NOT_FOUND,
                    operation_status="0",
                    operation_type="Error"
                )

            try:
                organizacao = Organizacao.objects.get(id=id)

                organizacao.alterado_por = request.user
                organizacao.alter_at =  timezone.now()
                organizacao.status = status
                organizacao.save()

                success_response = CustomResponse(
                    detail="organização  atualizado com sucesso",
                    status_code=200,
                    operation_status="1",
                    operation_type="Success"
                )
                raise success_response


            except Equipamento.DoesNotExist:
                raise CustomResponse(
                    detail="organização não encontrada.",
                    status_code=status.HTTP_404_NOT_FOUND,
                    operation_status="0",
                    operation_type="Error"
                )
        else:
            return CustomResponse(
                detail="Dados inválidos",
                status_code=status.HTTP_400_BAD_REQUEST,
                operation_status="0",
                operation_type="Validation Error",
                errors=serializer.errors
            )
        
# Equipamentos init
class EquipamentoListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, CanViewCreateUpdateEquipamento]
    queryset = Equipamento.objects.all()
    serializer_class = EquipamentoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        if self.request.user.has_perm("equipamentos.can_view_all_equipamento"):
            return queryset  
        
        if self.request.user.has_perm("equipamentos.can_view_equipamento_create_by_user"):
            return queryset.filter(criado_por=self.request.user.pk)  
        
        if self.request.user.has_perm("equipamentos.view_associated_equipamentos"):
        
            equi = EquipamentoOrganizacaoUtilizador.objects.filter(
                    Q(users_pro=self.request.user.id) | 
                    Q(users_ges=self.request.user.id)
                ).values('id_equi')
        
            return queryset.filter(id__in=equi)
        return queryset.none() 

class EquipamentoDetailView(generics.UpdateAPIView):
    
    permission_classes = [IsAuthenticated,CanViewCreateUpdateEquipamento]
    queryset = Equipamento.objects.all()
    serializer_class = EquipamentoSerializer

    def get_object(self):
        equipamento_id = self.kwargs.get('pk')  
        
        try:
            return  Equipamento.objects.get(id=equipamento_id)
        except Equipamento.DoesNotExist:
            raise CustomResponse(
                detail="Equipamento não encontrada.",
                status_code=status.HTTP_404_NOT_FOUND,
                operation_status="0",
                operation_type="Error"
            )

class EquipamentoGetDetailView(generics.RetrieveAPIView):
    
    permission_classes = [IsAuthenticated]
    queryset = Equipamento.objects.all()
    serializer_class = EquipamentoDetailSerializer

    def get_object(self):
        equipamento_id = self.kwargs.get('pk')  

        try:
            return  Equipamento.objects.get(id=equipamento_id)
        except Equipamento.DoesNotExist:
            raise CustomResponse(
                detail="Equipamento não encontrado.",
                status_code=status.HTTP_404_NOT_FOUND,
                operation_status="0",
                operation_type="Error"
            )


class FonteFinanciamentoListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = FonteFinanciamento.objects.all()
    serializer_class = FonteFinanciamentoSerializer

class EquipamentoCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]  
    queryset = Equipamento.objects.all()  
    serializer_class = EquipamentoSerializer 


class ValidarEquipamentoView(APIView):
    def post(self, request):
        serializer = ValidarEquipamentoSerializer(data=request.data)

        if serializer.is_valid():
            id = serializer.validated_data('id')
            status = serializer.validated_data('status')

            if status not in(1,2,3):
                raise CustomResponse(
                    detail="Estado desconhecido.",
                    status_code=status.HTTP_404_NOT_FOUND,
                    operation_status="0",
                    operation_type="Error"
                )

            try:
                equipamento =   Equipamento.objects.get(id=id)

                equipamento.alterado_por = request.user
                equipamento.alter_at =  timezone.now()
                equipamento.status = status
                equipamento.save()

                success_response = CustomResponse(
                    detail="Equipamento  atualizado com sucesso",
                    status_code=200,
                    operation_status="1",
                    operation_type="Success"
                )
                raise success_response


            except Equipamento.DoesNotExist:
                raise CustomResponse(
                    detail="Equipamento não encontrada.",
                    status_code=status.HTTP_404_NOT_FOUND,
                    operation_status="0",
                    operation_type="Error"
                )
        else:
            return CustomResponse(
                detail="Dados inválidos",
                status_code=status.HTTP_400_BAD_REQUEST,
                operation_status="0",
                operation_type="Validation Error",
                errors=serializer.errors
            )
        
# serviso
class ServicoListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Servico.objects.all()
    serializer_class = ServicoSerializer

    def create(self, request, *args, **kwargs):
  
        many = isinstance(request.data, list)
        serializer = self.get_serializer(data=request.data, many=many)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class ServicoDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Servico.objects.all()
    serializer_class = ServicoSerializer

# geografia
class IlhaList(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = IlhaSerializer

    # Define constant ilhas list at class level
    ILHAS_CV = [
        "BOA VISTA", "SAL", "SAO NICOLAU", 
        "FOGO", "SAO VICENTE", "SANTIAGO", "MAIO", "BRAVA",
        "SANTO ANTAO"
    ]

    def get_queryset(self):
        try:
            profile = Profile.objects.get(user=self.request.user)
            municipio = profile.municipio
        except Profile.DoesNotExist:
            return Geografia.objects.none()

        if not municipio:
            return Geografia.objects.none()

        if municipio == 'all':
            return Geografia.objects.filter(ilha__in=self.ILHAS_CV).values('ilha').distinct()
        else:
           
            ilha = Geografia.objects.filter(concelho=municipio).values('ilha').first()
            
            if not ilha:
                return Geografia.objects.none()
                
            return Geografia.objects.filter(ilha=ilha['ilha']).values('ilha').distinct()

class ConcelhoList(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ConcelhoSerializer

    def get_queryset(self):
        ilha = self.kwargs['ilha']
        municipio = Profile.objects.filter(user = self.request.user).values('municipio').first()
        municipio = municipio['municipio'] if municipio else None

        if municipio == 'all':
            return Geografia.objects.filter(ilha=ilha).values('concelho').distinct()
        else:
             return Geografia.objects.filter(ilha=ilha, concelho = municipio).values('concelho').distinct()

class FreguesiaList(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FreguesiaSerializer

    def get_queryset(self):
        concelho = self.kwargs['concelho']
        return Geografia.objects.filter(concelho=concelho).values('freguesia').distinct()

class ZonaList(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ZonaSerializer

    def get_queryset(self):
        freguesia = self.kwargs['freguesia']
        return Geografia.objects.filter(freguesia=freguesia).values('zona').distinct()

class LugarList(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LugarSerializer

    def get_queryset(self):
        zona = self.kwargs['zona']
        return Geografia.objects.filter(zona=zona).values('lugar','id').distinct()

# profile

class ProfileListView(generics.ListAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return Profile.objects.get(user=self.request.user)


class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return Profile.objects.get(user=self.request.user)
# End

# lista concelho
class ConcelhosAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        ilhas = [
            "BOA VISTA", "SAL", "SAO NICOLAU", "SANTIAGO NORTE", 
            "FOGO", "SAO VICENTE", "SANTIAGO SUL", "MAIO", "BRAVA",
            "SANTO ANTAO", "BOA VISTA"
        ]
        
        concelhos = Geografia.objects.filter(ilha__in=ilhas)\
                   .order_by('concelho')\
                   .values_list('concelho', flat=True)\
                   .distinct()
        
        # Transforma a lista de strings em uma lista de dicionários para o serializer
        concelhos_data = [{'concelho': c} for c in concelhos]
        
        serializer = ConcelhoSerializer(concelhos_data, many=True)
        return Response(serializer.data)

class PorTipoFaixaEtariaView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PorTipoFaixaEtariaSerializer

    def post(self, request):
        serializer = PorTipoFaixaEtariaSerializer(data=request.data)
        if serializer.is_valid():
            tipo_resposta = serializer.validated_data.get('tipo_resposta')  

            id_domain = TipoFaixaEtaria.objects.filter(
                tipo_resposta=tipo_resposta
            ).values_list('id_dominio', flat=True)
            
            domains = Dominio.objects.filter(id__in=id_domain)
            serialized_domains = DominioSerializer(domains, many=True)  
            
            return Response(serialized_domains.data, status=status.HTTP_200_OK)  
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) 





        
