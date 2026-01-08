'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { hasPermission } from '@/lib/permissions';
import { useGetTicketApprovalProgressQuery, useGetApprovalProgressSummaryQuery, useGetApprovalProgressSummaryByCustomerQuery } from '@/store/services/approvalProgressApi';
import { useGetTicketsQuery } from '@/store/services/ticketApi';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronDown, X, FileText, GitBranch, CheckCircle, Clock } from 'lucide-react';

interface WorkflowProgress {
  stage_name: string;
  status: 'complete' | 'pending' | 'rejected';
}

export default function ApprovalProgressPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Check permissions
  const canViewAllProgress = hasPermission('view all progress');
  
  // Set default filter mode based on permissions
  const defaultFilterMode = canViewAllProgress ? 'all' : 'my';
  
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  // Fetch tickets with workflows from approval progress summary
  const { data: summaryData, isLoading: summaryLoading } = useGetApprovalProgressSummaryQuery({
    type: 'ticket',
    limit: 100,
    offset: 0,
  });

  // Fetch customer-specific tickets
  const { data: customerData, isLoading: customerLoading } = useGetApprovalProgressSummaryByCustomerQuery(
    { customer_id: user?.id || 0, type: 'ticket', limit: 100, offset: 0 },
    { skip: !user?.id }
  );

  // Fetch approval progress for selected ticket
  const { data: approvalProgressData, isLoading: progressLoading } = useGetTicketApprovalProgressQuery(
    selectedTicketId || 0,
    { skip: !selectedTicketId }
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'complete':
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'in_progress':
      case 'in progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const ticketsWithWorkflows = defaultFilterMode === 'my' 
    ? (customerData?.data || [])
    : (summaryData?.data || []);

  const isLoading = defaultFilterMode === 'my' ? customerLoading : summaryLoading;

  // Filter tickets by approval status
  const approvedTickets = ticketsWithWorkflows.filter(
    (ticket: any) => 
      ticket.approval_status?.toLowerCase() === 'approved' || 
      ticket.status?.toLowerCase() === 'resolved' ||
      ticket.workflow_status?.toLowerCase() === 'completed'
  );

  const pendingTickets = ticketsWithWorkflows.filter(
    (ticket: any) => 
      ticket.approval_status?.toLowerCase() === 'pending' || 
      ticket.approval_status?.toLowerCase() === 'in_progress' ||
      ticket.approval_status?.toLowerCase() === 'in progress' ||
      ticket.status?.toLowerCase() === 'in progress'
  );

  const handleViewProgress = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => setSelectedTicketId(null), 300);
  };

  // Get workflow progress from API data
  const progressData = approvalProgressData?.data;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <GitBranch className="w-8 h-8" />
          Approval Progress
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Track workflow approval progress for tickets
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show:</span>
        <div className="flex gap-2">
          <Button
            variant="default"
            className="transition-all"
          >
            {canViewAllProgress ? 'All Tickets' : 'My Tickets'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500 py-8">Loading tickets with workflows...</div>
      ) : ticketsWithWorkflows.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium">
            {!canViewAllProgress 
              ? 'No tickets created by you with workflows found' 
              : 'No tickets with workflows found'}
          </p>
          <p className="text-sm mt-1">
            {!canViewAllProgress
              ? 'Create tickets and assign workflows to track their approval progress'
              : 'Assign workflows to tickets to track their approval progress'}
          </p>
        </div>
      ) : (
        <div>
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending ({pendingTickets.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Approved ({approvedTickets.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Tab */}
            <TabsContent value="pending" className="mt-6">
              {pendingTickets.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No pending approvals</p>
                  <p className="text-sm mt-1">All tickets have been approved!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingTickets.map((ticket: any) => (
                    <Card
                      key={ticket.id || ticket.ticket_id}
                      className="p-4 cursor-pointer transition-all hover:shadow-lg dark:border-slate-700"
                      onClick={() => handleViewProgress(ticket.id || ticket.ticket_id)}
                    >
                      <div className="space-y-3">
                        {/* Header with Subject and Status */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">
                              {ticket.subject || ticket.trace_no || `Ticket #${ticket.id || ticket.ticket_id}`}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ID: {ticket.id || ticket.ticket_id}
                            </p>
                          </div>
                          <Badge className={getStatusColor(ticket.approval_status || ticket.status)}>
                            {ticket.approval_status || ticket.status}
                          </Badge>
                        </div>

                        {/* Ticket Details */}
                        <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded text-sm space-y-2">
                          {ticket.workflow_name && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Workflow:</span>
                              <span className="font-semibold text-right truncate max-w-[150px]">
                                {ticket.workflow_name}
                              </span>
                            </div>
                          )}
                          {ticket.current_node_name && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Current Stage:</span>
                              <span className="font-semibold text-right">
                                {ticket.current_node_name}
                              </span>
                            </div>
                          )}
                          {ticket.category && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Category:</span>
                              <span className="font-semibold">
                                {ticket.category}
                              </span>
                            </div>
                          )}
                          {ticket.priority && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Priority:</span>
                              <Badge variant={
                                ticket.priority === 'High' ? 'destructive' :
                                ticket.priority === 'Medium' ? 'secondary' :
                                'outline'
                              } className="text-xs">{ticket.priority}</Badge>
                            </div>
                          )}
                        </div>

                        {/* Workflow Progress Preview */}
                        {ticket.workflow_progress && ticket.workflow_progress.length > 0 && (
                          <div className="flex items-center gap-1 overflow-x-auto py-2">
                            {ticket.workflow_progress.map((stage: WorkflowProgress, idx: number) => (
                              <div key={idx} className="flex items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                                  stage.status === 'complete' || stage.status === 'completed' as any
                                    ? 'bg-green-500'
                                    : stage.status === 'rejected'
                                    ? 'bg-red-500'
                                    : 'bg-gray-400'
                                }`}>
                                  {stage.status === 'complete' || stage.status === 'completed' as any ? '✓' : idx + 1}
                                </div>
                                {idx < ticket.workflow_progress.length - 1 && (
                                  <div className={`w-4 h-0.5 ${
                                    stage.status === 'complete' || stage.status === 'completed' as any
                                      ? 'bg-green-500'
                                      : 'bg-gray-300'
                                  }`}></div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Dates */}
                        <div className="text-xs text-gray-500 flex justify-between">
                          <span>
                            Created: {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* View Progress Button */}
                        <button
                          className="w-full mt-3 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                          onClick={() => handleViewProgress(ticket.id || ticket.ticket_id)}
                        >
                          <ChevronDown className="w-4 h-4" /> View Progress
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Approved Tab */}
            <TabsContent value="approved" className="mt-6">
              {approvedTickets.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No approved tickets</p>
                  <p className="text-sm mt-1">Approved tickets will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approvedTickets.map((ticket: any) => (
                    <Card
                      key={ticket.id || ticket.ticket_id}
                      className="p-4 cursor-pointer transition-all hover:shadow-lg border-green-200 dark:border-green-900"
                    >
                      <div className="space-y-3">
                        {/* Header with Subject and Status */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">
                              {ticket.subject || ticket.trace_no || `Ticket #${ticket.id || ticket.ticket_id}`}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ID: {ticket.id || ticket.ticket_id}
                            </p>
                          </div>
                          <Badge className={getStatusColor(ticket.approval_status || ticket.status)}>
                            {ticket.approval_status || ticket.status}
                          </Badge>
                        </div>

                        {/* Ticket Details */}
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm space-y-2">
                          {ticket.workflow_name && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Workflow:</span>
                              <span className="font-semibold text-right truncate max-w-[150px]">
                                {ticket.workflow_name}
                              </span>
                            </div>
                          )}
                          {ticket.current_node_name && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Final Stage:</span>
                              <span className="font-semibold text-right">
                                {ticket.current_node_name}
                              </span>
                            </div>
                          )}
                          {ticket.category && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Category:</span>
                              <span className="font-semibold">
                                {ticket.category}
                              </span>
                            </div>
                          )}
                          {ticket.priority && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Priority:</span>
                              <Badge variant={
                                ticket.priority === 'High' ? 'destructive' :
                                ticket.priority === 'Medium' ? 'secondary' :
                                'outline'
                              } className="text-xs">{ticket.priority}</Badge>
                            </div>
                          )}
                        </div>

                        {/* Workflow Progress Preview */}
                        {ticket.workflow_progress && ticket.workflow_progress.length > 0 && (
                          <div className="flex items-center gap-1 overflow-x-auto py-2">
                            {ticket.workflow_progress.map((stage: WorkflowProgress, idx: number) => (
                              <div key={idx} className="flex items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                                  stage.status === 'complete' || stage.status === 'completed' as any
                                    ? 'bg-green-500'
                                    : stage.status === 'rejected'
                                    ? 'bg-red-500'
                                    : 'bg-gray-400'
                                }`}>
                                  {stage.status === 'complete' || stage.status === 'completed' as any ? '✓' : idx + 1}
                                </div>
                                {idx < ticket.workflow_progress.length - 1 && (
                                  <div className={`w-4 h-0.5 ${
                                    stage.status === 'complete' || stage.status === 'completed' as any
                                      ? 'bg-green-500'
                                      : 'bg-gray-300'
                                  }`}></div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Dates */}
                        <div className="text-xs text-gray-500 flex justify-between">
                          <span>
                            Created: {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* View Progress Button */}
                        <button
                          className="w-full mt-3 bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                          onClick={() => handleViewProgress(ticket.id || ticket.ticket_id)}
                        >
                          <ChevronDown className="w-4 h-4" /> View Details
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Progress Modal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {progressData?.trace_no || progressData?.ticket_id ? `Ticket: ${progressData.trace_no || progressData.ticket_id}` : 'Approval Progress'}
            </DialogTitle>
            <button
              onClick={handleCloseDialog}
              className="absolute right-4 top-4 p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>

          {progressLoading ? (
            <div className="text-center text-gray-500 py-8">Loading progress details...</div>
          ) : !progressData ? (
            <div className="text-center text-gray-500 py-8">No progress data available</div>
          ) : (
            <div className="space-y-6">
              {/* Progress Summary */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overall Status</p>
                    <Badge className={getStatusColor(progressData.workflow_status || progressData.overall_status || 'PENDING')}>
                      {progressData.workflow_status || progressData.overall_status || 'PENDING'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Step</p>
                    <p className="text-lg font-semibold">
                      {progressData.current_step || progressData.current_node_order || 1} / {progressData.total_steps || progressData.steps?.length || progressData.nodes?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completion</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${progressData.completion_percentage || progressData.overall_progress_percentage || 0}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold w-10">
                        {progressData.completion_percentage || progressData.overall_progress_percentage || 0}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Workflow</p>
                    <p className="font-semibold text-sm">
                      {progressData.workflow_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Workflow Progress - Organizational Chart */}
              {progressData.workflow_progress &&
                progressData.workflow_progress.length > 0 && (
                  <div className="border rounded-lg p-6 bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 dark:border-slate-700">
                    <h3 className="text-lg font-bold mb-6">Workflow Structure</h3>
                    <div className="space-y-4">
                      {progressData.workflow_progress.map(
                        (stage: WorkflowProgress, index: number) => (
                          <div key={index}>
                            {/* Node */}
                            <div className="flex items-center gap-4 mb-2">
                              {/* Connector Line (if not first) */}
                              {index > 0 && (
                                <div className="flex flex-col items-center w-12">
                                  <div className="w-0.5 h-6 bg-gray-300 dark:bg-slate-600 mb-2"></div>
                                </div>
                              )}
                              
                              {/* Node Box */}
                              <div className="flex-1 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                                  stage.status.toLowerCase() === 'complete' || stage.status.toLowerCase() === 'completed'
                                    ? 'bg-green-500'
                                    : stage.status.toLowerCase() === 'rejected'
                                    ? 'bg-red-500'
                                    : 'bg-blue-500'
                                }`}>
                                  {stage.status.toLowerCase() === 'complete' || stage.status.toLowerCase() === 'completed'
                                    ? '✓'
                                    : stage.status.toLowerCase() === 'rejected'
                                    ? '✕'
                                    : index + 1}
                                </div>
                                <div className="flex-1 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded-lg p-3 hover:border-blue-400 transition-colors">
                                  <p className="font-semibold text-gray-800 dark:text-white">{stage.stage_name}</p>
                                  <p className={`text-xs font-medium ${
                                    stage.status.toLowerCase() === 'complete' || stage.status.toLowerCase() === 'completed'
                                      ? 'text-green-600'
                                      : stage.status.toLowerCase() === 'rejected'
                                      ? 'text-red-600'
                                      : 'text-yellow-600'
                                  }`}>
                                    {stage.status.toUpperCase()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Approval Steps - Detailed Organizational Chart */}
              {((progressData.steps && progressData.steps.length > 0) || (progressData.nodes && progressData.nodes.length > 0)) && (
                  <div className="border rounded-lg p-6 bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 dark:border-slate-700">
                    <h3 className="text-lg font-bold mb-6">Approval Hierarchy</h3>
                    <div className="space-y-6">
                      {(progressData.steps ?? progressData.nodes ?? []).map((step: any, index: number) => (
                        <div key={index} className="relative">
                          {/* Connector from previous step */}
                          {index > 0 && (
                            <div className="absolute left-6 top-0 w-0.5 h-8 bg-gradient-to-b from-gray-300 to-blue-300 -translate-y-8"></div>
                          )}
                          
                          {/* Main Node */}
                          <div className="border-2 border-blue-400 rounded-lg overflow-hidden bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow">
                            {/* Header */}
                            <div className={`p-4 ${
                              step.status?.toLowerCase() === 'completed'
                                ? 'bg-green-50 dark:bg-green-900/20 border-b-2 border-green-200 dark:border-green-800'
                                : step.status?.toLowerCase() === 'rejected'
                                ? 'bg-red-50 dark:bg-red-900/20 border-b-2 border-red-200 dark:border-red-800'
                                : 'bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-200 dark:border-blue-800'
                            }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                                    step.status?.toLowerCase() === 'completed'
                                      ? 'bg-green-500'
                                      : step.status?.toLowerCase() === 'rejected'
                                      ? 'bg-red-500'
                                      : step.status?.toLowerCase() === 'pending'
                                      ? 'bg-yellow-500'
                                      : 'bg-blue-500'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-bold text-lg text-gray-800 dark:text-white">{step.node_name}</h4>
                                    {step.description && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{step.description}</p>
                                    )}
                                    <div className="flex gap-4 mt-2 text-xs">
                                      <span className="font-semibold text-gray-700 dark:text-gray-300">Type: {step.approval_type}</span>
                                      <span className={`font-semibold ${
                                        step.status?.toLowerCase() === 'completed'
                                          ? 'text-green-600'
                                          : step.status?.toLowerCase() === 'rejected'
                                          ? 'text-red-600'
                                          : step.status?.toLowerCase() === 'pending'
                                          ? 'text-yellow-600'
                                          : 'text-blue-600'
                                      }`}>
                                        {step.status?.toUpperCase() || 'PENDING'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Statistics Bar */}
                            {step.statistics && (
                              <div className="px-4 py-3 border-b bg-gray-50 dark:bg-slate-700/50">
                                <div className="flex items-center justify-between mb-2 text-xs">
                                  <span className="font-semibold">Approvers Progress</span>
                                  <span className="font-bold text-blue-600 dark:text-blue-400">
                                    {step.statistics.approved}/{step.statistics.total_approvers} Approved
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
                                    style={{
                                      width: `${step.statistics.approval_percentage}%`,
                                    }}
                                  ></div>
                                </div>
                                <div className="flex gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                                  <span>✓ Approved: {step.statistics.approved}</span>
                                  <span>⏳ Pending: {step.statistics.pending}</span>
                                  <span>✕ Rejected: {step.statistics.rejected}</span>
                                </div>
                              </div>
                            )}

                            {/* Approvers List */}
                            {step.approvals && step.approvals.length > 0 && (
                              <div className="p-4 space-y-2">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Approvers</p>
                                {step.approvals.map((approval: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className={`p-3 rounded border-l-4 ${
                                      approval.status === 'APPROVED'
                                        ? 'bg-green-50 dark:bg-green-900/20 border-l-green-500'
                                        : approval.status === 'REJECTED'
                                        ? 'bg-red-50 dark:bg-red-900/20 border-l-red-500'
                                        : 'bg-gray-50 dark:bg-slate-700/50 border-l-yellow-500'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                          approval.status === 'APPROVED'
                                            ? 'bg-green-500'
                                            : approval.status === 'REJECTED'
                                            ? 'bg-red-500'
                                            : 'bg-yellow-500'
                                        }`}></div>
                                        <span className="font-semibold text-gray-800 dark:text-white">
                                          {approval.user_name}
                                        </span>
                                      </div>
                                      <Badge className={getStatusColor(approval.status)}>
                                        {approval.status}
                                      </Badge>
                                    </div>
                                    {approval.action_at && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        {new Date(approval.action_at).toLocaleString()}
                                      </p>
                                    )}
                                    {approval.comments && (
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic border-t border-gray-200 dark:border-slate-600 pt-2">
                                        💬 {approval.comments}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
