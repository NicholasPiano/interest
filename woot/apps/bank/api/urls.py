
### Django
from django.conf.urls import include, url

### Local
from apps.bank.api.access import login, access

### Util


### Urls
urlpatterns = [

	# login
	url(r'^login/$', login),

	# request or update existing data
	url(r'^a/$', access),

]