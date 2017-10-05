
# Django
from django.db import models
from django.contrib.auth import get_user_model

# Local
from apps.base.models import Model, AccessMixin
from apps.base.api import add_tables


# Bank
class Bank(Model):
    _label = 'bank'

    # Connections

    # Properties
    name = models.CharField(max_length=255)


# Deposit
class Deposit(Model, AccessMixin):
    _label = 'deposit'

    # Connections
    bank = models.ForeignKey('bank.Bank', related_name='deposits')

    # Properties
    account_number = models.PositiveIntegerField(default=0)
    yearly_interest = models.FloatField(default=0)
    tax = models.FloatField(default=0)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(auto_now_add=False, null=True)

    # Methods


# Deposit access token
class DepositAccessToken(Model):
    _label = 'depositaccesstoken'

    # Connections
    deposit = models.ForeignKey('bank.Deposit', related_name='tokens')
    user = models.ForeignKey(get_user_model(), related_name='tokens')


# Deposit instance
class DepositInstance(Model):
    _label = 'depositinstance'

    # Connections
    deposit = models.ForeignKey('bank.Deposit', related_name='instances')

    # Properties
    balance = models.FloatField(default=0)


add_tables(Bank, Deposit, DepositAccessToken, DepositInstance)
