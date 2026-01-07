'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  GitBranch,
  Users,
  ChevronRight,
  GripVertical,
  UserPlus,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  useGetWorkflowsQuery,
  useGetWorkflowByIdQuery,
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
  useDeleteWorkflowMutation,
  useCreateWorkflowNodeMutation,
  useUpdateWorkflowNodeMutation,
  useDeleteWorkflowNodeMutation,
  useSetNodeUsersMutation,
  Workflow,
  WorkflowNode,
} from '@/store/services/workflowApi';
import { useGetUsersQuery } from '@/store/services/userApi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function WorkflowsPage() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);

  // Form states
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowActive, setWorkflowActive] = useState(true);

  const [nodeName, setNodeName] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [nodeApprovalType, setNodeApprovalType] = useState<'ALL' | 'ANY'>('ALL');
  const [nodeOrder, setNodeOrder] = useState(1);

  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  // Queries
  const { data: workflowsData, isLoading: loadingWorkflows } = useGetWorkflowsQuery();
  const { data: selectedWorkflowData, isLoading: loadingWorkflow } = useGetWorkflowByIdQuery(
    selectedWorkflowId!,
    { skip: !selectedWorkflowId }
  );
  const { data: usersData } = useGetUsersQuery({ limit: 100, offset: 0 });

  // Mutations
  const [createWorkflow, { isLoading: creating }] = useCreateWorkflowMutation();
  const [updateWorkflow, { isLoading: updating }] = useUpdateWorkflowMutation();
  const [deleteWorkflow, { isLoading: deleting }] = useDeleteWorkflowMutation();
  const [createNode, { isLoading: creatingNode }] = useCreateWorkflowNodeMutation();
  const [updateNode, { isLoading: updatingNode }] = useUpdateWorkflowNodeMutation();
  const [deleteNode, { isLoading: deletingNode }] = useDeleteWorkflowNodeMutation();
  const [setNodeUsers, { isLoading: settingUsers }] = useSetNodeUsersMutation();

  const workflows = workflowsData?.data || [];
  const selectedWorkflow = selectedWorkflowData?.data;
  const users = usersData?.data || [];

  // Workflow handlers
  const openCreateWorkflow = () => {
    setEditingWorkflow(null);
    setWorkflowName('');
    setWorkflowDescription('');
    setWorkflowActive(true);
    setShowWorkflowDialog(true);
  };

  const openEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description || '');
    setWorkflowActive(workflow.is_active);
    setShowWorkflowDialog(true);
  };

  const handleSaveWorkflow = async () => {
    try {
      if (editingWorkflow) {
        await updateWorkflow({
          id: editingWorkflow.id,
          data: {
            name: workflowName,
            description: workflowDescription || undefined,
            is_active: workflowActive,
          },
        }).unwrap();
      } else {
        const result = await createWorkflow({
          name: workflowName,
          description: workflowDescription || undefined,
          is_active: workflowActive,
        }).unwrap();
        setSelectedWorkflowId(result.data.id);
      }
      setShowWorkflowDialog(false);
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow');
    }
  };

  const handleDeleteWorkflow = async (id: number) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await deleteWorkflow(id).unwrap();
      if (selectedWorkflowId === id) {
        setSelectedWorkflowId(null);
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      alert('Failed to delete workflow');
    }
  };

  // Node handlers
  const openCreateNode = () => {
    if (!selectedWorkflowId) return;
    setEditingNode(null);
    setNodeName('');
    setNodeDescription('');
    setNodeApprovalType('ALL');
    setNodeOrder((selectedWorkflow?.nodes?.length || 0) + 1);
    setShowNodeDialog(true);
  };

  const openEditNode = (node: WorkflowNode) => {
    setEditingNode(node);
    setNodeName(node.name);
    setNodeDescription(node.description || '');
    setNodeApprovalType(node.approval_type);
    setNodeOrder(node.node_order);
    setShowNodeDialog(true);
  };

  const handleSaveNode = async () => {
    if (!selectedWorkflowId) return;
    try {
      if (editingNode) {
        await updateNode({
          workflowId: selectedWorkflowId,
          nodeId: editingNode.id,
          data: {
            name: nodeName,
            description: nodeDescription || undefined,
            approval_type: nodeApprovalType,
          },
        }).unwrap();
      } else {
        await createNode({
          workflowId: selectedWorkflowId,
          data: {
            name: nodeName,
            description: nodeDescription || undefined,
            approval_type: nodeApprovalType,
            node_order: nodeOrder,
          },
        }).unwrap();
      }
      setShowNodeDialog(false);
    } catch (error) {
      console.error('Failed to save node:', error);
      alert('Failed to save node');
    }
  };

  const handleDeleteNode = async (nodeId: number) => {
    if (!selectedWorkflowId) return;
    if (!confirm('Are you sure you want to delete this approval stage?')) return;
    try {
      await deleteNode({ workflowId: selectedWorkflowId, nodeId }).unwrap();
    } catch (error) {
      console.error('Failed to delete node:', error);
      alert('Failed to delete node');
    }
  };

  // User assignment handlers
  const openUserDialog = (node: WorkflowNode) => {
    setSelectedNodeId(node.id);
    setSelectedUserIds(node.users?.map(u => u.user_id) || []);
    setShowUserDialog(true);
  };

  const handleSaveUsers = async () => {
    if (!selectedNodeId) return;
    try {
      await setNodeUsers({
        nodeId: selectedNodeId,
        data: { user_ids: selectedUserIds },
      }).unwrap();
      setShowUserDialog(false);
    } catch (error) {
      console.error('Failed to save users:', error);
      alert('Failed to save users');
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Workflow Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Configure approval workflows with hierarchical stages
          </p>
        </div>
        <Button onClick={openCreateWorkflow} className="gap-2">
          <Plus className="w-4 h-4" />
          New Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflows List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Workflows
            </CardTitle>
            <CardDescription>Select a workflow to manage its stages</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingWorkflows ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : workflows.length > 0 ? (
              <div className="space-y-2">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedWorkflowId === workflow.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                    onClick={() => setSelectedWorkflowId(workflow.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{workflow.name}</span>
                          <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                            {workflow.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        {workflow.description && (
                          <p className="text-xs text-slate-500 mt-1 truncate">
                            {workflow.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <GitBranch className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No workflows created yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={openCreateWorkflow}>
                  Create First Workflow
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow Details & Nodes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedWorkflow ? selectedWorkflow.name : 'Workflow Details'}
                </CardTitle>
                <CardDescription>
                  {selectedWorkflow
                    ? `${selectedWorkflow.nodes?.length || 0} approval stage(s)`
                    : 'Select a workflow to view details'}
                </CardDescription>
              </div>
              {selectedWorkflow && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditWorkflow(selectedWorkflow)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteWorkflow(selectedWorkflow.id)}
                    disabled={deleting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingWorkflow ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : selectedWorkflow ? (
              <div className="space-y-4">
                {/* Workflow Info */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Status:</span>
                      <Badge className="ml-2" variant={selectedWorkflow.is_active ? 'default' : 'secondary'}>
                        {selectedWorkflow.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-slate-500">Created:</span>
                      <span className="ml-2">{new Date(selectedWorkflow.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {selectedWorkflow.description && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      {selectedWorkflow.description}
                    </p>
                  )}
                </div>

                {/* Approval Stages */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Approval Stages</h3>
                  <Button size="sm" onClick={openCreateNode} className="gap-1">
                    <Plus className="w-4 h-4" />
                    Add Stage
                  </Button>
                </div>

                {selectedWorkflow.nodes && selectedWorkflow.nodes.length > 0 ? (
                  <div className="space-y-3">
                    {[...selectedWorkflow.nodes]
                      .sort((a, b) => a.node_order - b.node_order)
                      .map((node, index) => (
                        <div
                          key={node.id}
                          className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                        >
                          <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-bold text-sm">
                                  {node.node_order}
                                </div>
                                <div>
                                  <h4 className="font-medium">{node.name}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="outline" className="text-xs">
                                      {node.approval_type === 'ALL' ? 'All must approve' : 'Any can approve'}
                                    </Badge>
                                    <span className="text-xs text-slate-500">
                                      {node.users?.length || 0} user(s)
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openUserDialog(node)}
                                  title="Manage Users"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditNode(node)}
                                  title="Edit Stage"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteNode(node.id)}
                                  disabled={deletingNode}
                                  title="Delete Stage"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {node.description && (
                              <p className="mt-2 text-sm text-slate-500">{node.description}</p>
                            )}
                          </div>
                          {node.users && node.users.length > 0 && (
                            <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                              <div className="flex flex-wrap gap-2">
                                {node.users.map((user) => (
                                  <Badge key={user.user_id} variant="secondary" className="gap-1">
                                    <Users className="w-3 h-3" />
                                    {user.user_name || `User #${user.user_id}`}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {index < (selectedWorkflow.nodes?.length || 0) - 1 && (
                            <div className="flex justify-center py-2 bg-slate-100 dark:bg-slate-800">
                              <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p>No approval stages defined</p>
                    <p className="text-sm mt-1">Add stages to create the approval hierarchy</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <GitBranch className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg">Select a workflow to view its details</p>
                <p className="text-sm mt-1">Or create a new workflow to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workflow Dialog */}
      <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow ? 'Edit Workflow' : 'Create Workflow'}
            </DialogTitle>
            <DialogDescription>
              {editingWorkflow
                ? 'Update the workflow details'
                : 'Create a new approval workflow'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-name">Name *</Label>
              <Input
                id="workflow-name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="e.g., Reprint Approval"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-description">Description</Label>
              <Textarea
                id="workflow-description"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Describe the workflow purpose..."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="workflow-active">Active</Label>
              <Switch
                id="workflow-active"
                checked={workflowActive}
                onCheckedChange={setWorkflowActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWorkflowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveWorkflow}
              disabled={!workflowName || creating || updating}
            >
              {(creating || updating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingWorkflow ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Node Dialog */}
      <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNode ? 'Edit Approval Stage' : 'Add Approval Stage'}
            </DialogTitle>
            <DialogDescription>
              {editingNode
                ? 'Update the approval stage details'
                : 'Add a new stage to the workflow'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="node-name">Stage Name *</Label>
              <Input
                id="node-name"
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                placeholder="e.g., Manager Approval"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="node-description">Description</Label>
              <Textarea
                id="node-description"
                value={nodeDescription}
                onChange={(e) => setNodeDescription(e.target.value)}
                placeholder="Describe what this stage approves..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="node-approval-type">Approval Type *</Label>
              <Select value={nodeApprovalType} onValueChange={(v) => setNodeApprovalType(v as 'ALL' | 'ANY')}>
                <SelectTrigger id="node-approval-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All users must approve</SelectItem>
                  <SelectItem value="ANY">Any one user can approve</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                {nodeApprovalType === 'ALL'
                  ? 'All assigned users must approve before moving to the next stage'
                  : 'Any single user approval moves to the next stage'}
              </p>
            </div>
            {!editingNode && (
              <div className="space-y-2">
                <Label htmlFor="node-order">Stage Order</Label>
                <Input
                  id="node-order"
                  type="number"
                  min={1}
                  value={nodeOrder}
                  onChange={(e) => setNodeOrder(parseInt(e.target.value) || 1)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNodeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveNode}
              disabled={!nodeName || creatingNode || updatingNode}
            >
              {(creatingNode || updatingNode) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingNode ? 'Update' : 'Add Stage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Assignment Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Users to Stage</DialogTitle>
            <DialogDescription>
              Select users who can approve at this stage
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto border rounded-lg">
            {users.length > 0 ? (
              <div className="divide-y">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      selectedUserIds.includes(user.id) ? 'bg-blue-50 dark:bg-blue-950' : ''
                    }`}
                    onClick={() => toggleUserSelection(user.id)}
                  >
                    <div>
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                    {selectedUserIds.includes(user.id) && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                No users available
              </div>
            )}
          </div>
          <div className="text-sm text-slate-500">
            {selectedUserIds.length} user(s) selected
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUsers} disabled={settingUsers}>
              {settingUsers && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
