
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientId } from '@/hooks/useClientId';
import { useClientServices } from '@/hooks/useClientServices';
import ServiceFilters from '@/components/client/ServiceFilters';
import ServicesList from '@/components/client/ServicesList';
import ServiceDetailsDialog from '@/components/client/ServiceDetailsDialog';

const ClientServicesPage = () => {
  const { clientId } = useClientId();
  
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
  
  const breadcrumbs = [
    { label: 'Client', href: '/client' },
    { label: 'Accounts', href: '/client/accounts' },
    { label: 'Services' }
  ];

  const hasFilters = !!(searchTerm || statusFilter);

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="client"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Services</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Services</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <ServiceFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              onReset={resetFilters}
              showResetButton={hasFilters}
            />
            
            {/* Services List */}
            <ServicesList
              services={services}
              isLoading={isLoading}
              onViewDetails={handleViewDetails}
              onResetFilters={resetFilters}
              hasFilters={hasFilters}
            />
          </CardContent>
        </Card>
      </div>

      {/* Service Details Dialog */}
      <ServiceDetailsDialog
        service={selectedService}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </DashboardLayout>
  );
};

export default ClientServicesPage;
