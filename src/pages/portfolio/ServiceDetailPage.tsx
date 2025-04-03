import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Edit, Trash2, Users, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { ServiceTierFormDialog } from '@/components/portfolio/ServiceTierFormDialog';
import { ServiceTierDeleteDialog } from '@/components/portfolio/ServiceTierDeleteDialog';
import { ServiceFormDialog } from '@/components/portfolio/ServiceFormDialog';
import { ServiceDeleteDialog } from '@/components/portfolio/ServiceDeleteDialog';
import { useServiceTiers, ServiceTier } from '@/hooks/useServiceTiers';
import { Service } from '@/hooks/useServices';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ServiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State for service management
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceClientCount, setServiceClientCount] = useState(0);
  const [serviceTierCount, setServiceTierCount] = useState(0);
  
  // State for service tiers management
  const [isTierDialogOpen, setIsTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<ServiceTier | null>(null);
  const [isTierDeleteDialogOpen, setIsTierDeleteDialogOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<ServiceTier | null>(null);
  const [tierClientCount, setTierClientCount] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch the service details
  const { data: service, isLoading, error } = useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Service')
        .select(`
          *,
          category:Category(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Service;
    }
  });

  // Custom hook for the service tiers
  const {
    tiers,
    isLoading: tiersLoading,
    createTier,
    updateTier,
    deleteTier,
    getTierClientCount
  } = useServiceTiers(id);

  // Get client count for the service
  const getServiceClientCount = async (serviceId: string) => {
    try {
      const { count, error } = await supabase
        .from('ClientService')
        .select('*', { count: 'exact', head: true })
        .eq('serviceId', serviceId)
        .eq('status', 'ACTIVE');
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching client count:', error);
      return 0;
    }
  };

  // Get tier count for the service
  const getServiceTierCount = async (serviceId: string) => {
    try {
      const { count, error } = await supabase
        .from('ServiceTier')
        .select('*', { count: 'exact', head: true })
        .eq('serviceId', serviceId);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching tier count:', error);
      return 0;
    }
  };

  // Update client counts
  useEffect(() => {
    if (id) {
      const fetchCounts = async () => {
        const clientCount = await getServiceClientCount(id);
        const tierCount = await getServiceTierCount(id);
        setServiceClientCount(clientCount);
        setServiceTierCount(tierCount);
      };
      
      fetchCounts();
    }
  }, [id]);

  // Update service
  const handleUpdateService = async (updates: any) => {
    try {
      // Remove the availability field since it doesn't exist in the database
      const { availability, ...validUpdates } = updates;
      
      const { data, error } = await supabase
        .from('Service')
        .update(validUpdates)
        .eq('id', id as string)
        .select();
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      toast({
        title: 'Service updated',
        description: 'The service has been updated successfully',
      });
      setIsEditDialogOpen(false);
      
      // Log action in audit log
      await supabase
        .from('AuditLog')
        .insert({
          action: 'UPDATE',
          resource: 'SERVICE',
          userId: (await supabase.auth.getUser()).data?.user?.id || '',
          details: { message: 'Service updated' }
        });
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: 'Error',
        description: 'Failed to update service',
        variant: 'destructive',
      });
    }
  };

  // Delete service
  const handleDeleteServiceConfirm = async () => {
    try {
      const { error } = await supabase
        .from('Service')
        .delete()
        .eq('id', id as string);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Service deleted',
        description: 'The service has been deleted successfully',
      });
      
      // Log action in audit log
      await supabase
        .from('AuditLog')
        .insert({
          action: 'DELETE',
          resource: 'SERVICE',
          userId: (await supabase.auth.getUser()).data?.user?.id || '',
          details: { message: 'Service deleted' }
        });
      
      // Navigate back to services list
      navigate('/admin/portfolio/services');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete service',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle adding a new service tier
  const handleAddTier = () => {
    setEditingTier(null);
    setIsTierDialogOpen(true);
  };

  // Handle editing a service tier
  const handleEditTier = (tier: ServiceTier) => {
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

  // Handlers for service tier operations
  const handleCreateTier = (values: any) => {
    createTier(values);
    setIsTierDialogOpen(false);
    
    // Refresh the tiers
    queryClient.invalidateQueries({ queryKey: ['serviceTiers', id] });
  };

  const handleUpdateTier = (values: any) => {
    if (editingTier) {
      updateTier({
        id: editingTier.id,
        updates: values
      });
      setIsTierDialogOpen(false);
      setEditingTier(null);
      
      // Refresh the tiers
      queryClient.invalidateQueries({ queryKey: ['serviceTiers', id] });
    }
  };

  const handleDeleteTierConfirm = () => {
    if (tierToDelete) {
      deleteTier(tierToDelete.id);
      setIsTierDeleteDialogOpen(false);
      setTierToDelete(null);
      
      // Refresh the tiers
      queryClient.invalidateQueries({ queryKey: ['serviceTiers', id] });
    }
  };

  // Client usage for service tiers
  const handleTierClientUsageClick = async (tierId: string) => {
    navigate(`/admin/accounts/clients?tierId=${tierId}`);
  };

  // Client usage for service
  const handleClientUsageClick = async () => {
    navigate(`/admin/accounts/clients?serviceId=${id}`);
  };

  // Define breadcrumbs for navigation
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Portfolio', href: '/admin/portfolio' },
    { label: 'Services', href: '/admin/portfolio/services' },
    { label: service?.name || 'Service Details' }
  ];

  if (isLoading) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs} role="admin">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center py-8">
                <p>Loading service details...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !service) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs} role="admin">
        <div className="space-y-6">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Service not found</AlertTitle>
            <AlertDescription>
              The service could not be found. It may have been deleted or you may not have permission to view it.
            </AlertDescription>
          </Alert>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center py-4">
                <Button onClick={() => navigate('/admin/portfolio/services')}>
                  Back to Services
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} role="admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold">{service.name}</h1>
            {service.availability && (
              <Badge variant={
                service.availability === 'ACTIVE' ? 'success' :
                service.availability === 'DISCONTINUED' ? 'outline' : 'secondary'
              }>
                {service.availability}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Service
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview" className="flex-1 sm:flex-initial">Overview</TabsTrigger>
            <TabsTrigger value="tiers" className="flex-1 sm:flex-initial">
              Service Tiers ({serviceTierCount})
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex-1 sm:flex-initial">
              Client Usage ({serviceClientCount})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
                <CardDescription>Overview of the service configuration and details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-1">Description</h3>
                    <p className="text-sm sm:text-base">{service.description || 'No description provided'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Category</h3>
                    <p className="text-sm sm:text-base">{service.category?.name || 'Uncategorized'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Price</h3>
                    <p className="text-sm sm:text-base">{service.price !== null ? formatCurrency(service.price) : 'Not set'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Monthly Price</h3>
                    <p className="text-sm sm:text-base">{service.monthlyPrice !== null ? formatCurrency(service.monthlyPrice) : 'Not set'}</p>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div>
                  <h3 className="font-semibold mb-3">Features</h3>
                  {service.features && service.features.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {service.features.map((feature, idx) => (
                        <Badge key={idx} variant="outline">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No features listed</p>
                  )}
                </div>
                
                {service.customFields && Object.keys(service.customFields).length > 0 && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h3 className="font-semibold mb-3">Custom Fields</h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(service.customFields).map(([key, value]) => (
                          <div key={key}>
                            <dt className="text-sm font-medium text-muted-foreground">{key}</dt>
                            <dd className="text-sm sm:text-base">{String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </>
                )}
                
                <Separator className="my-6" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">Metadata</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Created: {new Date(service.createdAt).toLocaleString()}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Last Updated: {new Date(service.updatedAt).toLocaleString()}</p>
                  </div>
                  
                  <Button 
                    onClick={handleClientUsageClick}
                    variant="outline"
                    disabled={serviceClientCount === 0}
                    className="mt-2 sm:mt-0"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    View Client Usage ({serviceClientCount})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tiers" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Service Tiers</CardTitle>
                  <CardDescription className="mt-1">Different pricing tiers available for this service</CardDescription>
                </div>
                <Button onClick={handleAddTier} className="mt-2 sm:mt-0">
                  <Plus className="mr-2 h-4 w-4" /> Add Tier
                </Button>
              </CardHeader>
              <CardContent>
                {tiersLoading ? (
                  <div className="flex justify-center py-8">
                    <p>Loading tiers...</p>
                  </div>
                ) : !tiers || tiers.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">No tiers for this service</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Monthly Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Client Usage</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tiers.map((tier) => (
                          <TableRow key={tier.id}>
                            <TableCell className="font-medium">
                              <div>
                                {tier.name}
                                {tier.features && tier.features.length > 0 && (
                                  <div className="text-xs text-muted-foreground mt-1 space-x-1">
                                    {tier.features.slice(0, 2).map((feature, idx) => (
                                      <Badge key={idx} variant="outline" className="mr-1">
                                        {feature}
                                      </Badge>
                                    ))}
                                    {tier.features.length > 2 && (
                                      <Badge variant="outline">+{tier.features.length - 2} more</Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(tier.price)}</TableCell>
                            <TableCell>{tier.monthlyPrice !== null ? formatCurrency(tier.monthlyPrice) : '-'}</TableCell>
                            <TableCell>
                              <Badge variant={
                                tier.availability === 'ACTIVE' ? 'success' :
                                tier.availability === 'DISCONTINUED' ? 'outline' : 'secondary'
                              }>
                                {tier.availability}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTierClientUsageClick(tier.id)}
                              >
                                <Users className="h-4 w-4 mr-1" />
                                {/* We would need to fetch client counts for each tier here */}
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditTier(tier)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteTier(tier)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Client Usage</CardTitle>
                <CardDescription>Information about clients using this service</CardDescription>
              </CardHeader>
              <CardContent>
                {serviceClientCount === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    This service is not currently being used by any clients.
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p>This service is being used by {serviceClientCount} clients.</p>
                    <Button 
                      onClick={handleClientUsageClick}
                      className="mt-4"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      View Client List
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Service edit dialog */}
      <ServiceFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateService}
        initialData={service}
        title="Edit Service"
      />
      
      {/* Service delete dialog */}
      <ServiceDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteServiceConfirm}
        service={service}
        clientCount={serviceClientCount}
        tierCount={serviceTierCount}
      />
      
      {/* Service tier form dialog */}
      <ServiceTierFormDialog
        open={isTierDialogOpen}
        onOpenChange={(open) => {
          setIsTierDialogOpen(open);
          if (!open) setEditingTier(null);
        }}
        onSubmit={editingTier ? handleUpdateTier : handleCreateTier}
        initialValues={editingTier || { serviceId: id }}
        mode={editingTier ? 'edit' : 'add'}
      />
      
      {/* Service tier delete dialog */}
      <ServiceTierDeleteDialog
        open={isTierDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsTierDeleteDialogOpen(open);
          if (!open) setTierToDelete(null);
        }}
        onConfirm={handleDeleteTierConfirm}
        tier={tierToDelete}
        clientCount={tierClientCount}
      />
    </DashboardLayout>
  );
};

export default ServiceDetailPage;
