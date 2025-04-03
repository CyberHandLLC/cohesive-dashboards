import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BarChart2, Calendar } from 'lucide-react';
import { useClientId } from '@/hooks/useClientId';
import { useClientServices } from '@/hooks/useClientServices';
import { supabase } from '@/integrations/supabase/client';
import ServiceFilters from '@/components/client/ServiceFilters';
import ServicesList from '@/components/client/ServicesList';
import ServiceDetailsDialog from '@/components/client/ServiceDetailsDialog';
import AvailableServicesDialog from '@/components/client/AvailableServicesDialog';
import { useToast } from '@/hooks/use-toast';

const ClientServicesPage = () => {
  const { clientId, isLoading: clientIdLoading, error: clientIdError } = useClientId();
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const { toast } = useToast();
  
  const {
    services,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedService,
    setSelectedService,
    isDetailsOpen,
    setIsDetailsOpen,
    resetFilters,
    handleViewDetails
  } = useClientServices(clientId);
  
  // Fetch user data for service requests
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('User')
            .select('id, firstName, lastName, email, clientId, role')
            .eq('id', user.id)
            .single();
            
          if (error) throw error;
          
          if (data && data.clientId) {
            // Get client company name
            const { data: clientData, error: clientError } = await supabase
              .from('Client')
              .select('companyName')
              .eq('id', data.clientId)
              .single();
              
            if (clientError) throw clientError;
            
            setUserData({
              ...data,
              companyName: clientData?.companyName
            });
          } else {
            setUserData(data);
            
            // If we have a user but no client association, show a warning
            if (data.role && data.role.toUpperCase() === 'CLIENT') {
              toast({
                title: 'Account Issue',
                description: 'Your account is not properly linked to a client organization. Please contact support.',
                variant: 'destructive'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error',
          description: 'Could not load your profile information.',
          variant: 'destructive'
        });
      }
    };
    
    fetchUserData();
  }, [toast]);
  
  // Show error toast if clientId could not be retrieved
  useEffect(() => {
    if (clientIdError) {
      toast({
        title: 'Error',
        description: 'Could not determine your client organization. Some features may be limited.',
        variant: 'destructive'
      });
    }
  }, [clientIdError, toast]);
  
  const breadcrumbs = [
    { label: 'Client', href: '/client' },
    { label: 'Accounts', href: '/client/accounts' },
    { label: 'Services' }
  ];

  const hasFilters = !!(searchTerm || statusFilter);
  
  // Custom service list renderer with dashboard links
  const renderServicesList = () => {
    if (!services || services.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">You don't have any services yet.</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card key={service.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg truncate">{service.service?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-2">
                {service.service?.description || 'No description available'}
              </p>
              <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewDetails(service)}
                  >
                    Details
                  </Button>
                  {clientId && (
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/client/accounts/services/dashboard/${service.id}`}>
                          <BarChart2 className="h-4 w-4 mr-1" />
                          Dashboard
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/client/accounts/services/${service.id}/lifecycle`}>
                          <Calendar className="h-4 w-4 mr-1" />
                          Lifecycle
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    service.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                    service.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {service.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="client"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Services</h1>
          <Button 
            onClick={() => setIsAddServiceOpen(true)}
            disabled={clientIdLoading && !userData?.clientId}
          >
            <Plus className="mr-2 h-4 w-4" />
            Request Service
          </Button>
        </div>
        
        <ServiceFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onResetFilters={resetFilters}
          hasFilters={hasFilters}
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Your Services</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || clientIdLoading ? (
              <div className="text-center py-8">
                <p>Loading services...</p>
              </div>
            ) : (
              renderServicesList()
            )}
          </CardContent>
        </Card>
      </div>
      
      <ServiceDetailsDialog 
        service={selectedService}
        isOpen={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen}
      />
      
      <AvailableServicesDialog
        clientId={clientId}
        userData={userData}
        open={isAddServiceOpen}
        onOpenChange={setIsAddServiceOpen}
      />
    </DashboardLayout>
  );
};

export default ClientServicesPage;
