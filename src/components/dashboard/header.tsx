'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '@/store';
import { logout } from '@/store/features/authSlice';
import { Bell, Search, LogOut, ClipboardCheck, ChevronRight, Loader2, Clock, Printer, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGetPendingReprintApprovalsQuery, useGetPendingTicketApprovalsQuery } from '@/store/services/workflowApi';

interface PendingApprovalItem {
  id: number;
  reprint_request_id: number;
  trace_no: string;
  reason: string;
  node_name: string;
  workflow_name: string;
  created_at: string;
}

export function Header() {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Fetch pending approvals for current user
  const { data: pendingReprintData, isLoading: loadingReprintApprovals, error: reprintError } = useGetPendingReprintApprovalsQuery(
    { userId: user?.id || 0, limit: 20, offset: 0 },
    { skip: !user?.id, pollingInterval: 30000 } // Poll every 30 seconds
  );

  const { data: pendingTicketData, isLoading: loadingTicketApprovals, error: ticketError } = useGetPendingTicketApprovalsQuery(
    { userId: user?.id || 0, limit: 20, offset: 0 },
    { skip: !user?.id, pollingInterval: 30000 } // Poll every 30 seconds
  );

  const pendingReprintApprovals = (pendingReprintData?.data || []) as unknown as PendingApprovalItem[];
  const pendingTicketApprovals = (pendingTicketData?.data || []) as unknown as PendingApprovalItem[];
  const allPendingApprovals = [...pendingReprintApprovals, ...pendingTicketApprovals];
  const pendingCount = allPendingApprovals.length;
  const isLoading = loadingReprintApprovals || loadingTicketApprovals;
  const hasError = reprintError || ticketError;

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const handleViewAllApprovals = () => {
    setNotificationOpen(false);
    router.push('/dashboard/approvals');
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      damaged: 'Damaged',
      lost: 'Lost',
      print_error: 'Print Error',
      customer_request: 'Customer Request',
      faded: 'Faded',
      other: 'Other',
    };
    return labels[reason] || reason;
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-6">
      <div className="hidden md:flex items-center flex-1 max-w-2xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search..."
            className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        {/* Notifications Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          onClick={() => setNotificationOpen(true)}
        >
          <Bell className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </Button>

        {/* Notifications Drawer */}
        <Sheet open={notificationOpen} onOpenChange={setNotificationOpen}>
          <SheetContent side="right" className="w-full sm:w-96 p-0">
            <SheetHeader className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </SheetTitle>
                {pendingCount > 0 && (
                  <Badge className="bg-red-500 text-white">
                    {pendingCount} pending
                  </Badge>
                )}
              </div>
              <SheetDescription>
                Pending approvals that require your attention
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="h-[calc(100vh-180px)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : hasError ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 px-4">
                  <AlertCircle className="w-12 h-12 mb-4 text-slate-300" />
                  <p className="font-medium text-center">Failed to load approvals</p>
                  <p className="text-sm text-slate-400 mt-1">Please refresh the page</p>
                </div>
              ) : allPendingApprovals.length > 0 ? (
                <div className="p-2 space-y-2">
                  {allPendingApprovals.map((item) => (
                    <div
                      key={`${item.id}-${item.reprint_request_id}`}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={handleViewAllApprovals}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900">
                          <Printer className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">Approval Needed</span>
                            <Badge variant="outline" className="text-xs">
                              {getReasonLabel(item.reason)}
                            </Badge>
                          </div>
                          <p className="text-sm font-mono text-slate-600 dark:text-slate-400 truncate">
                            {item.trace_no}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                            <ClipboardCheck className="w-3 h-3" />
                            <span>{item.workflow_name}</span>
                            <ChevronRight className="w-3 h-3" />
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              {item.node_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <ClipboardCheck className="w-12 h-12 mb-4 text-slate-300" />
                  <p className="font-medium">No pending approvals</p>
                  <p className="text-sm text-slate-400 mt-1">You&apos;re all caught up!</p>
                </div>
              )}
            </ScrollArea>

            {allPendingApprovals.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                <Button 
                  className="w-full" 
                  onClick={handleViewAllApprovals}
                >
                  View All Approvals
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {user?.role || 'user'}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer">
                {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-sm">
                {user?.email}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm capitalize">
                Role: {user?.role}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
