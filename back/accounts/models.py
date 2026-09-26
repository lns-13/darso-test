"""
accounts/models.py -- Phase 1, matches real Supabase schema.
"""

import uuid

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class UserRole(models.TextChoices):
    STUDENT = "student", _("Student")
    TEACHER = "teacher", _("Teacher")


class DeviceKind(models.TextChoices):
    DESKTOP = "desktop", _("Desktop")
    MOBILE = "mobile", _("Mobile")


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("is_active", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email


class Subject(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class Level(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class Language(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class Profile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, primary_key=True, related_name="profile"
    )
    full_name = models.CharField(max_length=200)
    role = models.CharField(max_length=10, choices=UserRole.choices)
    avatar_path = models.CharField(max_length=500, blank=True, null=True)
    city = models.CharField(max_length=120, blank=True, null=True)
    ui_locale = models.CharField(max_length=10, default="fr")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} ({self.role})"


class ProfilePrivate(models.Model):
    profile = models.OneToOneField(
        Profile, on_delete=models.CASCADE, primary_key=True, related_name="private"
    )
    birth_date = models.DateField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    guardian_name = models.CharField(max_length=200, blank=True, null=True)
    guardian_email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        super().clean()
        if self.birth_date:
            age = (timezone.now().date() - self.birth_date).days // 365
            if age < 18 and not self.guardian_email:
                raise ValidationError(
                    {"guardian_email": _("Guardian email is required for minors.")}
                )

    def __str__(self):
        return f"Private data for {self.profile_id}"


class StudentProfile(models.Model):
    profile = models.OneToOneField(
        Profile, on_delete=models.CASCADE, primary_key=True, related_name="student_profile"
    )
    bio = models.TextField(blank=True, null=True)
    class_label = models.CharField(max_length=100, blank=True, null=True)
    school = models.CharField(max_length=200, blank=True, null=True)
    level = models.ForeignKey(
        Level, on_delete=models.SET_NULL, null=True, blank=True, related_name="students"
    )
    subjects = models.ManyToManyField(
        Subject, through="StudentSubject", related_name="interested_students"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        super().clean()
        if self.profile.role != UserRole.STUDENT:
            raise ValidationError("Only profiles with role='student' can have a StudentProfile.")

    def __str__(self):
        return f"Student profile: {self.profile.full_name}"


class StudentSubject(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "subject")


class TeacherProfile(models.Model):
    profile = models.OneToOneField(
        Profile, on_delete=models.CASCADE, primary_key=True, related_name="teacher_profile"
    )
    username = models.SlugField(max_length=50, unique=True)
    bio = models.TextField(blank=True, null=True)
    tagline = models.CharField(max_length=200, blank=True, null=True)
    years_experience = models.PositiveIntegerField(blank=True, null=True)
    hourly_rate_minor = models.PositiveIntegerField(blank=True, null=True)
    currency = models.CharField(max_length=3, default="MAD")
    timezone = models.CharField(max_length=50, default="Africa/Casablanca")

    subjects = models.ManyToManyField(Subject, through="TeacherSubject", related_name="teachers")
    levels = models.ManyToManyField(Level, through="TeacherLevel", related_name="teachers")
    languages = models.ManyToManyField(Language, through="TeacherLanguage", related_name="teachers")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        super().clean()
        if self.profile.role != UserRole.TEACHER:
            raise ValidationError("Only profiles with role='teacher' can have a TeacherProfile.")

    def __str__(self):
        return f"@{self.username}"

    def public_fields(self):
        return {
            "user_id": self.profile_id,
            "username": self.username,
            "full_name": self.profile.full_name,
            "avatar_path": self.profile.avatar_path,
            "city": self.profile.city,
            "bio": self.bio,
            "tagline": self.tagline,
            "years_experience": self.years_experience,
            "hourly_rate_minor": self.hourly_rate_minor,
            "currency": self.currency,
            "timezone": self.timezone,
            "created_at": self.created_at,
        }


class TeacherSubject(models.Model):
    teacher = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("teacher", "subject")


class TeacherLevel(models.Model):
    teacher = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE)
    level = models.ForeignKey(Level, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("teacher", "level")


class TeacherLanguage(models.Model):
    teacher = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE)
    language = models.ForeignKey(Language, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("teacher", "language")


class TeacherAvailability(models.Model):
    teacher = models.ForeignKey(
        TeacherProfile, on_delete=models.CASCADE, related_name="availability_slots"
    )
    weekday = models.PositiveSmallIntegerField()
    starts_at = models.TimeField()
    ends_at = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        super().clean()
        if self.weekday > 6:
            raise ValidationError({"weekday": _("weekday must be 0-6.")})
        if self.starts_at >= self.ends_at:
            raise ValidationError({"ends_at": _("End time must be after start time.")})


class UserDevice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="devices")
    kind = models.CharField(max_length=10, choices=DeviceKind.choices)
    device_label = models.CharField(max_length=200)
    ip = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.CharField(max_length=500, blank=True, null=True)
    city = models.CharField(max_length=120, blank=True, null=True)
    country_code = models.CharField(max_length=2, blank=True, null=True)
    auth_session_id = models.CharField(max_length=200, blank=True, null=True)
    last_seen_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-last_seen_at"]

    def __str__(self):
        return f"{self.device_label} ({self.user.email})"
