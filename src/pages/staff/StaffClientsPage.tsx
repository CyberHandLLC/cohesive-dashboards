
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
import { AlertCircle, Search, FileText, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClientId } from '@/hooks/useClientId';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/formatters';
import { Column, ResponsiveTable } from '@/components/ui/responsive-table';

// Define ClientStatus type to match database
type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'PAST';

interface Client {
  id: string;
  companyName: string;
  industry: string | null;
  websiteUrl: string | null;
  status: ClientStatus;
  notes: string | null;
  createdAt: string;
  openTickets?: number;
}

const StaffClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
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

  // Define columns for the responsive table
  const columns: Column<Client>[] = [
    {
      id: 'companyName',
      header: 'Company Name',
      cell: (client) => <span className="font-medium">{client.companyName}</span>
    },
    {
      id: 'industry',
      header: 'Industry',
      cell: (client) => client.industry || <span className="text-muted-foreground">Not specified</span>,
      responsive: true
    },
    {
      id: 'status',
      header: 'Status',
      cell: (client) => (
        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
          client.status === 'ACTIVE' 
            ? 'bg-green-100 text-green-800' 
            : client.status === 'INACTIVE'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-gray-100 text-gray-800'
        }`}>
          {client.status}
        </span>
      )
    },
    {
      id: 'openTickets',
      header: 'Open Tickets',
      cell: (client) => (
        client.openTickets && client.openTickets > 0 ? (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            {client.openTickets}
          </span>
        ) : (
          <span className="text-muted-foreground">None</span>
        )
      )
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (client) => formatDate(client.createdAt),
      responsive: true
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (client) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link to={`/staff/accounts/support?clientId=${client.id}`}>
              <FileText className="h-4 w-4" />
            </Link>
          </Button>
          {client.websiteUrl && (
            <Button variant="outline" size="icon" asChild>
              <a href={`mailto:${client.contactEmail}`} onClick={(e) => e.stopPropagation()}>
                <Mail className="h-4 w-4" />
              </a>
            </Button>
          )}
          <Button variant="default" size="sm" asChild>
            <Link to={`/staff/accounts/clients/${client.id}`}>
              View
            </Link>
          </Button>
        </div>
      ),
      className: "text-right"
    }
  ];

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
            <ResponsiveTable
              columns={columns}
              data={clients}
              keyField="id"
              isLoading={isLoading}
              emptyMessage="No clients found"
              searchQuery={searchQuery}
              onRowClick={(client) => {
                window.location.href = `/staff/accounts/clients/${client.id}`;
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffClientsPage;
