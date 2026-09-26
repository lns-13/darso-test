"""
accounts/permissions.py -- Phase 2.

Each permission below encodes the equivalent Postgres RLS policy from
the real Supabase schema. See MIGRATION_GUIDE.md's Phase 2 table.
"""

from rest_framework import permissions


class IsProfileOwner(permissions.BasePermission):
    """Profile: public fields readable by anyone, writable by owner only."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user_id == request.user.id


class IsOwnerOnly(permissions.BasePermission):
    """
    ProfilePrivate, StudentProfile, UserDevice: owner only, for BOTH
    read and write. Mirrors RLS policies that never grant public SELECT.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        owner_id = getattr(obj, "user_id", None)
        if owner_id is None:
            # StudentProfile's pk is profile_id which equals user_id
            owner_id = getattr(obj, "profile_id", None)
        return owner_id == request.user.id


class IsTeacherProfileOwnerOrReadOnly(permissions.BasePermission):
    """
    TeacherProfile: public fields readable by anyone (mirrors
    teacher_public_profiles view), writable by the teacher who owns it.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.profile_id == request.user.id


class IsTeacherAvailabilityOwnerOrReadOnly(permissions.BasePermission):
    """TeacherAvailability: anyone can read (to book), only the teacher can write."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.teacher.profile_id == request.user.id
