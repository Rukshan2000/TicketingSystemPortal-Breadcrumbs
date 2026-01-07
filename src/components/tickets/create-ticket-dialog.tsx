'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { useCreateTicketMutation } from '@/store/services/ticketApi';
import { CreateTicketRequest } from '@/store/services/ticketApi';

const CATEGORIES = [
  'General',
  'Billing',
  'Technical Support',
  'Feature Request',
  'Bug Report',
  'Account',
  'Other',
];

const PRIORITIES = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
];

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateTicketDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTicketDialogProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const [createTicket, { isLoading }] = useCreateTicketMutation();

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'General',
    priority: 'Medium',
    product_id: '',
    order_id: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      alert('User not authenticated');
      return;
    }

    if (!formData.subject.trim() || !formData.description.trim()) {
      alert('Subject and description are required');
      return;
    }

    try {
      const ticketData: CreateTicketRequest = {
        customer_id: user.id,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority as any,
        ...(formData.product_id && { product_id: parseInt(formData.product_id) }),
        ...(formData.order_id && { order_id: formData.order_id.trim() }),
      };

      await createTicket(ticketData).unwrap();

      // Reset form
      setFormData({
        subject: '',
        description: '',
        category: 'General',
        priority: 'Medium',
        product_id: '',
        order_id: '',
      });

      alert('Ticket created successfully!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to create ticket:', error);
      alert(error?.data?.message || 'Failed to create ticket. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Ticket
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to create a support ticket
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="e.g., Payment issue"
              value={formData.subject}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe your issue in detail..."
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                handleSelectChange('category', value)
              }
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                handleSelectChange('priority', value)
              }
            >
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product ID (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="product_id">Product ID (Optional)</Label>
            <Input
              id="product_id"
              name="product_id"
              placeholder="e.g., PROD123"
              value={formData.product_id}
              onChange={handleInputChange}
            />
          </div>

          {/* Order ID (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="order_id">Order ID (Optional)</Label>
            <Input
              id="order_id"
              name="order_id"
              placeholder="e.g., ORD456"
              value={formData.order_id}
              onChange={handleInputChange}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
