from rest_framework import serializers
from django.core.exceptions import ObjectDoesNotExist
from apps.shared.exceptions import CustomResponse  

class GeografiaField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        try:
            return self.get_queryset().get(id=data)
        except ObjectDoesNotExist:
            raise CustomResponse(
                detail="Geografia não encontrada.",
                status_code=400,
                operation_status="0",
                operation_type="Error"
            )

class GestorField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        try:
            return self.get_queryset().get(id=data)
        except ObjectDoesNotExist:
            raise CustomResponse(
                detail="Gestor não encontrado.",
                status_code=400,
                operation_status="0",
                operation_type="Error"
            )