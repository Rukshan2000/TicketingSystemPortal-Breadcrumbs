'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Loader2, Plus, ArrowLeft, Upload, X } from 'lucide-react';
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

export default function CreateTicketPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [createTicket, { isLoading }] = useCreateTicketMutation();

  // Generate auto IDs on mount
  const generateTicketId = () => {
    return `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  };

  const generateReferenceNumber = () => {
    return `REF-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  };

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'General',
    priority: 'Medium',
    product_id: generateTicketId(),
    order_id: generateReferenceNumber(),
  });

  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...files]);
    }
    // Clear input
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    if (!formData.subject.trim() || !formData.description.trim()) {
      setError('Subject and description are required');
      return;
    }

    try {
      // Build FormData for ticket creation
      const ticketFormData = new FormData();
      ticketFormData.append('customer_id', user.id.toString());
      ticketFormData.append('subject', formData.subject.trim());
      ticketFormData.append('description', formData.description.trim());
      ticketFormData.append('category', formData.category);
      ticketFormData.append('priority', formData.priority);

      // Only add product_id and order_id if they have values
      if (formData.product_id && formData.product_id !== '') {
        ticketFormData.append('product_id', formData.product_id);
      }
      if (formData.order_id && formData.order_id !== '') {
        ticketFormData.append('order_id', formData.order_id);
      }

      // Add attachments to FormData
      attachments.forEach((file) => {
        ticketFormData.append('attachments', file);
      });

      const createdTicket = await createTicket(ticketFormData).unwrap();
      const ticketId = createdTicket.data?.id;

      if (!ticketId) {
        setError('Failed to create ticket: No ticket ID returned');
        return;
      }

      // Redirect to tickets page
      router.push('/dashboard/tickets');
    } catch (error: any) {
      console.error('Failed to create ticket error object:', error);
      console.error('Error status:', error?.status);
      console.error('Error data:', error?.data);
      
      let errorMessage = 'Failed to create ticket. Please try again.';
      
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Plus className="w-8 h-8" />
            Create New Ticket
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Fill in the details below to create a support ticket
          </p>
        </div>
      </div>

      {/* Author Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-300">
                {user?.first_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {user?.email}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Created on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Ticket Information</CardTitle>
          <CardDescription>
            Provide detailed information about your issue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="e.g., Payment issue with invoice"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="h-10"
              />
              <p className="text-xs text-slate-500">
                Provide a clear, concise title for your issue
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your issue in detail. Include any relevant information that might help us assist you better."
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                required
                className="resize-none"
              />
              <p className="text-xs text-slate-500">
                The more detail you provide, the faster we can help
              </p>
            </div>

            {/* Category and Priority Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <p className="text-xs text-slate-500">
                  Select the category that best fits your issue
                </p>
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
                <p className="text-xs text-slate-500">
                  Choose the urgency level
                </p>
              </div>
            </div>

            {/* Product ID and Order ID Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ticket ID - Auto Generated */}
              <div className="space-y-2">
                <Label htmlFor="product_id">
                  Ticket ID (Auto-Generated)
                  <span className="text-xs text-slate-500 font-normal ml-1">readonly</span>
                </Label>
                <Input
                  id="product_id"
                  name="product_id"
                  value={formData.product_id}
                  disabled
                  className="h-10 bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500">
                  Automatically generated unique ticket identifier
                </p>
              </div>

              {/* Reference Number - Auto Generated */}
              <div className="space-y-2">
                <Label htmlFor="order_id">
                  Reference Number (Auto-Generated)
                  <span className="text-xs text-slate-500 font-normal ml-1">readonly</span>
                </Label>
                <Input
                  id="order_id"
                  name="order_id"
                  value={formData.order_id}
                  disabled
                  className="h-10 bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500">
                  Automatically generated reference number for tracking
                </p>
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <Label htmlFor="attachments">Attachments (Optional)</Label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-900/50">
                <input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={handleAttachmentChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xlsx"
                />
                <label
                  htmlFor="attachments"
                  className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      PDF, DOC, DOCX, JPG, PNG, TXT, XLSX (Max 5MB per file)
                    </p>
                  </div>
                </label>
              </div>

              {/* Attached Files List */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Attached Files ({attachments.length})
                  </p>
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded bg-slate-300 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                              {file.name.split('.').pop()?.toUpperCase().slice(0, 2) || 'F'}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="ml-2 flex-shrink-0"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
