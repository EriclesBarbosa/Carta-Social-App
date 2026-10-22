from django.db.models import Q
def user_filter(request):
    print(request.GET)
    filter_string = {}
    filter_mappings = {
        'search': 'username__icontains',#'username__icontains',
        'email': 'email__icontains',
        'first_name': 'first_name__icontains',
        'last_name': 'last_name__icontains'
    }
    for key in request.GET:
        print(request.GET.get(key))
        if request.GET.get(key) and key != 'page':
            print(filter_mappings[key])
            filter_string[filter_mappings[key]] = request.GET.get(key)

    return filter_string


def user_filter_all(request):
    search_term = request.POST.get('search', '').strip()
    print("teste---------")
    if not search_term:
        return Q()  
    
    search_fields = [
        'email__icontains',
        'username__icontains',
        'first_name__icontains',
        'last_name__icontains',
    ]
    
    query = Q()
    for field in search_fields:
        query |= Q(**{field: search_term})

    
    return query

