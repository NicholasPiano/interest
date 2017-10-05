
# Django
from django.conf.urls import url

# Local
from apps.base.api.access import login, access

# Util


# Urls
urlpatterns = [

    # login
    url(r'^login/$', login),

    # request or update existing data
    url(r'^a/$', access),

]
