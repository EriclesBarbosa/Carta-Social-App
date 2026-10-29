from rest_framework import permissions
from django.contrib.auth.models import User

class CanViewCreateUpdateOrganizacao(permissions.BasePermission):
    """
    Permissões para visualizar, criar e editar objetos de 'Organizacao'.
    """

    def has_permission(self, request, view):
        method = request.method

        if method == "GET":
            return (
                request.user.has_perm("organizacoes.can_view_all_organizacao") or
                request.user.has_perm("organizacoes.can_view_only_my_organizacao")
            )

        elif method == "POST":
            return request.user.has_perm("organizacoes.can_create_organizacao")

        elif method in ["PUT", "PATCH"]:
            # Verificação será feita no has_object_permission
            
            return (
                request.user.has_perm("organizacoes.can_edit_organizacao") or 
                request.user.has_perm("organizacoes.can_edit_all_organization") or request.user.has_perm("organizacoes.can_alter_organization_pg")
                )

        return False

    def has_object_permission(self, request, view, obj):
        method = request.method

        if method == "GET":
            if request.user.has_perm("organizacoes.can_view_all_organizacao"):
                return True

            if request.user.has_perm("organizacoes.can_view_only_my_organizacao"):
                return True#hasattr(obj, 'criado_por') and obj.criado_por == request.user

        elif method in ["PUT", "PATCH"]:
            if  request.user.has_perm("organizacoes.can_edit_organizacao") or request.user.has_perm("organizacoes.can_edit_all_organization") or request.user.has_perm("organizacoes.can_alter_organization_pg"):
                return True
            else:
                return False
            """
            if request.user.has_perm("organizacoes.can_view_all_organizacao"):
                return True

            return hasattr(obj, 'criado_por') and obj.criado_por == request.user
            """
        return False

class CanViewCreateUpdateEquipamento(permissions.BasePermission):
    """
    Permissões para visualizar, criar e editar objetos de 'Equipamento'.
    """

    def has_permission(self, request, view):
        method = request.method

        if method == "GET":
            return (
                request.user.has_perm("equipamentos.can_view_all_equipamento") or
                request.user.has_perm("equipamentos.can_view_equipamento_create_by_user") or
                request.user.has_perm("equipamentos.view_associated_equipamentos")
            )

        elif method == "POST":
            return request.user.has_perm("equipamentos.can_create_equipamento")

        elif method in ["PUT", "PATCH"]:
           
            return (
                request.user.has_perm("equipamentos.can_edit_all_equipamento") or
                request.user.has_perm("equipamentos.can_edit_equipamento_create_by_user")
            )

        return False

    def has_object_permission(self, request, view, obj):
        method = request.method

        if method == "GET":
            if request.user.has_perm("equipamentos.can_view_all_equipamento"):
                return True

            if request.user.has_perm("equipamentos.can_view_equipamento_create_by_user"):
                return hasattr(obj, 'criado_por') and obj.criado_por == request.user

            return False

        elif method in ["PUT", "PATCH"]:
            if request.user.has_perm("equipamentos.can_edit_all_equipamento"):
                return True

            if request.user.has_perm("equipamentos.can_edit_equipamento_create_by_user"):
                return hasattr(obj, 'criado_por') and obj.criado_por == request.user.pk

            if request.user.has_perm("equipamentos.view_associated_equipamentos"):
                from django.db.models import Q
                from apps.equipamentos.models import EquipamentoOrganizacaoUtilizador
                return EquipamentoOrganizacaoUtilizador.objects.filter(
                    Q(users_pro=request.user.id) | Q(users_ges=request.user.id),
                    id_equi=obj.pk
                ).exists()

            return False

        return False


def get_user_permissions(user: User):

    all_permissions = user.get_all_permissions()

    permissions = {
        "organizacao": {
            "actions": []
        },
        "equipamento": {
            "actions": []
        }
    }

    if user.has_perm("organizacoes.can_create_organizacao"):
        permissions["organizacao"]["actions"].append("create")
    
    if user.has_perm("organizacoes.can_edit_organizacao") or user.has_perm("organizacoes.can_edit_all_organization"):
        permissions["organizacao"]["actions"].append("update")
    
    if user.has_perm("organizacoes.can_view_all_organizacao") or user.has_perm("organizacoes.can_view_only_my_organizacao"):
        permissions["organizacao"]["actions"].append("list")


    if (
        user.has_perm("equipamentos.can_view_all_equipamento") or
        user.has_perm("equipamentos.can_view_equipamento_create_by_user") or
        user.has_perm("equipamentos.view_associated_equipamentos")
    ):
        permissions["equipamento"]["actions"].append("list")


    if user.has_perm("equipamentos.can_create_equipamento"):  
        permissions["equipamento"]["actions"].append("create")

 
    if (
        user.has_perm("equipamentos.can_edit_all_equipamento") or
        user.has_perm("equipamentos.can_edit_equipamento_create_by_user")
    ):
        permissions["equipamento"]["actions"].append("update")

    return permissions
