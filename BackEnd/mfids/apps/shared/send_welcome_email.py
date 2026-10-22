from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from apps.appConfig.models import Configuration


def send_welcome_email(user, nome, password, is_staff, request=None):
    config = Configuration.objects.first()

    
    if not config or not config.email_send  or not config.frontend_url or config.used_type == False:
        return  

    subject = 'Bem-vindo ao Sistema'

    def has_explicit_perm(user, perm_codename):
        return user.user_permissions.filter(codename=perm_codename).exists() or \
            user.groups.filter(permissions__codename=perm_codename).exists()

    type_login = 0
    if has_explicit_perm(user, 'can_access_backoffice') and has_explicit_perm(user, 'can_access_frontend'):
        login_url_back = request.build_absolute_uri('/users/signin/')
        login_url_front = config.frontend_url 
        type_login = 1
       
    elif has_explicit_perm(user, 'can_access_backoffice'):
        type_login = 2
        login_url_back = request.build_absolute_uri('/users/signin/')
        login_url_front = None
    elif has_explicit_perm(user, 'can_access_frontend'):
        type_login = 3
        login_url_front = config.frontend_url
        login_url_back = None
        


    html_content = render_to_string('registration/welcome_email.html', {
        'username': nome,
        'password': password,
        'login_url_back': login_url_back,
        'login_url_front': login_url_front,
        'email': user.email,
        'type_login': type_login
        
    })

    text_content = strip_tags(html_content)

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=config.email_send,
        to=[user.email]
    )
    email.attach_alternative(html_content, "text/html")
    email.send()