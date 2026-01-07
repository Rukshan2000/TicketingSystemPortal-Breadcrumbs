'use client';

import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ChevronLeft, ChevronRight, Plus, X, Filter, Eye, MapPin, Calendar, Clock, Printer, Check, GitBranch, Edit, Trash2, Star, MoreHorizontal } from 'lucide-react';
import { useGetTicketsQuery, Ticket, useUpdateTicketMutation, useDeleteTicketMutation, useGetTicketsByCustomerQuery } from '@/store/services/ticketApi';
import { useCreateReprintRequestMutation } from '@/store/services/reprintRequestApi';
import { useGetWorkflowsQuery, useInitializeTicketWorkflowMutation } from '@/store/services/workflowApi';
import { ReviewDialog } from '@/components/tickets/review-dialog';
import { ReviewDisplay } from '@/components/tickets/review-display';
import { hasPermission } from '@/lib/permissions';
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
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Filter field options
const FILTER_FIELDS = [
  { value: 'subject', label: 'Subject', type: 'string' },
  { value: 'category', label: 'Category', type: 'string' },
  { value: 'priority', label: 'Priority', type: 'string' },
  { value: 'status', label: 'Status', type: 'string' },
  { value: 'customer_id', label: 'Customer ID', type: 'number' },
  { value: 'product_id', label: 'Product ID', type: 'number' },
  { value: 'order_id', label: 'Order ID', type: 'string' },
  { value: 'created_at', label: 'Created Date', type: 'date' },
];

// Operators based on field type
const STRING_OPERATORS = [
  { value: 'equals', label: 'is' },
  { value: 'not_equals', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
];

const NUMBER_OPERATORS = [
  { value: 'equals', label: '=' },
  { value: 'not_equals', label: '≠' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'greater_equal', label: 'greater or equal' },
  { value: 'less_than', label: 'less than' },
  { value: 'less_equal', label: 'less or equal' },
];

const DATE_OPERATORS = [
  { value: 'equals', label: 'is' },
  { value: 'not_equals', label: 'is not' },
  { value: 'before', label: 'before' },
  { value: 'after', label: 'after' },
];

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export default function TicketsPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [mobileDisplayCount, setMobileDisplayCount] = useState(10);
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'my'>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [editTicket, setEditTicket] = useState<Ticket | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [deleteTicket, setDeleteTicket] = useState<Ticket | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isReprintDialogOpen, setIsReprintDialogOpen] = useState(false);
  const [reprintTicket, setReprintTicket] = useState<Ticket | null>(null);
  const [reprintReason, setReprintReason] = useState('');
  const [reprintCopies, setReprintCopies] = useState(1);
  const [reprintNotes, setReprintNotes] = useState('');
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [workflowTicket, setWorkflowTicket] = useState<Ticket | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewTicket, setReviewTicket] = useState<Ticket | null>(null);

  // Check permissions
  const canViewAllTickets = hasPermission('view all tickets');
  const canUpdateTicket = hasPermission('update ticket');
  const canDeleteTicket = hasPermission('delete ticket');
  const canAssignWorkflow = hasPermission('assign workflow to ticket');
  const canAddReviews = hasPermission('add reviews');

  // Set default filter mode based on permissions
  const defaultFilterMode = canViewAllTickets ? 'all' : 'my';

  // New filter state
  const [newFilterField, setNewFilterField] = useState('');
  const [newFilterOperator, setNewFilterOperator] = useState('');
  const [newFilterValue, setNewFilterValue] = useState('');

  const { data: ticketsData, isLoading } = useGetTicketsQuery({
    limit: 500, // Fetch more for client-side filtering
    offset: 0,
  });

  const { data: customerTicketsData, isLoading: isLoadingCustomerTickets } = useGetTicketsByCustomerQuery(
    { customer_id: user?.id || 0, limit: 500, offset: 0 },
    { skip: !user?.id }
  );

  const ticketsData_toUse = defaultFilterMode === 'my' ? customerTicketsData : ticketsData;
  const isLoading_final = defaultFilterMode === 'my' ? isLoadingCustomerTickets : isLoading;

  const { data: workflowsData } = useGetWorkflowsQuery({ active: true });
  const [initializeWorkflow, { isLoading: isInitializingWorkflow }] = useInitializeTicketWorkflowMutation();

  const [requestReprint, { isLoading: isReprintLoading }] = useCreateReprintRequestMutation();
  const [updateTicketMutation, { isLoading: isUpdatingTicket }] = useUpdateTicketMutation();
  const [deleteTicketMutation, { isLoading: isDeletingTicket }] = useDeleteTicketMutation();

  const tickets = useMemo(() => ticketsData_toUse?.data || [], [ticketsData_toUse?.data]);

  // Get operators based on field type
  const getOperatorsForField = (fieldValue: string) => {
    const field = FILTER_FIELDS.find((f) => f.value === fieldValue);
    if (!field) return STRING_OPERATORS;
    
    switch (field.type) {
      case 'number':
        return NUMBER_OPERATORS;
      case 'date':
        return DATE_OPERATORS;
      default:
        return STRING_OPERATORS;
    }
  };

  // Apply filter condition to ticket
  const applyFilter = (ticket: Ticket, filter: FilterCondition): boolean => {
    const field = FILTER_FIELDS.find((f) => f.value === filter.field);
    if (!field) return true;

    const ticketValue = ticket[filter.field as keyof Ticket];
    const filterValue = filter.value;

    if (ticketValue === undefined || ticketValue === null) return false;

    // String operations
    if (field.type === 'string') {
      const strValue = String(ticketValue).toLowerCase();
      const strFilter = filterValue.toLowerCase();

      switch (filter.operator) {
        case 'equals':
          return strValue === strFilter;
        case 'not_equals':
          return strValue !== strFilter;
        case 'contains':
          return strValue.includes(strFilter);
        case 'not_contains':
          return !strValue.includes(strFilter);
        case 'starts_with':
          return strValue.startsWith(strFilter);
        case 'ends_with':
          return strValue.endsWith(strFilter);
        default:
          return true;
      }
    }

    // Number operations
    if (field.type === 'number') {
      const numValue = Number(ticketValue);
      const numFilter = Number(filterValue);

      if (isNaN(numFilter)) return true;

      switch (filter.operator) {
        case 'equals':
          return numValue === numFilter;
        case 'not_equals':
          return numValue !== numFilter;
        case 'greater_than':
          return numValue > numFilter;
        case 'greater_equal':
          return numValue >= numFilter;
        case 'less_than':
          return numValue < numFilter;
        case 'less_equal':
          return numValue <= numFilter;
        default:
          return true;
      }
    }

    // Date operations
    if (field.type === 'date') {
      const dateValue = new Date(String(ticketValue)).getTime();
      const dateFilter = new Date(filterValue).getTime();

      if (isNaN(dateFilter)) return true;

      switch (filter.operator) {
        case 'equals':
          return String(ticketValue) === filterValue;
        case 'not_equals':
          return String(ticketValue) !== filterValue;
        case 'before':
          return dateValue < dateFilter;
        case 'after':
          return dateValue > dateFilter;
        default:
          return true;
      }
    }

    return true;
  };

  // Filter and sort tickets
  const filteredTickets = useMemo(() => {
    let result = [...tickets];

    // Apply all filters
    if (filters.length > 0) {
      result = result.filter((ticket) =>
        filters.every((filter) => applyFilter(ticket, filter))
      );
    }

    // Sort by created_at in descending order
    return result.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [tickets, filters]);

  // Paginate filtered results
  const paginatedTickets = useMemo(() => {
    return filteredTickets.slice(offset, offset + limit);
  }, [filteredTickets, offset, limit]);

  // Mobile tickets with "show more"
  const mobileTickets = useMemo(() => {
    return filteredTickets.slice(0, mobileDisplayCount);
  }, [filteredTickets, mobileDisplayCount]);

  const hasMoreMobileTickets = mobileDisplayCount < filteredTickets.length;

  const loadMoreMobile = () => {
    setMobileDisplayCount((prev) => Math.min(prev + 10, filteredTickets.length));
  };

  const addFilter = () => {
    if (!newFilterField || !newFilterOperator || !newFilterValue) return;

    const newFilter: FilterCondition = {
      id: Date.now().toString(),
      field: newFilterField,
      operator: newFilterOperator,
      value: newFilterValue,
    };

    setFilters([...filters, newFilter]);
    setNewFilterField('');
    setNewFilterOperator('');
    setNewFilterValue('');
    setOffset(0); // Reset to first page when adding filter
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
    setOffset(0); // Reset to first page when removing filter
  };

  const clearAllFilters = () => {
    setFilters([]);
    setOffset(0);
    setMobileDisplayCount(10);
  };

  const getFieldLabel = (fieldValue: string) => {
    return FILTER_FIELDS.find((f) => f.value === fieldValue)?.label || fieldValue;
  };

  const getOperatorLabel = (fieldValue: string, operatorValue: string) => {
    const operators = getOperatorsForField(fieldValue);
    return operators.find((o) => o.value === operatorValue)?.label || operatorValue;
  };

  const handlePrevious = () => {
    if (offset >= limit) {
      setOffset(offset - limit);
    }
  };

  const handleNext = () => {
    if (offset + limit < filteredTickets.length) {
      setOffset(offset + limit);
    }
  };

  const handleReprintSubmit = async () => {
    if (!reprintTicket) return;

    try {
      await requestReprint({
        ticket_id: reprintTicket.id,
        trace_no: `TICKET-${reprintTicket.id}`,
        reason: reprintReason,
        requested_copies: reprintCopies,
        notes: reprintNotes || undefined,
      }).unwrap();

      alert('Reprint request submitted successfully!');
      setIsReprintDialogOpen(false);
      setReprintTicket(null);
      setReprintReason('');
      setReprintCopies(1);
      setReprintNotes('');
    } catch (error) {
      console.error('Failed to submit reprint request:', error);
      alert('Failed to submit reprint request. Please try again.');
    }
  };

  const handleEditSubmit = async () => {
    if (!editTicket) return;

    try {
      await updateTicketMutation({
        ticketId: editTicket.id,
        data: {
          ...(editStatus && { status: editStatus as 'Open' | 'In Progress' | 'Resolved' | 'Closed' }),
          ...(editPriority && { priority: editPriority as 'Low' | 'Medium' | 'High' | 'Critical' }),
        },
      }).unwrap();

      alert('Ticket updated successfully!');
      setEditTicket(null);
      setEditStatus('');
      setEditPriority('');
    } catch (error) {
      console.error('Failed to update ticket:', error);
      alert('Failed to update ticket. Please try again.');
    }
  };

  const handleDeleteTicket = async () => {
    if (!deleteTicket) return;

    try {
      await deleteTicketMutation(deleteTicket.id).unwrap();

      alert('Ticket deleted successfully!');
      setShowDeleteConfirm(false);
      setDeleteTicket(null);
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      alert('Failed to delete ticket. Please try again.');
    }
  };

  const openReprintDialog = (ticket: Ticket) => {
    setReprintTicket(ticket);
    setReprintReason('');
    setReprintCopies(1);
    setReprintNotes('');
    setIsReprintDialogOpen(true);
  };

  const handleInitializeWorkflow = async () => {
    if (!workflowTicket || !selectedWorkflowId) return;
    try {
      await initializeWorkflow({
        ticketId: workflowTicket.id,
        data: { workflow_id: parseInt(selectedWorkflowId) },
      }).unwrap();
      setIsWorkflowDialogOpen(false);
      setWorkflowTicket(null);
      setSelectedWorkflowId('');
      alert('Workflow assigned successfully!');
    } catch (error) {
      console.error('Failed to assign workflow:', error);
      alert('Failed to assign workflow. Please try again.');
    }
  };

  const openWorkflowDialog = (ticket: Ticket) => {
    setWorkflowTicket(ticket);
    setSelectedWorkflowId('');
    setIsWorkflowDialogOpen(true);
  };

  const openReviewDialog = (ticket: Ticket) => {
    setReviewTicket(ticket);
    setIsReviewDialogOpen(true);
  };

  const workflows = workflowsData?.data || [];

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(filteredTickets.length / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Tickets Management
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          View and manage all scanned tickets
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show:</span>
        <div className="flex gap-2">
          <Button
            variant="default"
            className="transition-all"
          >
            {canViewAllTickets ? 'All Tickets' : 'My Tickets'}
          </Button>
        </div>
      </div>

      {/* Filter Builder */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
            <div className="flex items-center gap-2">
              {filters.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear all
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterBuilder(!showFilterBuilder)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Active Filters */}
          {filters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Badge
                  key={filter.id}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                >
                  <span className="font-medium">{getFieldLabel(filter.field)}</span>
                  <span className="mx-1.5 text-blue-500">{getOperatorLabel(filter.field, filter.operator)}</span>
                  <span className="font-semibold">&quot;{filter.value}&quot;</span>
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="ml-2 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Filter Builder */}
          {showFilterBuilder && (
            <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              {/* Field Select */}
              <div className="space-y-1.5 min-w-[180px]">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Field
                </label>
                <Select value={newFilterField} onValueChange={(val) => {
                  setNewFilterField(val);
                  setNewFilterOperator('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_FIELDS.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Operator Select */}
              <div className="space-y-1.5 min-w-[150px]">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Operator
                </label>
                <Select
                  value={newFilterOperator}
                  onValueChange={setNewFilterOperator}
                  disabled={!newFilterField}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {getOperatorsForField(newFilterField).map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value Input */}
              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Value
                </label>
                <Input
                  placeholder="Enter value..."
                  type={
                    FILTER_FIELDS.find((f) => f.value === newFilterField)?.type === 'date'
                      ? 'date'
                      : FILTER_FIELDS.find((f) => f.value === newFilterField)?.type === 'number'
                      ? 'number'
                      : 'text'
                  }
                  value={newFilterValue}
                  onChange={(e) => setNewFilterValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addFilter();
                    }
                  }}
                  disabled={!newFilterOperator}
                />
              </div>

              {/* Add Button */}
              <Button
                onClick={addFilter}
                disabled={!newFilterField || !newFilterOperator || !newFilterValue}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>

              {/* Cancel Button */}
              <Button
                variant="ghost"
                onClick={() => {
                  setShowFilterBuilder(false);
                  setNewFilterField('');
                  setNewFilterOperator('');
                  setNewFilterValue('');
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Filter Summary */}
          {filters.length === 0 && !showFilterBuilder && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No filters applied. Click &quot;Add filter&quot; to filter tickets.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">
              {canViewAllTickets ? 'All Tickets' : 'My Tickets'} 
              <span className="text-slate-500 font-normal ml-2">
                ({filteredTickets.length}{filters.length > 0 ? ' filtered' : ''})
              </span>
            </CardTitle>
            <div className="hidden md:block text-sm text-slate-500">
              Page {currentPage} of {totalPages || 1}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {isLoading_final ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
          ) : filteredTickets.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {mobileTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{ticket.subject}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ticket.description}</p>
                      </div>
                      <Badge className={`flex-shrink-0 ${
                        ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                        ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="bg-white dark:bg-slate-700 p-2 rounded">
                        <p className="text-gray-600 dark:text-gray-400">Category</p>
                        <p className="font-semibold">{ticket.category}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-700 p-2 rounded">
                        <p className="text-gray-600 dark:text-gray-400">Priority</p>
                        <p className={`font-semibold ${
                          ticket.priority === 'Critical' ? 'text-red-600' :
                          ticket.priority === 'High' ? 'text-orange-600' :
                          ticket.priority === 'Medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {ticket.priority}
                        </p>
                      </div>
                    </div>
                    {ticket.order_id && (
                      <p className="text-xs text-slate-500 mb-3">Order: {ticket.order_id}</p>
                    )}
                    <p className="text-xs text-slate-400 mb-3">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      {(ticket.status === 'Resolved' || ticket.status === 'Closed') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2 hover:bg-yellow-50 hover:border-yellow-300"
                          onClick={() => openReviewDialog(ticket)}
                        >
                          <Star className="w-4 h-4" />
                          Rate
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => openWorkflowDialog(ticket)}
                      >
                        <GitBranch className="w-4 h-4" />
                        Workflow
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => {
                          setEditTicket(ticket);
                          setEditStatus(ticket.status);
                          setEditPriority(ticket.priority);
                        }}
                      >
                        <Check className="w-4 h-4" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Show More Button */}
                {hasMoreMobileTickets && (
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={loadMoreMobile}
                    >
                      Show More ({filteredTickets.length - mobileDisplayCount} remaining)
                    </Button>
                  </div>
                )}

                {/* Mobile count info */}
                <p className="text-center text-xs text-slate-500 pt-2">
                  Showing {mobileTickets.length} of {filteredTickets.length} tickets
                </p>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead className="font-semibold">Subject</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Priority</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Created At</TableHead>
                      <TableHead className="font-semibold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTickets.map((ticket) => (
                      <TableRow key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="font-semibold truncate">{ticket.subject}</p>
                            <p className="text-xs text-slate-500 truncate">{ticket.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{ticket.category}</TableCell>
                        <TableCell className="text-sm">
                          <Badge className={
                            ticket.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                            ticket.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                            ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge className={
                            ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                            ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                            ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 min-w-[120px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTicket(ticket)}
                              title="View Details"
                              className="flex-shrink-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canAddReviews && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openReviewDialog(ticket)}
                                title="Rate Ticket"
                                className={`hover:text-yellow-600 flex-shrink-0 ${!(ticket.status === 'Resolved' || ticket.status === 'Closed') ? 'opacity-30 cursor-not-allowed' : ''}`}
                                disabled={!(ticket.status === 'Resolved' || ticket.status === 'Closed')}
                              >
                                <Star className="w-4 h-4" />
                              </Button>
                            )}
                            {canAssignWorkflow && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openWorkflowDialog(ticket)}
                                title="Assign Workflow"
                                className="flex-shrink-0"
                              >
                                <GitBranch className="w-4 h-4" />
                              </Button>
                            )}
                            {(canUpdateTicket || canDeleteTicket) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="More Actions"
                                    className="flex-shrink-0"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {canUpdateTicket && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditTicket(ticket);
                                        setEditStatus(ticket.status);
                                        setEditPriority(ticket.priority);
                                      }}
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  {canDeleteTicket && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setDeleteTicket(ticket);
                                        setShowDeleteConfirm(true);
                                      }}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Desktop Pagination */}
              <div className="hidden md:flex items-center justify-between mt-6">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {offset + 1} to {Math.min(offset + limit, filteredTickets.length)} of {filteredTickets.length} tickets
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={offset === 0 || isLoading_final}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={offset + limit >= filteredTickets.length || isLoading_final}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Items per page selector - Desktop only */}
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
              {filters.length > 0 ? (
                <div className="text-center">
                  <p className="text-lg font-medium">No tickets match your filters</p>
                  <p className="text-sm mt-1">Try adjusting or removing some filters</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4" 
                    onClick={clearAllFilters}
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-lg font-medium">No tickets available</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Ticket Details
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="max-h-[600px] overflow-y-auto">
              <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Subject</p>
                <p className="text-sm font-semibold">{selectedTicket.subject}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Description</p>
                <p className="text-sm">{selectedTicket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Category</p>
                  <p className="text-sm font-medium">{selectedTicket.category}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Priority</p>
                  <Badge className={
                    selectedTicket.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                    selectedTicket.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                    selectedTicket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }>
                    {selectedTicket.priority}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <Badge className={
                    selectedTicket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                    selectedTicket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                    selectedTicket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {selectedTicket.status}
                  </Badge>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Customer ID</p>
                  <p className="text-sm font-medium">{selectedTicket.customer_id}</p>
                </div>
              </div>

              {selectedTicket.product_id && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Product ID</p>
                  <p className="text-sm font-medium">{selectedTicket.product_id}</p>
                </div>
              )}

              {selectedTicket.order_id && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Order ID</p>
                  <p className="text-sm font-medium">{selectedTicket.order_id}</p>
                </div>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Created At</p>
                <p className="text-sm font-medium">
                  {new Date(selectedTicket.created_at).toLocaleDateString()}{' '}
                  {new Date(selectedTicket.created_at).toLocaleTimeString()}
                </p>
              </div>

              {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-2">Attachments</p>
                  <div className="space-y-1">
                    {selectedTicket.attachments.map((attachment, idx) => (
                      <p key={idx} className="text-xs truncate">
                        📎 {(attachment as any).filename}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Display for Resolved/Closed Tickets */}
              {(selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed') && (
                <ReviewDisplay ticketId={selectedTicket.id} />
              )}
            </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSelectedTicket(null)}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Close
            </Button>
            {selectedTicket && canAddReviews && (selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed') && (
              <Button
                onClick={() => {
                  openReviewDialog(selectedTicket);
                  setSelectedTicket(null);
                }}
                className="gap-2 bg-yellow-600 hover:bg-yellow-700"
              >
                <Star className="w-4 h-4" />
                Rate Ticket
              </Button>
            )}
             {canAssignWorkflow && (
            <Button
              onClick={() => {
                if (selectedTicket) openWorkflowDialog(selectedTicket);
              }}
              className="gap-2"
            >
              <GitBranch className="w-4 h-4" />
              Assign Workflow
            </Button>
          )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Ticket Modal */}
      <Dialog open={!!editTicket} onOpenChange={() => setEditTicket(null)}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Update Ticket
            </DialogTitle>
          </DialogHeader>
          {editTicket && (
            <div className="space-y-4">
              {/* Ticket Info Summary */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Subject</p>
                <p className="text-sm font-semibold">{editTicket.subject}</p>
                <p className="text-xs text-slate-500 mt-2">ID: {editTicket.id}</p>
              </div>

              {/* Edit Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={editPriority} onValueChange={setEditPriority}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEditTicket(null)}
              disabled={isReprintLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={isUpdatingTicket}
              className="gap-2"
            >
              {isUpdatingTicket ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Update
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reprint Request Dialog */}
      <Dialog open={isReprintDialogOpen} onOpenChange={setIsReprintDialogOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Request Reprint
            </DialogTitle>
          </DialogHeader>
          {reprintTicket && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Ticket Subject</p>
                <p className="text-sm font-semibold">{reprintTicket.subject}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for Reprint</label>
                <input
                  type="text"
                  placeholder="e.g., Damaged copy, Additional copy needed"
                  value={reprintReason}
                  onChange={(e) => setReprintReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Copies</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={reprintCopies}
                  onChange={(e) => setReprintCopies(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Notes (Optional)</label>
                <textarea
                  placeholder="Any additional information..."
                  value={reprintNotes}
                  onChange={(e) => setReprintNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-sm resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsReprintDialogOpen(false)}
              disabled={isReprintLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReprintSubmit}
              disabled={isReprintLoading}
              className="gap-2"
            >
              {isReprintLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow Assignment Dialog */}
      <Dialog open={isWorkflowDialogOpen} onOpenChange={setIsWorkflowDialogOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Assign Workflow
            </DialogTitle>
          </DialogHeader>
          {workflowTicket && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Ticket Subject</p>
                <p className="text-sm font-semibold">{workflowTicket.subject}</p>
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
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsWorkflowDialogOpen(false)}
              disabled={isInitializingWorkflow}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInitializeWorkflow}
              disabled={!selectedWorkflowId || isInitializingWorkflow}
              className="gap-2"
            >
              {isInitializingWorkflow ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <GitBranch className="w-4 h-4" />
                  Assign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Ticket
            </DialogTitle>
          </DialogHeader>
          {deleteTicket && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Are you sure you want to delete this ticket? This action cannot be undone.
              </p>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Ticket Subject</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{deleteTicket.subject}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">ID</p>
                  <p className="text-sm font-medium">{deleteTicket.id}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Category</p>
                  <p className="text-sm font-medium">{deleteTicket.category}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteTicket(null);
              }}
              disabled={isDeletingTicket}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteTicket}
              disabled={isDeletingTicket}
              variant="destructive"
              className="gap-2"
            >
              {isDeletingTicket ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      {reviewTicket && (
        <ReviewDialog
          open={isReviewDialogOpen}
          onClose={() => {
            setIsReviewDialogOpen(false);
            setReviewTicket(null);
          }}
          ticketId={reviewTicket.id}
          customerId={reviewTicket.customer_id}
          ticketTitle={reviewTicket.subject}
        />
      )}
    </div>
  );
}
