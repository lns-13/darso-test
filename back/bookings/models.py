"""
bookings/models.py -- Phase 4.

Booking now validates against accounts.TeacherAvailability (the real
schema's recurring weekly slots) instead of the earlier "any time"
assumption.
"""

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from accounts.models import StudentProfile, Subject, TeacherProfile


class BookingStatus(models.TextChoices):
    PENDING = "pending", _("Pending")
    CONFIRMED = "confirmed", _("Confirmed")
    REJECTED = "rejected", _("Rejected")
    CANCELLED = "cancelled", _("Cancelled")
    COMPLETED = "completed", _("Completed")


class Booking(models.Model):
    student = models.ForeignKey(
        StudentProfile, on_delete=models.CASCADE, related_name="bookings"
    )
    teacher = models.ForeignKey(
        TeacherProfile, on_delete=models.CASCADE, related_name="bookings"
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name="bookings"
    )

    date = models.DateField(help_text=_("Calendar date of the session."))
    start_time = models.TimeField()
    end_time = models.TimeField()

    status = models.CharField(
        max_length=12, choices=BookingStatus.choices, default=BookingStatus.PENDING
    )
    student_notes = models.TextField(blank=True)
    teacher_response_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-start_time"]

    def __str__(self):
        return f"{self.student} -> {self.teacher} on {self.date} ({self.status})"

    def clean(self):
        super().clean()
        if self.date and self.date < timezone.now().date():
            raise ValidationError({"date": _("Date must not be in the past.")})
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError({"end_time": _("End time must be after start time.")})
        if self.date and self.start_time and self.end_time and self.teacher_id:
            weekday = self.date.weekday()  # 0=Monday
            fits = self.teacher.availability_slots.filter(
                weekday=weekday,
                starts_at__lte=self.start_time,
                ends_at__gte=self.end_time,
            ).exists()
            if not fits:
                raise ValidationError(
                    _("Requested time is outside the teacher's declared availability.")
                )

    @property
    def is_decided(self):
        return self.status in (BookingStatus.CONFIRMED, BookingStatus.REJECTED)
