
# Django
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect

# Util
import json

# App
def auth(request):
    if request.method == 'GET':
        # logout any user to begin with
        logout(request)

        # return SPA
        return render(request, 'bank/auth.html')

    elif request.method == 'POST':

        # 1. log the user in using username and password
        body = json.loads(request.body)
        username, password, activation_key = body.get('username'), body.get('password'), body.get('activation_key')
        user = authenticate(username=username, password=password)

        # 2. check activation and check the activation key in the post data
        success = False
        if user is not None and (user.is_activated or user.activate(activation_key)):
            login(request, user)
            success = True

        return JsonResponse({'success': success})

def app(request):
    if request.method == 'GET' and request.user.is_authenticated:
        return render(request, 'bank/account.html')
    else:
        return redirect('/login/')
