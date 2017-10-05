# django
from django.core.wsgi import get_wsgi_application

# util
import os

# set environ
if not 'DJANGO_SETTINGS_MODULE' in os.environ:
	os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'woot.settings.development')
application = get_wsgi_application()
