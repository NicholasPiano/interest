
### Django
from django.db import models
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser, PermissionsMixin
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

### Local
from apps.bank.models.base import Model

### Member
class MemberManager(BaseUserManager):
	pass

class Member(AbstractBaseUser, PermissionsMixin, Model):
	_label = 'user'
	USERNAME_FIELD = 'username'

	### Manager
	objects = MemberManager()

	### Connections


	### Properties
	# identification
	username = models.CharField(max_length=255, unique=True)
	email = models.EmailField(max_length=255)
	first_name = models.CharField(max_length=255)
	last_name = models.CharField(max_length=255)

	# activation
	is_activated = models.BooleanField(default=False)
	activation_email_sent = models.BooleanField(default=False)
	activation_key = models.UUIDField(default=uuid.uuid4)
	activation_email_key = models.CharField(max_length=8, default=random_key)

	# enabled status on system: is deleted?
	is_enabled = models.BooleanField(default=True)
	is_staff = models.BooleanField(default=False)

	### Methods
	def send_activation_email(self):
		self.activation_key = uuid.uuid4()
		self.activation_email_key = random_key()
		self.activation_email_sent = True
		self.save()

		html_content = render_to_string('users/activation_email.html', {'key': self.activation_key.hex})
		text_content = strip_tags(html_content) # this strips the html, so people will have the text as well.

		# create the email, and attach the HTML version as well.
		msg = EmailMultiAlternatives('oe activation {}'.format(self.activation_email_key), text_content, 'signup@oe.com', [self.email])
		msg.attach_alternative(html_content, 'text/html')
		msg.send()
		return self.activation_email_key

	def activate(self, activation_key):
		self.is_activated = activation_key == self.activation_key.hex if activation_key is not None else self.is_activated
		self.save()
		return self.is_activated

class AccessToken(Model):
	_label = 'accesstoken'

	### Connections
	member = models.ForeignKey('bank.Member', related_name='access_tokens')

	### Properties
	is_active = models.BooleanField(default=True)