'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generateTicketPrintTemplate, getReasonLabel as getReason } from '@/lib/templates/reprintRequestPrintTemplate';
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Check, 
  X, 
  Printer,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  GitBranch,
  History,
} from 'lucide-react';
import { 
  useGetReprintRequestsQuery, 
  useUpdateReprintRequestStatusMutation,
  ReprintRequest 
} from '@/store/services/reprintRequestApi';
import {
  useGetWorkflowsQuery,
  useInitializeReprintWorkflowMutation,
  useApproveReprintRequestMutation,
  useGetReprintApprovalsQuery,
} from '@/store/services/workflowApi';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    icon: XCircle,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    icon: CheckCircle,
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

const REASON_LABELS: Record<string, string> = {
  damaged: 'Damaged Ticket',
  lost: 'Lost Ticket',
  print_error: 'Print Error',
  customer_request: 'Customer Request',
  faded: 'Faded/Unreadable',
  other: 'Other',
};

export default function ReprintRequestsPage() {
  const getReasonLabel = (reason: string) => getReason(reason);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ReprintRequest | null>(null);
  const [mobileDisplayCount, setMobileDisplayCount] = useState(10);
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [approvalComments, setApprovalComments] = useState('');
  const [pendingAction, setPendingAction] = useState<'APPROVE' | 'REJECT' | null>(null);

  const user = useSelector((state: RootState) => state.auth.user);

  const { data: requestsData, isLoading } = useGetReprintRequestsQuery({
    limit: 500,
    offset: 0,
  });

  const { data: workflowsData } = useGetWorkflowsQuery({ active: true });
  
  const [updateStatus, { isLoading: isUpdating }] = useUpdateReprintRequestStatusMutation();
  const [initializeWorkflow, { isLoading: isInitializing }] = useInitializeReprintWorkflowMutation();
  const [approveReprint, { isLoading: isApproving }] = useApproveReprintRequestMutation();

  // Get approval history for selected request
  const { data: approvalHistoryData, isLoading: loadingHistory } = useGetReprintApprovalsQuery(
    selectedRequest?.id || 0,
    { skip: !selectedRequest?.id || !showHistoryDialog }
  );

  const workflows = workflowsData?.data || [];

  const requests = useMemo(() => requestsData?.data || [], [requestsData?.data]);

  // Filter requests by status
  const filteredRequests = useMemo(() => {
    let result = [...requests];
    
    if (statusFilter !== 'all') {
      result = result.filter(req => req.status === statusFilter);
    }

    // Sort by created_at descending
    return result.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [requests, statusFilter]);

  // Paginate filtered results
  const paginatedRequests = useMemo(() => {
    return filteredRequests.slice(offset, offset + limit);
  }, [filteredRequests, offset, limit]);

  // Mobile requests with "show more"
  const mobileRequests = useMemo(() => {
    return filteredRequests.slice(0, mobileDisplayCount);
  }, [filteredRequests, mobileDisplayCount]);

  const hasMoreMobileRequests = mobileDisplayCount < filteredRequests.length;

  const loadMoreMobile = () => {
    setMobileDisplayCount((prev) => Math.min(prev + 10, filteredRequests.length));
  };

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      completed: requests.filter(r => r.status === 'completed').length,
    };
  }, [requests]);

  const handleStatusUpdate = async (id: number, newStatus: 'approved' | 'rejected' | 'completed') => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  // Initialize workflow for a request
  const handleInitializeWorkflow = async () => {
    if (!selectedRequest || !selectedWorkflowId) return;
    try {
      await initializeWorkflow({
        reprintId: selectedRequest.id,
        data: { workflow_id: parseInt(selectedWorkflowId) },
      }).unwrap();
      setShowWorkflowDialog(false);
      setSelectedWorkflowId('');
      alert('Workflow initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize workflow:', error);
      alert('Failed to initialize workflow. Please try again.');
    }
  };

  // Handle workflow-based approval
  const openApprovalDialog = (request: ReprintRequest, action: 'APPROVE' | 'REJECT') => {
    setSelectedRequest(request);
    setPendingAction(action);
    setApprovalComments('');
    setShowApprovalDialog(true);
  };

  const handleWorkflowApproval = async () => {
    if (!selectedRequest || !pendingAction || !user?.id) return;
    try {
      const result = await approveReprint({
        reprintId: selectedRequest.id,
        data: {
          user_id: user.id,
          action: pendingAction,
          comments: approvalComments || undefined,
        },
      }).unwrap();
      
      setShowApprovalDialog(false);
      setSelectedRequest(null);
      setPendingAction(null);
      setApprovalComments('');
      
      // Show result message
      if (result.data.ticket_status === 'APPROVED') {
        alert('Request has been fully approved!');
      } else if (result.data.ticket_status === 'REJECTED') {
        alert('Request has been rejected.');
      } else if (result.data.moved_to_next_node) {
        alert(`Approved! Moved to next stage: ${result.data.next_node?.name}`);
      } else {
        alert(`Approval recorded. Waiting for ${result.data.node_status.total_required - result.data.node_status.approved_count} more approval(s).`);
      }
    } catch (error: any) {
      console.error('Failed to process approval:', error);
      alert(error?.data?.message || 'Failed to process approval. Please try again.');
    }
  };

  // Open approval history
  const openHistoryDialog = (request: ReprintRequest) => {
    setSelectedRequest(request);
    setShowHistoryDialog(true);
  };

  // Open print dialog
  const openPrintDialog = (request: ReprintRequest) => {
    setSelectedRequest(request);
    setShowPrintDialog(true);
  };

  const handlePrevious = () => {
    if (offset >= limit) {
      setOffset(offset - limit);
    }
  };

  const handleNext = () => {
    if (offset + limit < filteredRequests.length) {
      setOffset(offset + limit);
    }
  };

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(filteredRequests.length / limit);

  const getDisplayStatus = (request: ReprintRequest): StatusKey => {
    // If approval_status exists, map it to display status
    if ((request as any).approval_status === 'APPROVED') {
      return 'approved';
    }
    if ((request as any).approval_status === 'REJECTED') {
      return 'rejected';
    }
    return (request.status as StatusKey);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Reprint Requests
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Manage and process ticket reprint requests
        </p>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => { setStatusFilter('all'); setOffset(0); }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium">All</span>
            </div>
            <p className="text-2xl font-bold mt-1">{statusCounts.all}</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => { setStatusFilter('pending'); setOffset(0); }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold mt-1">{statusCounts.pending}</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === 'approved' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => { setStatusFilter('approved'); setOffset(0); }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Approved</span>
            </div>
            <p className="text-2xl font-bold mt-1">{statusCounts.approved}</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => { setStatusFilter('rejected'); setOffset(0); }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">Rejected</span>
            </div>
            <p className="text-2xl font-bold mt-1">{statusCounts.rejected}</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === 'completed' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => { setStatusFilter('completed'); setOffset(0); }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <p className="text-2xl font-bold mt-1">{statusCounts.completed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">
              Reprint Requests
              <span className="text-slate-500 font-normal ml-2">
                ({filteredRequests.length}{statusFilter !== 'all' ? ` ${statusFilter}` : ''})
              </span>
            </CardTitle>
            <div className="hidden md:block text-sm text-slate-500">
              Page {currentPage} of {totalPages || 1}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
          ) : filteredRequests.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {mobileRequests.map((request) => {
                  const displayStatus = getDisplayStatus(request);
                  const StatusIcon = STATUS_CONFIG[displayStatus].icon;
                  return (
                    <div
                      key={request.id}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded font-mono truncate">
                              {request.trace_no}
                            </code>
                            <Badge className={STATUS_CONFIG[displayStatus].color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {STATUS_CONFIG[displayStatus].label}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                            {getReasonLabel(request.reason)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(request.created_at).toLocaleDateString()} • {request.requested_copies} copies
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => openHistoryDialog(request)}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        {getDisplayStatus(request) === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowWorkflowDialog(true);
                            }}
                            title="Start Workflow"
                          >
                            <GitBranch className="w-4 h-4" />
                          </Button>
                        )}
                        {getDisplayStatus(request) === 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => openPrintDialog(request)}
                          >
                            <Printer className="w-4 h-4" />
                            Print
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Show More Button */}
                {hasMoreMobileRequests && (
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={loadMoreMobile}
                    >
                      Show More ({filteredRequests.length - mobileDisplayCount} remaining)
                    </Button>
                  </div>
                )}

                <p className="text-center text-xs text-slate-500 pt-2">
                  Showing {mobileRequests.length} of {filteredRequests.length} requests
                </p>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead className="font-semibold">ID</TableHead>
                      <TableHead className="font-semibold">Trace No</TableHead>
                      <TableHead className="font-semibold">Reason</TableHead>
                      <TableHead className="font-semibold">Copies</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Requested</TableHead>
                      <TableHead className="font-semibold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRequests.map((request) => {
                      const displayStatus = getDisplayStatus(request);
                      const StatusIcon = STATUS_CONFIG[displayStatus].icon;
                      return (
                        <TableRow key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <TableCell className="font-medium">#{request.id}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono">
                              {request.trace_no}
                            </code>
                          </TableCell>
                          <TableCell className="text-sm">{getReasonLabel(request.reason)}</TableCell>
                          <TableCell className="text-sm font-medium">{request.requested_copies}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_CONFIG[displayStatus].color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {STATUS_CONFIG[displayStatus].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {new Date(request.created_at).toLocaleDateString()}{' '}
                            {new Date(request.created_at).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedRequest(request)}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openHistoryDialog(request)}
                                title="View Approval History"
                              >
                                <History className="w-4 h-4" />
                              </Button>
                              {getDisplayStatus(request) === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowWorkflowDialog(true);
                                  }}
                                  title="Start Approval Workflow"
                                >
                                  <GitBranch className="w-4 h-4" />
                                </Button>
                              )}
                              {getDisplayStatus(request) === 'approved' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openPrintDialog(request)}
                                  title="Print Ticket">
                                  <Printer className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Desktop Pagination */}
              <div className="hidden md:flex items-center justify-between mt-6">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {offset + 1} to {Math.min(offset + limit, filteredRequests.length)} of {filteredRequests.length} requests
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={offset === 0 || isLoading}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={offset + limit >= filteredRequests.length || isLoading}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Items per page selector */}
              <div className="hidden md:flex mt-4 items-center gap-2 text-sm">
                <label className="text-slate-600 dark:text-slate-400">Items per page:</label>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setOffset(0);
                  }}
                  className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">No reprint requests found</p>
                <p className="text-sm mt-1">
                  {statusFilter !== 'all' 
                    ? `No ${statusFilter} requests at the moment` 
                    : 'No reprint requests have been submitted yet'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Detail Modal */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Reprint Request Details
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Request ID</span>
                <span className="font-semibold">#{selectedRequest.id}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Trace Number</p>
                <code className="text-sm font-mono font-semibold">{selectedRequest.trace_no}</code>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <Badge className={STATUS_CONFIG[getDisplayStatus(selectedRequest)].color}>
                  {STATUS_CONFIG[getDisplayStatus(selectedRequest)].label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Reason</p>
                  <p className="text-sm font-medium">{getReasonLabel(selectedRequest.reason)}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Copies Requested</p>
                  <p className="text-lg font-bold">{selectedRequest.requested_copies}</p>
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Notes</p>
                  <p className="text-sm">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.location && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Ticket Location</p>
                  <p className="text-sm font-medium">{selectedRequest.location}</p>
                </div>
              )}

              {selectedRequest.total_amount && (
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-xs text-green-600 dark:text-green-400 mb-1">Ticket Amount</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    LKR {selectedRequest.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Requested At</p>
                <p className="text-sm font-medium">
                  {new Date(selectedRequest.created_at).toLocaleDateString()}{' '}
                  {new Date(selectedRequest.created_at).toLocaleTimeString()}
                </p>
              </div>

              {selectedRequest.approved_at && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">
                    {selectedRequest.status === 'rejected' ? 'Rejected' : 'Approved'} At
                  </p>
                  <p className="text-sm font-medium">
                    {new Date(selectedRequest.approved_at).toLocaleDateString()}{' '}
                    {new Date(selectedRequest.approved_at).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Close
            </Button>
            {selectedRequest && getDisplayStatus(selectedRequest) === 'approved' && (
              <Button
                onClick={() => openPrintDialog(selectedRequest)}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Ticket
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Initialize Workflow Dialog */}
      <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Start Approval Workflow
            </DialogTitle>
            <DialogDescription>
              Select a workflow to process this reprint request through an approval hierarchy
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Request</p>
                <p className="font-medium">#{selectedRequest.id} - {selectedRequest.trace_no}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {getReasonLabel(selectedRequest.reason)} • {selectedRequest.requested_copies} copies
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workflow-select">Select Workflow</Label>
                <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
                  <SelectTrigger id="workflow-select">
                    <SelectValue placeholder="Choose a workflow..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.map((workflow) => (
                      <SelectItem key={workflow.id} value={workflow.id.toString()}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {workflows.length === 0 && (
                  <p className="text-sm text-amber-600">
                    No active workflows available. Create a workflow first.
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWorkflowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInitializeWorkflow}
              disabled={!selectedWorkflowId || isInitializing}
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <GitBranch className="w-4 h-4 mr-2" />
                  Start Workflow
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingAction === 'APPROVE' ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <X className="w-5 h-5 text-red-600" />
              )}
              {pendingAction === 'APPROVE' ? 'Approve Request' : 'Reject Request'}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === 'APPROVE' 
                ? 'Confirm your approval for this reprint request'
                : 'Confirm rejection of this reprint request'}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Request</p>
                <p className="font-medium">#{selectedRequest.id} - {selectedRequest.trace_no}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {getReasonLabel(selectedRequest.reason)} • {selectedRequest.requested_copies} copies
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approval-comments">Comments (Optional)</Label>
                <Textarea
                  id="approval-comments"
                  placeholder="Add any comments about your decision..."
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleWorkflowApproval}
              disabled={isApproving}
              variant={pendingAction === 'REJECT' ? 'destructive' : 'default'}
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : pendingAction === 'APPROVE' ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Approval History
            </DialogTitle>
            <DialogDescription>
              View the approval workflow progress and history
            </DialogDescription>
          </DialogHeader>
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            </div>
          ) : approvalHistoryData?.data ? (
            <div className="space-y-4">
              {/* Current Status */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="mb-3">
                  <p className="text-xs text-slate-500 mb-1">Approval Status</p>
                  <Badge className={`
                    ${approvalHistoryData.data.approval_status === 'APPROVED' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                      : approvalHistoryData.data.approval_status === 'REJECTED'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}
                  `}>
                    {approvalHistoryData.data.approval_status}
                  </Badge>
                </div>
                {approvalHistoryData.data.current_node ? (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 mb-1">Current Stage</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{approvalHistoryData.data.current_node.name}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="text-slate-600 dark:text-slate-400">
                        <span className="font-medium">{approvalHistoryData.data.current_node.approved_count} / {approvalHistoryData.data.current_node.total_required}</span> approvals
                      </p>
                      <p className="text-xs text-slate-500">
                        {approvalHistoryData.data.current_node.total_required - approvalHistoryData.data.current_node.approved_count} pending • 
                        {approvalHistoryData.data.current_node.approval_type === 'ALL' ? 'All required' : 'Any one required'}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Approval Timeline */}
              {approvalHistoryData.data.history && approvalHistoryData.data.history.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Approval Timeline</h4>
                  <div className="space-y-2">
                    {approvalHistoryData.data.history.map((item: any, index: number) => (
                      <div 
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          item.status === 'APPROVED' 
                            ? 'bg-green-100 text-green-600' 
                            : item.status === 'REJECTED'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {item.status === 'APPROVED' ? (
                            <Check className="w-4 h-4" />
                          ) : item.status === 'REJECTED' ? (
                            <X className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-1">
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">
                              {item.user_name || 'Unknown User'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Stage {item.node_order}: {item.node_name}
                              </Badge>
                              <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {item.status}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            {item.approved_at ? new Date(item.approved_at).toLocaleString() : 'Pending'}
                          </p>
                          {item.comments && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 italic border-l-2 border-slate-300 dark:border-slate-600 pl-2">
                              &quot;{item.comments}&quot;
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500">
                  <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>No approval history yet</p>
                </div>
              )}
            </div>
          ) : !approvalHistoryData?.data ? (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-medium">No workflow assigned</p>
              <p className="text-sm mt-1">Start an approval workflow to begin the approval process</p>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="w-[95vw] h-screen max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Print Reprint Request
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              {/* Print Preview in iframe */}
              <iframe
                id="print-preview-frame"
                srcDoc={generateTicketPrintTemplate(selectedRequest)}
                className="w-full h-[600px] border border-slate-300 rounded-lg"
                title="Print Preview"
              />

              {/* Print Instructions */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Tip:</strong> Use the &ldquo;Print Document&rdquo; button below or your browser&apos;s print function (Ctrl+P or Cmd+P) to print or save as PDF.
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedRequest) {
                  const printWindow = window.open('', '', 'width=900,height=700');
                  if (printWindow) {
                    printWindow.document.write(generateTicketPrintTemplate(selectedRequest));
                    printWindow.document.close();
                    setTimeout(() => {
                      printWindow.focus();
                      printWindow.print();
                    }, 250);
                  }
                }
              }}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
