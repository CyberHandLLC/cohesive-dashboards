
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
        const { data: clientServiceCounts, error: countError } = await supabase
          .from('ClientService')
          .select('serviceId, count')
          .in('serviceId', serviceIds)
          .eq('status', 'ACTIVE')
          .then(result => {
            if (result.error) return { data: null, error: result.error };
            
            // Process results to get counts by serviceId
            const countsByServiceId: Record<string, number> = {};
            result.data.forEach(row => {
              countsByServiceId[row.serviceId] = parseInt(row.count);
            });
            
            return { data: countsByServiceId, error: null };
          });
          
        if (!countError && clientServiceCounts) {
          setClientCounts(clientServiceCounts);
        }
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
    onSuccess: () => {
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
          userId: supabase.auth.getUser()?.data?.user?.id || '',
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
    onSuccess: () => {
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
          userId: supabase.auth.getUser()?.data?.user?.id || '',
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
      
      const { error } = await supabase
        .from('Service')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, clientServiceCount };
    },
    onSuccess: ({ id, clientServiceCount }) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      
      let message = 'The service has been deleted successfully';
      if (clientServiceCount && clientServiceCount > 0) {
        message += `. ${clientServiceCount} client ${clientServiceCount === 1 ? 'subscription was' : 'subscriptions were'} affected.`;
      }
      
      toast({
        title: 'Service deleted',
        description: message,
      });
      
      setIsDeleteDialogOpen(false);
      setServiceToDelete(null);
      
      // Log action in audit log
      supabase
        .from('AuditLog')
        .insert({
          action: 'DELETE',
          resource: 'SERVICE',
          userId: supabase.auth.getUser()?.data?.user?.id || '',
          details: { 
            message: 'Service deleted', 
            clientServicesAffected: clientServiceCount || 0
          }
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error logging action:', error);
          }
        });
    },
    onError: (error) => {
      console.error('Error deleting service:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete service',
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
