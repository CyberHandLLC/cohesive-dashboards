
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, Search, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import SubMenuTabs from '@/components/navigation/SubMenuTabs';

type TicketPriority = "LOW" | "MEDIUM" | "HIGH";
type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type TicketCategory = "BILLING" | "TECHNICAL" | "GENERAL";

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: TicketCategory;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  clientId: string;
  staffId: string | null;
  comments: any;
  staff?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface TicketFormValues {
  title: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
  status: TicketStatus;
  staffId?: string | null;
}

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const AdminClientSupportPage = () => {
  const { toast } = useToast();
  const { id: clientId } = useParams<{ id: string }>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');

  const form = useForm<TicketFormValues>({
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      category: 'GENERAL',
      status: 'OPEN',
      staffId: null
    },
  });
  
  // Fetch tickets and staff members
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch tickets
      const { data: ticketData, error: ticketError } = await supabase
        .from('SupportTicket')
        .select(`
          *,
          staff:staffId(id, firstName, lastName)
        `)
        .eq('clientId', clientId);

      if (ticketError) throw ticketError;
      
      // Fetch staff members for assignment
      const { data: staffData, error: staffError } = await supabase
        .from('User')
        .select(`
          id,
          firstName,
          lastName,
          email
        `)
        .eq('role', 'STAFF');
        
      if (staffError) throw staffError;
      
      setTickets(ticketData as Ticket[]);
      setStaffMembers(staffData as StaffMember[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tickets and staff data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchData();
    }
  }, [clientId]);

  const handleCreateTicket = () => {
    setIsEditMode(false);
    setCurrentTicket(null);
    form.reset({
      title: '',
      description: '',
      priority: 'MEDIUM',
      category: 'GENERAL',
      status: 'OPEN',
      staffId: null
    });
    setIsDialogOpen(true);
  };
  
  const handleEditTicket = (ticket: Ticket) => {
    setIsEditMode(true);
    setCurrentTicket(ticket);
    form.reset({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      category: ticket.category,
      status: ticket.status,
      staffId: ticket.staffId
    });
    setIsDialogOpen(true);
  };

  const handleDeleteTicket = async (id: string) => {
    try {
      const { error } = await supabase
        .from('SupportTicket')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Ticket deleted successfully",
      });
      
      setTickets(tickets.filter(ticket => ticket.id !== id));
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete ticket",
      });
    }
  };

  const onSubmit = async (values: TicketFormValues) => {
    try {
      if (isEditMode && currentTicket) {
        // Update existing ticket
        const { error } = await supabase
          .from('SupportTicket')
          .update({
            title: values.title,
            description: values.description,
            priority: values.priority,
            category: values.category,
            status: values.status,
            staffId: values.staffId || null,
            resolvedAt: values.status === 'RESOLVED' ? new Date().toISOString() : null
          })
          .eq('id', currentTicket.id);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Ticket updated successfully",
        });
      } else {
        // Create new ticket
        const { error } = await supabase
          .from('SupportTicket')
          .insert([
            {
              title: values.title,
              description: values.description,
              priority: values.priority,
              category: values.category,
              status: values.status,
              staffId: values.staffId || null,
              clientId
            },
          ]);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Ticket created successfully",
        });
      }
      
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving ticket:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save ticket",
      });
    }
  };

  const handleAssignStaff = async (ticketId: string, staffId: string | null) => {
    try {
      const { error } = await supabase
        .from('SupportTicket')
        .update({ staffId })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: staffId ? "Ticket assigned successfully" : "Ticket unassigned",
      });
      
      fetchData();
    } catch (error) {
      console.error('Error assigning staff:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign staff to ticket",
      });
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('SupportTicket')
        .update({ 
          status,
          resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : null 
        })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Ticket status updated to ${status}`,
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update ticket status",
      });
    }
  };

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // For priority badge styling
  const getPriorityBadgeColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // For status badge styling
  const getStatusBadgeColor = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Create submenu tabs
  const subMenuItems = [
    { value: "overview", label: "Overview", href: `/admin/accounts/clients/${clientId}/overview` },
    { value: "services", label: "Services", href: `/admin/accounts/clients/services` },
    { value: "invoices", label: "Invoices", href: `/admin/accounts/clients/invoices` },
    { value: "support", label: "Support", href: `/admin/accounts/clients/support` },
    { value: "contacts", label: "Contacts", href: `/admin/accounts/clients/contacts` },
  ];

  // Set up breadcrumbs for navigation
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Clients', href: '/admin/accounts/clients' },
    { label: 'Support' }
  ];

  return (
    <DashboardLayout
      breadcrumbs={breadcrumbs}
      subMenuItems={subMenuItems}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <Button onClick={handleCreateTicket}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as TicketStatus | 'ALL')}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
            <CardDescription>
              Manage support tickets for this client
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {searchQuery || statusFilter !== 'ALL'
                  ? "No tickets match your filters"
                  : "No support tickets found"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.title}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadgeColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </TableCell>
                        <TableCell>{ticket.category}</TableCell>
                        <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                        <TableCell>
                          <Select
                            value={ticket.staffId || ''}
                            onValueChange={(value) => handleAssignStaff(ticket.id, value || null)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Unassigned</SelectItem>
                              {staffMembers.map((staff) => (
                                <SelectItem key={staff.id} value={staff.id}>
                                  {staff.firstName} {staff.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Select
                              value={ticket.status}
                              onValueChange={(value) => handleUpdateStatus(ticket.id, value as TicketStatus)}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OPEN">Open</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm" onClick={() => handleEditTicket(ticket)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-500"
                              onClick={() => handleDeleteTicket(ticket.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Support Ticket" : "Create Support Ticket"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Update the details of this support ticket" 
                : "Create a new support ticket for this client"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of the issue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed explanation of the issue" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BILLING">Billing</SelectItem>
                          <SelectItem value="TECHNICAL">Technical</SelectItem>
                          <SelectItem value="GENERAL">General</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                  control={form.control}
                  name="staffId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select staff member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
                          {staffMembers.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              {staff.firstName} {staff.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditMode ? "Update Ticket" : "Create Ticket"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminClientSupportPage;
