from django.utils import timezone
from .models import KYCSubmission, NotificationEvent

class StateMachineError(Exception):
    pass

class KYCStateMachine:
    """
    Centralized state machine for KYC Submission.
    Handles legal transitions and logging.
    """
    TRANSITIONS = {
        'draft': ['submitted'],
        'submitted': ['under_review'],
        'under_review': ['approved', 'rejected', 'more_info_requested'],
        'more_info_requested': ['submitted'],
        'approved': [],
        'rejected': [],
    }

    @classmethod
    def transition(cls, submission: KYCSubmission, new_state: str, payload: dict = None):
        if payload is None:
            payload = {}
            
        current_state = submission.status
        
        if new_state not in cls.TRANSITIONS.get(current_state, []):
            raise StateMachineError(f"Illegal transition from '{current_state}' to '{new_state}'.")
            
        submission.status = new_state
        
        if new_state == 'submitted':
            submission.submitted_at = timezone.now()
            
        submission.save()
        
        NotificationEvent.objects.create(
            submission=submission,
            event_type='state_transition',
            old_state=current_state,
            new_state=new_state,
            payload=payload
        )
        
        return submission
