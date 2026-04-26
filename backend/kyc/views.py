from rest_framework import status, views, viewsets, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db.models import Count, F, ExpressionWrapper, DurationField, Avg
import datetime

from .models import User, KYCSubmission
from .serializers import UserSerializer, KYCSubmissionSerializer, KYCQueueSerializer
from .services import KYCStateMachine, StateMachineError

class IsMerchant(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'merchant'

class IsReviewer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'reviewer'

class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'role': user.role,
                'username': user.username
            })
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_400_BAD_REQUEST)


class MerchantKYCView(views.APIView):
    permission_classes = [IsMerchant]

    def get(self, request):
        submission, _ = KYCSubmission.objects.get_or_create(merchant=request.user)
        serializer = KYCSubmissionSerializer(submission)
        return Response(serializer.data)

    def put(self, request):
        submission, _ = KYCSubmission.objects.get_or_create(merchant=request.user)
        # Can only edit if in draft or more_info_requested
        if submission.status not in ['draft', 'more_info_requested']:
            return Response({'error': 'Cannot edit submission in current state.'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = KYCSubmissionSerializer(submission, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MerchantKYCSubmitView(views.APIView):
    permission_classes = [IsMerchant]

    def post(self, request):
        try:
            submission = KYCSubmission.objects.get(merchant=request.user)
            KYCStateMachine.transition(submission, 'submitted')
            return Response({'status': 'submitted'})
        except KYCSubmission.DoesNotExist:
            return Response({'error': 'No draft found'}, status=status.HTTP_404_NOT_FOUND)
        except StateMachineError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ReviewerQueueView(views.APIView):
    permission_classes = [IsReviewer]

    def get(self, request):
        # Order by oldest first, filter by states that are active
        submissions = KYCSubmission.objects.filter(
            status__in=['submitted', 'under_review', 'more_info_requested']
        ).order_by('created_at')
        serializer = KYCQueueSerializer(submissions, many=True)
        return Response(serializer.data)

class ReviewerDetailView(views.APIView):
    permission_classes = [IsReviewer]

    def get(self, request, pk):
        try:
            submission = KYCSubmission.objects.get(pk=pk)
            serializer = KYCSubmissionSerializer(submission)
            return Response(serializer.data)
        except KYCSubmission.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class ReviewerTransitionView(views.APIView):
    permission_classes = [IsReviewer]

    def post(self, request, pk):
        new_state = request.data.get('status')
        notes = request.data.get('notes', '')
        
        try:
            submission = KYCSubmission.objects.get(pk=pk)
            
            if new_state in ['rejected', 'more_info_requested'] and notes:
                submission.reviewer_notes = notes
                submission.save()
            
            if new_state == 'approved' and notes:
                 submission.reviewer_notes = notes
                 submission.save()

            KYCStateMachine.transition(submission, new_state, payload={'notes': notes})
            return Response({'status': new_state})
        except KYCSubmission.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        except StateMachineError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ReviewerMetricsView(views.APIView):
    permission_classes = [IsReviewer]

    def get(self, request):
        queue_count = KYCSubmission.objects.filter(status__in=['submitted', 'under_review']).count()
        
        # Avg time in queue for currently submitted items
        submitted_items = KYCSubmission.objects.filter(status='submitted', submitted_at__isnull=False)
        avg_time = None
        if submitted_items.exists():
            times = [timezone.now() - item.submitted_at for item in submitted_items]
            avg_time = sum(times, datetime.timedelta()) / len(times)
            avg_time = str(avg_time).split('.')[0] # keep it simple string like "1 day, 2:00:00"
            
        # Approval rate over last 7 days
        seven_days_ago = timezone.now() - datetime.timedelta(days=7)
        recent_decisions = KYCSubmission.objects.filter(
            status__in=['approved', 'rejected'],
            updated_at__gte=seven_days_ago
        )
        total_decisions = recent_decisions.count()
        approved_count = recent_decisions.filter(status='approved').count()
        approval_rate = (approved_count / total_decisions * 100) if total_decisions > 0 else 0

        return Response({
            'queue_count': queue_count,
            'avg_time_in_queue': avg_time,
            'approval_rate_7d': round(approval_rate, 2)
        })
