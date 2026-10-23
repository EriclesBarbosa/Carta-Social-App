import secrets
import string
from django import forms
from django.core.exceptions import ValidationError
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm, UsernameField, PasswordChangeForm, PasswordResetForm, SetPasswordForm
from django.contrib.auth.models import User, Group
from django.utils.translation import gettext_lazy as _
from apps.users.models import Profile
from apps.shared.utilFunctions import generate_username_code 
from apps.organizacoes.models import Geografia


class SigninForm(AuthenticationForm):


    username = forms.EmailField(
        label=_("Email"),
        widget=forms.EmailInput(attrs={
            'autofocus': True,
            'class': 'bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500',
            'placeholder': 'nome@gmail.com',
            
        })
    )
    password = forms.CharField(
        label=_("Password"),
        strip=False,
        widget=forms.PasswordInput(attrs={
            'class': 'bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500',
            'placeholder': '******',
        }),
    )


class SignupForm(forms.ModelForm):
    # Sobrescreva o campo is_superuser para usar um ChoiceField

    municipio = forms.ChoiceField(
        label="Município",
        choices=[],  
        required=False,
        widget=forms.Select(attrs={
            'class': 'bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
        })
    )

    is_superuser = forms.ChoiceField(
        choices=[ (False, 'Não'),(True, 'Sim')],
        label="É administrador?",
        widget=forms.Select(attrs={'class': 'bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'})
    )

    
    groups = forms.ModelChoiceField(
        label="Perfil",
        queryset = Group.objects.all(),
        required=False,
        empty_label="Selecione um perfil",
        widget=forms.Select(attrs={'class': 'bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'})
    )

    groups_val = forms.BooleanField(
        widget=forms.HiddenInput(),
        required=False, 
        initial=True  
    )


    class Meta:
        model = User
        fields = ( 'first_name','last_name','email', 'is_superuser','groups')

    def __init__(self, *args, **kwargs):
        super(SignupForm, self).__init__(*args, **kwargs)
        self.fields['groups'].queryset = Group.objects.all()

        concelhos = Geografia.objects\
               .order_by('concelho')\
               .values_list('concelho', flat=True)\
               .distinct()

        self.fields['municipio'].choices = [("", "---------"),("all", "Todos")] + [(c, c) for c in concelhos]
        

        #self.fields.pop('password1')
        #self.fields.pop('password2')

        for field_name, field in self.fields.items():
            self.fields[field_name].widget.attrs['placeholder'] = field.label
            self.fields[field_name].widget.attrs['class'] = 'bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
            self.fields[field_name].widget.attrs['required'] = True

    def clean(self):
        cleaned_data = super().clean()
        is_superuser = cleaned_data.get('is_superuser') == 'True'
        groups = cleaned_data.get('groups')
        groups_val = cleaned_data.get('groups_val')

        
        
        if groups_val is True:
            if not is_superuser and not groups:
                raise ValidationError("Por favor, selecione pelo menos um perfil quando não for administrador.")
            
        return cleaned_data

    def clean_email(self):
        email = self.cleaned_data.get('email')
        email = email.strip().lower()

        if email:
            if email and User.objects.filter(email__iexact=email).exists():
                raise ValidationError("Este email já está cadastrado no sistema")
        else:
            raise ValidationError("E-mail é obrigatório")

            
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        user.username = generate_username_code()
        user.email = user.email.strip().lower()

        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(12))
        
        user.set_password(password)
        if commit:
            user.save()
            if self.cleaned_data.get('groups_val') is True and self.cleaned_data.get('is_superuser') == 'False':
                user.groups.set([self.cleaned_data['groups']])
            
            if self.cleaned_data.get('is_superuser') == 'True':
                user.groups.set([2])
                user.is_staff = True
                user.save()

        return user, password


class AssociarUserForm(forms.ModelForm):
    # Sobrescreva o campo is_superuser para usar um ChoiceField
   

    groups = forms.ModelChoiceField(
        label="Perfil",
        queryset = Group.objects.all(),
        required=True,
        empty_label="Selecione um perfil",
        widget=forms.Select(attrs={'class': 'bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'})
    )

    class Meta:
        model = User
        fields = ( 'first_name','last_name','email','groups')

    def __init__(self, *args, **kwargs):
        super(AssociarUserForm, self).__init__(*args, **kwargs)
        self.fields['groups'].queryset = Group.objects.all()
     

        for field_name, field in self.fields.items():
            self.fields[field_name].widget.attrs['placeholder'] = field.label
            self.fields[field_name].widget.attrs['class'] = 'bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
            self.fields[field_name].widget.attrs['required'] = True

    

    def clean_email(self):
        email = self.cleaned_data.get('email')
        email= email.lower()
    
        if email and User.objects.filter(email__iexact=email).exists():
            raise ValidationError("Este email já está cadastrado no sistema")
            
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        user.username = generate_username_code()

        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(12))
        
        user.set_password(password)
        if commit:
            user.save()
            user.groups.set([self.cleaned_data['groups']])
        return user, password



class UserPasswordResetForm(PasswordResetForm):
    email = forms.EmailField(widget=forms.EmailInput(attrs={
        'class': 'bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500',
        'placeholder': 'name@company.com'
    }))

class UserSetPasswordForm(SetPasswordForm):
    new_password1 = forms.CharField(max_length=50, widget=forms.PasswordInput(attrs={
        'class': 'bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500', 
        'placeholder': 'New Password'
    }), label="New Password")
    new_password2 = forms.CharField(max_length=50, widget=forms.PasswordInput(attrs={
        'class': 'bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500', 
        'placeholder': 'Confirm New Password'
    }), label="Confirm New Password")
    

class UserPasswordChangeForm(PasswordChangeForm):
    old_password = forms.CharField(max_length=50, widget=forms.PasswordInput(attrs={
        'class': 'bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500', 
        'placeholder': 'Old Password'
    }), label='Old Password')
    new_password1 = forms.CharField(max_length=50, widget=forms.PasswordInput(attrs={
        'class': 'bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500', 
        'placeholder': 'New Password'
    }), label="New Password")
    new_password2 = forms.CharField(max_length=50, widget=forms.PasswordInput(attrs={
        'class': 'bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500', 
        'placeholder': 'Confirm New Password'
    }), label="Confirm New Password")

    

class ProfileForm(forms.ModelForm):

    phone = forms.CharField(
        max_length=7,
        required=True,
        widget=forms.TextInput(
            attrs={
                'id': 'id_phone',
                'maxlength': '7',
                'inputmode': 'numeric',
                'pattern': '[0-9]*',
                'placeholder': 'Digite 7 dígitos',
                'class': 'shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500',

            }
        ),
        error_messages={
            'required': 'Informe o número de telefone.',
            'max_length': 'Digite no máximo 7 dígitos.'
        },
        label='Telefone'
    )

    municipio = forms.ChoiceField(
        label="Município",
        choices=[],  
        required=False,
        widget=forms.Select(attrs={
            'class': 'bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
        })
    )

    
    class Meta:
        model = Profile
        exclude = ('user', 'role', 'avatar',)
        labels = {
            'full_name': 'Nome Completo',
            'country': 'País',
            'city': 'Cidade',
            'zip_code': 'Código Postal',
            'address': 'Endereço',
            'phone': 'Telefone',
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super(ProfileForm, self).__init__(*args, **kwargs)

        concelhos = Geografia.objects\
               .order_by('concelho')\
               .values_list('concelho', flat=True)\
               .distinct()

        self.fields['municipio'].choices = [("", "---------"),("all", "Todos")] + [(c, c) for c in concelhos]

      
        for field_name, field in self.fields.items():
            if field_name != 'phone':
                self.fields[field_name].widget.attrs['placeholder'] = field.label
                self.fields[field_name].widget.attrs['class'] = 'shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500'
                self.fields[field_name].widget.attrs['required'] = False
            else:
                 self.fields['phone']

     
        if self.user.is_superuser:
            self.fields['municipio'].disabled = False
        else:
            self.fields['municipio'].disabled = True

    