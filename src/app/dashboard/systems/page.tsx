'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Server,
  User,
  FileText,
  Search,
} from 'lucide-react';
import {
  useGetSystemsQuery,
  useCreateSystemMutation,
  useUpdateSystemMutation,
  useDeleteSystemMutation,
} from '@/store/services/systemApi';
import { useGetRolesQuery } from '@/store/services/roleApi';
import { useGetUsersQuery } from '@/store/services/userApi';
import type { System, CreateSystemRequest, UpdateSystemRequest } from '@/types/system';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function SystemsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [formData, setFormData] = useState<CreateSystemRequest>({
    system_name: '',
    system_description: '',
    status: 'active',
    responsible_person: {}, // Changed from responsible_person_ids array to object
    customers: {}, // Added customers field
    system_documentation: '',
  });

  const { data: systemsResponse, isLoading, refetch } = useGetSystemsQuery();
  const { data: usersResponse } = useGetUsersQuery({ limit: 1000, offset: 0 });
  const { data: rolesResponse } = useGetRolesQuery({});
  const [createSystem, { isLoading: isCreating }] = useCreateSystemMutation();
  const [updateSystem, { isLoading: isUpdating }] = useUpdateSystemMutation();
  const [deleteSystem, { isLoading: isDeleting }] = useDeleteSystemMutation();

  const systems = systemsResponse?.data || [];
  const allUsers = usersResponse?.data || [];
  const allRoles = rolesResponse?.data || [];
  const developers = allUsers.filter(user => user.role === 'Developer');
  const usersBySelectedRole = selectedRole ? allUsers.filter(user => user.role === selectedRole) : [];

  const filteredSystems = systems.filter(system =>
    system.system_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    system.system_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    try {
      await createSystem(formData).unwrap();
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      console.error('Failed to create system:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedSystem) return;

    try {
      await updateSystem({
        id: selectedSystem.id,
        data: formData as UpdateSystemRequest,
      }).unwrap();
      setIsEditDialogOpen(false);
      setSelectedSystem(null);
      resetForm();
      refetch();
    } catch (error) {
      console.error('Failed to update system:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedSystem) return;

    try {
      await deleteSystem(selectedSystem.id).unwrap();
      setIsDeleteDialogOpen(false);
      setSelectedSystem(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete system:', error);
    }
  };

  const openEditDialog = (system: System) => {
    setSelectedSystem(system);
    setFormData({
      system_name: system.system_name,
      system_description: system.system_description || '',
      status: system.status || 'active',
      responsible_person: system.responsible_person || {}, // Changed from responsible_person_ids array to object
      customers: system.customers || {}, // Added customers field
      system_documentation: system.system_documentation || '',
    });
    setSelectedRole('');
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (system: System) => {
    setSelectedSystem(system);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      system_name: '',
      system_description: '',
      status: 'active',
      responsible_person: {}, // Changed from responsible_person_ids array to object
      customers: {}, // Added customers field
      system_documentation: '',
    });
    setSelectedRole('');
  };

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const formatStatus = (status?: string) => {
    if (!status) return 'Active';
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Systems Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage software systems and applications in your organization
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add System
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Systems
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search systems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>System Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsible Persons</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSystems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No systems found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSystems.map((system) => (
                    <TableRow key={system.id}>
                      <TableCell className="font-medium">{system.system_name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {system.system_description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={system.status === 'active' ? 'default' : 'secondary'}>
                          {formatStatus(system.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {system.responsible_person && Object.keys(system.responsible_person).length > 0 ? (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              {Object.keys(system.responsible_person).map((userIdStr, index) => {
                                const userId = parseInt(userIdStr);
                                const user = allUsers.find(u => u.id === userId);
                                return user ? (
                                  <span key={userId} className="font-medium">
                                    {user.first_name} {user.last_name}
                                    {index < Object.keys(system.responsible_person!).length - 1 ? ', ' : ''}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {system.customers && Object.keys(system.customers).length > 0 ? (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              {Object.keys(system.customers).map((customerIdStr, index) => {
                                const customerId = parseInt(customerIdStr);
                                const customer = allUsers.find(u => u.id === customerId); // Assuming customers are also users
                                return customer ? (
                                  <span key={customerId} className="font-medium">
                                    {customer.first_name} {customer.last_name}
                                    {index < Object.keys(system.customers!).length - 1 ? ', ' : ''}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No customers</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(system)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(system)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create System Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New System</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="system_name">System Name *</Label>
              <Input
                id="system_name"
                value={formData.system_name}
                onChange={(e) => setFormData({ ...formData, system_name: e.target.value })}
                placeholder="Enter system name"
              />
            </div>
            <div>
              <Label htmlFor="system_description">Description</Label>
              <Textarea
                id="system_description"
                value={formData.system_description}
                onChange={(e) => setFormData({ ...formData, system_description: e.target.value })}
                placeholder="Enter system description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'active'}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsible Developers</Label>
              
              {/* Selected Users Display */}
              {formData.responsible_person && Object.keys(formData.responsible_person).length > 0 && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Selected Users:</Label>
                  <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-muted/50">
                    {Object.keys(formData.responsible_person).map((userIdStr) => {
                      const userId = parseInt(userIdStr);
                      const user = allUsers.find(u => u.id === userId);
                      return user ? (
                        <div key={userId} className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-sm">
                          <span>{user.first_name} {user.last_name} ({user.role})</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newResponsiblePerson = { ...formData.responsible_person };
                              delete newResponsiblePerson[userIdStr];
                              setFormData({
                                ...formData,
                                responsible_person: newResponsiblePerson
                              });
                            }}
                            className="ml-1 hover:text-red-300"
                          >
                            ×
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Role and User Selection */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm">Select Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose role" />
                    </SelectTrigger>
                    <SelectContent>
                      {allRoles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Select User</Label>
                  <Select
                    disabled={!selectedRole}
                    onValueChange={(userId) => {
                      const id = userId;
                      if (!formData.responsible_person?.[id]) {
                        setFormData({
                          ...formData,
                          responsible_person: { ...formData.responsible_person, [id]: true }
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose user" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersBySelectedRole
                        .filter(user => !formData.responsible_person?.[user.id.toString()])
                        .map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.first_name} {user.last_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Customers</Label>
              
              {/* Selected Customers Display */}
              {formData.customers && Object.keys(formData.customers).length > 0 && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Selected Customers:</Label>
                  <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-muted/50">
                    {Object.keys(formData.customers).map((customerIdStr) => {
                      const customerId = parseInt(customerIdStr);
                      const customer = allUsers.find(u => u.id === customerId);
                      return customer ? (
                        <div key={customerId} className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-sm">
                          <span>{customer.first_name} {customer.last_name} ({customer.role})</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newCustomers = { ...formData.customers };
                              delete newCustomers[customerIdStr];
                              setFormData({
                                ...formData,
                                customers: newCustomers
                              });
                            }}
                            className="ml-1 hover:text-red-300"
                          >
                            ×
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Role and Customer Selection */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm">Select Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose role" />
                    </SelectTrigger>
                    <SelectContent>
                      {allRoles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Select Customer</Label>
                  <Select
                    disabled={!selectedRole}
                    onValueChange={(customerId) => {
                      if (!formData.customers?.[customerId]) {
                        setFormData({
                          ...formData,
                          customers: {
                            ...formData.customers,
                            [customerId]: true
                          }
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersBySelectedRole
                        .filter(user => !formData.customers?.[user.id.toString()])
                        .map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.first_name} {user.last_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="system_documentation">Documentation</Label>
              <Textarea
                id="system_documentation"
                value={formData.system_documentation}
                onChange={(e) => setFormData({ ...formData, system_documentation: e.target.value })}
                placeholder="Enter documentation or notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !formData.system_name.trim()}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create System
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit System Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit System</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_system_name">System Name *</Label>
              <Input
                id="edit_system_name"
                value={formData.system_name}
                onChange={(e) => setFormData({ ...formData, system_name: e.target.value })}
                placeholder="Enter system name"
              />
            </div>
            <div>
              <Label htmlFor="edit_system_description">Description</Label>
              <Textarea
                id="edit_system_description"
                value={formData.system_description}
                onChange={(e) => setFormData({ ...formData, system_description: e.target.value })}
                placeholder="Enter system description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit_status">Status</Label>
              <Select
                value={formData.status || 'active'}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsible Developers</Label>
              
              {/* Selected Users Display */}
              {formData.responsible_person && Object.keys(formData.responsible_person).length > 0 && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Selected Users:</Label>
                  <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-muted/50">
                    {Object.keys(formData.responsible_person).map((userIdStr) => {
                      const userId = parseInt(userIdStr);
                      const user = allUsers.find(u => u.id === userId);
                      return user ? (
                        <div key={userId} className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-sm">
                          <span>{user.first_name} {user.last_name} ({user.role})</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newResponsiblePerson = { ...formData.responsible_person };
                              delete newResponsiblePerson[userIdStr];
                              setFormData({
                                ...formData,
                                responsible_person: newResponsiblePerson
                              });
                            }}
                            className="ml-1 hover:text-red-300"
                          >
                            ×
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Role and User Selection */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm">Select Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose role" />
                    </SelectTrigger>
                    <SelectContent>
                      {allRoles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Select User</Label>
                  <Select
                    disabled={!selectedRole}
                    onValueChange={(userId) => {
                      if (!formData.responsible_person?.[userId]) {
                        setFormData({
                          ...formData,
                          responsible_person: {
                            ...formData.responsible_person,
                            [userId]: true
                          }
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose user" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersBySelectedRole
                        .filter(user => !formData.responsible_person?.[user.id.toString()])
                        .map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.first_name} {user.last_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Customers</Label>
              
              {/* Selected Customers Display */}
              {formData.customers && Object.keys(formData.customers).length > 0 && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Selected Customers:</Label>
                  <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-muted/50">
                    {Object.keys(formData.customers).map((customerIdStr) => {
                      const customerId = parseInt(customerIdStr);
                      const customer = allUsers.find(u => u.id === customerId);
                      return customer ? (
                        <div key={customerId} className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-sm">
                          <span>{customer.first_name} {customer.last_name} ({customer.role})</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newCustomers = { ...formData.customers };
                              delete newCustomers[customerIdStr];
                              setFormData({
                                ...formData,
                                customers: newCustomers
                              });
                            }}
                            className="ml-1 hover:text-red-300"
                          >
                            ×
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Role and Customer Selection */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm">Select Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose role" />
                    </SelectTrigger>
                    <SelectContent>
                      {allRoles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Select Customer</Label>
                  <Select
                    disabled={!selectedRole}
                    onValueChange={(customerId) => {
                      if (!formData.customers?.[customerId]) {
                        setFormData({
                          ...formData,
                          customers: {
                            ...formData.customers,
                            [customerId]: true
                          }
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersBySelectedRole
                        .filter(user => !formData.customers?.[user.id.toString()])
                        .map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.first_name} {user.last_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="edit_system_documentation">Documentation</Label>
              <Textarea
                id="edit_system_documentation"
                value={formData.system_documentation}
                onChange={(e) => setFormData({ ...formData, system_documentation: e.target.value })}
                placeholder="Enter documentation or notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isUpdating || !formData.system_name.trim()}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update System
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete System</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSystem?.system_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}