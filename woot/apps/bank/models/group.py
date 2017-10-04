
### Django
from django.db import models

### Local
from apps.bank.models.base import Model

### Group
class Group(Model):
	_label = 'group'

	### Properties
	name = models.CharField(max_length=255)
	# crest_file