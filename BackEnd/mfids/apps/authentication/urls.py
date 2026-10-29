from django.urls import path
from .views import *

urlpatterns = [
    path('password/reset/', PasswordResetView.as_view(), name='password_reset'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password-reset-confirm/<uidb64>/<token>/',
         UserPasswordResetConfirmView.as_view(), name="auth_password_reset_confirm"
    ),
    path('change_password/', ChangePasswordView.as_view(), name='change_password'),
]
