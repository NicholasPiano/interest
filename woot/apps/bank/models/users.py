
# Django
from django.db import models
# from django.db.models import Q
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser, PermissionsMixin
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# Local
from apps.bank.models.base import Model

# Util
import uuid
import string
import random


# random key
def random_key():
    chars = string.ascii_uppercase + string.digits
    return ''.join([random.choice(chars) for _ in range(8)])


# Models
class UserManager(BaseUserManager):
    def get_or_create_user(self, first=None, last=None, username=None, email=None, password=None, is_staff=False):
        if username is not None:
            if self.filter(username=username).exists():
                return self.get(username=username), False
        elif None not in [first, last, email, password]:
            user = self.model(first_name=first, last_name=last, username=username, email=self.normalize_email(email), is_staff=is_staff)
            user.set_password(password)
            user.save()

            return user, True
        else:
            return None, False

    def create_superuser(self, **kwargs):
        self.get_or_create_user(first='super', last='user', email='', is_staff=True, **kwargs)


# User
class User(AbstractBaseUser, PermissionsMixin, Model):

    _label = 'user'
    USERNAME_FIELD = 'username'

    # Manager
    objects = UserManager()

    # Properties
    # identification
    username = models.CharField(max_length=255, unique=True)
    email = models.EmailField(max_length=255)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)

    # roles
    is_user = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    is_manager = models.BooleanField(default=False)

    # activation
    is_activated = models.BooleanField(default=False)
    activation_email_sent = models.BooleanField(default=False)
    activation_key = models.UUIDField(default=uuid.uuid4)
    submitted_activation_key = models.UUIDField(default=uuid.uuid4)
    activation_email_key = models.CharField(max_length=8, default=random_key)

    # enabled status on system: is deleted?
    is_enabled = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # Methods
    def send_activation_email(self):
        self.activation_key = uuid.uuid4()
        self.activation_email_key = random_key()
        self.activation_email_sent = True
        self.save()

        html_content = render_to_string('users/activation_email.html', {'key': self.activation_key.hex})
        text_content = strip_tags(html_content)  # this strips the html, so people will have the text as well.

        # create the email, and attach the HTML version as well.
        msg = EmailMultiAlternatives('oe activation {}'.format(self.activation_email_key), text_content, 'signup@oe.com', [self.email])
        msg.attach_alternative(html_content, 'text/html')
        msg.send()
        return self.activation_email_key

    def activate(self, activation_key):
        self.is_activated = activation_key == self.activation_key.hex if activation_key is not None else self.is_activated
        self.save()
        return self.is_activated
