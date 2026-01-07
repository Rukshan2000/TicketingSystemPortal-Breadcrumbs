'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Check,
  X,
  ClipboardCheck,
  Clock,
  AlertCircle,
  Printer,
  FileText,
  MapPin,
  Calendar,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  useGetPendingReprintApprovalsQuery,
  useGetPendingTicketApprovalsQuery,
  useApproveReprintRequestMutation,
} from '@/store/services/workflowApi';
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

interface PendingApprovalItem {
  // Core IDs
  id: string | number;
  reprint_request_id?: number;
  ticket_id?: number;
  customer_id?: string | number;
  
  // Ticket/Approval Info
  trace_no?: string;
  reason?: string;
  requested_copies?: number;
  notes?: string | null;
  location?: string;
  total_amount?: number;
  ticket_date?: string;
  ticket_time?: string;
  
  // Workflow Info
  node_id?: number;
  node_name?: string;
  node_order?: number;
  approval_type?: 'ALL' | 'ANY';
  workflow_name?: string;
  workflow_id?: string | number;
  current_node_order?: number;
  current_node_name?: string;
  current_node_approval_type?: 'ALL' | 'ANY';
  approval_status?: string;
  
  // User Info
  requested_by_name?: string;
  
  // Ticket Data (from pending approvals API)
  subject?: string;
  description?: string;
  category?: string;
  priority?: string;
  product_id?: string | null;
  order_id?: string;
  attachments?: any[];
  status?: string;
  
  // Dates
  created_at: string;
  updated_at?: string;
}

const REASON_LABELS: Record<string, string> = {
  damaged: 'Damaged Ticket',
  lost: 'Lost Ticket',
  print_error: 'Print Error',
  customer_request: 'Customer Request',
  faded: 'Faded/Unreadable',
  other: 'Other',
};

export default function ApprovalsPage() {
  const [selectedItem, setSelectedItem] = useState<PendingApprovalItem | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');
  const [pendingAction, setPendingAction] = useState<'APPROVE' | 'REJECT' | null>(null);

  const user = useSelector((state: RootState) => state.auth.user);

  // Fetch pending approvals for current user
  const { data: pendingReprintData, isLoading: loadingReprint } = useGetPendingReprintApprovalsQuery(
    { userId: user?.id || 0, limit: 100, offset: 0 },
    { skip: !user?.id }
  );

  const { data: pendingTicketData, isLoading: loadingTicket } = useGetPendingTicketApprovalsQuery(
    { userId: user?.id || 0, limit: 100, offset: 0 },
    { skip: !user?.id }
  );

  const isLoading = loadingReprint || loadingTicket;

  const [approveReprint, { isLoading: isApproving }] = useApproveReprintRequestMutation();

  const pendingReprintApprovals = (pendingReprintData?.data || []) as unknown as PendingApprovalItem[];
  const pendingTicketApprovals = (pendingTicketData?.data || []) as unknown as PendingApprovalItem[];
  const pendingApprovals = [...pendingReprintApprovals, ...pendingTicketApprovals];

  const getReasonLabel = (reason: string) => {
    return REASON_LABELS[reason] || reason;
  };

  const openApprovalDialog = (item: PendingApprovalItem, action?: 'APPROVE' | 'REJECT' | null) => {
    setSelectedItem(item);
    if (action) {
      setPendingAction(action);
      setApprovalComments('');
    } else {
      setPendingAction(null);
      setApprovalComments('');
    }
    setShowApprovalDialog(true);
  };

  const handleApproval = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedItem || !user?.id) return;

    try {
      const result = await approveReprint({
        reprintId: selectedItem.reprint_request_id || (selectedItem.id as number),
        data: {
          user_id: user.id,
          action: action,
          comments: approvalComments || undefined,
        },
      }).unwrap();

      setShowApprovalDialog(false);
      setSelectedItem(null);
      setPendingAction(null);
      setApprovalComments('');

      // Show result message
      if (result.data?.ticket_status === 'APPROVED') {
        alert('Request has been fully approved!');
      } else if (result.data?.ticket_status === 'REJECTED') {
        alert('Request has been rejected.');
      } else if (result.data?.moved_to_next_node) {
        alert(`Approved! Moved to next stage: ${result.data.next_node?.name}`);
      } else {
        alert(`Your ${action.toLowerCase()} has been recorded.`);
      }
    } catch (error: any) {
      console.error('Failed to process approval:', error);
      alert(error?.data?.message || 'Failed to process approval. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8" />
          My Approvals
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Review and approve requests assigned to you
        </p>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingApprovals.length}</p>
                <p className="text-sm text-slate-500">Pending Approvals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>
            These requests are waiting for your approval at the current workflow stage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
          ) : pendingApprovals.length > 0 ? (
            <div className="space-y-4">
              {pendingApprovals.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Request Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="gap-1">
                          {item.reprint_request_id ? (
                            <>
                              <Printer className="w-3 h-3" />
                              Reprint Request
                            </>
                          ) : (
                            <>
                              <FileText className="w-3 h-3" />
                              Ticket
                            </>
                          )}
                        </Badge>
                        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono">
                          {item.trace_no || item.subject || `ID: ${item.id}`}
                        </code>
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.approval_status || 'Pending'}
                        </Badge>
                      </div>

                      {/* Subject/Description for Tickets */}
                      {item.subject && (
                        <div className="text-sm">
                          <span className="font-semibold text-slate-900 dark:text-white">{item.subject}</span>
                        </div>
                      )}
                      {item.description && (
                        <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                          {item.description.length > 150 ? `${item.description.substring(0, 150)}...` : item.description}
                        </div>
                      )}

                      {/* Requesting User */}
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>Requested by: <span className="font-medium text-slate-900 dark:text-white">{item.requested_by_name || 'Unknown'}</span></span>
                      </div>

                      {/* Core Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                        {item.category && (
                          <div className="flex gap-1.5 text-slate-600 dark:text-slate-400">
                            <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div className="text-xs flex-1">
                              <p className="text-slate-500">Category</p>
                              <p className="font-semibold text-slate-900 dark:text-white">{item.category}</p>
                            </div>
                          </div>
                        )}
                        {item.priority && (
                          <div className="flex gap-1.5 text-slate-600 dark:text-slate-400">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div className="text-xs flex-1">
                              <p className="text-slate-500">Priority</p>
                              <Badge variant={
                                item.priority === 'High' ? 'destructive' :
                                item.priority === 'Medium' ? 'secondary' :
                                'outline'
                              } className="text-xs">{item.priority}</Badge>
                            </div>
                          </div>
                        )}
                        {item.reason && (
                          <div className="flex gap-1.5 text-slate-600 dark:text-slate-400">
                            <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div className="text-xs flex-1">
                              <p className="text-slate-500">Reason</p>
                              <p className="font-semibold text-slate-900 dark:text-white">{getReasonLabel(item.reason)}</p>
                            </div>
                          </div>
                        )}
                        {item.requested_copies && (
                          <div className="flex gap-1.5 text-slate-600 dark:text-slate-400">
                            <Printer className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div className="text-xs flex-1">
                              <p className="text-slate-500">Copies</p>
                              <p className="font-semibold text-slate-900 dark:text-white">{item.requested_copies}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex gap-1.5 text-slate-600 dark:text-slate-400">
                          <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div className="text-xs flex-1">
                            <p className="text-slate-500">Date</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{new Date(item.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {item.total_amount ? (
                          <div className="flex gap-1.5 text-slate-600 dark:text-slate-400">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div className="text-xs flex-1">
                              <p className="text-slate-500">Amount</p>
                              <p className="font-semibold text-green-600 dark:text-green-400">LKR {item.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {/* Location */}
                      {item.location && (
                        <div className="flex items-center gap-2 text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                          <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <span className="text-slate-600 dark:text-slate-400">Location: <span className="font-medium text-slate-900 dark:text-white">{item.location}</span></span>
                        </div>
                      )}

                      {/* Workflow Info */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700 flex-wrap">
                        <span className="font-medium text-slate-900 dark:text-white">{item.workflow_name || 'Workflow'}</span>
                        <ChevronRight className="w-3 h-3" />
                        <Badge variant="secondary" className="text-xs">
                          Stage {item.node_order || item.current_node_order || 1}: {item.node_name || item.current_node_name || 'N/A'}
                        </Badge>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600 dark:text-slate-400">{(item.approval_type || item.current_node_approval_type) === 'ALL' ? 'All must approve' : 'Any can approve'}</span>
                      </div>

                      {/* Notes */}
                      {item.notes && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Notes:</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{item.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 w-full gap-2"
                        onClick={() => openApprovalDialog(item, null as any)}
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <ClipboardCheck className="w-16 h-16 mb-4 text-slate-300" />
              <p className="text-lg font-medium">No pending approvals</p>
              <p className="text-sm mt-1">You&apos;re all caught up! Check back later.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingAction === 'APPROVE' ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : pendingAction === 'REJECT' ? (
                <X className="w-5 h-5 text-red-600" />
              ) : (
                <Eye className="w-5 h-5 text-blue-600" />
              )}
              {pendingAction === 'APPROVE' ? 'Approve Request' : pendingAction === 'REJECT' ? 'Reject Request' : 'Approval Details'}
            </DialogTitle>
            {pendingAction && (
              <DialogDescription>
                Review the complete ticket details before making your decision
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {/* Approval Request Details */}
              <div className="space-y-4">
                {/* Request Type & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Type</p>
                    <div className="flex items-center gap-2">
                      {selectedItem.reprint_request_id ? (
                        <>
                          <Printer className="w-4 h-4 text-slate-600" />
                          <span className="text-sm font-semibold">Reprint Request</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 text-slate-600" />
                          <span className="text-sm font-semibold">Ticket</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Trace/Subject</p>
                    <code className="text-sm font-mono font-semibold">{selectedItem.trace_no || selectedItem.subject}</code>
                  </div>
                </div>

                {/* Requester Info */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Requested By</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedItem.requested_by_name || 'Unknown'}</p>
                </div>

                {/* Approval Request Details Grid */}
                {(selectedItem.reason || selectedItem.requested_copies || selectedItem.location) && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    {selectedItem.reason && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Reason</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{getReasonLabel(selectedItem.reason)}</p>
                      </div>
                    )}
                    {selectedItem.requested_copies && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Copies</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedItem.requested_copies}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Request Date</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{new Date(selectedItem.created_at).toLocaleDateString()}</p>
                    </div>
                    {selectedItem.total_amount && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Amount</p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">LKR {selectedItem.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Location */}
                {selectedItem.location && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Location</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedItem.location}</p>
                  </div>
                )}

                {/* Workflow Stage Info */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-2">Current Workflow Stage</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{selectedItem.workflow_name || selectedItem.current_node_name}</Badge>
                    <ChevronRight className="w-3 h-3" />
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                      {selectedItem.node_name || selectedItem.current_node_name} (Stage {selectedItem.node_order || selectedItem.current_node_order})
                    </Badge>
                    <span className="text-xs text-slate-600 dark:text-slate-400">•</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">{(selectedItem.approval_type || selectedItem.current_node_approval_type) === 'ALL' ? 'All must approve' : 'Any can approve'}</span>
                  </div>
                </div>

                {/* Request Notes */}
                {selectedItem.notes && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Request Notes</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{selectedItem.notes}</p>
                  </div>
                )}
              </div>

              {/* Full Ticket Data Section */}
              {(selectedItem.subject || selectedItem.description) && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Ticket Details
                  </h3>
                  
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    {/* Ticket Header */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                      {selectedItem.subject && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Subject</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white break-words">{selectedItem.subject}</p>
                        </div>
                      )}
                      {selectedItem.category && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Category</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedItem.category}</p>
                        </div>
                      )}
                      {selectedItem.priority && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Priority</p>
                          <Badge variant={
                            selectedItem.priority === 'High' ? 'destructive' :
                            selectedItem.priority === 'Medium' ? 'secondary' :
                            'outline'
                          }>{selectedItem.priority}</Badge>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {selectedItem.description && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1.5">Description</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 break-words whitespace-pre-wrap bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                          {selectedItem.description}
                        </p>
                      </div>
                    )}

                    {/* Additional Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      {selectedItem.status && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Status</p>
                          <Badge>{selectedItem.status}</Badge>
                        </div>
                      )}
                      {selectedItem.customer_id && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Customer ID</p>
                          <code className="text-sm font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{selectedItem.customer_id}</code>
                        </div>
                      )}
                      {selectedItem.order_id && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Order ID</p>
                          <code className="text-sm font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{selectedItem.order_id || 'N/A'}</code>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Created</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{new Date(selectedItem.created_at).toLocaleDateString()}</p>
                      </div>
                      {selectedItem.updated_at && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Updated</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{new Date(selectedItem.updated_at).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {/* Attachments */}
                    {selectedItem.attachments && selectedItem.attachments.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 mb-2">Attachments ({selectedItem.attachments.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedItem.attachments.map((att: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">{att.name || `File ${idx + 1}`}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comments - Always visible for approval */}
              <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4">
                <Label htmlFor="approval-comments">Your Comments {!pendingAction ? <span className="text-gray-400 text-xs">(optional)</span> : <span className="text-red-500">*</span>}</Label>
                <Textarea
                  id="approval-comments"
                  placeholder={pendingAction === 'REJECT' 
                    ? "Please provide a reason for rejection..." 
                    : "Add any comments before approving or rejecting..."
                  }
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Close
            </Button>
            <Button
              onClick={() => handleApproval('REJECT')}
              disabled={isApproving}
              variant="destructive"
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Reject
            </Button>
            <Button
              onClick={() => handleApproval('APPROVE')}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
