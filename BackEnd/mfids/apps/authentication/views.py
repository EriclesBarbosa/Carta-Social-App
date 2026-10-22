import random
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.template.loader import render_to_string
from django.shortcuts import get_object_or_404
from django.utils.http import urlsafe_base64_encode,urlsafe_base64_decode
from django.utils.encoding import force_bytes,force_str
from django.contrib.auth.tokens import default_token_generator
from django.urls import reverse


from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from . models import *
from .serializers import *


class PasswordResetView(generics.GenericAPIView):
    permission_classes = [AllowAny]
 
    serializer_class = PasswordResetSerializer
    email_template_name = 'registration/password_reset_email.html'

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({
                "operationStatus": 0,
                "operationType": "Error",
                "operationDesc": "O campo de email é obrigatório.",
                "return_id": 0
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            if  user.is_active:
                pass
            else:
                return Response({
                    "operationStatus": 0,
                    "operationType": "Error",
                    "operationDesc": "Utilizador Inativo.",
                    "return_id": 0
                }, status=status.HTTP_404_NOT_FOUND)
                

        except User.DoesNotExist:
            return Response({
                "operationStatus": 0,
                "operationType": "Error",
                "operationDesc": "Utilizador com este email não encontrado.",
                "return_id": 0
            }, status=status.HTTP_404_NOT_FOUND)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        reset_link = request.build_absolute_uri(
            reverse('password_reset_confirm', kwargs={'uidb64': uid, 'token': token})
        )

        email_html_message = render_to_string(self.email_template_name, {"reset_link": reset_link})
        send_mail(
            subject='MFIDS - Password Reset',
            message='',
            from_email='2017backend@gmail.com',
            recipient_list=[user.email],
            fail_silently=False,
            html_message=email_html_message
        )

        return Response({
            "operationStatus": 1,
            "operationType": "Success",
            "operationDesc": "Email de redefinição de senha enviado com sucesso.",
            "return_id": 0
        }, status=status.HTTP_200_OK)

class UserPasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request, uidb64, token):
        # Primeiro valida o token
        try: 
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
            print(user)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is None or not default_token_generator.check_token(user, token):
            return Response({
                "operationStatus": 0,
                "operationType": "Error",
                "operationDesc": "Link de redefinição inválido ou expirado.",
                "return_id": 0
            }, status=status.HTTP_400_BAD_REQUEST)

        # Se o token for válido, processa a alteração da senha
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({
            "operationStatus": 1,
            "operationType": "Success",
            "operationDesc": "Senha alterada com sucesso.",
            "return_id": 0
        }, status=status.HTTP_200_OK)

class PasswordResetConfirmView(generics.GenericAPIView):
    pass
    """permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        # alterar status do PasswordResetCode para 2
        if serializer.is_valid():
            serializer.save()
            return Response({'description': 'Senha redefinida com sucesso', 'status': True}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    """

class ChangePasswordView(generics.GenericAPIView):
    
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePassword
    def post(self, request):
        serializer = ChangePassword(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "operationStatus": 1,
                "operationType": "Success",
                "operationDesc": "Senha alterada com sucesso.",
                "return_id": 0
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
