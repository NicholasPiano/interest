
# Django
from django.db import models
from django.contrib.auth import get_user_model

# Local
from apps.base.models import Model, Manager, AccessMixin
from apps.base.api import add_tables


# Bank
class Bank(Model):
    _label = 'bank'

    # Connections

    # Properties
    name = models.CharField(max_length=255)


# Deposit
class DepositManager(Manager):
    def access(self, user):
        credentials = {}
        for token in user.permanent_tokens.all():
            credentials[token.deposit._id] = {
                'creator': token.deposit._creator,
                'admin': token.deposit._admin,
                'editor': token.deposit._editor,
                'viewer': token.deposit._viewer,
            }

        return credentials


class Deposit(Model, AccessMixin):
    _label = 'deposit'
    objects = DepositManager()

    # Connections
    bank = models.ForeignKey('bank.Bank', related_name='deposits')

    # Properties
    account_number = models.PositiveIntegerField(default=0)
    yearly_interest = models.FloatField(default=0)
    tax = models.FloatField(default=0)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(auto_now_add=False, null=True)

    # Methods


# Permission tokens
class DepositPermanentToken(Model):
    _label = 'depositpermanenttoken'

    # Connections
    deposit = models.ForeignKey('bank.Deposit', related_name='permanent_tokens')
    user = models.ForeignKey(get_user_model(), related_name='permanent_tokens', null=True)


# Deposit instance
class DepositInstance(Model):
    _label = 'depositinstance'

    # Connections
    deposit = models.ForeignKey('bank.Deposit', related_name='instances')

    # Properties
    balance = models.FloatField(default=0)


add_tables(Bank, Deposit, DepositInstance, primary=Deposit)
