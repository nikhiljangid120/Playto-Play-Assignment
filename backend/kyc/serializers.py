from rest_framework import serializers
from django.utils import timezone
import datetime
import os
from .models import User, KYCSubmission, NotificationEvent

def validate_file_size_and_type(value):
    if not value:
        return value
    # Check size (max 5 MB)
    max_size = 5 * 1024 * 1024
    if value.size > max_size:
        raise serializers.ValidationError("File size must be under 5 MB.")
    
    # Check type
    ext = os.path.splitext(value.name)[1].lower()
    valid_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
    if ext not in valid_extensions:
        raise serializers.ValidationError("Unsupported file type. Only PDF, JPG, and PNG are allowed.")
    return value

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']

class KYCSubmissionSerializer(serializers.ModelSerializer):
    pan_document = serializers.FileField(validators=[validate_file_size_and_type], required=False, allow_null=True)
    aadhaar_document = serializers.FileField(validators=[validate_file_size_and_type], required=False, allow_null=True)
    bank_statement = serializers.FileField(validators=[validate_file_size_and_type], required=False, allow_null=True)

    class Meta:
        model = KYCSubmission
        fields = '__all__'
        read_only_fields = ['merchant', 'status', 'reviewer_notes', 'created_at', 'updated_at', 'submitted_at']


class KYCQueueSerializer(serializers.ModelSerializer):
    merchant_name = serializers.CharField(source='merchant.username', read_only=True)
    at_risk = serializers.SerializerMethodField()

    class Meta:
        model = KYCSubmission
        fields = ['id', 'merchant_name', 'status', 'submitted_at', 'at_risk']

    def get_at_risk(self, obj):
        if obj.status == 'submitted' and obj.submitted_at:
            return (timezone.now() - obj.submitted_at) > datetime.timedelta(hours=24)
        return False

class NotificationEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationEvent
        fields = '__all__'
