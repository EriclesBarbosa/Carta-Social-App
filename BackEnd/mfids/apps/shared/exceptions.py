from rest_framework.exceptions import APIException

class CustomResponse(APIException):
    status_code = 400
    default_detail = {
        "operationStatus": "0",
        "operationType": "Error",
        "operationDesc": "Erro de validação.",
        "return_id":0
    }

    def __init__(self, detail=None, status_code=None, operation_status="0", operation_type="Error",return_id=0):
        if detail is not None:
            self.detail = {
                "operationStatus": operation_status,
                "operationType": operation_type,
                "operationDesc": detail,
                "return_id": return_id
            }
        else:
            self.detail = self.default_detail

        if status_code is not None:
            self.status_code = status_code