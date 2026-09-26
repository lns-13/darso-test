from django.urls import path
from . import views

app_name = "accounts"

urlpatterns = [
    # auth
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("confirm-email/", views.ConfirmEmailView.as_view(), name="confirm-email"),
    path("password-reset/", views.PasswordResetRequestView.as_view(), name="password-reset"),
    path("password-reset/confirm/", views.PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("logout/", views.LogoutView.as_view(), name="logout"),

    # own profile
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("profile/private/", views.ProfilePrivateView.as_view(), name="profile-private"),
    path("profile/student/", views.StudentProfileView.as_view(), name="student-profile"),
    path("profile/teacher/", views.TeacherProfileOwnerView.as_view(), name="teacher-profile-owner"),

    # public teacher discovery
    path("teachers/", views.TeacherPublicListView.as_view(), name="teacher-list"),
    path("teachers/<slug:username>/", views.TeacherPublicDetailView.as_view(), name="teacher-detail"),

    # availability
    path("availability/", views.TeacherAvailabilityListCreateView.as_view(), name="availability-list"),
    path("availability/<int:pk>/", views.TeacherAvailabilityDetailView.as_view(), name="availability-detail"),

    # reference data
    path("subjects/", views.SubjectListView.as_view(), name="subject-list"),
    path("levels/", views.LevelListView.as_view(), name="level-list"),
    path("languages/", views.LanguageListView.as_view(), name="language-list"),

    # devices
    path("devices/", views.UserDeviceListView.as_view(), name="device-list"),
    path("devices/<uuid:pk>/", views.UserDeviceDeleteView.as_view(), name="device-delete"),
]

