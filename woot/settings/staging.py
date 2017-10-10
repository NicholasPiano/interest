# bank.settings.staging

# django
# local
from woot.settings.common import *

# util
from os import environ

########## DEBUG CONFIGURATION
# See: https://docs.djangoproject.com/en/dev/ref/settings/#debug
DEBUG = True
########## END DEBUG CONFIGURATION


########## DATABASE CONFIGURATION
DATABASE_USER = environ.get('DB_USER')
DATABASE_PWD = environ.get('DB_PWD')

# mysql: https://github.com/PyMySQL/mysqlclient-python
DATABASES = {
  'default': {
    'ENGINE': 'django.db.backends.mysql', # Add 'postgresql_psycopg2' for PG
    'NAME': '',
    'USER': '',
    'PASSWORD': '',
    'HOST': '', # Set to empty string for localhost.
    'PORT': '', # Set to empty string for default.
  }
}
########## END DATABASE CONFIGURATION


########## CACHE CONFIGURATION
CACHES = {
  'default': {
    'BACKEND': 'django.core.cache.backends.memcached.MemcachedCache',
    'LOCATION': '127.0.0.1:11211',
  }
}
########## END CACHE CONFIGURATION


########## SECRET CONFIGURATION
# See: https://docs.djangoproject.com/en/dev/ref/settings/#secret-key
SECRET_KEY = '#za#m48_9in&i!9rodpp)r6$4_)_94l0sij7+06&mw6t*9f1t9'
########## END SECRET CONFIGURATION


########## TOOLBAR CONFIGURATION
# See: https://github.com/django-debug-toolbar/django-debug-toolbar#installation
INSTALLED_APPS += (
  'debug_toolbar',
)

# See: https://github.com/django-debug-toolbar/django-debug-toolbar#installation
INTERNAL_IPS = ('127.0.0.1',)

# See: https://github.com/django-debug-toolbar/django-debug-toolbar#installation
MIDDLEWARE_CLASSES += (
  'debug_toolbar.middleware.DebugToolbarMiddleware',
)

DEBUG_TOOLBAR_CONFIG = {

}
########## END TOOLBAR CONFIGURATION
