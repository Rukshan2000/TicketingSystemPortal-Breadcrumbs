'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useCreateRoleMutation, useUpdateRoleMutation, useGetPermissionsQuery, Role, Permission } from '@/store/services/roleApi';

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  onSave: () => void;
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  onSave,
}: RoleFormDialogProps) {
  // Fetch permissions from API
  const { data: permissionsData, isLoading: permissionsLoading } = useGetPermissionsQuery({
    limit: 100,
    offset: 0,
  });

  const permissions = permissionsData?.data || [];
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    permissions: number[];
    is_active: boolean;
  }>({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions?.map((p) => p.id) || [],
    is_active: role?.is_active ?? true,
  });

  // Update permissions when role changes (for editing)
  useEffect(() => {
    if (open && role) {
      setFormData((prev) => ({
        ...prev,
        name: role.name,
        description: role.description,
        permissions: role.permissions?.map((p) => p.id) || [],
        is_active: role.is_active,
      }));
    } else if (open && !role) {
      // Reset form when creating a new role
      setFormData({
        name: '',
        description: '',
        permissions: [],
        is_active: true,
      });
    }
  }, [open, role]);

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();

  const isLoading = isCreating || isUpdating || permissionsLoading;
  const isEditing = !!role;

  const handlePermissionToggle = (permissionId: number) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Role name is required');
      return;
    }

    try {
      if (isEditing && role) {
        await updateRole({
          roleId: role.id,
          data: {
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions,
            is_active: formData.is_active,
          },
        }).unwrap();
      } else {
        await createRole({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          is_active: formData.is_active,
        }).unwrap();
      }

      onSave();
      onOpenChange(false);
      setFormData({
        name: '',
        description: '',
        permissions: [],
        is_active: true,
      });
    } catch (error) {
      console.error('Failed to save role:', error);
      alert('Failed to save role. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update role details and permissions' : 'Create a new role and assign permissions'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Name */}
          <div className="space-y-2">
            <Label htmlFor="role-name">Role Name *</Label>
            <Input
              id="role-name"
              placeholder="e.g., supervisor, manager"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isLoading || isEditing}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="role-description">Description</Label>
            <Textarea
              id="role-description"
              placeholder="Describe the purpose of this role"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <Label>Permissions</Label>
            <div className="space-y-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-800 max-h-96 overflow-y-auto">
              {permissionsLoading ? (
                <div className="text-sm text-slate-500">Loading permissions...</div>
              ) : permissions.length > 0 ? (
                permissions.map((permission: any) => (
                  <div key={permission.id} className="space-y-2">
                    {/* Parent Category Name */}
                    <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                      {permission.name.charAt(0).toUpperCase() + permission.name.slice(1)}
                    </h4>
                    
                    {/* Child Permissions */}
                    <div className="space-y-2 pl-4 border-l-2 border-slate-300 dark:border-slate-600">
                      {permission.children && permission.children.length > 0 ? (
                        permission.children.map((child: any) => (
                          <div key={child.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`permission-${child.id}`}
                              checked={formData.permissions.includes(child.id)}
                              onCheckedChange={() => handlePermissionToggle(child.id)}
                              disabled={isLoading}
                            />
                            <label
                              htmlFor={`permission-${child.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {child.name.charAt(0).toUpperCase() + child.name.slice(1)}
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500">No permissions available</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">No permissions available</div>
              )}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked === true })
              }
              disabled={isLoading}
            />
            <label
              htmlFor="is-active"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Active
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

