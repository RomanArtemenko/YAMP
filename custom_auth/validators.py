from django.core import validators
from django.utils.deconstruct import deconstructible
from django.utils.translation import gettext_lazy as _

@deconstructible
class PhoneNumberValidator(validators.RegexValidator):
    regex = r'^\d{10}$'
    message = _('Enter a valid phone number. This value may contain only numbers. ')
    flags = 0