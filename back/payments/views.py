from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from .models import Payment
from .permissions import CanRecordPayment, IsPaymentParticipantOrStaff
from .serializers import PaymentSerializer


class PaymentListCreateView(generics.ListCreateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, CanRecordPayment]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Payment.objects.all()
        return Payment.objects.filter(booking__student__profile=user.profile) | \
               Payment.objects.filter(booking__teacher__profile=user.profile)

    def perform_create(self, serializer):
        booking = serializer.validated_data["booking"]
        user = self.request.user
        if not (user.is_staff or user.id == booking.teacher.profile_id):
            raise PermissionDenied("Only the teacher on this booking (or staff) can record a payment.")
        serializer.save()


class PaymentDetailView(generics.RetrieveUpdateAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsPaymentParticipantOrStaff]

    def perform_update(self, serializer):
        user = self.request.user
        payment = self.get_object()
        if not (user.is_staff or user.id == payment.booking.teacher.profile_id):
            raise PermissionDenied("Only the teacher on this booking (or staff) can update this payment.")
        serializer.save()
