from rest_framework import permissions

from accounts.models import UserRole


class IsStudentUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.role == UserRole.STUDENT
        )


class IsBookingParticipant(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        uid = request.user.id
        return obj.student.profile_id == uid or obj.teacher.profile_id == uid
