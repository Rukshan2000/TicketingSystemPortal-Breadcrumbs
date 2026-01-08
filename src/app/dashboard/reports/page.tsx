'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  BarChart3,
  FileText,
  Users,
  GitBranch,
  Star,
  Download,
  Plus,
  X,
  Play,
  Calendar,
  TrendingUp,
  Ticket,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  FileJson,
} from 'lucide-react';
import { ReportLetterhead } from '@/components/reports/report-letterhead';
import { exportReportToCSV, formatTableForPDF, createPrintDocument } from '@/lib/pdfExport';
import {
  useGetDashboardSummaryQuery,
  useGetTicketSummaryQuery,
  useGetUserActivityQuery,
  useGetWorkflowPerformanceQuery,
  useGetReviewsAnalyticsQuery,
  useGetAvailableTablesQuery,
  useExecuteCustomReportMutation,
} from '@/store/services/reportApi';
import type { ColumnSelection, FilterCondition, OrderByClause } from '@/types/report';
import { toast } from 'sonner';
import { hasPermission } from '@/lib/permissions';

export default function ReportsPage() {
  // Check permissions first
  const canViewTicketReports = hasPermission('view ticket reports');
  const canViewUserReports = hasPermission('view user reports');
  const canViewWorkflowReports = hasPermission('view workflow reports');
  const canViewReviewReports = hasPermission('view review reports');
  const canCreateCustomReports = hasPermission('create custom reports');

  // State declarations
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [ticketGroupBy, setTicketGroupBy] = useState<'status' | 'category' | 'priority'>('status');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [baseTable, setBaseTable] = useState('');
  const [selectedJoins, setSelectedJoins] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<ColumnSelection[]>([]);
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [orderBy, setOrderBy] = useState<OrderByClause[]>([]);
  const [reportLimit, setReportLimit] = useState(100);
  const [reportResults, setReportResults] = useState<any[]>([]);
  const [currentUser] = useState({ name: 'Administrator', email: 'admin@organization.com' });

  // Set default active tab based on available permissions
  const getDefaultTab = () => {
    if (canViewTicketReports) return 'tickets';
    if (canViewUserReports) return 'users';
    if (canViewWorkflowReports) return 'workflows';
    if (canViewReviewReports) return 'reviews';
    if (canCreateCustomReports) return 'custom';
    return 'tickets'; // fallback
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab());
  
  // API Queries
  const { data: dashboardData, isLoading: isDashboardLoading } = useGetDashboardSummaryQuery(dateRange);
  const { data: ticketSummary, isLoading: isTicketLoading } = useGetTicketSummaryQuery({
    groupBy: ticketGroupBy,
    ...dateRange,
  });
  const { data: userActivity, isLoading: isUserLoading } = useGetUserActivityQuery({
    ...dateRange,
    role: userRoleFilter !== 'all' ? userRoleFilter : undefined,
  });
  const { data: workflowPerformance, isLoading: isWorkflowLoading } = useGetWorkflowPerformanceQuery(dateRange);
  const { data: reviewsAnalytics, isLoading: isReviewsLoading } = useGetReviewsAnalyticsQuery(dateRange);
  const { data: tablesData } = useGetAvailableTablesQuery();
  
  const [executeReport, { isLoading: isExecutingReport }] = useExecuteCustomReportMutation();

  const availableTables = tablesData?.tables ? Object.keys(tablesData.tables) : [];
  const currentTableInfo = baseTable && tablesData?.tables ? tablesData.tables[baseTable] : null;
  
  const allAvailableColumns = useMemo(() => {
    if (!tablesData?.tables) return [];
    const columns: { table: string; column: string }[] = [];
    
    // Add base table columns
    if (baseTable && tablesData.tables[baseTable]) {
      tablesData.tables[baseTable].columns.forEach(col => {
        columns.push({ table: baseTable, column: col });
      });
    }
    
    // Add joined tables columns
    selectedJoins.forEach(joinTable => {
      if (tablesData.tables[joinTable]) {
        tablesData.tables[joinTable].columns.forEach(col => {
          columns.push({ table: joinTable, column: col });
        });
      }
    });
    
    return columns;
  }, [tablesData, baseTable, selectedJoins]);

  const handleExecuteReport = async () => {
    if (!baseTable || selectedColumns.length === 0) {
      toast.error('Please select a base table and at least one column');
      return;
    }
    
    try {
      const result = await executeReport({
        baseTable,
        joins: selectedJoins.length > 0 ? selectedJoins : undefined,
        columns: selectedColumns,
        filters: filters.length > 0 ? filters : undefined,
        orderBy: orderBy.length > 0 ? orderBy : undefined,
        limit: reportLimit,
        offset: 0,
      }).unwrap();
      
      setReportResults(result.rows);
      toast.success(`Report generated with ${result.total} records`);
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to generate report');
    }
  };

  const handleExportCSV = () => {
    if (!reportResults || reportResults.length === 0) return;
    
    const filename = `report_${Date.now()}.csv`;
    exportReportToCSV(reportResults, filename);
    toast.success('Report exported as CSV');
  };

  const handleExportPDF = () => {
    if (!reportResults || reportResults.length === 0) return;

    // Create letterhead HTML
    const letterheadDiv = document.createElement('div');
    const root = document.createElement('div');
    
    // Create table HTML for PDF
    const headers = Object.keys(reportResults[0]);
    const tableHTML = `
      <h2 style="margin-top: 20px; margin-bottom: 15px; font-size: 18px; font-weight: bold;">
        ${activeTab === 'tickets' ? 'Ticket Summary Report' :
          activeTab === 'users' ? 'User Activity Report' :
          activeTab === 'workflows' ? 'Workflow Performance Report' :
          activeTab === 'reviews' ? 'Reviews Analytics Report' :
          'Custom Report'}
      </h2>
      <p style="margin-bottom: 15px; font-size: 12px; color: #666;">
        Date Range: ${dateRange.startDate ? dateRange.startDate : 'All'} to ${dateRange.endDate ? dateRange.endDate : 'All'}
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px;">
        <thead>
          <tr style="background: white; border-bottom: 2px solid black;">
            ${headers.map(h => `<th style="padding: 10px; border: 1px solid black; text-align: left; font-weight: bold;">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${reportResults.map((row, rIdx) => `
            <tr style="background: ${rIdx % 2 === 0 ? 'white' : 'white'};">
              ${headers.map(h => `<td style="padding: 8px; border: 1px solid black; text-align: left;">${row[h] !== null && row[h] !== undefined ? String(row[h]) : '-'}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Create complete print document
    const letterheadHTML = `
      <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">Support Ticket System</h1>
      <p style="font-size: 12px; color: #666; margin-bottom: 5px;">Enterprise Support Management Platform</p>
      <div style="display: flex; justify-content: center; gap: 20px; margin-top: 10px; font-size: 11px; color: #666;">
        <span>📧 support@organization.com</span>
        <span>📞 1-800-SUPPORT</span>
        <span>🌐 www.organization.com</span>
      </div>
    `;

    const fullHTML = createPrintDocument(letterheadHTML, tableHTML, 'Support Ticket Report');
    
    // Open print dialog for PDF export
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(fullHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }

    toast.success('Report ready for PDF export. Use your browser\'s print dialog to save as PDF.');
  };

  const addColumn = (table: string, column: string) => {
    if (selectedColumns.some(c => c.table === table && c.column === column)) return;
    setSelectedColumns([...selectedColumns, { table, column }]);
  };

  const removeColumn = (index: number) => {
    setSelectedColumns(selectedColumns.filter((_, i) => i !== index));
  };

  const addFilter = () => {
    if (allAvailableColumns.length === 0) return;
    const firstCol = allAvailableColumns[0];
    setFilters([...filters, {
      table: firstCol.table,
      column: firstCol.column,
      operator: '=',
      value: '',
    }]);
  };

  const updateFilter = (index: number, updates: Partial<FilterCondition>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Letterhead */}
      <ReportLetterhead
        title="Reports & Analytics"
        generatedBy={currentUser.name}
      />

      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Reports & Analytics
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Generate custom reports and view analytics dashboards
        </p>
      </div>

      {/* Date Range Filter */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-[180px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-[180px]"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setDateRange({
                startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
              })}
            >
              Reset to YTD
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid gap-2 h-auto p-2" style={{ gridTemplateColumns: `repeat(${[canViewTicketReports, canViewUserReports, canViewWorkflowReports, canViewReviewReports, canCreateCustomReports].filter(Boolean).length}, 1fr)` }}>
          {canViewTicketReports && (
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="w-4 h-4" />
              <span className="hidden sm:inline">Tickets</span>
            </TabsTrigger>
          )}
          {canViewUserReports && (
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
          )}
          {canViewWorkflowReports && (
            <TabsTrigger value="workflows" className="gap-2">
              <GitBranch className="w-4 h-4" />
              <span className="hidden sm:inline">Workflows</span>
            </TabsTrigger>
          )}
          {canViewReviewReports && (
            <TabsTrigger value="reviews" className="gap-2">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
          )}
          {canCreateCustomReports && (
            <TabsTrigger value="custom" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Custom</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {isDashboardLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
          ) : dashboardData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tickets Card */}
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Total Tickets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      {dashboardData.tickets?.total || 0}
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge className="bg-blue-100 text-blue-800">
                        {dashboardData.tickets?.open || 0} Open
                      </Badge>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {dashboardData.tickets?.in_progress || 0} In Progress
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Users Card */}
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Total Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      {dashboardData.users?.total || 0}
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge className="bg-green-100 text-green-800">
                        {dashboardData.users?.active || 0} Active
                      </Badge>
                      <Badge className="bg-slate-100 text-slate-800">
                        {dashboardData.users?.inactive || 0} Inactive
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Approvals Card */}
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Total Approvals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      {dashboardData.approvals?.total || 0}
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge className="bg-green-100 text-green-800">
                        {dashboardData.approvals?.approved || 0} Approved
                      </Badge>
                      <Badge className="bg-orange-100 text-orange-800">
                        {dashboardData.approvals?.pending || 0} Pending
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews Card */}
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Customer Reviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {dashboardData.reviews?.average_rating || '0.0'}
                      <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                      Based on {dashboardData.reviews?.total || 0} reviews
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Ticket Trend */}
              {dashboardData.ticketTrend && dashboardData.ticketTrend.length > 0 && (
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Ticket Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end gap-1">
                      {dashboardData.ticketTrend.slice(-30).map((item, index) => {
                        const maxCount = Math.max(...dashboardData.ticketTrend.map(t => parseInt(t.count) || 0));
                        const height = maxCount > 0 ? (parseInt(item.count) / maxCount) * 100 : 0;
                        return (
                          <div
                            key={index}
                            className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={`${item.date}: ${item.count} tickets`}
                          />
                        );
                      })}
                    </div>
                    <p className="text-sm text-slate-500 mt-4 text-center">
                      Last 30 days ticket creation trend
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">
              No dashboard data available
            </div>
          )}
        </TabsContent>

        {/* Tickets Tab */}
        {canViewTicketReports && (
          <TabsContent value="tickets" className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ticket Summary Report</CardTitle>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={ticketGroupBy} onValueChange={(v) => setTicketGroupBy(v as any)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="category">Group by Category</SelectItem>
                      <SelectItem value="status">Group by Status</SelectItem>
                      <SelectItem value="priority">Group by Priority</SelectItem>
                    </SelectContent>
                  </Select>
                  {ticketSummary?.summary && ticketSummary.summary.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const data = ticketSummary.summary.map(row => ({
                            [ticketGroupBy]: row[ticketGroupBy as keyof typeof row] || 'N/A',
                            'Total': row.count,
                            'Open': row.open_count,
                            'In Progress': row.in_progress_count,
                            'Resolved': row.resolved_count,
                            'Closed': row.closed_count,
                          }));
                          exportReportToCSV(data, `ticket-summary-${Date.now()}.csv`);
                          toast.success('Report exported as CSV');
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const headers = [ticketGroupBy, 'Total', 'Open', 'In Progress', 'Resolved', 'Closed'];
                          const tableHTML = `
                            <h2 style="margin-bottom: 15px; font-size: 18px; font-weight: bold;">Ticket Summary Report</h2>
                            <p style="margin-bottom: 15px; font-size: 12px;">Grouped by: ${ticketGroupBy}</p>
                            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px;">
                              <thead>
                                <tr style="background: white; border-bottom: 2px solid black;">
                                  ${headers.map(h => `<th style="padding: 10px; border: 1px solid black; text-align: left; font-weight: bold;">${h}</th>`).join('')}
                                </tr>
                              </thead>
                              <tbody>
                                ${ticketSummary.summary.map((row, idx) => `
                                  <tr style="background: ${idx % 2 === 0 ? 'white' : 'white'};">
                                    <td style="padding: 8px; border: 1px solid black;">${row[ticketGroupBy as keyof typeof row] || 'N/A'}</td>
                                    <td style="padding: 8px; border: 1px solid black; text-align: right;"><strong>${row.count}</strong></td>
                                    <td style="padding: 8px; border: 1px solid black; text-align: right;">${row.open_count}</td>
                                    <td style="padding: 8px; border: 1px solid black; text-align: right;">${row.in_progress_count}</td>
                                    <td style="padding: 8px; border: 1px solid black; text-align: right;">${row.resolved_count}</td>
                                    <td style="padding: 8px; border: 1px solid black; text-align: right;">${row.closed_count}</td>
                                  </tr>
                                `).join('')}
                              </tbody>
                            </table>
                          `;
                          const letterheadHTML = `
                            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">Support Ticket System</h1>
                            <p style="font-size: 12px; color: #666; margin-bottom: 5px;">Enterprise Support Management Platform</p>
                            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 10px; font-size: 11px; color: #666;">
                              <span>📧 support@organization.com</span>
                              <span>📞 1-800-SUPPORT</span>
                              <span>🌐 www.organization.com</span>
                            </div>
                          `;
                          const fullHTML = createPrintDocument(letterheadHTML, tableHTML, 'Ticket Summary Report');
                          const printWindow = window.open('', '', 'width=800,height=600');
                          if (printWindow) {
                            printWindow.document.write(fullHTML);
                            printWindow.document.close();
                            printWindow.focus();
                            setTimeout(() => {
                              printWindow.print();
                              printWindow.close();
                            }, 250);
                          }
                          toast.success('Report ready for PDF export.');
                        }}
                      >
                        <FileJson className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isTicketLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
                </div>
              ) : ticketSummary?.summary && ticketSummary.summary.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="capitalize">{ticketGroupBy}</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Open</TableHead>
                        <TableHead className="text-right">In Progress</TableHead>
                        <TableHead className="text-right">Resolved</TableHead>
                        <TableHead className="text-right">Closed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ticketSummary.summary.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {row[ticketGroupBy as keyof typeof row] || 'N/A'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">{row.count}</TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-blue-100 text-blue-800">{row.open_count}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-yellow-100 text-yellow-800">{row.in_progress_count}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-green-100 text-green-800">{row.resolved_count}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-slate-100 text-slate-800">{row.closed_count}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  No ticket data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* Users Tab */}
        {canViewUserReports && (
          <TabsContent value="users" className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Activity Report</CardTitle>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  {userActivity?.users && userActivity.users.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const data = userActivity.users.map(u => ({
                            'Name': `${u.first_name} ${u.last_name}`,
                            'Email': u.email,
                            'Role': u.role,
                            'Department': u.department || '-',
                            'Tickets Created': u.tickets_created,
                            'Approvals Made': u.approvals_made,
                            'Approved': u.approvals_approved,
                            'Rejected': u.approvals_rejected,
                          }));
                          exportReportToCSV(data, `user-activity-${Date.now()}.csv`);
                          toast.success('Report exported as CSV');
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const headers = ['Name', 'Email', 'Role', 'Department', 'Tickets Created', 'Approvals Made', 'Approved', 'Rejected'];
                          const tableHTML = `
                            <h2 style="margin-bottom: 15px; font-size: 18px; font-weight: bold;">User Activity Report</h2>
                            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px;">
                              <thead>
                                <tr style="background: white; border-bottom: 2px solid black;">
                                  ${headers.map(h => `<th style="padding: 10px; border: 1px solid black; text-align: left; font-weight: bold;">${h}</th>`).join('')}
                                </tr>
                              </thead>
                              <tbody>
                                ${userActivity.users.map((user, idx) => `
                                  <tr style="background: ${idx % 2 === 0 ? 'white' : 'white'};">
                                    <td style="padding: 8px; border: 1px solid black;">${user.first_name} ${user.last_name}</td>
                                    <td style="padding: 8px; border: 1px solid black;">${user.email}</td>
                                    <td style="padding: 8px; border: 1px solid black;">${user.role}</td>
                                    <td style="padding: 8px; border: 1px solid black;">${user.department || '-'}</td>
                                    <td style="padding: 8px; border: 1px solid black; text-align: right;">${user.tickets_created}</td>
                                    <td style="padding: 8px; border: 1px solid black; text-align: right;">${user.approvals_made}</td>
                                    <td style="padding: 8px; border: 1px solid black; text-align: right; color: green;">${user.approvals_approved}</td>
                                    <td style="padding: 8px; border: 1px solid black; text-align: right; color: red;">${user.approvals_rejected}</td>
                                  </tr>
                                `).join('')}
                              </tbody>
                            </table>
                          `;
                          const letterheadHTML = `
                            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">Support Ticket System</h1>
                            <p style="font-size: 12px; color: #666; margin-bottom: 5px;">Enterprise Support Management Platform</p>
                            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 10px; font-size: 11px; color: #666;">
                              <span>📧 support@organization.com</span>
                              <span>📞 1-800-SUPPORT</span>
                              <span>🌐 www.organization.com</span>
                            </div>
                          `;
                          const fullHTML = createPrintDocument(letterheadHTML, tableHTML, 'User Activity Report');
                          const printWindow = window.open('', '', 'width=800,height=600');
                          if (printWindow) {
                            printWindow.document.write(fullHTML);
                            printWindow.document.close();
                            printWindow.focus();
                            setTimeout(() => {
                              printWindow.print();
                              printWindow.close();
                            }, 250);
                          }
                          toast.success('Report ready for PDF export.');
                        }}
                      >
                        <FileJson className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isUserLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
                </div>
              ) : userActivity?.users && userActivity.users.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Tickets Created</TableHead>
                        <TableHead className="text-right">Approvals Made</TableHead>
                        <TableHead className="text-right">Approved</TableHead>
                        <TableHead className="text-right">Rejected</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userActivity.users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.first_name} {user.last_name}</p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="capitalize">{user.role}</Badge>
                          </TableCell>
                          <TableCell>{user.department || '-'}</TableCell>
                          <TableCell className="text-right">{user.tickets_created}</TableCell>
                          <TableCell className="text-right">{user.approvals_made}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-green-600">{user.approvals_approved}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-red-600">{user.approvals_rejected}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  No user activity data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* Workflows Tab */}
        {canViewWorkflowReports && (
          <TabsContent value="workflows" className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Workflow Performance Report</CardTitle>
            </CardHeader>
            <CardContent>
              {isWorkflowLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
                </div>
              ) : workflowPerformance?.performance && workflowPerformance.performance.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Workflow</TableHead>
                        <TableHead>Node</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Pending</TableHead>
                        <TableHead className="text-right">Approved</TableHead>
                        <TableHead className="text-right">Rejected</TableHead>
                        <TableHead className="text-right">Avg Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workflowPerformance.performance.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.workflow_name}</TableCell>
                          <TableCell>{item.node_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.approval_type}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.total_tickets}</TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-orange-100 text-orange-800">{item.pending_count}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-green-100 text-green-800">{item.approved_count}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-red-100 text-red-800">{item.rejected_count}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {parseFloat(item.avg_approval_hours || '0').toFixed(1)}h
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  No workflow performance data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* Reviews Tab */}
        {canViewReviewReports && (
          <TabsContent value="reviews" className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Reviews Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {isReviewsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
                </div>
              ) : reviewsAnalytics ? (
                <div className="space-y-6">
                  {/* Overall Stats */}
                  {reviewsAnalytics.overall && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">
                          {reviewsAnalytics.overall.total_reviews}
                        </p>
                        <p className="text-sm text-slate-500">Total Reviews</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                          {parseFloat(reviewsAnalytics.overall.average_rating || '0').toFixed(1)}
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        </p>
                        <p className="text-sm text-slate-500">Average Rating</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-green-600">
                          {reviewsAnalytics.overall.total_helpful}
                        </p>
                        <p className="text-sm text-slate-500">Helpful Votes</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-red-600">
                          {reviewsAnalytics.overall.total_unhelpful}
                        </p>
                        <p className="text-sm text-slate-500">Unhelpful Votes</p>
                      </div>
                    </div>
                  )}

                  {/* Rating Breakdown */}
                  {reviewsAnalytics.byRating && reviewsAnalytics.byRating.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rating</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                          <TableHead className="text-right">Avg Helpful</TableHead>
                          <TableHead className="text-right">Approved</TableHead>
                          <TableHead className="text-right">Pending</TableHead>
                          <TableHead className="text-right">Rejected</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reviewsAnalytics.byRating.map((item) => (
                          <TableRow key={item.rating}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < item.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-slate-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{item.review_count}</TableCell>
                            <TableCell className="text-right">{parseFloat(item.avg_helpful || '0').toFixed(1)}</TableCell>
                            <TableCell className="text-right">
                              <Badge className="bg-green-100 text-green-800">{item.approved_count}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className="bg-yellow-100 text-yellow-800">{item.pending_count}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className="bg-red-100 text-red-800">{item.rejected_count}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  No reviews analytics available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* Custom Report Tab */}
        {canCreateCustomReports && (
          <TabsContent value="custom" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Builder */}
            <Card className="lg:col-span-1 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Report Builder
                </CardTitle>
                <CardDescription>
                  Select tables, columns, and filters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Base Table */}
                <div className="space-y-2">
                  <Label>Base Table</Label>
                  <Select
                    value={baseTable}
                    onValueChange={(v) => {
                      setBaseTable(v);
                      setSelectedJoins([]);
                      setSelectedColumns([]);
                      setFilters([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTables.map((table) => (
                        <SelectItem key={table} value={table}>
                          {table.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Joins */}
                {baseTable && currentTableInfo?.joinableTables && (
                  <div className="space-y-2">
                    <Label>Join Tables</Label>
                    <div className="flex flex-wrap gap-2">
                      {currentTableInfo.joinableTables.map((table) => (
                        <Badge
                          key={table}
                          variant={selectedJoins.includes(table) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            if (selectedJoins.includes(table)) {
                              setSelectedJoins(selectedJoins.filter(t => t !== table));
                            } else {
                              setSelectedJoins([...selectedJoins, table]);
                            }
                          }}
                        >
                          {table.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Columns */}
                {allAvailableColumns.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Columns</Label>
                    <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
                      {allAvailableColumns.map((col, index) => (
                        <div
                          key={`${col.table}-${col.column}`}
                          className={`text-sm p-1 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ${
                            selectedColumns.some(c => c.table === col.table && c.column === col.column)
                              ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              : ''
                          }`}
                          onClick={() => addColumn(col.table, col.column)}
                        >
                          <span className="text-slate-500">{col.table}.</span>
                          {col.column}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Columns */}
                {selectedColumns.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Columns ({selectedColumns.length})</Label>
                    <div className="flex flex-wrap gap-1">
                      {selectedColumns.map((col, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {col.table}.{col.column}
                          <X
                            className="w-3 h-3 cursor-pointer hover:text-red-500"
                            onClick={() => removeColumn(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Filters</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={addFilter}
                      disabled={allAvailableColumns.length === 0}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {filters.map((filter, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Select
                        value={`${filter.table}.${filter.column}`}
                        onValueChange={(v) => {
                          const [table, column] = v.split('.');
                          updateFilter(index, { table, column });
                        }}
                      >
                        <SelectTrigger className="flex-1 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allAvailableColumns.map((col) => (
                            <SelectItem
                              key={`${col.table}.${col.column}`}
                              value={`${col.table}.${col.column}`}
                            >
                              {col.table}.{col.column}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={filter.operator}
                        onValueChange={(v) => updateFilter(index, { operator: v })}
                      >
                        <SelectTrigger className="w-20 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'ILIKE'].map((op) => (
                            <SelectItem key={op} value={op}>{op}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={filter.value as string || ''}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        className="flex-1 text-xs"
                        placeholder="Value"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFilter(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Limit */}
                <div className="space-y-2">
                  <Label>Limit Results</Label>
                  <Select value={reportLimit.toString()} onValueChange={(v) => setReportLimit(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 rows</SelectItem>
                      <SelectItem value="50">50 rows</SelectItem>
                      <SelectItem value="100">100 rows</SelectItem>
                      <SelectItem value="500">500 rows</SelectItem>
                      <SelectItem value="1000">1000 rows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Execute Button */}
                <Button
                  className="w-full gap-2"
                  onClick={handleExecuteReport}
                  disabled={isExecutingReport || !baseTable || selectedColumns.length === 0}
                >
                  {isExecutingReport ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Run Report
                </Button>
              </CardContent>
            </Card>

            {/* Report Results */}
            <Card className="lg:col-span-2 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>Report Results</CardTitle>
                  {reportResults && reportResults.length > 0 && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleExportPDF}>
                        <FileJson className="w-4 h-4 mr-2" />
                        Export PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExportCSV}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isExecutingReport ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
                  </div>
                ) : reportResults && reportResults.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(reportResults[0]).map((key) => (
                            <TableHead key={key} className="text-xs whitespace-nowrap">
                              {key}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportResults.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {Object.values(row).map((value, colIndex) => (
                              <TableCell key={colIndex} className="text-xs">
                                {value !== null && value !== undefined ? String(value) : '-'}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No report data</p>
                    <p className="text-sm mt-1">
                      Configure your report in the builder and click &quot;Run Report&quot;
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
