# myapp/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate

from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import *

from django.contrib.auth.models import User

from apps.shared.exceptions import CustomResponse 



from .models import *
User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    is_client = serializers.BooleanField(required=True)
    is_worker = serializers.BooleanField(required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'is_client', 'is_worker')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Os campos de senha não correspondem."})
        return attrs
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este endereço de email já está registrado.")
        return value

    def create(self, validated_data):
        user = User.objects.create(
            email=validated_data['email'],
            is_client=validated_data['is_client'],
            is_worker=validated_data['is_worker'],
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(email=email, password=password)
          
            if user:
                if not user.is_active:
                    raise serializers.ValidationError("O usuário está desabilitado.")
            else:
                raise serializers.ValidationError("Credenciais de login inválidas.")
        else:
            raise serializers.ValidationError("Deve incluir 'e-mail' e 'senha'.")

        attrs['user'] = user
       
        return attrs

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("E-mail não existe")
        return value

class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(required=True, min_length=8, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            error_response = CustomResponse(
                detail="As senhas não coincidem.",
                status_code=400,
                operation_status="0",
                operation_type="Error"
            )
            raise error_response
            
        return attrs


class ChangePassword(serializers.Serializer):
    email = serializers.EmailField()
    old_password = serializers.CharField(min_length=8)
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField(required=True, write_only=True,min_length=8)
    
    def validate(self, data):
        UserModel = get_user_model()
        try:
            user = UserModel.objects.get(email=data['email'])

            if not user.check_password(data['old_password']):
                error_response = CustomResponse(
                    detail="Senha atual incorreta.",
                    status_code=400,
                    operation_status="0",
                    operation_type="Error"
                )
                raise error_response

            if data['new_password'] != data['confirm_password']:
                error_response = CustomResponse(
                    detail="As senhas não coincidem.",
                    status_code=400,
                    operation_status="0",
                    operation_type="Error"
                )
                raise error_response
                
                
        except UserModel.DoesNotExist:
            error_response = CustomResponse(
                detail="Dados incorreto.",
                status_code=400,
                operation_status="0",
                operation_type="Error"
            )
            raise error_response
        return data
    
    def save(self):
        UserModel = get_user_model()
        user = UserModel.objects.get(email=self.validated_data['email'])
        user.set_password(self.validated_data['new_password'])
        user.save()


    