'use client';

import { useState, useEffect, useMemo } from 'react';
import { userApi } from '@/store/services/userApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Mail,
  Building,
  Calendar,
} from 'lucide-react';
import { UserFormDialog } from './user-form-dialog';
import { UserViewDialog } from './user-view-dialog';



export interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: number | string;
  status: string;
  phone?: string;
  department?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [mobileDisplayCount, setMobileDisplayCount] = useState(10);

  // API hooks
  const [createUser, { isLoading: isCreating }] = userApi.useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = userApi.useUpdateUserMutation();
  const [deleteUserMutation] = userApi.useDeleteUserMutation();
  const { data: usersData, isLoading } = userApi.useGetUsersQuery({
    limit: 100,
    offset: 0,
  });

  // Populate users from API
  useEffect(() => {
    if (usersData?.data) {
      const mappedUsers = usersData.data.map((user) => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        department: user.department,
        is_verified: user.is_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }));
      setUsers(mappedUsers);
    }
  }, [usersData]);

  const filteredUsers = users.filter(
    (user) =>
      `${user.first_name} ${user.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof user.role === 'string'
        ? user.role
        : String(user.role)
      )
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mobile users with "show more"
  const mobileUsers = useMemo(() => {
    return filteredUsers.slice(0, mobileDisplayCount);
  }, [filteredUsers, mobileDisplayCount]);

  const hasMoreMobileUsers = mobileDisplayCount < filteredUsers.length;

  const loadMoreMobile = () => {
    setMobileDisplayCount((prev) => Math.min(prev + 10, filteredUsers.length));
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleViewUser = (user: User) => {
    setViewingUser(user);
    setIsViewOpen(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUserMutation(userId).unwrap();
        setUsers(users.filter((u) => u.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleToggleStatus = (user: User) => {
    setUsers(
      users.map((u) =>
        u.id === user.id
          ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
          : u
      )
    );
  };

  const handleSaveUser = async (userData: Partial<User> & { password?: string }) => {
    try {
      if (editingUser) {
        // Update existing user
        await updateUser({
          userId: editingUser.id,
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            username: userData.username,
            phone: userData.phone,
            department: userData.department,
            role: typeof userData.role === 'number' ? userData.role : parseInt(String(userData.role)),
          },
        }).unwrap();
      } else {
        // Create new user
        const username = userData.username || userData.email?.split('@')[0] || '';

        await createUser({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          username,
          email: userData.email || '',
          password: userData.password || '',
          phone: userData.phone,
          department: userData.department,
          role: typeof userData.role === 'number' ? userData.role : parseInt(String(userData.role)),
        }).unwrap();
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

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

  const getStatusBadgeVariant = (status: string) => {
    return status === 'active' ? 'success' : 'warning';
  };

  return (
    <>
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <CardTitle className="text-base sm:text-lg">All Users ({filteredUsers.length})</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleCreateUser} className="gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {mobileUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {user.first_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
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
                          <DropdownMenuItem onClick={() => handleViewUser(user)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                            {user.status === 'active' ? (
                              <>
                                <UserX className="w-4 h-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(String(user.role))} className="text-xs">
                        {user.role}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(user.status)} className="text-xs">
                        {user.status}
                      </Badge>
                      {user.department && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Building className="w-3 h-3" />
                          {user.department}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}

                {/* Show More Button */}
                {hasMoreMobileUsers && (
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={loadMoreMobile}
                    >
                      Show More ({filteredUsers.length - mobileDisplayCount} remaining)
                    </Button>
                  </div>
                )}

                {/* Mobile count info */}
                <p className="text-center text-xs text-slate-500 pt-2">
                  Showing {mobileUsers.length} of {filteredUsers.length} users
                </p>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {user.first_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(String(user.role))}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600 dark:text-slate-400">
                            {user.department || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600 dark:text-slate-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleViewUser(user)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditUser(user)}
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(user)}
                              >
                                {user.status === 'active' ? (
                                  <>
                                    <UserX className="w-4 h-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">
                No users found. Add your first user to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <UserFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={editingUser}
        onSave={handleSaveUser}
      />

      <UserViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        user={viewingUser}
      />
    </>
  );
}
