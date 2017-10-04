
### Django
from django.db import models

### Local
from apps.bank.models.base import Model

### Asset
# Anything like a boat, boathouse, blades, jackets, coxbox, etc.
assets = [
	{
		'name': 'boat',
	}
]

class Asset(Model):
	_label = 'asset'

	### Connections
	group = models.ForeignKey('bank.Group', related_name='assets')

	### Properties
	type = models.PositiveIntegerField(default=0)
	@property
	def _type(self):
		return assets[self.type]

	location = models.CharField(max_length=255)
	description = models.TextField()

class AssetInstance(Model):
	_label = 'assetinstance'

	### Connections
	asset = models.ForeignKey('bank.Asset', related_name='instances')
	in_possession_of = models.ForeignKey('bank.Group', related_name='external_assets')

	### Properties
