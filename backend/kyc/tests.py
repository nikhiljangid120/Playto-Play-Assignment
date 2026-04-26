from django.test import TestCase
from .models import User, KYCSubmission, NotificationEvent
from .services import KYCStateMachine, StateMachineError

class StateMachineTest(TestCase):
    def setUp(self):
        self.merchant = User.objects.create_user(username='testmerch', password='password', role='merchant')
        self.submission = KYCSubmission.objects.create(merchant=self.merchant, status='draft')

    def test_valid_transitions(self):
        # Draft -> Submitted
        KYCStateMachine.transition(self.submission, 'submitted')
        self.assertEqual(self.submission.status, 'submitted')
        self.assertIsNotNone(self.submission.submitted_at)
        
        # Submitted -> Under Review
        KYCStateMachine.transition(self.submission, 'under_review')
        self.assertEqual(self.submission.status, 'under_review')

        # Under Review -> More Info Requested
        KYCStateMachine.transition(self.submission, 'more_info_requested')
        self.assertEqual(self.submission.status, 'more_info_requested')
        
        # More Info Requested -> Submitted
        KYCStateMachine.transition(self.submission, 'submitted')
        self.assertEqual(self.submission.status, 'submitted')

        # Check notifications were created
        self.assertEqual(NotificationEvent.objects.count(), 4)

    def test_invalid_transition(self):
        # Draft -> Approved (Illegal)
        with self.assertRaises(StateMachineError):
            KYCStateMachine.transition(self.submission, 'approved')

        # Submitted -> Approved (Illegal)
        KYCStateMachine.transition(self.submission, 'submitted')
        with self.assertRaises(StateMachineError):
            KYCStateMachine.transition(self.submission, 'approved')
