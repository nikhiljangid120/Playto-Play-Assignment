from django.urls import path
from .views import (
    LoginView, 
    MerchantKYCView, MerchantKYCSubmitView,
    ReviewerQueueView, ReviewerDetailView, ReviewerTransitionView, ReviewerMetricsView
)

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='api-login'),
    
    path('kyc/', MerchantKYCView.as_view(), name='merchant-kyc'),
    path('kyc/submit/', MerchantKYCSubmitView.as_view(), name='merchant-kyc-submit'),
    
    path('reviews/', ReviewerQueueView.as_view(), name='reviewer-queue'),
    path('reviews/metrics/', ReviewerMetricsView.as_view(), name='reviewer-metrics'),
    path('reviews/<int:pk>/', ReviewerDetailView.as_view(), name='reviewer-detail'),
    path('reviews/<int:pk>/transition/', ReviewerTransitionView.as_view(), name='reviewer-transition'),
]
