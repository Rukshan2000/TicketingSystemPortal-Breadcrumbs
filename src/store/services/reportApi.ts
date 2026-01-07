import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  TablesResponse,
  CustomReportRequest,
  CustomReportResponse,
  ExportRequest,
  DashboardStats,
  TicketSummaryResponse,
  UserActivityResponse,
  WorkflowPerformanceResponse,
  ReviewsAnalyticsResponse,
} from '@/types/report';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const reportApi = createApi({
  reducerPath: 'reportApi',
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
  tagTypes: ['Report'],
  endpoints: (builder) => ({
    // Get available tables for reporting
    getAvailableTables: builder.query<TablesResponse, void>({
      query: () => '/reports/tables',
      transformResponse: (response: { success: boolean; data: TablesResponse }) => response.data,
    }),

    // Execute custom report
    executeCustomReport: builder.mutation<CustomReportResponse, CustomReportRequest>({
      query: (body) => ({
        url: '/reports/custom',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { success: boolean; data: CustomReportResponse }) => response.data,
    }),

    // Export report
    exportReport: builder.mutation<Blob, ExportRequest>({
      query: (body) => ({
        url: '/reports/export',
        method: 'POST',
        body,
        responseHandler: async (response) => {
          if (body.format === 'csv') {
            return response.blob();
          }
          return response.json();
        },
      }),
    }),

    // Get dashboard summary
    getDashboardSummary: builder.query<DashboardStats, { startDate?: string; endDate?: string }>({
      query: ({ startDate, endDate }) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return `/reports/dashboard?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: DashboardStats }) => response.data,
    }),

    // Get ticket summary report
    getTicketSummary: builder.query<TicketSummaryResponse, {
      groupBy: 'status' | 'category' | 'priority';
      startDate?: string;
      endDate?: string;
      customerId?: number;
    }>({
      query: ({ groupBy, startDate, endDate, customerId }) => {
        const params = new URLSearchParams();
        params.append('groupBy', groupBy);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (customerId) params.append('customerId', customerId.toString());
        return `/reports/tickets/summary?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: TicketSummaryResponse }) => response.data,
    }),

    // Get user activity report
    getUserActivity: builder.query<UserActivityResponse, {
      startDate?: string;
      endDate?: string;
      userId?: number;
      role?: string;
    }>({
      query: ({ startDate, endDate, userId, role }) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (userId) params.append('userId', userId.toString());
        if (role) params.append('role', role);
        return `/reports/users/activity?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: UserActivityResponse }) => response.data,
    }),

    // Get workflow performance report
    getWorkflowPerformance: builder.query<WorkflowPerformanceResponse, {
      workflowId?: number;
      startDate?: string;
      endDate?: string;
    }>({
      query: ({ workflowId, startDate, endDate }) => {
        const params = new URLSearchParams();
        if (workflowId) params.append('workflowId', workflowId.toString());
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return `/reports/workflows/performance?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: WorkflowPerformanceResponse }) => response.data,
    }),

    // Get reviews analytics report
    getReviewsAnalytics: builder.query<ReviewsAnalyticsResponse, {
      startDate?: string;
      endDate?: string;
      minRating?: number;
      maxRating?: number;
    }>({
      query: ({ startDate, endDate, minRating, maxRating }) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (minRating) params.append('minRating', minRating.toString());
        if (maxRating) params.append('maxRating', maxRating.toString());
        return `/reports/reviews/analytics?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: ReviewsAnalyticsResponse }) => response.data,
    }),
  }),
});

export const {
  useGetAvailableTablesQuery,
  useExecuteCustomReportMutation,
  useExportReportMutation,
  useGetDashboardSummaryQuery,
  useGetTicketSummaryQuery,
  useGetUserActivityQuery,
  useGetWorkflowPerformanceQuery,
  useGetReviewsAnalyticsQuery,
} = reportApi;
