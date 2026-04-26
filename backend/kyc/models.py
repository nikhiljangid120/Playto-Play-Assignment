from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('merchant', 'Merchant'),
        ('reviewer', 'Reviewer'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='merchant')


class KYCSubmission(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('more_info_requested', 'More Info Requested'),
    )

    merchant = models.OneToOneField(User, on_delete=models.CASCADE, related_name='kyc_submission')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Personal details
    personal_name = models.CharField(max_length=255, blank=True)
    personal_email = models.EmailField(blank=True)
    personal_phone = models.CharField(max_length=20, blank=True)
    
    # Business details
    business_name = models.CharField(max_length=255, blank=True)
    business_type = models.CharField(max_length=255, blank=True)
    expected_monthly_volume = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Documents
    pan_document = models.FileField(upload_to='kyc_docs/pan/', null=True, blank=True)
    aadhaar_document = models.FileField(upload_to='kyc_docs/aadhaar/', null=True, blank=True)
    bank_statement = models.FileField(upload_to='kyc_docs/bank/', null=True, blank=True)
    
    # Reviewer fields
    reviewer_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"KYC - {self.merchant.username} - {self.status}"


class NotificationEvent(models.Model):
    submission = models.ForeignKey(KYCSubmission, on_delete=models.CASCADE, related_name='notifications')
    event_type = models.CharField(max_length=50)
    old_state = models.CharField(max_length=20, blank=True)
    new_state = models.CharField(max_length=20)
    timestamp = models.DateTimeField(auto_now_add=True)
    payload = models.JSONField(default=dict)

    def __str__(self):
        return f"Event {self.event_type} - {self.submission.id}"
