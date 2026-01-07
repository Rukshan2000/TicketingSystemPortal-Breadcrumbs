'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Users } from 'lucide-react';
import { Role } from '@/store/services/roleApi';

interface RoleViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
}

export function RoleViewDialog({
  open,
  onOpenChange,
  role,
}: RoleViewDialogProps) {
  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Role Details</DialogTitle>
          <DialogDescription>
            Overview of the {role.name} role
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Role Header */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {role.description}
              </p>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Permissions
            </h4>
            <div className="flex flex-wrap gap-2">
              {role.permissions && role.permissions.length > 0 ? (
                role.permissions.map((permission) => (
                  <Badge key={permission.id} variant="secondary">
                    {permission.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No permissions assigned</p>
              )}
            </div>
          </div>

          {/* Created At */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Users className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Role created</p>
              <p className="font-semibold text-lg text-slate-900 dark:text-white">
                {new Date(role.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Roles in the system are managed through the backend. 
              The available roles are: <Badge variant="outline" className="ml-1">admin</Badge> <Badge variant="outline">user</Badge> <Badge variant="outline">moderator</Badge>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
