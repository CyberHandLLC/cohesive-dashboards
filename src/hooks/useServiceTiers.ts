
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export type ServiceTier = {
  id: string;
  name: string;
  description: string | null;
  features: string[];
  price: number;
  monthlyPrice: number | null;
  serviceId: string;
  availability: 'ACTIVE' | 'DISCONTINUED' | 'COMING_SOON';
  createdAt: string;
  updatedAt: string;
};

export type ServiceTierInput = {
  name: string;
  description?: string | null;
  features: string[];
  price: number;
  monthlyPrice?: number | null;
  serviceId: string;
  availability?: 'ACTIVE' | 'DISCONTINUED' | 'COMING_SOON';
};

export const useServiceTiers = (serviceId?: string) => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<ServiceTier | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState<ServiceTier | null>(null);
  const [clientCounts, setClientCounts] = useState<Record<string, number>>({});

  // Fetch tiers for a specific service
  const { data: tiers, isLoading, error } = useQuery({
    queryKey: ['serviceTiers', serviceId],
    queryFn: async () => {
      if (!serviceId) return [];
      
      const { data, error } = await supabase
        .from('ServiceTier')
        .select('*')
        .eq('serviceId', serviceId)
        .order('price');
      
      if (error) throw error;
      
      // Get client usage counts for each tier
      const tierIds = (data as ServiceTier[]).map(tier => tier.id);
      if (tierIds.length > 0) {
        const { data: clientTierCounts, error: countError } = await supabase
          .from('ClientTier')
          .select('tierId, count')
          .in('tierId', tierIds)
          .eq('status', 'ACTIVE')
          .then(result => {
            if (result.error) return { data: null, error: result.error };
            
            // Process results to get counts by tierId
            const countsByTierId: Record<string, number> = {};
            result.data.forEach(row => {
              countsByTierId[row.tierId] = parseInt(row.count);
            });
            
            return { data: countsByTierId, error: null };
          });
          
        if (!countError && clientTierCounts) {
          setClientCounts(clientTierCounts);
        }
      }
      
      return data as ServiceTier[];
    },
    enabled: !!serviceId
  });

  // Create a new tier
  const createMutation = useMutation({
    mutationFn: async (newTier: ServiceTierInput) => {
      const { data, error } = await supabase
        .from('ServiceTier')
        .insert([newTier])
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      if (serviceId) {
        queryClient.invalidateQueries({ queryKey: ['serviceTiers', serviceId] });
      }
      toast({
        title: 'Service tier created',
        description: 'The service tier has been created successfully',
      });
      setIsAddDialogOpen(false);
      
      // Log action in audit log
      supabase
        .from('AuditLog')
        .insert({
          action: 'CREATE',
          resource: 'SERVICE_TIER',
          userId: supabase.auth.getUser()?.data?.user?.id || '',
          details: { message: 'Service tier created' }
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error logging action:', error);
          }
        });
    },
    onError: (error) => {
      console.error('Error creating service tier:', error);
      toast({
        title: 'Error',
        description: 'Failed to create service tier',
        variant: 'destructive',
      });
    }
  });

  // Update a tier
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<ServiceTierInput> }) => {
      const { data, error } = await supabase
        .from('ServiceTier')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      if (serviceId) {
        queryClient.invalidateQueries({ queryKey: ['serviceTiers', serviceId] });
      }
      toast({
        title: 'Service tier updated',
        description: 'The service tier has been updated successfully',
      });
      setEditingTier(null);
      
      // Log action in audit log
      supabase
        .from('AuditLog')
        .insert({
          action: 'UPDATE',
          resource: 'SERVICE_TIER',
          userId: supabase.auth.getUser()?.data?.user?.id || '',
          details: { message: 'Service tier updated' }
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error logging action:', error);
          }
        });
    },
    onError: (error) => {
      console.error('Error updating service tier:', error);
      toast({
        title: 'Error',
        description: 'Failed to update service tier',
        variant: 'destructive',
      });
    }
  });

  // Delete a tier
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if there are client tiers using this tier
      const { count: clientTierCount, error: countError } = await supabase
        .from('ClientTier')
        .select('*', { count: 'exact', head: true })
        .eq('tierId', id);
      
      if (countError) throw countError;
      
      const { error } = await supabase
        .from('ServiceTier')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, clientTierCount };
    },
    onSuccess: ({ id, clientTierCount }) => {
      if (serviceId) {
        queryClient.invalidateQueries({ queryKey: ['serviceTiers', serviceId] });
      }
      
      let message = 'The service tier has been deleted successfully';
      if (clientTierCount && clientTierCount > 0) {
        message += `. ${clientTierCount} client ${clientTierCount === 1 ? 'subscription was' : 'subscriptions were'} affected.`;
      }
      
      toast({
        title: 'Service tier deleted',
        description: message,
      });
      setIsDeleteDialogOpen(false);
      setTierToDelete(null);
      
      // Log action in audit log
      supabase
        .from('AuditLog')
        .insert({
          action: 'DELETE',
          resource: 'SERVICE_TIER',
          userId: supabase.auth.getUser()?.data?.user?.id || '',
          details: { 
            message: 'Service tier deleted',
            clientTiersAffected: clientTierCount || 0
          }
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error logging action:', error);
          }
        });
    },
    onError: (error) => {
      console.error('Error deleting service tier:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete service tier',
        variant: 'destructive',
      });
    }
  });

  // Get tier client count
  const getTierClientCount = async (tierId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('ClientTier')
        .select('*', { count: 'exact', head: true })
        .eq('tierId', tierId)
        .eq('status', 'ACTIVE');
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting tier client count:', error);
      return 0;
    }
  };

  return {
    tiers,
    isLoading,
    error,
    createTier: createMutation.mutate,
    updateTier: updateMutation.mutate,
    deleteTier: deleteMutation.mutate,
    isAddDialogOpen,
    setIsAddDialogOpen,
    editingTier,
    setEditingTier,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    tierToDelete,
    setTierToDelete,
    clientCounts,
    getTierClientCount,
  };
};
