from django.shortcuts import render, redirect
from django.contrib.auth import get_user_model
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_text
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.http import HttpResponse, HttpResponseRedirect
from django.views import View
from django.views.generic import TemplateView
from rest_framework import viewsets
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import UserSerializer, SignUpSerializer, SignInSerializer
from .tokens import account_activation_token
from boards.settings import OAUTH_CREDENTIALS
import urllib
import requests
User = get_user_model()

# Create your views here.


#API
class SingUp(viewsets.mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = SignUpSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers({})
        # out_serializer = UserSerializer(serializer.instance)
        confirm = ConfirmEmailView(self.request, serializer.instance)
        confirm.request_confirm()
        return Response("Confirm your email address to complete the registration",
                        status=status.HTTP_201_CREATED, headers=headers)


class SignIn(viewsets.mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = Token.objects.all()
    serializer_class = SignInSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers({})
        out_data = 'Token %s' % serializer.instance.key
        return Response(out_data,
                        status=status.HTTP_200_OK, headers=headers)


class ActivationView(View):

    def get(self, request, uidb64, token):
        try:
            uid = force_text(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except(TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None
        if user is not None and account_activation_token.check_token(user, token):
            user.is_active = True
            user.save()
            # return redirect('home')
            return HttpResponse('Thank you for your email confirmation. Now you can login your account.')
        else:
            return HttpResponse('Activation link is invalid!')


class ConfirmEmailView():
    mail_subject = 'Activate your account.'
    mail_teplate = 'custom_auth/template_confirm_registration.html'

    def __init__(self, request, user):
        self.domain = get_current_site(request).domain
        self.user = user
        self.uid = urlsafe_base64_encode(force_bytes(user.pk)).decode()
        self.token = account_activation_token.make_token(user)

    def _make_body(self):
        body = render_to_string(self.mail_teplate, {
                'user': self.user,
                'domain': self.domain,
                'uid': self.uid,
                'token': self.token,
            })

        return body

    def request_confirm(self):
        email = EmailMessage(
            subject=self.mail_subject,
            body=self._make_body(),
            to=[self.user.email]
        )
        email.send()


class MainView(TemplateView):
    template_name = 'custom_auth/index.html'


class FBRedirect(View):
    template_name = 'custom_auth/fb_redirect.html'

    def get(self, request, *arg, **kwargs):
        return render(request, self.template_name, *arg, **kwargs)


class SignInFacebookView(View):
    template_name = "custom_auth/sign_in_facebook.html"
    errors = []
    authorize_url = 'https://www.facebook.com/v3.1/dialog/oauth?'

    clint_id = OAUTH_CREDENTIALS['facebook']['id']

    authorize_vars = {
        'client_id': clint_id,
        'redirect_uri':
        'http://localhost:8000/auth/facebook/redirect',
        # 'http://localhost:8000',
        'response_type': 'code',
        'scope': 'email'
    }

    url = authorize_url + urllib.parse.urlencode(authorize_vars)

    def get(self, request, *args, **kwargs):
        return HttpResponseRedirect(self.url)


class FacebookRedirectView(View):
    template_name = "custom_auth/fb_redirect.html"
    # clint_id = OAUTH_CREDENTIALS['facebook']['id']
    # secret_key = OAUTH_CREDENTIALS['facebook']['secret']
    # access_url = 'https://graph.facebook.com/v3.1/oauth/access_token?'
    # access_vars = {
    #     'client_id': clint_id,
    #     'redirect_uri': 'http://localhost:8000/auth/facebook/redirect',
    #     'client_secret': secret_key,
    #     'code': ''
    # }
    # info_url = 'https://graph.facebook.com/v3.1/me?'
    # info_vars = {
    #     'access_token': '',
    #     'fields': 'id,name,last_name,first_name,email',
    #     'format': 'json',
    #     'method': 'get',
    #     'pretty': '0',
    #     'suppress_http_code': '1'
    # }

    def get(self, request, *args, **kwargs):
        if 'code' not in request.GET:
            return redirect('main')

        return render(request, self.template_name)


class UserInfo(viewsets.mixins.ListModelMixin ,viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def list(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)

        return Response(serializer.data)
