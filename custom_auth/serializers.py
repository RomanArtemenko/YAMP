from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import ValidationError
from rest_framework.validators import UniqueValidator
from .validators import PhoneNumberValidator
from .models import Profile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')


class SignUpSerializer(serializers.Serializer):
    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    username = serializers.CharField(min_length=1, max_length=50)
    first_name = serializers.CharField(min_length=2, max_length=50)
    last_name = serializers.CharField(min_length=2, max_length=50)
    phone_number = serializers.CharField(min_length=10, max_length=10,
        validators=[PhoneNumberValidator()]
    )
    password = serializers.CharField(min_length=8, max_length=128)
    password_confirm = serializers.CharField(min_length=8, max_length=128)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise ValidationError(
                '"password" and "confirm_password" should be the same !'
            )

        return attrs

    def create(self, validated_data):
        user_data = dict(validated_data)
        phone_number = user_data.pop('phone_number')
        user_data.pop('password_confirm')
        user = User.objects.create_user(**user_data)
        Profile.objects.create(**{'user':user ,'phone_number': phone_number})
        return user


class SignInSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(max_length=128, min_length=8)

    def create(self, validated_data):
        user = authenticate(
            email=validated_data['email'],
            password=validated_data['password']
        )

        if user is None:
            raise ValidationError('Wrong email or password or not confirmed email')

        token, created = Token.objects.get_or_create(user=user)
        return token
