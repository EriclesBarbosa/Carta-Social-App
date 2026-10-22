
from django import forms
from .models import Dominio


def get_existing_domain_codes():
    return [(d, d) for d in Dominio.objects.values_list('domain_name', flat=True).distinct()]

class DominioForm(forms.ModelForm):
    class Meta:
        model = Dominio
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.instance and self.instance.pk:
            self.fields['domain_name'].disabled = True
        else:
            self.fields['domain_name'].disabled = True
            self.fields['domain_name'] = forms.ChoiceField(
                choices=get_existing_domain_codes() + [('', 'Nome do domínio')],
                required=False
            )
