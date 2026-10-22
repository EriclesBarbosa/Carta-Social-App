from rest_framework.exceptions import PermissionDenied
from django.http import JsonResponse

class CustomPermissionMiddleware:
    """
    Middleware para personalizar respostas de erro de permissão negada.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        # Verifica se a resposta é uma permissão negada (403 Forbidden)
        if response.status_code == 403:
            # Modifica a resposta com o formato desejado
            return JsonResponse({
                "operationStatus": 0,
                "operationType": "error",
                "operationDesc": "Você não tem permissão para executar essa ação.",
                "return_id": 0
            }, status=403)

        return response
