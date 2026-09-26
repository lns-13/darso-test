from rest_framework import serializers

from accounts.models import StudentProfile, TeacherProfile

from .models import Booking, BookingStatus


class BookingSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.profile.full_name", read_only=True)
    teacher_name = serializers.CharField(source="teacher.profile.full_name", read_only=True)
    teacher_username = serializers.CharField(source="teacher.username", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id", "student_name", "teacher", "teacher_username", "teacher_name",
            "subject", "date", "start_time", "end_time", "status",
            "student_notes", "teacher_response_notes", "created_at", "updated_at",
        ]
        read_only_fields = ["status", "teacher_response_notes", "created_at", "updated_at"]

    def create(self, validated_data):
        student = StudentProfile.objects.get(profile=self.context["request"].user.profile)
        booking = Booking(student=student, **validated_data)
        booking.full_clean()
        booking.save()
        return booking


class BookingStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["status", "teacher_response_notes"]

    def validate_status(self, value):
        if value not in (BookingStatus.CONFIRMED, BookingStatus.REJECTED, BookingStatus.CANCELLED):
            raise serializers.ValidationError("Invalid status transition.")
        if self.instance and self.instance.status != BookingStatus.PENDING and value != BookingStatus.CANCELLED:
            raise serializers.ValidationError("Only pending bookings can be confirmed/rejected.")
        return value
