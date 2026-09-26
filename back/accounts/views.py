from django.core import signing
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .email import send_confirmation_email, send_password_reset_email
from .models import (
    Language, Level, StudentProfile, Subject, TeacherAvailability,
    TeacherProfile, User, UserDevice,
)
from .permissions import (
    IsOwnerOnly, IsTeacherAvailabilityOwnerOrReadOnly,
    IsTeacherProfileOwnerOrReadOnly,
)
from .serializers import (
    ConfirmEmailSerializer, LanguageSerializer, LevelSerializer, LoginSerializer,
    PasswordResetConfirmSerializer, PasswordResetRequestSerializer, ProfilePrivateSerializer,
    ProfileSerializer, RegisterSerializer, StudentProfileSerializer, SubjectSerializer,
    TeacherAvailabilitySerializer, TeacherProfileOwnerSerializer, TeacherPublicSerializer,
    UserDeviceSerializer,
)
from .tokens import make_confirm_token, make_reset_token, read_confirm_token, read_reset_token


# ---------------------------------------------------------------------------
# Auth (unchanged)
# ---------------------------------------------------------------------------

class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        send_confirmation_email(user, make_confirm_token(user))
        return Response(
            {"detail": "Registered. Check your email to confirm your account."},
            status=status.HTTP_201_CREATED,
        )


class ConfirmEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ConfirmEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            uid = read_confirm_token(serializer.validated_data["token"])
        except signing.SignatureExpired:
            return Response({"detail": "Link expired."}, status=status.HTTP_400_BAD_REQUEST)
        except signing.BadSignature:
            return Response({"detail": "Invalid link."}, status=status.HTTP_400_BAD_REQUEST)
        user = get_object_or_404(User, id=uid)
        user.is_active = True
        user.save(update_fields=["is_active"])
        return Response({"detail": "Email confirmed."})


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = User.objects.get(email__iexact=serializer.validated_data["email"])
            send_password_reset_email(user, make_reset_token(user))
        except User.DoesNotExist:
            pass
        return Response({"detail": "If that email exists, a reset link was sent."})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            uid = read_reset_token(serializer.validated_data["token"])
        except signing.SignatureExpired:
            return Response({"detail": "Link expired."}, status=status.HTTP_400_BAD_REQUEST)
        except signing.BadSignature:
            return Response({"detail": "Invalid link."}, status=status.HTTP_400_BAD_REQUEST)
        user = get_object_or_404(User, id=uid)
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password reset."})


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "role": user.profile.role})


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Profile (public fields)
# ---------------------------------------------------------------------------

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user.profile


# ---------------------------------------------------------------------------
# ProfilePrivate -- owner only, never listed, never nested elsewhere
# ---------------------------------------------------------------------------

class ProfilePrivateView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOnly]
    serializer_class = ProfilePrivateSerializer

    def get_object(self):
        from .models import ProfilePrivate
        obj, _ = ProfilePrivate.objects.get_or_create(profile=self.request.user.profile)
        self.check_object_permissions(self.request, obj)
        return obj


# ---------------------------------------------------------------------------
# StudentProfile -- owner only
# ---------------------------------------------------------------------------

class StudentProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOnly]
    serializer_class = StudentProfileSerializer

    def get_object(self):
        obj = get_object_or_404(StudentProfile, profile=self.request.user.profile)
        self.check_object_permissions(self.request, obj)
        return obj


# ---------------------------------------------------------------------------
# TeacherProfile -- public list/detail (safe fields only) + owner edit
# ---------------------------------------------------------------------------

class TeacherPublicListView(generics.ListAPIView):
    """GET /api/teachers/ -- anyone, safe fields only (mirrors the VIEW)."""

    permission_classes = [permissions.AllowAny]
    serializer_class = TeacherPublicSerializer

    def get_queryset(self):
        return TeacherProfile.objects.select_related("profile").all()

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        data = [TeacherPublicSerializer(t.public_fields()).data for t in qs]
        return Response(data)


class TeacherPublicDetailView(APIView):
    """GET /api/teachers/<username>/ -- anyone, safe fields only."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        teacher = get_object_or_404(TeacherProfile, username=username)
        return Response(TeacherPublicSerializer(teacher.public_fields()).data)


class TeacherProfileOwnerView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/teachers/me/ -- the teacher's own full editable profile."""

    permission_classes = [permissions.IsAuthenticated, IsTeacherProfileOwnerOrReadOnly]
    serializer_class = TeacherProfileOwnerSerializer

    def get_object(self):
        obj = get_object_or_404(TeacherProfile, profile=self.request.user.profile)
        self.check_object_permissions(self.request, obj)
        return obj


# ---------------------------------------------------------------------------
# TeacherAvailability -- public read, owner write
# ---------------------------------------------------------------------------

class TeacherAvailabilityListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsTeacherAvailabilityOwnerOrReadOnly]
    serializer_class = TeacherAvailabilitySerializer

    def get_queryset(self):
        teacher_username = self.request.query_params.get("teacher")
        qs = TeacherAvailability.objects.select_related("teacher")
        if teacher_username:
            qs = qs.filter(teacher__username=teacher_username)
        return qs

    def perform_create(self, serializer):
        teacher = TeacherProfile.objects.get(profile=self.request.user.profile)
        serializer.save(teacher=teacher)


class TeacherAvailabilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsTeacherAvailabilityOwnerOrReadOnly]
    serializer_class = TeacherAvailabilitySerializer
    queryset = TeacherAvailability.objects.all()


# ---------------------------------------------------------------------------
# Reference data
# ---------------------------------------------------------------------------

class SubjectListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = SubjectSerializer
    queryset = Subject.objects.all()


class LevelListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LevelSerializer
    queryset = Level.objects.all()


class LanguageListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LanguageSerializer
    queryset = Language.objects.all()


# ---------------------------------------------------------------------------
# UserDevice -- owner only
# ---------------------------------------------------------------------------

class UserDeviceListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserDeviceSerializer

    def get_queryset(self):
        return UserDevice.objects.filter(user=self.request.user)


class UserDeviceDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOnly]
    serializer_class = UserDeviceSerializer
    queryset = UserDevice.objects.all()