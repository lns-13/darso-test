from rest_framework import permissions


class IsPaymentParticipantOrStaff(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        return user.is_staff or user.id in (
            obj.booking.student.profile_id, obj.booking.teacher.profile_id
        )


class CanRecordPayment(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        return user.is_staff or user.id == obj.booking.teacher.profile_id
