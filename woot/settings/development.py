# bank.settings.development

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
# mysql: https://github.com/PyMySQL/mysqlclient-python
# http://jazstudios.blogspot.co.uk/2010/06/postgresql-login-commands.html
# http://stackoverflow.com/questions/7975556/how-to-start-postgresql-server-on-mac-os-x
# psql -d postgres -U <root_user> -W
DATABASES = {
  'default': {
    'ENGINE': 'django.db.backends.sqlite3', # Add 'postgresql_psycopg2' for PG django.db.backends.mysql
    'NAME': 'db.sqlite3',
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


########## EMAIL DEBUG CONFIGURATION
# Show emails in the console during developement.
# See: https://docs.djangoproject.com/en/dev/ref/settings/#email-backend
########## EMAIL SERVER CONFIGURATION
# EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = 'signup.deposit@gmail.com'
EMAIL_HOST_PASSWORD = 'machine0'
EMAIL_USE_TLS = True
SERVER_EMAIL = EMAIL_HOST_USER
# GO TO ACCOUNT > SIGNIN AND SECURITY > APPS WITH ACCESS > ALLOW LESS SECURE APPS
########## END EMAIL SERVER CONFIGURATION
