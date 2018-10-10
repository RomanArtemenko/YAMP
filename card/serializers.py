from django.contrib.auth import get_user_model
from django.db.models.functions import Concat
from django.db.models import Value as V
from rest_framework import serializers
from .models import Card, Status, Role

User = get_user_model()


class UserLiteSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name')


class StatusSerializer(serializers.ModelSerializer):

    class Meta:
        model = Status
        fields = ('id', 'name')


class RoleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Role
        fields = ('id', 'name')


class CardSerializer(serializers.ModelSerializer):
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True)
    assigned_to_repr = UserLiteSerializer(source='assigned_to', read_only=True)
    owner = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True, required=False)
    owner_repr = UserLiteSerializer(source='owner', read_only=True, allow_null=True)
    status = serializers.PrimaryKeyRelatedField(queryset=Status.objects.all(), allow_null=True, required=False)
    status_repr = StatusSerializer(source='status', read_only=True, allow_null=True)
    role_repr = RoleSerializer(source='role', read_only=True, many=True)

    class Meta:
        model = Card
        fields = ('id', 'title', 'description', 'assigned_to', 'assigned_to_repr','due_date',
                  'owner', 'owner_repr', 'status', 'status_repr', 'role_repr', 'created_date')


class CardCreateSerializer(serializers.ModelSerializer):
    assigned_to = serializers.ChoiceField(
        choices=[(u.id, u.full_name) for u in User.objects.all().annotate(
            full_name=Concat('first_name', V(" "), 'last_name'))],
        allow_null=True
    )
    assigned_to_repr = UserLiteSerializer(source='assigned_to', read_only=True)
    owner = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True, required=False)
    owner_repr = UserLiteSerializer(source='owner', read_only=True, allow_null=True)
    status = serializers.ChoiceField(choices=[(s.id, s.name) for s in Status.objects.all()])
    status_repr = StatusSerializer(source='status', read_only=True, allow_null=True)
    role = serializers.ChoiceField(choices=[(r.id, r.name) for r in Role.objects.all()])
    role_repr = RoleSerializer(source='role', read_only=True, many=True)

    class Meta:
        model = Card
        fields = ('id', 'title', 'description', 'assigned_to', 'assigned_to_repr','due_date',
                  'owner', 'owner_repr', 'status', 'status_repr','role', 'role_repr', 'created_date')