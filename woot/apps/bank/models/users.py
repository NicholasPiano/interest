
# Django
from django.db import models
from django.db.models import Q
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser, PermissionsMixin
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# Local
from apps.bank.models.base import Model, Manager

# Util
import uuid
import string
import random


# random key
def random_key():
    chars = string.ascii_uppercase + string.digits
    return ''.join([random.choice(chars) for _ in range(8)])


# Models
class UserManager(BaseUserManager, Manager):
    def create(self, first=None, last=None, username=None, email=None, is_staff=False, is_admin=False, is_manager=False, password=None):
        if username is not None:
            if self.filter(username=username).exists():
                return self.get(username=username), False

            if None not in [first, last, email, password]:
                user = self.model(first_name=first, last_name=last, username=username, email=self.normalize_email(email), is_staff=is_staff, is_admin=is_admin, is_manager=is_manager)
                user.set_password(password)
                user.send_activation_email()
                user.save()
                return user, True

        return None, False

    def token(self, token):
        return Q()

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
    is_admin = models.BooleanField(default=False)
    is_manager = models.BooleanField(default=False)

    # activation
    is_activated = models.BooleanField(default=False)
    activation_email_sent = models.BooleanField(default=False)
    activation_key = models.UUIDField(default=uuid.uuid4)
    submitted_activation_key = models.UUIDField(default=uuid.uuid4)
    activation_email_key = models.CharField(max_length=8, default=random_key)
    activation_email_key_returned = models.BooleanField(default=False)

    # enabled status on system: is deleted?
    is_enabled = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # Methods
    def send_activation_email(self):
        self.activation_key = uuid.uuid4()
        self.activation_email_key = random_key()
        self.activation_email_sent = True
        self.save()

        html_content = render_to_string('bank/activation_email.html', {'key': self.activation_key.hex})
        text_content = strip_tags(html_content)  # this strips the html, so people will have the text as well.

        # create the email, and attach the HTML version as well.
        msg = EmailMultiAlternatives('deposit activation {}'.format(self.activation_email_key), text_content, 'signup@deposit.com', [self.email])
        msg.attach_alternative(html_content, 'text/html')
        msg.send()
        return self.activation_email_key

    def activate(self, activation_key):
        if not self.is_activated:
            self.is_activated = activation_key == self.activation_key.hex if activation_key is not None else self.is_activated
            self.save()
        return self.is_activated

    def access(self):
        return {token.deposit._id: token.deposit._secure for token in self.permanent_tokens.all()}

    def data(self, token=None, secure=False, parameter=None, methods=[]):
        self.parameter = parameter
        self.methods = methods
        if token.user is not None and (token.user.is_admin or self == token.user):
            return {
                key: value for d in [
                    # Properties
                    self._parameter('username'),
                    self._parameter('email'),
                    self._parameter('first_name'),
                    self._parameter('last_name'),
                    self._parameter('is_admin'),
                    self._parameter('is_manager'),
                    self._parameter('is_activated'),
                    self._parameter('is_self', value=(self == token.user)),
                ] for key, value in d.items()
            }
        else:
            if not self.activation_email_key_returned:
                self.activation_email_key_returned = True
                self.save()
                return {
                    key: value for d in [
                        # Properties
                        self._parameter('activation_email_key'),
                    ] for key, value in d.items()
                }

            return {}
