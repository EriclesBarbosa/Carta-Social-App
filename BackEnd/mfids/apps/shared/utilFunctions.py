
import uuid
from datetime import datetime
from django.contrib.auth.models import User
from apps.shared.serializers import DominioSerializer 
from apps.api.models import Dominio

def get_domain_by_id(pk):
    try:
        
        dominio = Dominio.objects.get(id=pk)
       
        return DominioSerializer(dominio).data
    except (Dominio.DoesNotExist, ValueError):
        return None


def generate_username_code():
    while True:
        now = datetime.now()
        time_part = now.strftime("%m%d")  
        hour_min = now.strftime("%H%M")   
        datetime_part = (time_part + hour_min)[:4]  
    
        uuid_part = uuid.uuid4().hex[:4].upper()  
        
        code = f"{uuid_part}{datetime_part}"
        
        if not User.objects.filter(username=code).exists():
            return code