
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useClientId } from '@/hooks/useClientId';
import { Client } from '@/types/client';
import { Column, ResponsiveTable } from '@/components/ui/responsive-table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/formatters';

const StaffClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
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
  }, [staffId, searchQuery, statusFilter]);

  const fetchClients = async () => {
    if (!staffId) return;
    
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('Client')
        .select('*')
        .eq('accountManagerId', staffId);
      
      // Apply status filter
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      // Apply search filter
      if (searchQuery) {
        query = query.or(`companyName.ilike.%${searchQuery}%,industry.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query.order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      setClients(data as Client[]);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Define table columns
  const columns: Column<Client>[] = [
    {
      id: 'companyName',
      header: 'Company Name',
      cell: (client) => <span className="font-medium">{client.companyName}</span>
    },
    {
      id: 'industry',
      header: 'Industry',
      cell: (client) => client.industry || '-',
      responsive: true
    },
    {
      id: 'status',
      header: 'Status',
      cell: (client) => {
        const getStatusBadgeClass = () => {
          switch (client.status) {
            case 'ACTIVE': return 'bg-green-100 text-green-800';
            case 'INACTIVE': return 'bg-amber-100 text-amber-800';
            case 'PAST': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
          }
        };
        
        return (
          <Badge variant="outline" className={getStatusBadgeClass()}>
            {client.status}
          </Badge>
        );
      }
    },
    {
      id: 'website',
      header: 'Website',
      cell: (client) => client.websiteUrl ? (
        <a 
          href={client.websiteUrl.startsWith('http') ? client.websiteUrl : `https://${client.websiteUrl}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {new URL(client.websiteUrl.startsWith('http') ? client.websiteUrl : `https://${client.websiteUrl}`).hostname}
        </a>
      ) : '-',
      responsive: true
    },
    {
      id: 'startDate',
      header: 'Service Start',
      cell: (client) => client.serviceStartDate ? formatDate(client.serviceStartDate) : '-',
      responsive: true
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (client) => formatDate(client.createdAt)
    }
  ];

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

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  return (
    <DashboardLayout
      breadcrumbs={breadcrumbs}
      role="staff"
      title="Client Management"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Your Assigned Clients</h1>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-4">
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
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
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
        
        {/* Clients List */}
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
                // Navigate to client details
                console.log('Client clicked:', client);
                toast({
                  title: "Client Selected",
                  description: `You clicked on ${client.companyName}`,
                });
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffClientsPage;
