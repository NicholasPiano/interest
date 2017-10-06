
# Django
from django.conf.urls import include, url


urlpatterns = [
    url(r'^', include('apps.bank.api.urls')),
]
