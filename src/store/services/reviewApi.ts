import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Review,
  CreateReviewRequest,
  UpdateReviewRequest,
  ReviewStats,
  ReviewsResponse,
} from '@/types/review';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const reviewApi = createApi({
  reducerPath: 'reviewApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Review', 'ReviewStats'],
  endpoints: (builder) => ({
    // Create a new review
    createReview: builder.mutation<Review, CreateReviewRequest>({
      query: (body) => ({
        url: '/reviews',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Review', 'ReviewStats'],
    }),

    // Get all reviews (paginated)
    getReviews: builder.query<ReviewsResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 }) => `/reviews?page=${page}&limit=${limit}`,
      providesTags: ['Review'],
    }),

    // Get review by ID
    getReviewById: builder.query<Review, number>({
      query: (id) => `/reviews/${id}`,
      providesTags: (result, error, id) => [{ type: 'Review', id }],
    }),

    // Get review for a ticket
    getReviewByTicketId: builder.query<Review, number>({
      query: (ticketId) => `/reviews/ticket/${ticketId}`,
      providesTags: (result, error, ticketId) => [{ type: 'Review', id: `ticket-${ticketId}` }],
    }),

    // Get reviews by customer
    getReviewsByCustomer: builder.query<ReviewsResponse, { customerId: number; page?: number; limit?: number }>({
      query: ({ customerId, page = 1, limit = 10 }) =>
        `/reviews/customer/${customerId}?page=${page}&limit=${limit}`,
      providesTags: ['Review'],
    }),

    // Get reviews by rating
    getReviewsByRating: builder.query<ReviewsResponse, { rating: 1 | 2 | 3 | 4 | 5; page?: number; limit?: number }>({
      query: ({ rating, page = 1, limit = 10 }) =>
        `/reviews/rating/${rating}?page=${page}&limit=${limit}`,
      providesTags: ['Review'],
    }),

    // Get reviews by status
    getReviewsByStatus: builder.query<ReviewsResponse, { status: string; page?: number; limit?: number }>({
      query: ({ status, page = 1, limit = 10 }) =>
        `/reviews/status/${status}?page=${page}&limit=${limit}`,
      providesTags: ['Review'],
    }),

    // Get average rating statistics
    getReviewStats: builder.query<ReviewStats, void>({
      query: () => '/reviews/stats/average',
      providesTags: ['ReviewStats'],
    }),

    // Update a review
    updateReview: builder.mutation<Review, { id: number; data: UpdateReviewRequest }>({
      query: ({ id, data }) => ({
        url: `/reviews/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Review', id },
        'Review',
        'ReviewStats',
      ],
    }),

    // Delete a review
    deleteReview: builder.mutation<void, number>({
      query: (id) => ({
        url: `/reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Review', 'ReviewStats'],
    }),

    // Mark review as helpful
    markReviewHelpful: builder.mutation<Review, number>({
      query: (id) => ({
        url: `/reviews/${id}/helpful`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Review', id }],
    }),

    // Mark review as unhelpful
    markReviewUnhelpful: builder.mutation<Review, number>({
      query: (id) => ({
        url: `/reviews/${id}/unhelpful`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Review', id }],
    }),
  }),
});

export const {
  useCreateReviewMutation,
  useGetReviewsQuery,
  useGetReviewByIdQuery,
  useGetReviewByTicketIdQuery,
  useGetReviewsByCustomerQuery,
  useGetReviewsByRatingQuery,
  useGetReviewsByStatusQuery,
  useGetReviewStatsQuery,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useMarkReviewHelpfulMutation,
  useMarkReviewUnhelpfulMutation,
} = reviewApi;
