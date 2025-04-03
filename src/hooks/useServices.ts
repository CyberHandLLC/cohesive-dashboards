import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Category } from './useCategories';

export type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  monthlyPrice: number | null;
  categoryId: string;
  features: string[];
  customFields?: Record<string, any> | null;
  availability?: 'ACTIVE' | 'DISCONTINUED' | 'COMING_SOON';
  createdAt: string;
  updatedAt: string;
  category?: Category;
};

export type ServiceInput = {
  name: string;
  description?: string | null;
  price?: number | null;
  monthlyPrice?: number | null;
  categoryId: string;
  features: string[];
  customFields?: Record<string, any> | null;
  availability?: 'ACTIVE' | 'DISCONTINUED' | 'COMING_SOON';
};

export const useServices = (filters?: { categoryId?: string; searchTerm?: string }) => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState(filters?.searchTerm || '');
  const [clientCounts, setClientCounts] = useState<Record<string, number>>({});

  // Fetch all services with their categories
  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services', filters?.categoryId, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('Service')
        .select(`
          *,
          category:Category(*)
        `);
      
      // Apply filters
      if (filters?.categoryId) {
        query = query.eq('categoryId', filters.categoryId);
      }
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      
      // Get client usage counts
      const serviceIds = (data as Service[]).map(service => service.id);
      if (serviceIds.length > 0) {
        // Process in smaller batches to avoid URL length limits
        const batchSize = 5;
        const batches: string[][] = [];
        
        // Split serviceIds into smaller batches
        for (let i = 0; i < serviceIds.length; i += batchSize) {
          batches.push(serviceIds.slice(i, i + batchSize));
        }
        
        const countsByServiceId: Record<string, number> = {};
        
        // Set initial count of 0 for all services
        serviceIds.forEach(id => {
          countsByServiceId[id] = 0;
        });
        
        // Process each batch
        for (const batch of batches) {
          for (const serviceId of batch) {
            try {
              // Count active client services for this service ID
              const { count, error } = await supabase
                .from('ClientService')
                .select('*', { count: 'exact', head: true })
                .eq('serviceId', serviceId)
                .eq('status', 'ACTIVE');
                
              if (!error && count !== null) {
                countsByServiceId[serviceId] = count;
              }
            } catch (error) {
              console.error(`Error counting clients for service ${serviceId}:`, error);
            }
          }
        }
        
        setClientCounts(countsByServiceId);
      }
      
      return data as Service[];
    }
  });

  // Create a new service
  const createMutation = useMutation({
    mutationFn: async (newService: ServiceInput) => {
      const { data, error } = await supabase
        .from('Service')
        .insert([newService])
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Service created',
        description: 'The service has been created successfully',
      });
      setIsAddDialogOpen(false);
      
      // Log action in audit log
      supabase
        .from('AuditLog')
        .insert({
          action: 'CREATE',
          resource: 'SERVICE',
          userId: (await supabase.auth.getUser()).data?.user?.id || '',
          details: { message: 'Service created' }
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error logging action:', error);
          }
        });
    },
    onError: (error) => {
      console.error('Error creating service:', error);
      toast({
        title: 'Error',
        description: 'Failed to create service',
        variant: 'destructive',
      });
    }
  });

  // Update a service
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: ServiceInput }) => {
      const { data, error } = await supabase
        .from('Service')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Service updated',
        description: 'The service has been updated successfully',
      });
      setEditingService(null);
      
      // Log action in audit log
      supabase
        .from('AuditLog')
        .insert({
          action: 'UPDATE',
          resource: 'SERVICE',
          userId: (await supabase.auth.getUser()).data?.user?.id || '',
          details: { message: 'Service updated' }
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error logging action:', error);
          }
        });
    },
    onError: (error) => {
      console.error('Error updating service:', error);
      toast({
        title: 'Error',
        description: 'Failed to update service',
        variant: 'destructive',
      });
    }
  });

  // Delete a service
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if there are client services using this service
      const { count: clientServiceCount, error: countError } = await supabase
        .from('ClientService')
        .select('*', { count: 'exact', head: true })
        .eq('serviceId', id);
      
      if (countError) throw countError;
      
      // Get all service requests for this service for logging
      const { data: serviceRequests, error: serviceRequestError } = await supabase
        .from('ServiceRequest')
        .select('id, status')
        .eq('serviceid', id);
      
      if (serviceRequestError) throw serviceRequestError;
      
      const serviceRequestCount = serviceRequests?.length || 0;
      
      // Check for non-approved service requests
      const pendingRequests = serviceRequests?.filter(req => req.status !== 'APPROVED') || [];
      if (pendingRequests.length > 0) {
        throw new Error(`Cannot delete service: It has ${pendingRequests.length} pending or non-approved service ${pendingRequests.length === 1 ? 'request' : 'requests'}.`);
      }
      
      // Delete all service requests for this service
      if (serviceRequestCount > 0) {
        const { error: deleteRequestsError } = await supabase
          .from('ServiceRequest')
          .delete()
          .eq('serviceid', id);
        
        if (deleteRequestsError) {
          console.error('Error deleting service requests:', deleteRequestsError);
          throw deleteRequestsError;
        }
      }
      
      // Check if there are service tiers associated with this service
      // Delete service tiers first (cascade delete)
      const { error: tierDeleteError } = await supabase
        .from('ServiceTier')
        .delete()
        .eq('serviceId', id);
      
      if (tierDeleteError) throw tierDeleteError;
      
      // Delete the service
      const { error } = await supabase
        .from('Service')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, clientServiceCount, serviceRequestCount };
    },
    onSuccess: async ({ id, clientServiceCount, serviceRequestCount }) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      
      let message = 'The service has been deleted successfully';
      if (clientServiceCount && clientServiceCount > 0) {
        message += `. ${clientServiceCount} client ${clientServiceCount === 1 ? 'subscription was' : 'subscriptions were'} affected.`;
      }
      if (serviceRequestCount > 0) {
        message += ` ${serviceRequestCount} service ${serviceRequestCount === 1 ? 'request was' : 'requests were'} also removed.`;
      }
      
      toast({
        title: 'Service deleted',
        description: message,
      });
      
      setIsDeleteDialogOpen(false);
      setServiceToDelete(null);
      
      // Log action in audit log
      await supabase
        .from('AuditLog')
        .insert({
          action: 'DELETE',
          resource: 'SERVICE',
          userId: (await supabase.auth.getUser()).data?.user?.id || '',
          details: { 
            message: 'Service deleted', 
            clientServicesAffected: clientServiceCount || 0,
            serviceRequestsRemoved: serviceRequestCount || 0
          }
        });
    },
    onError: (error) => {
      console.error('Error deleting service:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete service',
        variant: 'destructive',
      });
    }
  });

  // Get service client usage count
  const getServiceClientCount = async (serviceId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('ClientService')
        .select('*', { count: 'exact', head: true })
        .eq('serviceId', serviceId)
        .eq('status', 'ACTIVE');
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting service client count:', error);
      return 0;
    }
  };

  // Get service tier count
  const getServiceTierCount = async (serviceId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('ServiceTier')
        .select('*', { count: 'exact', head: true })
        .eq('serviceId', serviceId);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting service tier count:', error);
      return 0;
    }
  };

  return {
    services,
    isLoading,
    error,
    createService: createMutation.mutate,
    updateService: updateMutation.mutate,
    deleteService: deleteMutation.mutate,
    isAddDialogOpen,
    setIsAddDialogOpen,
    editingService,
    setEditingService,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    serviceToDelete,
    setServiceToDelete,
    searchTerm,
    setSearchTerm,
    clientCounts,
    getServiceClientCount,
    getServiceTierCount,
  };
};
