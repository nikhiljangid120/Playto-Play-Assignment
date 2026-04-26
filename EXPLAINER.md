# EXPLAINER

### The State Machine
**Where does your state machine live in the code? Paste the function or class.**
The state machine is centralized in `backend/kyc/services.py`:
```python
class KYCStateMachine:
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
        ...
        current_state = submission.status
        if new_state not in cls.TRANSITIONS.get(current_state, []):
            raise StateMachineError(f"Illegal transition from '{current_state}' to '{new_state}'.")
        ...
```
**How do you prevent an illegal transition?**
I prevent illegal transitions by checking if the requested `new_state` exists in the `TRANSITIONS` dictionary for the `current_state`. If it doesn't, it raises a `StateMachineError` which is caught by the API view and returns a `400 Bad Request`.

### The Upload
**How are you validating file uploads? Paste the validation code.**
I validate file uploads at the DRF Serializer level in `backend/kyc/serializers.py`:
```python
def validate_file_size_and_type(value):
    if not value:
        return value
    max_size = 5 * 1024 * 1024
    if value.size > max_size:
        raise serializers.ValidationError("File size must be under 5 MB.")
    
    ext = os.path.splitext(value.name)[1].lower()
    valid_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
    if ext not in valid_extensions:
        raise serializers.ValidationError("Unsupported file type. Only PDF, JPG, and PNG are allowed.")
    return value
```
**What happens if someone sends a 50 MB file?**
The DRF validator will catch that `value.size > max_size` and raise a `ValidationError`. This results in the API returning a `400 Bad Request` with the error message "File size must be under 5 MB." before the file is persisted.

### The Queue
**Paste the query that powers the reviewer dashboard (queue list, SLA flag). Why did you write it this way?**
The Queue Query in `backend/kyc/views.py`:
```python
submissions = KYCSubmission.objects.filter(
    status__in=['submitted', 'under_review', 'more_info_requested']
).order_by('created_at')
```
The SLA Flag computation in `backend/kyc/serializers.py`:
```python
def get_at_risk(self, obj):
    if obj.status == 'submitted' and obj.submitted_at:
        return (timezone.now() - obj.submitted_at) > datetime.timedelta(hours=24)
    return False
```
**Why did you write it this way?**
I chose to filter the queue for active review states at the DB level for efficiency, but I computed the `at_risk` SLA flag dynamically using a `SerializerMethodField` rather than a database annotation or a saved field. This complies with the constraint "Compute this dynamically. Do not store a flag that goes stale." and avoids complex DB annotations for simple time math.

### The Auth
**How does your system stop merchant A from seeing merchant B's submission? Paste the check.**
The check happens in `backend/kyc/views.py` inside `MerchantKYCView` through `request.user`:
```python
class MerchantKYCView(views.APIView):
    permission_classes = [IsMerchant]

    def get(self, request):
        submission, _ = KYCSubmission.objects.get_or_create(merchant=request.user)
        # ...
```
By explicitly filtering (or getting/creating) the `KYCSubmission` using `merchant=request.user`, the query physically cannot return a submission belonging to any other user.

### The AI Audit
**One specific example where an AI tool wrote code that was buggy or insecure. Paste what it gave you, what you caught, and what you replaced it with.**
**What it gave me:**
When generating the metrics view, the AI suggested computing the average queue time like this:
```python
# AI suggestion
avg_time = KYCSubmission.objects.filter(status='submitted').aggregate(Avg(timezone.now() - F('submitted_at')))
```
**What I caught:**
The SQLite database backend doesn't support complex duration arithmetic and aggregation directly via the Django ORM using `timezone.now() - F('field')`. This would crash in SQLite.
**What I replaced it with:**
I replaced it with application-level calculation since the queue of active submissions is generally small:
```python
submitted_items = KYCSubmission.objects.filter(status='submitted', submitted_at__isnull=False)
if submitted_items.exists():
    times = [timezone.now() - item.submitted_at for item in submitted_items]
    avg_time = sum(times, datetime.timedelta()) / len(times)
```
