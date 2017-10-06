
# Django
from django.db import models
from django.conf import settings

# Local
from apps.bank.models.base import Model, Manager
from apps.bank.models.bank import Deposit
from apps.bank.models.users import User

# Util
import uuid


# Access token
class AccessTokenManager(Manager):
    use_for_related_fields = True

    def authenticate(self, user=None, access=None):

        # deactivate all previous tokens
        for token in self.filter(user=user, is_active=True):
            token.deactivate()

        # create and return new token
        access = user.access() if access is None and user is not None else access
        token = self.create(user=user)
        token.authenticate(access)
        return token


class AccessToken(Model):
    objects = AccessTokenManager()

    # Connections
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='access_tokens', null=True)

    # Properties
    machine = models.TextField(default='')
    is_active = models.BooleanField(default=False)

    # Methods
    def deactivate(self):
        self.is_active = False
        self.save()

    def authenticate(self, access):
        self.is_active = True
        for _id, _secure in access.items():
            self.add(_id, _secure)
        self.save()

    def add(self, _id, _secure):
        if Deposit.objects.filter(id=_id):
            deposit = Deposit.objects.get(id=_id, secure=_secure)
            if deposit is not None:
                temporary_token = self.temporary_tokens.create(deposit=deposit)


class TemporaryToken(Model):

    # Connections
    token = models.ForeignKey('bank.AccessToken', related_name='temporary_tokens')
    deposit = models.ForeignKey('bank.Deposit', related_name='temporary_tokens')


class PermanentToken(Model):

    # Connections
    deposit = models.ForeignKey('bank.Deposit', related_name='permanent_tokens')
    user = models.ForeignKey('bank.User', related_name='permanent_tokens')
