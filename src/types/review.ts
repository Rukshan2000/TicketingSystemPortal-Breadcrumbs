export interface Review {
  id: number;
  ticket_id: number;
  customer_id: number;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  helpful_count: number;
  unhelpful_count: number;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  ticket_title?: string;
}

export interface CreateReviewRequest {
  ticket_id: number;
  customer_id: number;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating?: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
