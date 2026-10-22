from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.http import HttpResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.views import LoginView, PasswordResetView, PasswordChangeView, PasswordResetConfirmView
from django.views.generic import CreateView
from apps.common.models import Sales
from apps.users.models import Profile
from apps.users.forms import SigninForm, SignupForm, UserPasswordChangeForm, UserSetPasswordForm, UserPasswordResetForm, ProfileForm,AssociarUserForm
from django.contrib.auth import logout
from django.urls import reverse, reverse_lazy 
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import check_password
from django.contrib import messages
from django.contrib.auth.models import User
from django.core.paginator import Paginator
from django.views.generic.edit import FormView
from django.contrib.auth import login
from django.utils.translation import gettext_lazy as _

from apps.users.utils import user_filter_all
from apps.organizacoes.models import Organizacao,UserOrganizacoes,OrganizacaoSemUtilizador
from apps.users.models import Profile
from rest_framework.authtoken.models import Token
from rest_framework.response import Response

from django.contrib.auth import authenticate

from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, authentication_classes, permission_classes

from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth import get_user_model

from apps.shared.send_welcome_email import send_welcome_email



# Create your views here.
######################################################## API START #########################################################
# User Login (Token-Based)
@api_view(['POST'])
def user_login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    
    
    user = authenticate(username=username, password=password)
    
    if user:
        token, created = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user_id": user.id, "username": user.username})
    return Response({"error": "Invalid credentials"}, status=400)

# User Logout (Token-Based)
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_logout(request):
    request.auth.delete()  # Deletes the token
    return Response({"message": "Sessão terminada com sucesso"})

# User Profile (Authenticated)
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email
    })

######################################################## API END #########################################################

def index(request):

    salesName = ''
    
    if len( Sales.objects.all() ):
        salesName = Sales.objects.all()[0].ItemName
        
    return HttpResponse("INDEX Users" + ' ' + salesName)

"""
class SignInView(LoginView):
    form_class = SigninForm
    template_name = "authentication/sign-in.html"

"""
class SignInView(LoginView):
    form_class = SigninForm
    template_name = "authentication/sign-in.html"

    def form_valid(self, form):
        user = form.get_user()

        if user.is_active:        
            if user.is_superuser or user.has_perm('auth.can_access_backoffice'):
                login(self.request, user)
                return redirect(self.get_success_url())
            else:
                form.add_error(None, _("Você não tem permissão para acessar o backoffice."))
                return self.form_invalid(form) 
        else:
            form.add_error(None, _("Você não tem permissão para acessar o backoffice."))

class SignUpView(CreateView):
    form_class = SignupForm
    template_name = "authenticatio/sign-up.html"
    success_url = "/users/signin/"

class UserPasswordChangeView(PasswordChangeView):
    template_name = 'authentication/password-change.html'
    form_class = UserPasswordChangeForm

class UserPasswordResetView(FormView):

    # Ainda falta a validacao da experacao do pedido
    template_name = 'authentication/forgot-password.html'
    email_template_name = 'registration/password_reset_email.html'
    success_url = '/users/password-reset-done/' 
    form_class = UserPasswordResetForm

    def form_valid(self, form):
       
        response = super().form_valid(form)
        email = form.cleaned_data["email"]  
        user = self.get_user_by_email(email)  
        
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            reset_link = self.request.build_absolute_uri(
                reverse('password_reset_confirm', kwargs={'uidb64': uid, 'token': token})
            )
            email_html_message = render_to_string(self.email_template_name, {'reset_link': reset_link})
            send_mail(
                'MFIDS - Password Reset',
                '', 
                '2017backend@gmail.com',
                [user.email],
                fail_silently=False,
                html_message=email_html_message
            )

        return response

    def send_mail(self, subject_template_name, email_template_name, context, from_email, to_email, html_email_template_name=None):
        """ Sobrescreve o método para impedir o envio duplicado do Django """
        pass  # Faz nada, evitando o envio padrão do Django

    def get_user_by_email(self, email):
        """Busca um utilizador ativo pelo e-mail."""
        
        User = get_user_model()
        try:
            return User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return None

    
class UserPasswrodResetConfirmView(PasswordResetConfirmView):
    template_name = 'authentication/reset-password.html'
    form_class = UserSetPasswordForm
    

def signout_view(request):
    logout(request)
    return redirect(reverse('signin'))


@login_required(login_url='/users/signin/')
def profile(request):
    
    #user = User.objects.get(username='seu_usuario')

    #profile = Profile.objects.get(user=user)

    profile = get_object_or_404(Profile, user=request.user)
    if request.method == 'POST':
        form = ProfileForm(request.POST, instance=profile,user = request.user)
       
        if form.is_valid():
            form.save()
            messages.success(request, 'Perfil atualizado com sucesso')
    else:
        form = ProfileForm(instance=profile, user=request.user)
    
    context = {
        'form': form,
        'segment': 'profile',
    }
    return render(request, 'dashboard/profile.html', context)


@login_required(login_url='/users/signin/')
def profile_by_id(request,pk):
    
    #user = User.objects.get(username='seu_usuario')

    #profile = Profile.objects.get(user=user)

    profile = get_object_or_404(Profile, user=pk)
    print(request.POST)
    if request.method == 'POST':

        form = ProfileForm(request.POST, instance=profile, user=request.user)
       
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile updated successfully')
    else:
        form = ProfileForm(instance=profile, user=request.user)
    
    context = {
        'form': form,
        'segment': 'profile',
    }
    return render(request, 'dashboard/profile_by_user.html', context)


def upload_avatar(request):
    profile = get_object_or_404(Profile, user=request.user)
    if request.method == 'POST':
        profile.avatar = request.FILES.get('avatar')
        profile.save()
        messages.success(request, 'Avatar alterado com sucesso')
    return redirect(request.META.get('HTTP_REFERER'))


def change_password(request):
    user = request.user
    if request.method == 'POST':
        if check_password(request.POST.get('current_password'), user.password):
            user.set_password(request.POST.get('new_password'))
            user.save()
            messages.success(request, 'Palavra-passe alterada com sucesso')
        else:
            messages.error(request, "A palavra-passe não corresponde!")
    return redirect(request.META.get('HTTP_REFERER'))


@login_required(login_url='/users/signin/')
def user_list_all(request):

    print("teste qqqqq")
    filters = user_filter_all(request)
    user_list = User.objects.filter(filters)
    form = SignupForm()

    page = request.GET.get('page', 1)
    paginator = Paginator(user_list, 5)
    users = paginator.page(page)
    context = {
        'users': users,
        'form': form,
        'messages': None
    }
    return render(request, 'apps/users.html', context)



@login_required(login_url='/users/signin/')
def user_list(request):
    filters = user_filter_all(request)
    user_list = User.objects.filter(filters)
    form = SignupForm()

    page = request.GET.get('page', 1)
    paginator = Paginator(user_list, 5)
    users = paginator.page(page)
    first_name = request.POST.get('first_name')
    last_name = request.POST.get('last_name')

    nome  = f"{first_name} {last_name}"
    is_staff = False

    if request.method == 'POST':
        form_data = request.POST
        form = SignupForm(request.POST)

        
        is_superuser = form_data['is_superuser']

        if is_superuser == 'True':
            moni = None
        else:
            moni = form_data['municipio']
        

 
        if form.is_valid():
            user, password = form.save()

            user_profile = Profile.objects.get(user=user)
            if moni:
                user_profile.municipio = moni
            user_profile.save()

            if user.is_superuser or user.has_perm('auth.can_access_backoffice'):
                is_staff = True
            else:
                is_staff = False

            send_welcome_email(user,nome, password,is_staff,request)

            form = SignupForm()
            context = {
                'users': users,
                'form': form,
                'messages': 'Utilizador criado com sucesso'
            }
            return render(request, 'apps/users.html', context)
            
            #return redirect(request.META.get('HTTP_REFERER'))

            #return post_request_handling(request, form)
        else:
            print(form.errors)

    context = {
        'segment'  : 'users',
        'users': users,
        'form': form,
        'messages': None
    }
    return render(request, 'apps/users.html', context)


@login_required(login_url='/users/signin/')
def post_request_handling(request, form):
    form.save()
    return redirect(request.META.get('HTTP_REFERER'))

@login_required(login_url='/users/signin/')
def delete_user(request, id):

    user_list = User.objects.all()
    form = SignupForm()

    page = request.GET.get('page', 1)
    paginator = Paginator(user_list, 5)
    users = paginator.page(page)

    user = User.objects.get(id=id)
    user.is_active = not user.is_active
    user.save()

    message = 'Utilizador ativado com sucesso' if user.is_active else 'Utilizador inativado com sucesso'


    context = {
            'users': users,
            'form': form,
            'messages': message
        }
    return render(request, 'apps/users.html', context)


    #return redirect(request.META.get('HTTP_REFERER'))

@login_required(login_url='/users/signin/')
def update_user(request, id):
    user = User.objects.get(id=id)
    user_list = User.objects.all()
    form = SignupForm()

    page = request.GET.get('page', 1)
    paginator = Paginator(user_list, 5)
    users = paginator.page(page)

    if request.method == 'POST':
        #user.username = request.POST.get('username')
        user.first_name = request.POST.get('first_name')
        user.last_name = request.POST.get('last_name')
        user.email = request.POST.get('email')
        user.save()

    context = {
            'users': users,
            'form': form,
            'messages': 'Utilizador atualizado com sucesso'
        }
    return render(request, 'apps/users.html', context)


    #return redirect(request.META.get('HTTP_REFERER'))


@login_required(login_url='/users/signin/')
def user_change_password(request, id):
    user = User.objects.get(id=id)

    user_list = User.objects.all()
    form = SignupForm()

    page = request.GET.get('page', 1)
    paginator = Paginator(user_list, 5)
    users = paginator.page(page)

    if request.method == 'POST':
        user.set_password(request.POST.get('password'))
        user.save()

    context = {
            'users': users,
            'form': form,
            'messages': 'palavra-passe alterada com sucesso'
        }
    return render(request, 'apps/users.html', context)
    #return redirect(request.META.get('HTTP_REFERER'))


@login_required(login_url='/users/signin/')
def user_organization_generate(request):
  
    error = None
    userOrg_id = None
    user_orgs = OrganizacaoSemUtilizador.objects.all()
    
    page = request.GET.get('page', 1)
    paginator = Paginator(user_orgs, 5)
    user_orgs = paginator.page(page)
    
    form = AssociarUserForm()
    
    if request.method == 'POST':
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        userOrg_id = int(request.POST.get('userOrg_id'))

        print(userOrg_id)
        
        nome = f"{first_name} {last_name}" if first_name and last_name else ""
        is_staff = False

        if not userOrg_id:
            error = "Não foi possível associar - organização não especificada."
        else:
            form = AssociarUserForm(request.POST)
            
            if form.is_valid():
                try:    
                    user, password = form.save()
                
                    organizacao = UserOrganizacoes.objects.get(id=int(userOrg_id))
                    organizacao.user = user
                    organizacao.save()
                    send_welcome_email(user, nome, password, is_staff, request)
                    return redirect(request.META.get('HTTP_REFERER', '/'))
                except Exception as e:
                    error = f"Erro ao processar o pedido: {str(e)}"
            else:
                print(form.errors)  

    context = {
        'organizacao': user_orgs,
        'form': form,
        'error': error,
        'id':userOrg_id
    }
    
    return render(request, 'apps/organizacao_sem_utilizador.html', context)



