import os
import django
from django.utils import timezone
import datetime

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from kyc.models import User, KYCSubmission
from kyc.services import KYCStateMachine

def seed():
    print("Clearing old data...")
    User.objects.all().delete()

    print("Creating reviewer...")
    reviewer = User.objects.create_user(username='reviewer', email='rev@playto.so', password='password', role='reviewer')

    print("Creating merchant 1 (Draft)...")
    merchant_draft = User.objects.create_user(username='merchant_draft', email='m1@example.com', password='password', role='merchant')
    KYCSubmission.objects.create(
        merchant=merchant_draft, 
        status='draft',
        personal_name='Draft Merchant',
        business_name='Draft Biz'
    )

    print("Creating merchant 2 (Under Review)...")
    merchant_review = User.objects.create_user(username='merchant_review', email='m2@example.com', password='password', role='merchant')
    sub2 = KYCSubmission.objects.create(
        merchant=merchant_review, 
        status='draft',
        personal_name='Review Merchant',
        business_name='Review Biz',
        expected_monthly_volume=5000.00
    )
    
    KYCStateMachine.transition(sub2, 'submitted')
    
    # We want to test SLA tracking (at_risk if > 24h). Let's simulate that by faking the submitted_at time.
    sub2.submitted_at = timezone.now() - datetime.timedelta(hours=25)
    sub2.save()
    
    KYCStateMachine.transition(sub2, 'under_review')
    
    print("Seeding complete!")
    print("Credentials (password is 'password'):")
    print(" - Reviewer: reviewer")
    print(" - Merchant (Draft): merchant_draft")
    print(" - Merchant (Under Review - At Risk SLA): merchant_review")

if __name__ == "__main__":
    seed()
