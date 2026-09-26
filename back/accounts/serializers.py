"""
accounts/serializers.py -- Phase 2 additions.

RULE (carried over from Supabase's query-layer rules in DATA.md):
never `fields = "__all__"` on anything touching ProfilePrivate, and
never let a serializer reachable by non-owners include private fields.
Each serializer below is scoped to exactly one audience.
"""




from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import serializers

from .models import (
    Language, Level, Profile, ProfilePrivate, StudentProfile, Subject,
    TeacherAvailability, TeacherProfile, User, UserDevice, UserRole,
)

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(max_length=200)
    role = serializers.ChoiceField(choices=UserRole.choices)
    birth_date = serializers.DateField(required=False, allow_null=True)
    guardian_email = serializers.EmailField(required=False, allow_null=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def validate(self, attrs):
        birth_date = attrs.get("birth_date")
        guardian_email = attrs.get("guardian_email")
        if birth_date:
            from django.utils import timezone
            age = (timezone.now().date() - birth_date).days // 365
            if age < 18 and not guardian_email:
                raise serializers.ValidationError(
                    {"guardian_email": "Required for users under 18."}
                )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        birth_date = validated_data.pop("birth_date", None)
        guardian_email = validated_data.pop("guardian_email", None)

        user = User.objects.create_user(
            email=validated_data["email"], password=validated_data["password"]
        )
        profile = Profile.objects.create(
            user=user, full_name=validated_data["full_name"], role=validated_data["role"]
        )
        if birth_date or guardian_email:
            ProfilePrivate.objects.create(
                profile=profile,
                birth_date=birth_date,
                guardian_email=guardian_email,
            )
        if profile.role == UserRole.STUDENT:
            StudentProfile.objects.create(profile=profile)
        else:
            TeacherProfile.objects.create(profile=profile, username=f"user-{user.id.hex[:8]}")
        return user


class ConfirmEmailSerializer(serializers.Serializer):
    token = serializers.CharField()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs["email"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("Account not active (email not confirmed).")
        attrs["user"] = user
        return attrs


# ---------------------------------------------------------------------------
# Reference data -- public, read-only
# ---------------------------------------------------------------------------

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "name", "slug", "sort_order"]


class LevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Level
        fields = ["id", "name", "slug", "sort_order"]


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ["id", "name", "slug", "sort_order"]


# ---------------------------------------------------------------------------
# Profile -- public fields only. NEVER add ProfilePrivate fields here.
# ---------------------------------------------------------------------------

class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Profile
        fields = ["email", "full_name", "role", "avatar_path", "city", "ui_locale"]
        read_only_fields = ["role"]


# ---------------------------------------------------------------------------
# ProfilePrivate -- owner-only endpoint. This serializer must NEVER be
# nested inside any public-facing serializer above.
# ---------------------------------------------------------------------------

class ProfilePrivateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfilePrivate
        fields = ["birth_date", "phone", "guardian_name", "guardian_email"]

    def validate(self, attrs):
        birth_date = attrs.get("birth_date", getattr(self.instance, "birth_date", None))
        guardian_email = attrs.get(
            "guardian_email", getattr(self.instance, "guardian_email", None)
        )
        if birth_date:
            from django.utils import timezone
            age = (timezone.now().date() - birth_date).days // 365
            if age < 18 and not guardian_email:
                raise serializers.ValidationError(
                    {"guardian_email": "Required for users under 18."}
                )
        return attrs


# ---------------------------------------------------------------------------
# StudentProfile -- owner-only (not public, per RLS table).
# ---------------------------------------------------------------------------

class StudentProfileSerializer(serializers.ModelSerializer):
    subject_ids = serializers.PrimaryKeyRelatedField(
        source="subjects", queryset=Subject.objects.all(), many=True, required=False
    )

    class Meta:
        model = StudentProfile
        fields = ["bio", "class_label", "school", "level", "subject_ids"]


# ---------------------------------------------------------------------------
# TeacherProfile -- two serializers: public (safe subset, mirrors the
# teacher_public_profiles VIEW exactly) and owner (full, editable).
# ---------------------------------------------------------------------------

class TeacherPublicSerializer(serializers.Serializer):
    """
    Built from TeacherProfile.public_fields() -- NEVER from the model
    directly, so a field added to TeacherProfile later doesn't silently
    become public. This mirrors why teacher_public_profiles is a VIEW
    with a fixed column list rather than `select *` on teacher_profiles.
    """
    user_id = serializers.UUIDField()
    username = serializers.CharField()
    full_name = serializers.CharField()
    avatar_path = serializers.CharField(allow_null=True)
    city = serializers.CharField(allow_null=True)
    bio = serializers.CharField(allow_null=True)
    tagline = serializers.CharField(allow_null=True)
    years_experience = serializers.IntegerField(allow_null=True)
    hourly_rate_minor = serializers.IntegerField(allow_null=True)
    currency = serializers.CharField()
    timezone = serializers.CharField()
    created_at = serializers.DateTimeField()


class TeacherProfileOwnerSerializer(serializers.ModelSerializer):
    subject_ids = serializers.PrimaryKeyRelatedField(
        source="subjects", queryset=Subject.objects.all(), many=True, required=False
    )
    level_ids = serializers.PrimaryKeyRelatedField(
        source="levels", queryset=Level.objects.all(), many=True, required=False
    )
    language_ids = serializers.PrimaryKeyRelatedField(
        source="languages", queryset=Language.objects.all(), many=True, required=False
    )

    class Meta:
        model = TeacherProfile
        fields = [
            "username", "bio", "tagline", "years_experience",
            "hourly_rate_minor", "currency", "timezone",
            "subject_ids", "level_ids", "language_ids",
        ]


# ---------------------------------------------------------------------------
# TeacherAvailability -- public read, owner write
# ---------------------------------------------------------------------------

class TeacherAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherAvailability
        fields = ["id", "teacher", "weekday", "starts_at", "ends_at"]
        read_only_fields = ["teacher"]  # set from request.user server-side


# ---------------------------------------------------------------------------
# UserDevice -- owner only
# ---------------------------------------------------------------------------

class UserDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDevice
        fields = [
            "id", "kind", "device_label", "ip", "user_agent",
            "city", "country_code", "last_seen_at", "created_at",
        ]
        read_only_fields = fields  # devices are created by the login flow, not user-edited