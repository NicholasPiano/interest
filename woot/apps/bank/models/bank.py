
# Django
from django.db import models
from django.db.models import Q
from django.conf import settings

# Local
from apps.bank.models.base import Model, Manager


# Bank
class BankManager(Manager):
    def token(self, token):
        deposit_class = self.model._meta.get_field('deposits').related_model
        return Q(deposits__in=deposit_class.objects.filter(temporary_tokens__token=token))

class Bank(Model):
    _label = 'bank'
    objects = BankManager()

    # Connections

    # Properties
    name = models.CharField(max_length=255)


# Deposit
class DepositManager(Manager):
    def token(self, token):
        return Q(temporary_tokens__token=token)

class Deposit(Model):
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


# Deposit instance
class DepositInstanceManager(Manager):
    def token(self, token):
        return Q(deposit__temporary_tokens__token=token)

class DepositInstance(Model):
    _label = 'depositinstance'

    # Connections
    deposit = models.ForeignKey('bank.Deposit', related_name='instances')

    # Properties
    balance = models.FloatField(default=0)
