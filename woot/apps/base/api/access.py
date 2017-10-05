
# Django
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse

# Local
from apps.source.models import PermissionToken

# Util
import json
# import collections
# from uuid import UUID


# Unpack
def authenticate(request):
    body = json.loads(request.body.decode('utf-8'))
    token = PermissionToken.objects.get(id=body.get('token') or '')
    return token, body


class Access():
    def __init__(self, token, body):
        self.token = token
        self.path = body.get('path')
        self.kwargs = body.get('kwargs') or {}
        self.query = body.get('query')
        self.permissions = body.get('permissions') or {}
        self.methods = body.get('methods') or []
        self.limit = body.get('limit')
        self.count = body.get('count')
        self.update = body.get('update') or {}


def unpack(request):
    token, body = authenticate(request)
    return Access(token, body)


# Login
@csrf_exempt
def login(request):
    # create access token
    if request.method == 'POST':
        credentials = json.loads(request.body.decode('utf-8'))
        token = PermissionToken.objects.create()
        token.authenticate(credentials)
        return JsonResponse({'token': token._id})


# API
tables = {}


def add_tables(*new_tables):
    for new_table in new_tables:
        tables[new_table._label] = new_table


def access(request):
    if request.method == 'POST':
        access = unpack(request)

        # process path
        path = access.path.split('.')
        table, _id, parameter = tuple(path + [''] * (3 - len(path)))

        # data
        if table in tables.keys():

            # get table
            table = tables[table]

            # get full queryset either by searching for a query or filtering the database
            queryset = table.objects.filter(token=access.token, secure=True, **access.kwargs)

            # fetch single object
            if _id:
                queryset = queryset.filter(id=_id)

            # if singular, update is possible
            if queryset.count() == 1 and access.update:
                queryset[0].update(token=access.token, secure=True, **access.update)

            # truncate
            queryset = queryset[0:access.limit] if access.limit is not None else queryset

            # return queryset
            if access.count:
                return JsonResponse({'count': queryset.count()})
            else:
                return JsonResponse({item._id: item.data(token=access.token, secure=True, parameter=parameter, methods=access.methods) for item in queryset})
