
# Django
from django.conf.urls import url

# Local
from apps.bank.api.users import auth, app
from apps.bank.api.access import login, access

urlpatterns = [
    # auth
    url(r'^login/', auth),

    # app
    url(r'^account/', app),

    # token
    url(r'^token/', login),

    # api
    url(r'^a/', access),
]
