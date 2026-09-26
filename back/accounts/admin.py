from django.contrib import admin
from .models import (
    User, Profile, ProfilePrivate, StudentProfile, TeacherProfile,
    Subject, Level, Language, TeacherAvailability, UserDevice,
)

admin.site.register(User)
admin.site.register(Profile)
admin.site.register(ProfilePrivate)
admin.site.register(StudentProfile)
admin.site.register(TeacherProfile)
admin.site.register(Subject)
admin.site.register(Level)
admin.site.register(Language)
admin.site.register(TeacherAvailability)
admin.site.register(UserDevice)
