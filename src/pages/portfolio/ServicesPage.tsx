
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { useServiceTiers, ServiceTier } from '@/hooks/useServiceTiers';
import { ServicesTable } from '@/components/portfolio/ServicesTable';
import { ServiceFormDialog } from '@/components/portfolio/ServiceFormDialog';
import { ServiceDeleteDialog } from '@/components/portfolio/ServiceDeleteDialog';
import { ServiceTierFormDialog } from '@/components/portfolio/ServiceTierFormDialog';
import { ServiceTierDeleteDialog } from '@/components/portfolio/ServiceTierDeleteDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';

const ServicesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryIdFromUrl = searchParams.get('categoryId');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const { categories } = useCategories();

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
    getServiceClientCount,
    getServiceTierCount
  } = useServices({
    categoryId: categoryIdFromUrl || undefined,
    searchTerm
  });

  // State for service tiers management
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [isTierDialogOpen, setIsTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<ServiceTier | null>(null);
  const [isTierDeleteDialogOpen, setIsTierDeleteDialogOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<ServiceTier | null>(null);
  const [serviceClientCount, setServiceClientCount] = useState<number>(0);
  const [serviceTierCount, setServiceTierCount] = useState<number>(0);
  const [tierClientCount, setTierClientCount] = useState<number>(0);

  // Track loaded tiers for services
  const [loadedTiers, setLoadedTiers] = useState<Record<string, ServiceTier[]>>({});
  const [loadingTiers, setLoadingTiers] = useState<Record<string, boolean>>({});
  const [clientCounts, setClientCounts] = useState<Record<string, number>>({});
  const [tierClientCounts, setTierClientCounts] = useState<Record<string, number>>({});

  // Custom hook for the selected service's tiers
  const {
    tiers,
    createTier,
    updateTier,
    deleteTier,
    getTierClientCount
  } = useServiceTiers(selectedServiceId || undefined);

  // Update search params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (categoryIdFromUrl) {
      params.set('categoryId', categoryIdFromUrl);
    }
    if (searchTerm) {
      params.set('search', searchTerm);
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    navigate(`/admin/portfolio/services${newUrl}`, { replace: true });
  }, [categoryIdFromUrl, searchTerm, navigate]);

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

      // Get client counts for each tier
      const newTierClientCounts: Record<string, number> = {};
      for (const tier of data) {
        const count = await getTierClientCount(tier.id);
        newTierClientCounts[tier.id] = count;
      }
      setTierClientCounts(prev => ({
        ...prev,
        ...newTierClientCounts
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

  // Update client counts for services
  useEffect(() => {
    const fetchClientCounts = async () => {
      if (!services) return;
      
      const counts: Record<string, number> = {};
      for (const service of services) {
        const count = await getServiceClientCount(service.id);
        counts[service.id] = count;
      }
      setClientCounts(counts);
    };
    
    fetchClientCounts();
  }, [services, getServiceClientCount]);

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
  const handleDeleteTier = async (tier: ServiceTier) => {
    const clientCount = await getTierClientCount(tier.id);
    setTierClientCount(clientCount);
    setTierToDelete(tier);
    setIsTierDeleteDialogOpen(true);
  };

  // Handle deleting a service with checks
  const handleDeleteService = async (service: ServiceTier) => {
    // Get client and tier counts for warnings
    const clientCount = await getServiceClientCount(service.id);
    const tierCount = await getServiceTierCount(service.id);
    
    setServiceClientCount(clientCount);
    setServiceTierCount(tierCount);
    setServiceToDelete(service);
    setIsDeleteDialogOpen(true);
  };

  // Handlers for service tier operations
  const handleCreateTier = (values: any) => {
    createTier(values);
    setIsTierDialogOpen(false);
    
    // Refresh the tiers for this service
    if (selectedServiceId) {
      // Give the database a moment to update
      setTimeout(() => {
        handleServiceExpand(selectedServiceId);
      }, 500);
    }
  };

  const handleUpdateTier = (values: any) => {
    if (editingTier) {
      updateTier({
        id: editingTier.id,
        updates: values
      });
      setIsTierDialogOpen(false);
      setEditingTier(null);
      
      // Refresh the tiers for this service
      if (selectedServiceId) {
        // Give the database a moment to update
        setTimeout(() => {
          handleServiceExpand(selectedServiceId);
        }, 500);
      }
    }
  };

  const handleDeleteTierConfirm = () => {
    if (tierToDelete) {
      deleteTier(tierToDelete.id);
      setIsTierDeleteDialogOpen(false);
      setTierToDelete(null);
      
      // Refresh the tiers for this service
      if (selectedServiceId) {
        // Give the database a moment to update
        setTimeout(() => {
          handleServiceExpand(selectedServiceId);
        }, 500);
      }
    }
  };

  const handleClientUsageClick = (serviceId: string) => {
    if (clientCounts[serviceId] && clientCounts[serviceId] > 0) {
      navigate(`/admin/accounts/clients?serviceId=${serviceId}`);
    }
  };

  const handleTierClientUsageClick = (tierId: string) => {
    if (tierClientCounts[tierId] && tierClientCounts[tierId] > 0) {
      navigate(`/admin/accounts/clients?tierId=${tierId}`);
    }
  };

  const handleFilterByCategory = (categoryId: string) => {
    navigate(`/admin/portfolio/services?categoryId=${categoryId}`);
  };

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Portfolio', href: '/admin/portfolio' },
    { label: 'Services' }
  ];

  // Get selected category name for display
  const selectedCategoryName = categoryIdFromUrl && categories 
    ? categories.find(c => c.id === categoryIdFromUrl)?.name || 'Unknown Category' 
    : null;

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              Services Management
              {selectedCategoryName && (
                <span className="text-muted-foreground text-lg ml-2">
                  — {selectedCategoryName}
                </span>
              )}
            </h1>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/admin/portfolio/services')}>
                  All Categories
                </DropdownMenuItem>
                {categories?.map((category) => (
                  <DropdownMenuItem 
                    key={category.id} 
                    onClick={() => handleFilterByCategory(category.id)}
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Service
            </Button>
          </div>
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
                clientCounts={clientCounts}
                tierClientCounts={tierClientCounts}
                loadingTiers={loadingTiers}
                onEdit={(service) => setEditingService(service)} 
                onDelete={handleDeleteService}
                onAddTier={handleAddTier}
                onEditTier={handleEditTier}
                onDeleteTier={handleDeleteTier}
                searchQuery={searchTerm}
                onSearchChange={setSearchTerm}
                onClientUsageClick={handleClientUsageClick}
                onTierClientUsageClick={handleTierClientUsageClick}
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
        clientCount={serviceClientCount}
        tierCount={serviceTierCount}
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
            clientCount={tierClientCount}
            onConfirm={handleDeleteTierConfirm}
          />
        </>
      )}
    </DashboardLayout>
  );
};

export default ServicesPage;
