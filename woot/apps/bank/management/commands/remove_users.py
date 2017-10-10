
# Django
from django.core.management.base import BaseCommand, CommandError

# Local
from apps.bank.models import User

# Command
class Command(BaseCommand):
    def handle(self, *args, **options):
        # remove all users
        User.objects.all().delete()
