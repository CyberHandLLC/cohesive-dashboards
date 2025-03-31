
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, UserPlus } from 'lucide-react';
import ServiceRequestTable from '@/components/admin/ServiceRequestTable';
import ClientOnboardingDialog from '@/components/admin/ClientOnboardingDialog';
import { ServiceRequest } from '@/types/service-request';

const ServiceRequestsPage = () => {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [isOnboardingDialogOpen, setIsOnboardingDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [requestToReject, setRequestToReject] = useState<ServiceRequest | null>(null);
  
  const { toast } = useToast();
  
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Engagements', href: '/admin/engagements' },
    { label: 'Service Requests' }
  ];

  useEffect(() => {
    fetchServiceRequests();
  }, [statusFilter, searchQuery]);

  const fetchServiceRequests = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('ServiceRequest')
        .select(`
          *,
          service:serviceId(name, price, features)
        `);
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (searchQuery) {
        query = query.or(
          `firstName.ilike.%${searchQuery}%,lastName.ilike.%${searchQuery}%,companyName.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
        );
      }
      
      const { data, error } = await query.order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      setServiceRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching service requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load service requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessRequest = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setIsOnboardingDialogOpen(true);
  };

  const handleRejectRequest = async () => {
    if (!requestToReject) return;
    
    try {
      const { error } = await supabase
        .from('ServiceRequest')
        .update({
          status: 'REJECTED',
          processedAt: new Date().toISOString(),
        })
        .eq('id', requestToReject.id);
      
      if (error) throw error;
      
      toast({
        title: 'Request rejected',
        description: 'The service request has been marked as rejected',
      });
      
      setIsRejectDialogOpen(false);
      fetchServiceRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject the request',
        variant: 'destructive',
      });
    }
  };
  
  const openRejectDialog = (request: ServiceRequest) => {
    setRequestToReject(request);
    setIsRejectDialogOpen(true);
  };

  const handleViewDetails = (request: ServiceRequest) => {
    // For now, just process the request when clicking on the row
    handleProcessRequest(request);
  };
  
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
      title="Service Requests"
    >
      <div className="space-y-6">
        {/* Header and Filters */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Service Requests</h1>
            <p className="text-muted-foreground">
              Manage and process service requests from users
            </p>
          </div>
          
          <Button variant="default" onClick={() => setIsOnboardingDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add New Client
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search requests by name, company..."
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
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
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

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Service Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceRequestTable
              data={serviceRequests}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onProcess={handleProcessRequest}
              onReject={openRejectDialog}
              onViewDetails={handleViewDetails}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Client Onboarding Dialog */}
      <ClientOnboardingDialog
        open={isOnboardingDialogOpen}
        onOpenChange={setIsOnboardingDialogOpen}
        serviceRequestData={selectedRequest}
        onSuccess={fetchServiceRequests}
      />
      
      {/* Reject Confirmation Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Service Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this service request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectRequest} className="bg-red-600 hover:bg-red-700">
              Reject Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ServiceRequestsPage;
