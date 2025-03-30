
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
import { AlertCircle, Search, FileText, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClientId } from '@/hooks/useClientId';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/formatters';

// Define ClientStatus type to match database
type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'PAST';

const StaffClientsPage = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get('clientId');
  
  const { userId, staffId, isLoading: userIdLoading, error: userIdError } = useClientId();
  const { toast } = useToast();
  
  const breadcrumbs = [
    { label: 'Staff', href: '/staff' },
    { label: 'Accounts', href: '/staff/accounts' },
    { label: 'Clients' }
  ];

  useEffect(() => {
    if (staffId) {
      fetchClients();
    }
  }, [staffId, searchQuery, statusFilter, clientIdParam]);

  const fetchClients = async () => {
    if (!staffId) return;
    
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('Client')
        .select(`
          id, 
          companyName, 
          industry, 
          websiteUrl, 
          status, 
          notes, 
          createdAt
        `)
        .eq('accountManagerId', staffId);
      
      // Apply filters
      if (statusFilter && statusFilter !== 'all') {
        // Type assertion to ensure statusFilter is a valid ClientStatus
        query = query.eq('status', statusFilter as ClientStatus);
      }
      
      if (clientIdParam) {
        query = query.eq('id', clientIdParam);
      }
      
      if (searchQuery) {
        query = query.or(`companyName.ilike.%${searchQuery}%,industry.ilike.%${searchQuery}%`);
      }
      
      const { data: clientData, error: clientError } = await query.order('createdAt', { ascending: false });
      
      if (clientError) throw clientError;
      
      // For each client, get the count of open support tickets
      const clientsWithDetails = await Promise.all((clientData || []).map(async (client) => {
        // Get open tickets count
        const { count: openTickets } = await supabase
          .from('SupportTicket')
          .select('*', { count: 'exact', head: true })
          .eq('clientId', client.id)
          .eq('status', 'OPEN');
          
        return {
          ...client,
          openTickets: openTickets || 0
        };
      }));
      
      setClients(clientsWithDetails);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Could not fetch client data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
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

  if (!staffId) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        role="staff"
      >
        <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Staff Record Not Found</h2>
          <p>Your user account is not associated with a staff record</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbs={breadcrumbs}
      role="staff"
      title="Client Management"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Assigned Clients</h1>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search clients by name, industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="PAST">Past</SelectItem>
                  </SelectContent>
                </Select>
                {(searchQuery || statusFilter !== 'all') && (
                  <Button variant="outline" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Client List */}
        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading clients...</p>
              </div>
            ) : clients.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead className="hidden md:table-cell">Industry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Open Tickets</TableHead>
                      <TableHead className="hidden lg:table-cell">Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.companyName}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {client.industry || <span className="text-muted-foreground">Not specified</span>}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            client.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800' 
                              : client.status === 'INACTIVE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {client.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {client.openTickets > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              {client.openTickets}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {formatDate(client.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" asChild>
                              <Link to={`/staff/accounts/support?clientId=${client.id}`}>
                                <FileText className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="outline" size="icon" asChild>
                              <a href={`mailto:${client.contactEmail}`}>
                                <Mail className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button variant="default" size="sm" asChild>
                              <Link to={`/staff/accounts/clients/${client.id}`}>
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
                  <AlertCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-xl mb-1">No clients found</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  There are no clients assigned to you or none match your current filters.
                </p>
                {(searchQuery || statusFilter !== 'all') && (
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

export default StaffClientsPage;
