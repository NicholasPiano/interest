
### Django
from django.db import models

### Local
from apps.bank.models.base import Model

### Team
class Team(Model):
	_label = 'team'

	### Connections
	group = models.ForeignKey('bank.Group', related_name='teams')

	### Properties
	name = models.CharField(max_length=255)
	description = models.TextField()

# types
types = [
	{
		'type': 'admin',
		'display': 'Admin',
		'plural': 'Admins',
	},
	{
		'type': 'coach',
		'display': 'Coach',
		'plural': 'Coaches',
	},
	{
		'type': 'rower',
		'display': 'Rower',
		'plural': 'Rowers',
	},
	{
		'type': 'coxswain',
		'display': 'Coxswain',
		'plural': 'Coxswains',
	},
	{
		'type': 'trainer',
		'display': 'Trainer',
		'plural': 'Trainers',
	},
]

### Role
class Role(Model):
	_label = 'role'

	### Connections
	group = models.ForeignKey('bank.Group', related_name='roles')
	team = models.ForeignKey('bank.Team', related_name='roles', null=True)
	member = models.ForeignKey('bank.Member', related_name='roles')

	### Properties
	type = models.PositiveIntegerField(default=0)
	@property
	def _type(self):
		return types[self.type]

class RoleInstance(Model):
	_label = 'roleinstance'

	### Connections
	event = models.ForeignKey('bank.EventInstance', related_name='roles')
	role = models.ForeignKey('bank.Role', related_name='instances')

	### Properties

### Records
class RowerRecord(Model):
	_label = 'rowerrecord'

	### Connections
	role = models.ForeignKey('bank.Role', related_name='rower_records')
	event = models.ForeignKey('bank.EventInstance', related_name='roles', null=True)

	### Properties
	power_to_weight_ratio = models.FloatField(default=0)
	weight = models.FloatField(default=0)
	two_kilometer_time = models.FloatField(default=0)
	five_kilometer_time = models.FloatField(default=0)
	five_hundred_meter_time = models.FloatField(default=0)
