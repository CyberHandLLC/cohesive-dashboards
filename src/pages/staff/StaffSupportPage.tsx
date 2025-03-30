
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { 
  AlertCircle, 
  Search, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClientId } from '@/hooks/useClientId';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/formatters';

const StaffSupportPage = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [searchParams] = useSearchParams();
  const ticketIdParam = searchParams.get('ticketId');
  const clientIdParam = searchParams.get('clientId');
  
  const { userId, isLoading: userIdLoading, error: userIdError } = useClientId();
  const { toast } = useToast();
  
  const breadcrumbs = [
    { label: 'Staff', href: '/staff' },
    { label: 'Accounts', href: '/staff/accounts' },
    { label: 'Support Tickets' }
  ];

  useEffect(() => {
    if (userId) {
      fetchClientsList();
      fetchTickets();
    }
  }, [userId, searchQuery, statusFilter, priorityFilter, clientFilter, ticketIdParam, clientIdParam]);

  const fetchClientsList = async () => {
    if (!userId) return;
    
    try {
      // Get staff id
      const { data: staffData, error: staffError } = await supabase
        .from('Staff')
        .select('id')
        .eq('userId', userId)
        .single();
      
      if (staffError) {
        console.error('Error fetching staff data:', staffError);
        return;
      }
      
      // Get assigned clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('Client')
        .select('id, companyName')
        .eq('accountManagerId', staffData.id)
        .order('companyName');
      
      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
        return;
      }
      
      setClients(clientsData || []);
    } catch (error) {
      console.error('Error in fetchClientsList:', error);
    }
  };

  const fetchTickets = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('SupportTicket')
        .select(`
          id, 
          title, 
          description, 
          status, 
          priority, 
          category,
          createdAt,
          updatedAt,
          resolvedAt,
          comments,
          clientId,
          Client (companyName)
        `)
        .eq('staffId', userId);
      
      // Apply filters
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (priorityFilter && priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }
      
      if (clientFilter && clientFilter !== 'all') {
        query = query.eq('clientId', clientFilter);
      } else if (clientIdParam) {
        query = query.eq('clientId', clientIdParam);
      }
      
      if (ticketIdParam) {
        query = query.eq('id', ticketIdParam);
      }
      
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }
      
      const { data: ticketData, error: ticketError } = await query.order('createdAt', { ascending: false });
      
      if (ticketError) throw ticketError;
      
      setTickets(ticketData || []);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      toast({
        title: "Error",
        description: "Could not fetch support tickets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      let updateData: any = { 
        status: newStatus, 
      };
      
      // If resolving, add resolved timestamp
      if (newStatus === 'RESOLVED') {
        updateData.resolvedAt = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('SupportTicket')
        .update(updateData)
        .eq('id', ticketId);
        
      if (error) throw error;
      
      // Log this action
      await supabase
        .from('AuditLog')
        .insert({
          userId,
          action: 'UPDATE',
          resource: 'SUPPORT_TICKET',
          details: { ticketId, status: { to: newStatus } },
          status: 'SUCCESS'
        });
      
      toast({
        title: "Ticket Updated",
        description: `Ticket status changed to ${newStatus}`,
      });
      
      // Optimistically update the UI
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus, resolvedAt: newStatus === 'RESOLVED' ? new Date().toISOString() : ticket.resolvedAt } 
          : ticket
      ));
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: "Error",
        description: "Could not update ticket status",
        variant: "destructive",
      });
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setClientFilter('all');
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" /> High
        </span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-yellow-100 text-yellow-800">
          Medium
        </span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800">
          Low
        </span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" /> Resolved
        </span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 mr-1" /> In Progress
        </span>;
      case 'CLOSED':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-800">
          Closed
        </span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" /> Open
        </span>;
    }
  };

  // Display loading or error state if needed
  if (userIdLoading) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        role="staff"
      >
        <div className="flex justify-center items-center h-[60vh]">
          <p>Loading user information...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (userIdError) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        role="staff"
      >
        <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Authentication Error</h2>
          <p>{userIdError}</p>
          <Button asChild variant="outline">
            <Link to="/login">Log in again</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbs={breadcrumbs}
      role="staff"
      title="Support Ticket Management"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Support Tickets</h1>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || clientFilter !== 'all') && (
                  <Button variant="outline" onClick={resetFilters}>
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Ticket List */}
        <Card>
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading tickets...</p>
              </div>
            ) : tickets.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="hidden lg:table-cell">Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">
                          <div className="max-w-[300px] truncate">
                            {ticket.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link 
                            to={`/staff/accounts/clients?clientId=${ticket.clientId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {ticket.Client?.companyName || "Unknown Client"}
                          </Link>
                        </TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {formatDate(ticket.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {ticket.status === 'OPEN' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateTicketStatus(ticket.id, 'IN_PROGRESS')}
                              >
                                Start
                              </Button>
                            )}
                            {ticket.status === 'IN_PROGRESS' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => updateTicketStatus(ticket.id, 'RESOLVED')}
                              >
                                Resolve
                              </Button>
                            )}
                            <Button variant="primary" size="sm" asChild>
                              <Link to={`/staff/accounts/support/${ticket.id}`}>
                                View
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-xl mb-1">No tickets found</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  There are no support tickets assigned to you or none match your current filters.
                </p>
                {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || clientFilter !== 'all') && (
                  <Button variant="outline" onClick={resetFilters} className="mt-4">
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffSupportPage;
