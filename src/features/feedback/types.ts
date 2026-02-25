export type FeedbackCategory = 'bug' | 'note' | 'praise';
export type FeedbackRating = 'up' | 'down';
export type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'wont_fix';

export interface Feedback {
  id: string;
  user_id: string;
  category: FeedbackCategory;
  rating: FeedbackRating | null;
  message: string | null;
  page_url: string | null;
  user_agent: string | null;
  app_version: string | null;
  screenshot_url: string | null;
  status: FeedbackStatus;
  admin_notes: string | null;
  created_at: string;
}

export type FeatureRequestStatus = 'submitted' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'rejected';

export interface FeatureRequest {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: FeatureRequestStatus;
  admin_notes: string | null;
  planned_month: string | null;
  vote_count: number;
  created_at: string;
  // Joined fields (from admin view)
  author_name?: string;
  upvotes?: number;
  downvotes?: number;
}

export type VoteType = 'up' | 'down';

export interface FeatureVote {
  id: string;
  user_id: string;
  feature_request_id: string;
  vote_type: VoteType;
  created_at: string;
}

export interface FeedbackInput {
  category: FeedbackCategory;
  rating?: FeedbackRating;
  message?: string;
  page_url?: string;
  user_agent?: string;
  screenshot_url?: string;
}

export interface FeatureRequestInput {
  title: string;
  description?: string;
  category?: string;
}
