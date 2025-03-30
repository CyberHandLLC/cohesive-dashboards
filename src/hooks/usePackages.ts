
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export type Package = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount: number | null;
  monthlyPrice: number | null;
  services: string[];
  availability: 'ACTIVE' | 'DISCONTINUED' | 'COMING_SOON';
  customFields: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
};

export type PackageInput = {
  name: string;
  description?: string | null;
  price: number;
  discount?: number | null;
  monthlyPrice?: number | null;
  services: string[];
  availability?: 'ACTIVE' | 'DISCONTINUED' | 'COMING_SOON';
  customFields?: Record<string, any> | null;
};

export const usePackages = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);

  // Fetch all packages
  const { data: packages, isLoading, error } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Package')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Package[];
    }
  });

  // Create a new package
  const createMutation = useMutation({
    mutationFn: async (newPackage: PackageInput) => {
      const { data, error } = await supabase
        .from('Package')
        .insert([newPackage])
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast({
        title: 'Package created',
        description: 'The package has been created successfully',
      });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error creating package:', error);
      toast({
        title: 'Error',
        description: 'Failed to create package',
        variant: 'destructive',
      });
    }
  });

  // Update a package
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<PackageInput> }) => {
      const { data, error } = await supabase
        .from('Package')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast({
        title: 'Package updated',
        description: 'The package has been updated successfully',
      });
      setEditingPackage(null);
    },
    onError: (error) => {
      console.error('Error updating package:', error);
      toast({
        title: 'Error',
        description: 'Failed to update package',
        variant: 'destructive',
      });
    }
  });

  // Delete a package
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('Package')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast({
        title: 'Package deleted',
        description: 'The package has been deleted successfully',
      });
      setIsDeleteDialogOpen(false);
      setPackageToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting package:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete package',
        variant: 'destructive',
      });
    }
  });

  return {
    packages,
    isLoading,
    error,
    createPackage: createMutation.mutate,
    updatePackage: updateMutation.mutate,
    deletePackage: deleteMutation.mutate,
    isAddDialogOpen,
    setIsAddDialogOpen,
    editingPackage,
    setEditingPackage,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    packageToDelete,
    setPackageToDelete,
  };
};
