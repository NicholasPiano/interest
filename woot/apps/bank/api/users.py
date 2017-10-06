
# Django
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect


# App
def auth(request):
    if request.method == 'GET':
        # logout any user to begin with
        logout(request)

        # return SPA
        return render(request, 'bank/auth.html')
    elif request.method == 'POST':
        user = authenticate(**json.loads(request.body))
        condition = user is not None and user.is_activated
        if condition:
            login(request, user)
        return JsonResponse({'success': condition})


def app(request):
    if request.method == 'GET' and request.user.is_authenticated:
        return render(request, 'bank/app.html')
    else:
        return redirect('/login/')
