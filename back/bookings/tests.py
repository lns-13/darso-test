import datetime

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Profile, StudentProfile, TeacherAvailability, TeacherProfile, User, UserRole
from .models import Booking, BookingStatus


class BookingDenyPathTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(email="s@x.com", password="p", is_active=True)
        self.student_profile = Profile.objects.create(user=self.student, full_name="S", role=UserRole.STUDENT)
        self.student_obj = StudentProfile.objects.create(profile=self.student_profile)

        self.other_student = User.objects.create_user(email="s2@x.com", password="p", is_active=True)
        self.other_profile = Profile.objects.create(user=self.other_student, full_name="S2", role=UserRole.STUDENT)
        StudentProfile.objects.create(profile=self.other_profile)

        self.teacher = User.objects.create_user(email="t@x.com", password="p", is_active=True)
        self.teacher_profile = Profile.objects.create(user=self.teacher, full_name="T", role=UserRole.TEACHER)
        self.teacher_obj = TeacherProfile.objects.create(profile=self.teacher_profile, username="teacher-t")

        # Monday 09:00-12:00 availability
        TeacherAvailability.objects.create(
            teacher=self.teacher_obj, weekday=0,
            starts_at=datetime.time(9, 0), ends_at=datetime.time(12, 0),
        )

        # next Monday
        today = datetime.date.today()
        days_ahead = (0 - today.weekday()) % 7 or 7
        self.next_monday = today + datetime.timedelta(days=days_ahead)

    def test_booking_outside_availability_rejected(self):
        self.client.force_authenticate(self.student)
        url = reverse("bookings:booking-list-create")
        resp = self.client.post(url, {
            "teacher": self.teacher_obj.pk,
            "date": str(self.next_monday),
            "start_time": "14:00",  # outside 09:00-12:00
            "end_time": "15:00",
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_booking_inside_availability_accepted(self):
        self.client.force_authenticate(self.student)
        url = reverse("bookings:booking-list-create")
        resp = self.client.post(url, {
            "teacher": self.teacher_obj.pk,
            "date": str(self.next_monday),
            "start_time": "09:00",
            "end_time": "10:00",
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_teacher_cannot_create_booking(self):
        self.client.force_authenticate(self.teacher)
        url = reverse("bookings:booking-list-create")
        resp = self.client.post(url, {
            "teacher": self.teacher_obj.pk,
            "date": str(self.next_monday),
            "start_time": "09:00",
            "end_time": "10:00",
        })
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_other_student_cannot_see_or_cancel_booking(self):
        booking = Booking.objects.create(
            student=self.student_obj, teacher=self.teacher_obj,
            date=self.next_monday, start_time=datetime.time(9, 0), end_time=datetime.time(10, 0),
        )
        self.client.force_authenticate(self.other_student)
        url = reverse("bookings:booking-detail", args=[booking.pk])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_can_only_cancel_not_confirm(self):
        booking = Booking.objects.create(
            student=self.student_obj, teacher=self.teacher_obj,
            date=self.next_monday, start_time=datetime.time(9, 0), end_time=datetime.time(10, 0),
        )
        self.client.force_authenticate(self.student)
        url = reverse("bookings:booking-detail", args=[booking.pk])
        resp = self.client.patch(url, {"status": BookingStatus.CONFIRMED})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
