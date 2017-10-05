
# Django
from django.db import models
from django.db.models import Q

# Local

# Util
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


# Queryset
class QuerySet(models.QuerySet):

    # returns a loaded list, not a queryset
    def filter_by_permissions(self, token, **permissions):
        return list(filter(lambda obj: obj.check_permissions(**permissions), [obj.add_permissions(token) for obj in self.all()]))


# Manager
class Manager(models.Manager):
    use_for_related_fields = True

    def get_queryset(self):
        return QuerySet(model=self.model)

    def filter(self, token=None, secure=False, **kwargs):

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
            if secure:
                if token is not None:
                    return super().filter(self.token(token)).filter(**kwargs).distinct()
                return self.none()
            return super().filter(**kwargs).distinct()
        return self.none()

    def get(self, token=None, secure=False, **kwargs):

        # filter first
        if self.filter(token=token, secure=secure, **kwargs).exists():
            return super().get(**kwargs)
        return None

    def search(self, token=None, secure=False, query=None, **kwargs):
        return self.none()

    def token(self, token):
        # return a set of filters to apply to the parent object, overridden by specific objects
        return Q()


# Base
class Model(models.Model):

    objects = Manager()

    class Meta:
        abstract = True

    # Properties
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    date_created = models.DateTimeField(auto_now_add=True)

    # Methods
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

    def _method(self, name, token=None, secure=False):
        if name in self.methods:
            return {name: getattr(self, name)(token=token, secure=secure) if hasattr(self, name) else None}
        return {}

    def add_permissions(self, token):
        return self

    def check_permissions(self, **permissions):
        return len(permissions.keys()) == 0


class AccessMixin(models.Model):
    class Meta:
        abstract = True

    # Properties
    creator = models.UUIDField(default=uuid.uuid4, editable=False)
    admin = models.UUIDField(default=uuid.uuid4, editable=False)
    editor = models.UUIDField(default=uuid.uuid4, editable=False)
    viewer = models.UUIDField(default=uuid.uuid4, editable=False)

    @property
    def _creator(self):
        return self.creator.hex

    @property
    def _admin(self):
        return self.admin.hex

    @property
    def _editor(self):
        return self.editor.hex

    @property
    def _viewer(self):
        return self.viewer.hex
