
# Django
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse

# Local
from apps.bank.models.permission import AccessToken
from apps.bank.models.bank import Bank, Deposit, DepositInstance
from apps.bank.models.users import User

# Util
import json
# import collections
# from uuid import UUID


# Unpack
def extract_token(request):
    body = json.loads(request.body.decode('utf-8'))
    token = AccessToken.objects.get(id=body.get('token') or '')
    return token, body


class Access():
    def __init__(self, token, body):
        self.token = token
        self.path = body.get('path')
        self.kwargs = body.get('kwargs') or {}
        self.methods = body.get('methods') or []
        self.limit = body.get('limit')
        self.count = body.get('count')
        self.update = body.get('update') or {}
        self.create = body.get('create') or {}


def unpack(request):
    token, body = extract_token(request)
    return Access(token, body)


# API
tables = {t._label: t for t in [User, Bank, Deposit, DepositInstance]}
def register(*new_tables):
    for new_table in new_tables:
        tables[new_table._label] = new_table

# Login
@csrf_exempt
def login(request):
    # create access token
    if request.method == 'POST':
        body = request.body.decode('utf-8')
        token = AccessToken.objects.authenticate(user=request.user, access=json.loads(body or '{}'))
        return JsonResponse({'token': token._id})


def access(request):
    if request.method == 'POST':
        access = unpack(request)

        # process path
        path = access.path.split('.')
        table, _id, parameter = tuple(path + [''] * (3 - len(path)))
        parameter = None if parameter == '' else parameter

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

            # if not found, create
            if queryset.count() == 0 and access.create:
                table_object, table_object_created = table.objects.create(**access.create)
                queryset = [table_object]

            # truncate
            queryset = queryset[0:access.limit] if access.limit is not None else queryset

            # return queryset
            if access.count:
                return JsonResponse({'count': queryset.count()})
            else:
                return JsonResponse({item._id: item.data(token=access.token, secure=True, parameter=parameter, methods=access.methods) for item in queryset})
