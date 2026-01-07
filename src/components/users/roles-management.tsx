'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetRolesQuery, useDeleteRoleMutation } from '@/store/services/roleApi';
import { Loader2, Trash2, Edit2, Plus, Eye, MoreHorizontal, Shield, FileText } from 'lucide-react';
import { RoleFormDialog } from './role-form-dialog';
import { RoleViewDialog } from './role-view-dialog';
import { Role } from '@/store/services/roleApi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function RolesManagement() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [mobileDisplayCount, setMobileDisplayCount] = useState(10);

  const { data: rolesData, isLoading, isError } = useGetRolesQuery({
    limit,
    offset,
  });

  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();

  const roles = useMemo(() => rolesData?.data || [], [rolesData?.data]);
  const total = rolesData?.pagination.total || 0;

  // Mobile roles with "show more"
  const mobileRoles = useMemo(() => {
    return roles.slice(0, mobileDisplayCount);
  }, [roles, mobileDisplayCount]);

  const hasMoreMobileRoles = mobileDisplayCount < roles.length;

  const loadMoreMobile = () => {
    setMobileDisplayCount((prev) => Math.min(prev + 10, roles.length));
  };

  const handleDelete = async (roleId: number) => {
    if (confirm('Are you sure you want to delete this role?')) {
      try {
        await deleteRole(roleId).unwrap();
      } catch (error) {
        console.error('Failed to delete role:', error);
      }
    }
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleView = (role: Role) => {
    setSelectedRole(role);
    setIsViewOpen(true);
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setIsFormOpen(true);
  };

  const handleFormSave = () => {
    setIsFormOpen(false);
    setSelectedRole(null);
  };

  if (isError) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Error Loading Roles</CardTitle>
          <CardDescription>Failed to load roles. Please try again.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6">
          <div>
            <CardTitle className="text-base sm:text-lg">Roles Management</CardTitle>
            <CardDescription className="text-sm">Manage system roles and permissions</CardDescription>
          </div>
          <Button onClick={handleCreate} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            New Role
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : roles.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {mobileRoles.map((role) => (
                  <div
                    key={role.id}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {role.description || 'No description'}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="flex-shrink-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleView(role)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(role)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(role.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Permissions
                        </span>
                        <Badge variant={role.is_active ? 'default' : 'secondary'} className="text-xs">
                          {role.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {role.permissions.slice(0, 2).map((perm) => (
                          <Badge key={perm.id} variant="secondary" className="text-xs">
                            {perm.name}
                          </Badge>
                        ))}
                        {role.permissions.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 2} more
                          </Badge>
                        )}
                        {role.permissions.length === 0 && (
                          <span className="text-xs text-slate-400">No permissions</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Show More Button */}
                {hasMoreMobileRoles && (
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={loadMoreMobile}
                    >
                      Show More ({roles.length - mobileDisplayCount} remaining)
                    </Button>
                  </div>
                )}

                {/* Mobile count info */}
                <p className="text-center text-xs text-slate-500 pt-2">
                  Showing {mobileRoles.length} of {roles.length} roles
                </p>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">
                          {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {role.description || 'No description'}
                        </TableCell>
                        {/* <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {role.permissions.slice(0, 3).map((perm) => (
                              <Badge key={perm.id} variant="secondary" className="text-xs">
                                {perm.name}
                              </Badge>
                            ))}
                            {role.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell> */}
                        <TableCell>
                          <Badge variant={role.is_active ? 'default' : 'secondary'}>
                            {role.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleView(role)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(role)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(role.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Desktop Pagination */}
              <div className="hidden md:flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} roles
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(offset + limit)}
                    disabled={offset + limit >= total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No roles found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <RoleFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        role={selectedRole}
        onSave={handleFormSave}
      />

      <RoleViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        role={selectedRole}
      />
    </>
  );
}
