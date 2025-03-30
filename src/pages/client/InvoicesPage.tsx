import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useClientId } from '@/hooks/useClientId';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { InvoiceStatus } from '@/types/invoice';
import ServicesList from '@/components/client/ServicesList';
import { ClientService } from '@/types/client';

const ClientInvoicesPage = () => {
  const [services, setServices] = useState<ClientService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get('clientId');
  
  const { userId, clientId, isLoading: userIdLoading, error: userIdError } = useClientId();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const breadcrumbs = [
    { label: 'Client', href: '/client' },
    { label: 'Accounts', href: '/client/accounts' },
    { label: 'Services' }
  ];

  useEffect(() => {
    if (clientId) {
      fetchServices();
    }
  }, [clientId, searchQuery, statusFilter, clientIdParam]);

  const fetchServices = async () => {
    if (!clientId) return;
    
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('ClientService')
        .select(`
          id, 
          clientId, 
          serviceId, 
          status, 
          price, 
          startDate, 
          endDate, 
          createdAt,
          updatedAt,
          service: Service (
            name, 
            description, 
            price, 
            monthlyPrice, 
            features, 
            customFields
          )
        `)
        .eq('clientId', clientId);
      
      // Apply filters
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (searchQuery) {
        query = query.or(`service.name.ilike.%${searchQuery}%,service.description.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query.order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      setServices(data as ClientService[]);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error",
        description: "Could not fetch service data",
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

  const filterInvoices = (invoices: ClientService[]) => {
    return invoices.filter(invoice => {
      // Status filter
      if (statusFilter !== 'all' && invoice.status !== statusFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const searchTermLower = searchQuery.toLowerCase();
        if (
          !invoice.service?.name?.toLowerCase().includes(searchTermLower) &&
          !invoice.service?.description?.toLowerCase().includes(searchTermLower)
        ) {
          return false;
        }
      }
      
      return true;
    });
  };

  const filteredInvoices = filterInvoices(services);

  const handleViewDetails = (service: ClientService) => {
    // Navigate to the service details page or open a modal
    console.log('View service details:', service);
    toast({
      title: "Coming Soon",
      description: "Service details will be available soon",
    });
  };

  // Display loading or error state if needed
  if (userIdLoading) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        role="client"
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
        role="client"
      >
        <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Authentication Error</h2>
          <p>{userIdError}</p>
          <Button asChild variant="outline">
            <a href="/login">Log in again</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!clientId) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        role="client"
      >
        <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Client Record Not Found</h2>
          <p>Your user account is not associated with a client record</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbs={breadcrumbs}
      role="client"
      title="Service Management"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Assigned Services</h1>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search services by name, description..."
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
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
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
        
        {/* Service List */}
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent>
            <ServicesList
              services={filteredInvoices}
              isLoading={isLoading}
              onViewDetails={handleViewDetails}
              onResetFilters={resetFilters}
              hasFilters={searchQuery !== '' || statusFilter !== 'all'}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClientInvoicesPage;
