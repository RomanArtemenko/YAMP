from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Card, Status, Role
from .serializers import CardSerializer, RoleSerializer, StatusSerializer, CardCreateSerializer

# Create your views here.


class CardViewSet(viewsets.ModelViewSet):
    serializer_class = CardSerializer
    queryset = Card.objects.all()
    permission_classes = (IsAuthenticated,)

    def perform_create(self, serializer):
        print('>>>> WAS CREATED NEW CARD >>>>')
        serializer.save(owner=self.request.user, status=Status.get_default_status())

    def perform_update(self, serializer):
        old_instance = self.get_object()
        new_assigned_to = serializer.validated_data.get('assigned_to')
        new_status = serializer.validated_data.get('status')

        if new_assigned_to is not None:
            if old_instance.assigned_to != new_assigned_to:
                print(">>>> ASSIGNED_TO was changed >>>>")

        if new_status is not None:
            if old_instance.status != new_status:
                print(">>>> STATUS was changed >>>>")

        serializer.save()

    def get_queryset(self):
        if 'me' in self.request.query_params.keys():
            return self.queryset.filter(owner=self.request.user)

        return self.queryset

    def get_serializer_class(self):
        if self.action == 'metadata':
            return CardCreateSerializer

        return self.serializer_class


class RoleViewSet(viewsets.mixins.CreateModelMixin,
                  viewsets.mixins.ListModelMixin,
                  viewsets.mixins.RetrieveModelMixin,
                  viewsets.GenericViewSet):
    serializer_class = RoleSerializer
    queryset = Role.objects.all()
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        search_str = self.request.query_params.get('search_str',None)

        if search_str is not None:
            return self.queryset.filter(name__icontains=search_str)

        return self.queryset


class StatusViewSet(viewsets.mixins.RetrieveModelMixin,
                    viewsets.mixins.ListModelMixin,
                    viewsets.mixins.UpdateModelMixin,
                    viewsets.GenericViewSet):
    serializer_class = StatusSerializer
    queryset = Status.objects.all()
    permission_classes = (IsAuthenticated,)
