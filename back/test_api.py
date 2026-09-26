"""
test_api.py

End-to-end smoke test for the accounts/bookings/payments API.
Run this while `python manage.py runserver` is running in another terminal.

Usage:
    pip install requests   (if not already installed)
    python test_api.py

It will:
1. Register a teacher + a student (skips if they already exist)
2. Log in as both, grabbing their tokens
3. Create a booking as the student
4. Confirm it as the teacher
5. Record a payment as the teacher
6. Print PASS/FAIL for each step so you can see exactly what broke
"""

import sys
import requests

BASE = "http://localhost:8000/api"


def step(name):
    print(f"\n--- {name} ---")


def check(resp, expected_statuses, label):
    ok = resp.status_code in expected_statuses
    print(f"[{'PASS' if ok else 'FAIL'}] {label} -> {resp.status_code}")
    if not ok:
        print("Response body:", resp.text)
    return ok


def main():
    session = requests.Session()

    # 1. Register teacher
    step("Register teacher")
    r = session.post(f"{BASE}/accounts/register/", json={
        "email": "teacher@x.com", "password": "testpass123",
        "password2": "testpass123", "first_name": "Jane",
        "last_name": "Doe", "role": "teacher",
    })
    # 201 = created, 400 = already exists (fine for re-running this script)
    check(r, (201, 400), "Register teacher")

    # 2. Register student
    step("Register student")
    r = session.post(f"{BASE}/accounts/register/", json={
        "email": "student@x.com", "password": "testpass123",
        "password2": "testpass123", "first_name": "Sam",
        "last_name": "Lee", "role": "student",
    })
    check(r, (201, 400), "Register student")

    # 3. Login as teacher
    step("Login as teacher")
    r = session.post(f"{BASE}/accounts/login/", json={
        "email": "teacher@x.com", "password": "testpass123",
    })
    if not check(r, (200,), "Login as teacher"):
        sys.exit(1)
    teacher_token = r.json()["token"]
    teacher_id = r.json()["user"]["id"]
    print("Teacher id:", teacher_id, "| token:", teacher_token[:8] + "...")

    # 4. Login as student
    step("Login as student")
    r = session.post(f"{BASE}/accounts/login/", json={
        "email": "student@x.com", "password": "testpass123",
    })
    if not check(r, (200,), "Login as student"):
        sys.exit(1)
    student_token = r.json()["token"]
    print("Student token:", student_token[:8] + "...")

    student_headers = {"Authorization": f"Token {student_token}"}
    teacher_headers = {"Authorization": f"Token {teacher_token}"}

    # 5. Student creates a booking
    step("Student creates booking")
    r = session.post(f"{BASE}/bookings/", headers=student_headers, json={
        "teacher": teacher_id,
        "requested_datetime": "2026-12-01T14:00:00Z",
        "duration_minutes": 60,
    })
    if not check(r, (201,), "Create booking"):
        sys.exit(1)
    booking_id = r.json()["id"]
    print("Booking id:", booking_id, "| status:", r.json()["status"])

    # 6. Teacher confirms the booking
    step("Teacher confirms booking")
    r = session.patch(f"{BASE}/bookings/{booking_id}/", headers=teacher_headers, json={
        "status": "confirmed",
    })
    check(r, (200,), "Confirm booking")
    print("Booking status now:", r.json().get("status"))

    # 7. Teacher records a payment
    step("Teacher records payment")
    r = session.post(f"{BASE}/payments/", headers=teacher_headers, json={
        "booking": booking_id,
        "amount": "50.00",
        "status": "paid",
        "method": "cash",
        "paid_at": "2026-12-01T15:00:00Z",
    })
    check(r, (201,), "Record payment")

    print("\nAll steps attempted. Check for any [FAIL] lines above.")


if __name__ == "__main__":
    main()