
# Django
from django.conf.urls import url

# Local
from apps.bank.api.users import auth, app

urlpatterns = [
    # auth
    url(r'^login/', auth),

    # app
    url(r'^account/', app),
]
