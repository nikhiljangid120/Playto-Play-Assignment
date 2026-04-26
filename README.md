# Playto KYC Pipeline

This is a full-stack solution for the Playto Founding Engineering Intern Challenge.
It handles merchant onboarding, document uploads, state transitions, SLA tracking, and reviewer dashboards.

## Stack
- Backend: Django + Django REST Framework + SQLite
- Frontend: React + Vite + Tailwind CSS + React Query

## Setup Instructions

### 1. Backend

Navigate to the backend directory and set up the virtual environment:
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt # (or install django djangorestframework django-cors-headers manually if missing)
python manage.py makemigrations
python manage.py migrate
```

**Seed Database (Optional but Recommended):**
```bash
python seed.py
```
This will create a reviewer and two merchants (one in draft, one under review with SLA risk).
**Credentials:**
- Reviewer: `reviewer` / `password`
- Merchant 1: `merchant_draft` / `password`
- Merchant 2: `merchant_review` / `password`

**Run Backend:**
```bash
python manage.py runserver
```

### 2. Frontend

Navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```

The application should now be accessible at `http://localhost:5173`.

## Architecture Details
- **State Machine:** Centralized in `backend/kyc/services.py`. Prevents illegal state transitions at the service layer.
- **File Validation:** Handled by DRF validators in `backend/kyc/serializers.py` (PDF/JPG/PNG only, max 5MB).
- **SLA Tracking:** Computed dynamically at serialization to avoid stale DB flags.

Please see `EXPLAINER.md` for answers to the required technical questions.
