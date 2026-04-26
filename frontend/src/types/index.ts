export interface User {
  username: string;
  role: 'merchant' | 'reviewer';
  token: string;
}

export interface KYCSubmission {
  id: number;
  merchant: number;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'more_info_requested';
  personal_name: string;
  personal_email: string;
  personal_phone: string;
  business_name: string;
  business_type: string;
  expected_monthly_volume: string | null;
  pan_document: string | null;
  aadhaar_document: string | null;
  bank_statement: string | null;
  reviewer_notes: string;
  submitted_at: string | null;
}

export interface QueueItem {
  id: number;
  merchant_name: string;
  status: string;
  submitted_at: string | null;
  at_risk: boolean;
}

export interface DashboardMetrics {
  queue_count: number;
  avg_time_in_queue: string | null;
  approval_rate_7d: number;
}
