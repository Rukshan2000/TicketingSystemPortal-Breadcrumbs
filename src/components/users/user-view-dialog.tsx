'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { User } from './users-list';
import { Mail, Phone, Building, Calendar, Clock, Shield } from 'lucide-react';

interface UserViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function UserViewDialog({
  open,
  onOpenChange,
  user,
}: UserViewDialogProps) {
  if (!user) return null;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.first_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                {user.first_name} {user.last_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getRoleBadgeVariant(String(user.role))}>
                  {user.role}
                </Badge>
                <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                  {user.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="grid gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <Mail className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {user.email}
                </p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <Phone className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {user.phone}
                  </p>
                </div>
              </div>
            )}

            {user.department && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <Building className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Department</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {user.department}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <Shield className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Role</p>
                <p className="font-medium text-slate-900 dark:text-white capitalize">
                  {user.role}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <Calendar className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Created</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <Clock className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Updated</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {new Date(user.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
