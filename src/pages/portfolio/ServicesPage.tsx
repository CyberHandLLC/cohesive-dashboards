
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { useServiceTiers, ServiceTier } from '@/hooks/useServiceTiers';
import { ServicesTable } from '@/components/portfolio/ServicesTable';
import { ServiceFormDialog } from '@/components/portfolio/ServiceFormDialog';
import { ServiceDeleteDialog } from '@/components/portfolio/ServiceDeleteDialog';
import { ServiceTierFormDialog } from '@/components/portfolio/ServiceTierFormDialog';
import { ServiceTierDeleteDialog } from '@/components/portfolio/ServiceTierDeleteDialog';

const ServicesPage = () => {
  const {
    services,
    isLoading,
    createService,
    updateService,
    deleteService,
    isAddDialogOpen,
    setIsAddDialogOpen,
    editingService,
    setEditingService,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    serviceToDelete,
    setServiceToDelete,
  } = useServices();

  // State for service tiers management
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [isTierDialogOpen, setIsTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<ServiceTier | null>(null);
  const [isTierDeleteDialogOpen, setIsTierDeleteDialogOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<ServiceTier | null>(null);

  // Track loaded tiers for services
  const [loadedTiers, setLoadedTiers] = useState<Record<string, ServiceTier[]>>({});
  const [loadingTiers, setLoadingTiers] = useState<Record<string, boolean>>({});

  // Load service tiers when a service is expanded
  const handleServiceExpand = async (serviceId: string) => {
    if (loadedTiers[serviceId] || loadingTiers[serviceId]) return;
    
    setLoadingTiers(prev => ({ ...prev, [serviceId]: true }));
    
    try {
      const { data, error } = await supabase
        .from('ServiceTier')
        .select('*')
        .eq('serviceId', serviceId)
        .order('price');
      
      if (error) throw error;
      
      setLoadedTiers(prev => ({ 
        ...prev, 
        [serviceId]: data as ServiceTier[]
      }));
    } catch (error) {
      console.error('Error loading service tiers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load service tiers',
        variant: 'destructive',
      });
    } finally {
      setLoadingTiers(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  // Handle adding a new service tier
  const handleAddTier = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setEditingTier(null);
    setIsTierDialogOpen(true);
  };

  // Handle editing a service tier
  const handleEditTier = (tier: ServiceTier) => {
    setSelectedServiceId(tier.serviceId);
    setEditingTier(tier);
    setIsTierDialogOpen(true);
  };

  // Handle deleting a service tier
  const handleDeleteTier = (tier: ServiceTier) => {
    setTierToDelete(tier);
    setIsTierDeleteDialogOpen(true);
  };

  // Custom hook for the selected service's tiers
  const {
    createTier,
    updateTier,
    deleteTier,
  } = useServiceTiers(selectedServiceId || undefined);

  // Handlers for service tier operations
  const handleCreateTier = (values: any) => {
    createTier(values, {
      onSuccess: () => {
        setIsTierDialogOpen(false);
        if (selectedServiceId) {
          // Refresh the tiers for this service
          handleServiceExpand(selectedServiceId);
        }
      }
    });
  };

  const handleUpdateTier = (values: any) => {
    if (editingTier) {
      updateTier({
        id: editingTier.id,
        updates: values
      }, {
        onSuccess: () => {
          setIsTierDialogOpen(false);
          setEditingTier(null);
          if (selectedServiceId) {
            // Refresh the tiers for this service
            handleServiceExpand(selectedServiceId);
          }
        }
      });
    }
  };

  const handleDeleteTierConfirm = () => {
    if (tierToDelete) {
      deleteTier(tierToDelete.id, {
        onSuccess: () => {
          setIsTierDeleteDialogOpen(false);
          setTierToDelete(null);
          if (selectedServiceId) {
            // Refresh the tiers for this service
            handleServiceExpand(selectedServiceId);
          }
        }
      });
    }
  };

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Portfolio', href: '/admin/portfolio' },
    { label: 'Services' }
  ];

  // Import required dependencies at the top
  const { supabase } = require('@/integrations/supabase/client');
  const { toast } = require('@/components/ui/use-toast');

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Services Management</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Service
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-6 text-center text-muted-foreground">Loading services...</div>
            ) : (
              <ServicesTable 
                services={services || []} 
                tiers={loadedTiers}
                loadingTiers={loadingTiers}
                onEdit={(service) => setEditingService(service)} 
                onDelete={(service) => {
                  setServiceToDelete(service);
                  setIsDeleteDialogOpen(true);
                }}
                onAddTier={handleAddTier}
                onEditTier={handleEditTier}
                onDeleteTier={handleDeleteTier}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Service Dialog */}
      <ServiceFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={(values) => createService(values)}
        title="Add Service"
      />

      {/* Edit Service Dialog */}
      <ServiceFormDialog
        open={!!editingService}
        onOpenChange={(open) => !open && setEditingService(null)}
        onSubmit={(values) => editingService && updateService({ id: editingService.id, updates: values })}
        initialData={editingService}
        title="Edit Service"
      />

      {/* Delete Service Dialog */}
      <ServiceDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        service={serviceToDelete}
        onConfirm={() => {
          if (serviceToDelete) {
            deleteService(serviceToDelete.id);
          }
        }}
      />

      {/* Service Tier Dialogs */}
      {selectedServiceId && (
        <>
          <ServiceTierFormDialog
            open={isTierDialogOpen}
            onOpenChange={setIsTierDialogOpen}
            onSubmit={editingTier ? handleUpdateTier : handleCreateTier}
            initialData={editingTier}
            title={editingTier ? "Edit Service Tier" : "Add Service Tier"}
            serviceId={selectedServiceId}
          />

          <ServiceTierDeleteDialog
            open={isTierDeleteDialogOpen}
            onOpenChange={setIsTierDeleteDialogOpen}
            tier={tierToDelete}
            onConfirm={handleDeleteTierConfirm}
          />
        </>
      )}
    </DashboardLayout>
  );
};

export default ServicesPage;
