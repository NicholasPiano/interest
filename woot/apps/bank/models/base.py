
### Django
from django.db import models
from django.db.models import Q

### Local

### Util
import uuid
from uuid import UUID

def is_valid_uuid(uuid_string):
	try:
		if hasattr(uuid_string, 'hex') and is_valid_uuid(uuid_string.hex):
			val = uuid_string
		else:
			val = UUID(uuid_string, version=4)
	except ValueError:
		return False
	return str(val) == uuid_string or val.hex == uuid_string or val == uuid_string

### Manager
class Manager(models.Manager):
	use_for_related_fields = True

	def filter(self, **kwargs):

		# add uuid check
		uuid_validated = True
		for uuid_field in ['id', 'creator', 'admin', 'editor', 'viewer']:
			if uuid_field in kwargs:
				if not is_valid_uuid(kwargs[uuid_field]):
					uuid_validated = False
					break
			elif '{}__in'.format(uuid_field) in kwargs:
				for uuid_string in kwargs['{}__in'.format(uuid_field)]:
					if not is_valid_uuid(uuid_string):
						uuid_validated = False
						break

		if uuid_validated:
			return super().filter(**kwargs).distinct()
		return self.none()

	def get(self, token=None, secure=False, **kwargs):

		# filter first
		if self.filter(token=token, secure=secure, **kwargs).exists():
			return super().get(**kwargs)
		return None

### Base
class Model(models.Model):

	objects = Manager()

	class Meta:
		abstract = True

	### Properties
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	date_created = models.DateTimeField(auto_now_add=True)

	### Methods
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)

	@property
	def _id(self):
		return self.id.hex

	@property
	def _ref(self):
		return '{}.{}'.format(self.__class__._label, self._id)

	def _parameter(self, name, value=None):
		# If the request loading the object specifies a filter keyword to access a single property, make sure it matches this property name
		# Else, let it through.
		if self.parameter is None or (self.parameter is not None and self.name == self.parameter):
			return {name: value if value is not None else (getattr(self, name) if hasattr(self, name) else None)}
		return {}