from rest_framework import serializers

from bookings.models import BookingStatus

from .models import Payment, PaymentStatus


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id", "booking", "amount", "status", "method",
            "reference_note", "paid_at", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_booking(self, booking):
        if booking.status != BookingStatus.CONFIRMED:
            raise serializers.ValidationError("Payments can only be recorded for confirmed bookings.")
        if hasattr(booking, "payment"):
            raise serializers.ValidationError("A payment already exists for this booking.")
        return booking

    def validate(self, attrs):
        if attrs.get("status") == PaymentStatus.PAID and not attrs.get("paid_at"):
            raise serializers.ValidationError({"paid_at": "Required when status is 'paid'."})
        return attrs
