
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, Search } from 'lucide-react';

// Define TypeScript types for ticket properties
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
  comments: any; // Using any for simplicity, could be more strictly typed
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
}

const SupportPage = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');

  const form = useForm<TicketFormValues>({
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      category: 'GENERAL',
    },
  });

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const { data: clientData } = await supabase
        .from('User')
        .select('clientId')
        .eq('id', '00000000-0000-0000-0000-000000000000') // Replace with actual user ID when auth is implemented
        .single();

      if (clientData?.clientId) {
        const { data, error } = await supabase
          .from('SupportTicket')
          .select(`
            *,
            staff:staffId(id, firstName, lastName)
          `)
          .eq('clientId', clientData.clientId);

        if (error) {
          throw error;
        }

        // Type assertion to handle the staff join result
        const ticketsData = data as unknown as Ticket[];
        setTickets(ticketsData);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not find client information",
        });
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load support tickets",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const onSubmit = async (values: TicketFormValues) => {
    try {
      // First get the client ID from the user table
      const { data: userData } = await supabase
        .from('User')
        .select('clientId')
        .eq('id', '00000000-0000-0000-0000-000000000000') // Replace with actual user ID when auth is implemented
        .single();

      if (!userData?.clientId) {
        throw new Error("Client ID not found");
      }

      const { data, error } = await supabase
        .from('SupportTicket')
        .insert([
          {
            ...values,
            clientId: userData.clientId,
            status: 'OPEN',
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Support ticket created successfully",
      });

      // Refresh ticket list
      fetchTickets();
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create support ticket",
      });
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-500';
      case 'IN_PROGRESS':
        return 'bg-yellow-500';
      case 'RESOLVED':
        return 'bg-green-500';
      case 'CLOSED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityBadgeColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'HIGH':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const breadcrumbs = [
    { label: 'Client', href: '/client' },
    { label: 'Support' }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="client"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <Button onClick={() => setIsDialogOpen(true)}>
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
              Manage your support tickets and view their status
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusBadgeColor(ticket.status)}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPriorityBadgeColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{ticket.category}</TableCell>
                        <TableCell>
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {ticket.staff ? `${ticket.staff.firstName} ${ticket.staff.lastName}` : "Unassigned"}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Submit a new support ticket for assistance
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
                        placeholder="Detailed explanation of your issue" 
                        rows={4}
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
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Submit Ticket</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SupportPage;
