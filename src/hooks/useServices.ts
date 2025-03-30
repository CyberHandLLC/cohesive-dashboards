
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
};

export const useServices = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  // Fetch all services with their categories
  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Service')
        .select(`
          *,
          category:Category(*)
        `)
        .order('name');
      
      if (error) throw error;
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
      const { error } = await supabase
        .from('Service')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Service deleted',
        description: 'The service has been deleted successfully',
      });
      setIsDeleteDialogOpen(false);
      setServiceToDelete(null);
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
  };
};
