from django.conf.urls import url
from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'signup', views.SingUp)
router.register(r'signin', views.SignIn)
router.register(r'profile', views.UserInfo)

urlpatterns = [
    # path('activate/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/$', views.ActivationView.as_view(), name='activate'),
    url(r'^activate/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/$',
        views.ActivationView.as_view(), name='activate'),

    path('', views.MainView.as_view(), name='index'),
    path(
        'auth/facebook',
        views.SignInFacebookView.as_view(),
        name='sign-in-facebook'
    ),
    path(
        'auth/facebook/redirect',
        views.FacebookRedirectView.as_view(),
        name='sign-in-facebook-redirect'
    ),
    path(
        'fb_redirect/',
        views.FBRedirect.as_view(),
        name='xxx'
    ),

    path('', include(router.urls)),
]
