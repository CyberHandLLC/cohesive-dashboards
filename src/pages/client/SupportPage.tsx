
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, MessageSquare, AlertCircle, Clock, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import SubMenuTabs from '@/components/navigation/SubMenuTabs';
import type { SubMenuItem } from '@/components/navigation/SubMenuTabs';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type TicketCategory = 'TECHNICAL' | 'BILLING' | 'INQUIRY' | 'FEATURE_REQUEST' | 'OTHER';
type StatusFilter = TicketStatus | 'ALL';

interface Ticket {
  id: string;
  clientId: string;
  staffId: string | null;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory | null;
  comments: any | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  staff?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  }
}

interface ClientInfo {
  id: string;
  companyName: string;
}

const SupportPage = () => {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const addTicketForm = useForm({
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      category: 'TECHNICAL',
      staffId: '',
    },
  });

  const editTicketForm = useForm({
    defaultValues: {
      title: '',
      description: '',
      priority: '',
      category: '',
      status: '',
      staffId: '',
    },
  });

  const commentForm = useForm({
    defaultValues: {
      comment: '',
    },
  });

  useEffect(() => {
    if (clientId) {
      fetchClient();
      fetchTickets();
      fetchStaffMembers();
    } else {
      navigate('/admin/accounts/clients');
    }
  }, [clientId, searchQuery, statusFilter]);

  const fetchClient = async () => {
    if (!clientId) return;

    try {
      const { data, error } = await supabase
        .from('Client')
        .select('id, companyName')
        .eq('id', clientId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setClient(data);
      }
    } catch (error: any) {
      console.error('Error fetching client:', error);
      toast({
        title: "Error",
        description: "Failed to load client information",
        variant: "destructive"
      });
    }
  };

  const fetchTickets = async () => {
    if (!clientId) return;
    
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('SupportTicket')
        .select(`
          *,
          staff:staffId (
            id,
            userId,
            User (
              firstName,
              lastName
            )
          )
        `)
        .eq('clientId', clientId);
      
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }
      
      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setTickets(data || []);
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('id, firstName, lastName, email')
        .eq('role', 'STAFF');
      
      if (error) {
        throw error;
      }
      
      setStaffMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching staff members:', error);
    }
  };

  const handleAddTicket = async (values: any) => {
    if (!clientId) return;
    
    try {
      const { data, error } = await supabase
        .from('SupportTicket')
        .insert({
          clientId,
          title: values.title,
          description: values.description,
          priority: values.priority,
          category: values.category,
          staffId: values.staffId || null,
          status: 'OPEN',
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Support ticket created successfully",
        variant: "default"
      });
      
      setIsAddDialogOpen(false);
      addTicketForm.reset();
      fetchTickets();
    } catch (error: any) {
      console.error('Error adding support ticket:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create support ticket",
        variant: "destructive"
      });
    }
  };

  const handleEditTicket = async (values: any) => {
    if (!selectedTicket) return;
    
    try {
      const updates: any = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        category: values.category,
        status: values.status,
        staffId: values.staffId || null,
      };
      
      if (values.status === 'RESOLVED' && selectedTicket.status !== 'RESOLVED') {
        updates.resolvedAt = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('SupportTicket')
        .update(updates)
        .eq('id', selectedTicket.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Support ticket updated successfully",
        variant: "default"
      });
      
      setIsEditDialogOpen(false);
      setSelectedTicket(null);
      editTicketForm.reset();
      fetchTickets();
    } catch (error: any) {
      console.error('Error updating support ticket:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update support ticket",
        variant: "destructive"
      });
    }
  };

  const handleAddComment = async (values: any) => {
    if (!selectedTicket) return;
    
    try {
      const newComment = {
        text: values.comment,
        timestamp: new Date().toISOString(),
        userId: "admin", // In a real app, this would be the logged-in user's ID
      };
      
      let comments = selectedTicket.comments ? [...selectedTicket.comments] : [];
      comments.push(newComment);
      
      const { error } = await supabase
        .from('SupportTicket')
        .update({
          comments
        })
        .eq('id', selectedTicket.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Comment added successfully",
        variant: "default"
      });
      
      setIsCommentDialogOpen(false);
      commentForm.reset();
      fetchTickets();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (confirm("Are you sure you want to delete this support ticket?")) {
      try {
        const { error } = await supabase
          .from('SupportTicket')
          .delete()
          .eq('id', ticketId);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: "Success",
          description: "Support ticket deleted successfully",
          variant: "default"
        });
        
        fetchTickets();
      } catch (error: any) {
        console.error('Error deleting support ticket:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete support ticket",
          variant: "destructive"
        });
      }
    }
  };

  const openAddDialog = () => {
    addTicketForm.reset({
      title: '',
      description: '',
      priority: 'MEDIUM',
      category: 'TECHNICAL',
      staffId: '',
    });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    editTicketForm.reset({
      title: ticket.title,
      description: ticket.description || '',
      priority: ticket.priority,
      category: ticket.category || '',
      status: ticket.status,
      staffId: ticket.staffId || '',
    });
    setIsEditDialogOpen(true);
  };

  const openCommentDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    commentForm.reset({
      comment: '',
    });
    setIsCommentDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'OPEN':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Open</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">In Progress</Badge>;
      case 'RESOLVED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resolved</Badge>;
      case 'CLOSED':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'LOW':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Low</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Medium</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">High</Badge>;
      case 'URGENT':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Urgent</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const subMenuItems: SubMenuItem[] = [
    { 
      label: 'Overview', 
      href: `/admin/accounts/clients/${clientId}/overview`,
      value: 'overview'
    },
    { 
      label: 'Services', 
      href: `/admin/accounts/clients/services?clientId=${clientId}`,
      value: 'services'
    },
    { 
      label: 'Invoices', 
      href: `/admin/accounts/clients/invoices?clientId=${clientId}`,
      value: 'invoices'
    },
    { 
      label: 'Support', 
      href: `/admin/accounts/clients/support?clientId=${clientId}`,
      value: 'support'
    },
    { 
      label: 'Contacts', 
      href: `/admin/accounts/clients/contacts?clientId=${clientId}`,
      value: 'contacts'
    },
  ];

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Clients', href: '/admin/accounts/clients' },
    { label: client?.companyName || 'Client', href: `/admin/accounts/clients/${clientId}/overview` },
    { label: 'Support' }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      subMenuItems={subMenuItems}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Select 
              value={statusFilter} 
              onValueChange={(value: StatusFilter) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openAddDialog} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Ticket
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="resolved">Resolved/Closed</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                {renderTicketsTable(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])}
              </TabsContent>
              <TabsContent value="open">
                {renderTicketsTable(['OPEN'])}
              </TabsContent>
              <TabsContent value="in-progress">
                {renderTicketsTable(['IN_PROGRESS'])}
              </TabsContent>
              <TabsContent value="resolved">
                {renderTicketsTable(['RESOLVED', 'CLOSED'])}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Create a new support ticket for this client.
            </DialogDescription>
          </DialogHeader>
          <Form {...addTicketForm}>
            <form onSubmit={addTicketForm.handleSubmit(handleAddTicket)} className="space-y-4">
              <FormField
                control={addTicketForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Ticket Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addTicketForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the issue..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addTicketForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addTicketForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TECHNICAL">Technical</SelectItem>
                          <SelectItem value="BILLING">Billing</SelectItem>
                          <SelectItem value="INQUIRY">Inquiry</SelectItem>
                          <SelectItem value="FEATURE_REQUEST">Feature Request</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={addTicketForm.control}
                name="staffId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {staffMembers.map(staff => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.firstName || staff.lastName ? 
                              `${staff.firstName || ''} ${staff.lastName || ''} (${staff.email})` : 
                              staff.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create Ticket</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Support Ticket</DialogTitle>
            <DialogDescription>
              Update support ticket details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editTicketForm}>
            <form onSubmit={editTicketForm.handleSubmit(handleEditTicket)} className="space-y-4">
              <FormField
                control={editTicketForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Ticket Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editTicketForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the issue..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editTicketForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editTicketForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TECHNICAL">Technical</SelectItem>
                          <SelectItem value="BILLING">Billing</SelectItem>
                          <SelectItem value="INQUIRY">Inquiry</SelectItem>
                          <SelectItem value="FEATURE_REQUEST">Feature Request</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editTicketForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editTicketForm.control}
                name="staffId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {staffMembers.map(staff => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.firstName || staff.lastName ? 
                              `${staff.firstName || ''} ${staff.lastName || ''} (${staff.email})` : 
                              staff.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Update Ticket</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>
              Add a comment to this support ticket.
            </DialogDescription>
          </DialogHeader>
          <Form {...commentForm}>
            <form onSubmit={commentForm.handleSubmit(handleAddComment)} className="space-y-4">
              <FormField
                control={commentForm.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comment</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Write your comment here..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsCommentDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Add Comment</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
  
  function renderTicketsTable(statusArray: string[]) {
    const filteredTickets = statusFilter === 'ALL' 
      ? tickets.filter(ticket => statusArray.includes(ticket.status))
      : tickets;
    
    return isLoading ? (
      <div className="flex justify-center py-8">
        <p>Loading tickets...</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium">Ticket</th>
              <th className="text-center py-3 px-4 font-medium">Status</th>
              <th className="text-center py-3 px-4 font-medium">Priority</th>
              <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Category</th>
              <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Assigned To</th>
              <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Created</th>
              <th className="text-right py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{ticket.title}</div>
                      {ticket.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {ticket.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getStatusBadge(ticket.status)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getPriorityBadge(ticket.priority)}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    {ticket.category || <span className="text-muted-foreground">Not specified</span>}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    {ticket.staff ? (
                      <span>
                        {ticket.staff.User?.firstName || ''} {ticket.staff.User?.lastName || ''}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    {formatDate(ticket.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(ticket)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openCommentDialog(ticket)}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTicket(ticket.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-6 text-center text-muted-foreground">
                  {searchQuery ? 'No tickets match your search criteria' : 'No tickets found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
};

export default SupportPage;
