// Report Types

export interface TableInfo {
  columns: string[];
  joinableTables: string[];
}

export interface TablesResponse {
  tables: Record<string, TableInfo>;
  allowedOperators: string[];
  allowedAggregations: string[];
}

export interface ColumnSelection {
  table: string;
  column: string;
  alias?: string;
}

export interface FilterCondition {
  table: string;
  column: string;
  operator: string;
  value?: string | number | string[] | number[];
}

export interface OrderByClause {
  table: string;
  column: string;
  direction: 'ASC' | 'DESC';
}

export interface AggregationClause {
  function: 'COUNT' | 'COUNT_DISTINCT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
  table: string;
  column: string;
  alias: string;
}

export interface GroupByClause {
  table: string;
  column: string;
}

export interface CustomReportRequest {
  baseTable: string;
  joins?: string[];
  columns: ColumnSelection[];
  filters?: FilterCondition[];
  aggregations?: AggregationClause[];
  groupBy?: GroupByClause[];
  orderBy?: OrderByClause[];
  limit?: number;
  offset?: number;
}

export interface CustomReportResponse {
  rows: Record<string, any>[];
  total: number;
  limit: number;
  offset: number;
  query?: string;
}

export interface ExportRequest extends CustomReportRequest {
  format: 'csv' | 'json';
}

// Dashboard Types
export interface DashboardStats {
  tickets: {
    total: string;
    open: string;
    in_progress: string;
    resolved: string;
    closed: string;
  };
  users: {
    total: string;
    active: string;
    inactive: string;
    admins: string;
    moderators: string;
    users: string;
  };
  approvals: {
    total: string;
    pending: string;
    approved: string;
    rejected: string;
  };
  reviews: {
    total: string;
    average_rating: string;
    approved: string;
  };
  recentTickets: any[];
  ticketTrend: { date: string; count: string }[];
}

// Ticket Summary Types
export interface TicketSummary {
  category?: string;
  status?: string;
  priority?: string;
  count: string;
  open_count: string;
  in_progress_count: string;
  resolved_count: string;
  closed_count: string;
  first_ticket?: string;
  last_ticket?: string;
}

export interface TicketSummaryResponse {
  summary: TicketSummary[];
  groupBy: string;
  filters: Record<string, string>;
}

// User Activity Types
export interface UserActivity {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: string;
  status: string;
  department: string;
  last_login: string;
  tickets_created: string;
  approvals_made: string;
  approvals_approved: string;
  approvals_rejected: string;
}

export interface UserActivityResponse {
  users: UserActivity[];
  filters: Record<string, string>;
}

// Workflow Performance Types
export interface WorkflowPerformance {
  workflow_id: number;
  workflow_name: string;
  node_id: number;
  node_name: string;
  node_order: number;
  approval_type: string;
  total_tickets: string;
  pending_count: string;
  approved_count: string;
  rejected_count: string;
  avg_approval_hours: string;
}

export interface WorkflowPerformanceResponse {
  performance: WorkflowPerformance[];
  filters: Record<string, string>;
}

// Reviews Analytics Types
export interface ReviewRatingStats {
  rating: number;
  review_count: string;
  avg_helpful: string;
  avg_unhelpful: string;
  approved_count: string;
  pending_count: string;
  rejected_count: string;
}

export interface ReviewsAnalyticsResponse {
  byRating: ReviewRatingStats[];
  overall: {
    total_reviews: string;
    average_rating: string;
    min_rating: string;
    max_rating: string;
    total_helpful: string;
    total_unhelpful: string;
  };
  filters: Record<string, string>;
}
