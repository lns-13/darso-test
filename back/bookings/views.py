from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError as DRFValidationError
from django.core.exceptions import ValidationError as DjangoValidationError

from accounts.models import UserRole

from .models import Booking, BookingStatus
from .permissions import IsBookingParticipant, IsStudentUser
from .serializers import BookingSerializer, BookingStatusUpdateSerializer


class BookingListCreateView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        profile = self.request.user.profile
        if profile.role == UserRole.TEACHER:
            return Booking.objects.filter(teacher__profile=profile)
        return Booking.objects.filter(student__profile=profile)

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsStudentUser()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        try:
            serializer.save()
        except DjangoValidationError as e:
            raise DRFValidationError(e.message_dict if hasattr(e, "message_dict") else str(e))


class BookingDetailView(generics.RetrieveUpdateAPIView):
    queryset = Booking.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsBookingParticipant]

    def get_serializer_class(self):
        user_profile = self.request.user.profile
        if self.request.method in ("PATCH", "PUT") and user_profile.role == UserRole.TEACHER:
            return BookingStatusUpdateSerializer
        return BookingSerializer

    def perform_update(self, serializer):
        booking = self.get_object()
        profile = self.request.user.profile

        if profile.role == UserRole.STUDENT:
            new_status = self.request.data.get("status")
            if new_status != BookingStatus.CANCELLED:
                raise PermissionDenied("Students can only cancel a booking.")
            serializer.save(status=BookingStatus.CANCELLED)
        else:
            serializer.save()
