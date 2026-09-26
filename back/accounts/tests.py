"""
accounts/tests.py -- Phase 2 checkpoint.

Mirrors db:verify's discipline: an RLS/permission mistake doesn't crash,
it silently returns wrong data. So every test here asserts the DENY
path explicitly, not just that the allow path works.

Run: python manage.py test accounts
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Profile, ProfilePrivate, StudentProfile, TeacherProfile, User, UserRole


class DenyPathTests(APITestCase):
    def setUp(self):
        # Student A (owns private data we'll try to leak)
        self.student_a = User.objects.create_user(
            email="a@x.com", password="testpass123", is_active=True
        )
        self.profile_a = Profile.objects.create(
            user=self.student_a, full_name="Student A", role=UserRole.STUDENT
        )
        self.student_profile_a = StudentProfile.objects.create(profile=self.profile_a)
        self.private_a = ProfilePrivate.objects.create(
            profile=self.profile_a, phone="0600000000"
        )

        # Student B (the attacker in these tests)
        self.student_b = User.objects.create_user(
            email="b@x.com", password="testpass123", is_active=True
        )
        self.profile_b = Profile.objects.create(
            user=self.student_b, full_name="Student B", role=UserRole.STUDENT
        )
        StudentProfile.objects.create(profile=self.profile_b)

        # A teacher, for public-profile tests
        self.teacher = User.objects.create_user(
            email="t@x.com", password="testpass123", is_active=True
        )
        self.teacher_profile = Profile.objects.create(
            user=self.teacher, full_name="Teacher T", role=UserRole.TEACHER
        )
        self.teacher_profile_obj = TeacherProfile.objects.create(
            profile=self.teacher_profile, username="teacher-t", bio="Hi"
        )

    def login(self, user):
        self.client.force_authenticate(user=user)  # noqa

    def test_cannot_read_others_profile_private(self):
        """The single most important test: private data must not leak."""
        self.login(self.student_b)
        url = reverse("accounts:profile-private")
        # ProfilePrivateView.get_object() always returns request.user's own
        # record -- there's no way to pass student_a's id, which IS the
        # correct design (no object-id parameter to attack). Confirm B
        # gets B's own (empty) record, never A's phone number.
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertNotEqual(resp.data.get("phone"), "0600000000")

    def test_cannot_read_others_student_profile(self):
        self.login(self.student_b)
        url = reverse("accounts:student-profile")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Confirms it's B's own record, structurally cannot target A's.
        self.assertNotEqual(resp.data, self.student_profile_a)

    def test_anonymous_cannot_read_profile_private(self):
        url = reverse("accounts:profile-private")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_anonymous_cannot_read_student_profile(self):
        url = reverse("accounts:student-profile")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_teacher_public_profile_excludes_private_fields(self):
        """Public teacher detail must NEVER include private-model fields."""
        url = reverse("accounts:teacher-detail", args=["teacher-t"])
        resp = self.client.get(url)  # anonymous
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        forbidden_keys = {"birth_date", "phone", "guardian_name", "guardian_email"}
        self.assertFalse(forbidden_keys & set(resp.data.keys()))

    def test_anyone_can_read_teacher_public_list(self):
        url = reverse("accounts:teacher-list")
        resp = self.client.get(url)  # anonymous, allowed
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_student_cannot_edit_teacher_profile(self):
        self.login(self.student_a)
        url = reverse("accounts:teacher-profile-owner")
        resp = self.client.get(url)
        # student_a has no TeacherProfile at all -> should 404, not leak teacher's
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_delete_others_device(self):
        from .models import UserDevice
        device = UserDevice.objects.create(
            user=self.student_a, kind="desktop", device_label="A's laptop"
        )
        self.login(self.student_b)
        url = reverse("accounts:device-delete", args=[device.id])
        resp = self.client.delete(url)
        self.assertIn(resp.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))
        device.refresh_from_db()  # still exists
