'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Settings, X, Loader2, ChevronDown } from 'lucide-react';
import ConversationList from '@/components/chat/conversation-list';
import ChatMessages from '@/components/chat/chat-messages';
import MessageInput from '@/components/chat/message-input';
import { Conversation, useCreateConversationMutation } from '@/store/services/chatApi';
import { useAppSelector, RootState } from '@/store';
import { useGetUsersQuery } from '@/store/services/userApi';
import { useGetRolesQuery } from '@/store/services/roleApi';

export default function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [selectedConversationData, setSelectedConversationData] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileViewChat, setIsMobileViewChat] = useState(false);
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [newConversationForm, setNewConversationForm] = useState({
    customer_id: '',
    subject: '',
  });
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const { user } = useAppSelector((state: RootState) => state.auth);
  const [createConversation, { isLoading: isCreating }] = useCreateConversationMutation();
  
  // Fetch all users with a high limit to get all customers
  const { data: usersData } = useGetUsersQuery({ limit: 1000, offset: 0 });
  
  // Fetch all roles
  const { data: rolesData } = useGetRolesQuery({ limit: 1000, offset: 0 });

  // Filter customers - can be filtered by selected role or show all non-admin users by default
  const availableCustomers = useMemo(() => {
    if (!usersData?.data) return [];
    
    let filtered = usersData.data;

    // If a role is selected, filter by that role name
    if (selectedRoleId) {
      const selectedRole = rolesData?.data?.find((r) => r.id === parseInt(selectedRoleId));
      if (selectedRole) {
        // Match by role name (case-insensitive) since user.role contains the role name
        filtered = filtered.filter((u) => {
          const userRole = String(u.role).toLowerCase();
          return userRole === selectedRole.name.toLowerCase();
        });
      }
    }

    // Create a copy of the array before sorting to avoid read-only errors
    return [...filtered].sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [usersData, rolesData, selectedRoleId]);

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    return availableCustomers.filter((customer) => {
      const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
      const email = customer.email.toLowerCase();
      const query = customerSearchQuery.toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }, [availableCustomers, customerSearchQuery]);

  // Get selected customer info
  const selectedCustomer = availableCustomers.find(
    (c) => c.id === parseInt(newConversationForm.customer_id || '0')
  );

  const handleSelectConversation = (id: number, conversation: Conversation) => {
    setSelectedConversation(id);
    setSelectedConversationData(conversation);
    setIsMobileViewChat(true);
  };

  const handleCreateConversation = async () => {
    if (!newConversationForm.customer_id.trim() || !user?.id) {
      alert('Please select a customer');
      return;
    }

    try {
      const result = await createConversation({
        user_id: user.id,
        customer_id: parseInt(newConversationForm.customer_id),
        subject: newConversationForm.subject || 'New conversation',
      }).unwrap();

      // Close dialog and reset form
      setShowNewConversationDialog(false);
      setNewConversationForm({ customer_id: '', subject: '' });
      setCustomerSearchQuery('');
      setShowCustomerDropdown(false);
      setSelectedRoleId('');
      setShowRoleDropdown(false);

      // Optionally select the new conversation
      if (result.data?.id) {
        handleSelectConversation(result.data.id, result.data as Conversation);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert('Failed to create conversation. Please try again.');
    }
  };

  const getDisplayName = () => {
    if (!selectedConversationData) return 'Unknown User';
    const firstName = selectedConversationData.first_name || '';
    const lastName = selectedConversationData.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown User';
  };

  const getStatusText = () => {
    if (!selectedConversationData) return '';
    switch (selectedConversationData.status) {
      case 'OPEN':
        return 'Active conversation';
      case 'CLOSED':
        return 'Conversation closed';
      case 'ON_HOLD':
        return 'On hold';
      default:
        return '';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Conversations List - Left Sidebar */}
        <div className={`
          ${isMobileViewChat ? 'hidden' : 'flex'}
          sm:flex flex-col w-full sm:w-96 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
        `}>
          {/* Conversations Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Messages</h1>
              <div className="flex gap-2">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="rounded-full hover:bg-blue-50 dark:hover:bg-blue-950"
                  onClick={() => setShowNewConversationDialog(true)}
                  title="Start new conversation"
                >
                  <Plus className="w-5 h-5" />
                </Button>
                <Button size="icon" variant="ghost" className="rounded-full">
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full bg-slate-100 dark:bg-slate-700 border-0"
              />
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            <ConversationList
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              searchQuery={searchQuery}
            />
          </ScrollArea>
        </div>

        {/* Chat Area - Right Side */}
        <div className={`
          ${isMobileViewChat ? 'flex' : 'hidden'}
          sm:flex flex-1 flex-col bg-white dark:bg-slate-800 overflow-hidden
        `}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsMobileViewChat(false);
                      setSelectedConversation(null);
                      setSelectedConversationData(null);
                    }}
                    className="sm:hidden mb-2"
                  >
                    ← Back
                  </Button>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{getDisplayName()}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{getStatusText()}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <Search className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <ChatMessages conversationId={selectedConversation} />

              {/* Message Input */}
              <MessageInput conversationId={selectedConversation} />
            </>
          ) : (
            /* Empty State */
            <div className="hidden sm:flex flex-1 items-center justify-center text-center">
              <div>
                <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <Search className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Your Messages
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Select a conversation to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Dialog */}
      {showNewConversationDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Start New Conversation</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowNewConversationDialog(false);
                  setNewConversationForm({ customer_id: '', subject: '' });
                  setCustomerSearchQuery('');
                  setShowCustomerDropdown(false);
                  setSelectedRoleId('');
                  setShowRoleDropdown(false);
                }}
                disabled={isCreating}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Role Filter Dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Filter by Role (Optional)
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                    disabled={isCreating}
                    className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-slate-900 dark:text-white text-sm hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="truncate">
                      {selectedRoleId
                        ? rolesData?.data?.find((r) => r.id === parseInt(selectedRoleId))?.name || 'Select role...'
                        : 'All Roles'}
                    </span>
                    <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2 text-slate-500" />
                  </button>

                  {/* Role Dropdown Menu */}
                  {showRoleDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-lg z-10">
                      <ScrollArea className="max-h-64">
                        {/* Clear Filter Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRoleId('');
                            setShowRoleDropdown(false);
                          }}
                          disabled={isCreating}
                          className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-600 border-b border-slate-100 dark:border-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="font-medium text-slate-900 dark:text-white text-sm">
                            All Roles
                          </span>
                        </button>

                        {/* Role List */}
                        {rolesData?.data && rolesData.data.length > 0 ? (
                          rolesData.data.map((role) => (
                            <button
                              key={role.id}
                              type="button"
                              onClick={() => {
                                setSelectedRoleId(role.id.toString());
                                setShowRoleDropdown(false);
                              }}
                              disabled={isCreating}
                              className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-600 border-b border-slate-100 dark:border-slate-600 last:border-b-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900 dark:text-white text-sm">
                                  {role.name}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {role.description}
                                </span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-center text-slate-500 dark:text-slate-400 text-sm">
                            No roles available
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Customer *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                    disabled={isCreating}
                    className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-slate-900 dark:text-white text-sm hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="truncate">
                      {selectedCustomer
                        ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`
                        : 'Choose a customer...'}
                    </span>
                    <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2 text-slate-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {showCustomerDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-lg z-10">
                      {/* Search Input */}
                      <div className="p-2 border-b border-slate-200 dark:border-slate-600">
                        <Input
                          type="text"
                          placeholder="Search by name or email..."
                          value={customerSearchQuery}
                          onChange={(e) => setCustomerSearchQuery(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-600 text-slate-900 dark:text-white border-slate-200 dark:border-slate-500"
                          disabled={isCreating}
                        />
                      </div>

                      {/* Customer List */}
                      <ScrollArea className="max-h-64">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-3 text-center text-slate-500 dark:text-slate-400 text-sm">
                            No customers found
                          </div>
                        ) : (
                          filteredCustomers.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => {
                                setNewConversationForm({
                                  ...newConversationForm,
                                  customer_id: customer.id.toString(),
                                });
                                setShowCustomerDropdown(false);
                                setCustomerSearchQuery('');
                              }}
                              disabled={isCreating}
                              className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-600 border-b border-slate-100 dark:border-slate-600 last:border-b-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900 dark:text-white text-sm">
                                  {customer.first_name} {customer.last_name}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {customer.email}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Subject
                </label>
                <Input
                  type="text"
                  placeholder="Enter conversation subject (optional)"
                  value={newConversationForm.subject}
                  onChange={(e) =>
                    setNewConversationForm({
                      ...newConversationForm,
                      subject: e.target.value,
                    })
                  }
                  disabled={isCreating}
                  className="bg-slate-50 dark:bg-slate-700"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewConversationDialog(false);
                    setNewConversationForm({ customer_id: '', subject: '' });
                    setCustomerSearchQuery('');
                    setShowCustomerDropdown(false);
                    setSelectedRoleId('');
                    setShowRoleDropdown(false);
                  }}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateConversation}
                  disabled={isCreating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Start Conversation'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
