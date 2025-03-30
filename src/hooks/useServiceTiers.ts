
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';

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
      const { error } = await supabase
        .from('ServiceTier')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      if (serviceId) {
        queryClient.invalidateQueries({ queryKey: ['serviceTiers', serviceId] });
      }
      toast({
        title: 'Service tier deleted',
        description: 'The service tier has been deleted successfully',
      });
      setIsDeleteDialogOpen(false);
      setTierToDelete(null);
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
  };
};
