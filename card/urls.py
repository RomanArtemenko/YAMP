from django.conf.urls import url
from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'card', views.CardViewSet)
router.register(r'role', views.RoleViewSet)
router.register(r'status', views.StatusViewSet)

urlpatterns = [
    path('', include(router.urls)),
]