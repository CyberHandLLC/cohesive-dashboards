
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Service } from './useServices';

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

export const usePackages = (filters?: { searchTerm?: string }) => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);
  const [searchTerm, setSearchTerm] = useState(filters?.searchTerm || '');
  const [clientCounts, setClientCounts] = useState<Record<string, number>>({});
  
  // Track loaded services for packages
  const [loadedServices, setLoadedServices] = useState<Record<string, Service[]>>({});
  const [loadingServices, setLoadingServices] = useState<Record<string, boolean>>({});

  // Fetch all packages
  const { data: packages, isLoading, error } = useQuery({
    queryKey: ['packages', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('Package')
        .select('*');
      
      // Apply search filter if provided
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data as Package[];
    },
    onSuccess: (data) => {
      // Load client counts for all packages
      if (data && data.length > 0) {
        loadClientCounts(data);
      }
    }
  });

  // Load client counts for packages
  const loadClientCounts = async (packageList: Package[]) => {
    const newClientCounts: Record<string, number> = {};
    
    for (const pkg of packageList) {
      try {
        const { count, error } = await supabase
          .from('ClientService')
          .select('*', { count: 'exact', head: true })
          .eq('packageId', pkg.id)
          .eq('status', 'ACTIVE');
        
        if (!error) {
          newClientCounts[pkg.id] = count || 0;
        }
      } catch (err) {
        console.error('Error fetching client count for package:', err);
        newClientCounts[pkg.id] = 0;
      }
    }
    
    setClientCounts(newClientCounts);
  };

  // Load services for a specific package
  const loadPackageServices = async (packageId: string) => {
    if (loadedServices[packageId] || loadingServices[packageId]) return;
    
    setLoadingServices(prev => ({ ...prev, [packageId]: true }));
    
    try {
      const pkg = packages?.find(p => p.id === packageId);
      if (!pkg || !pkg.services || pkg.services.length === 0) {
        setLoadedServices(prev => ({ ...prev, [packageId]: [] }));
        return;
      }
      
      const { data, error } = await supabase
        .from('Service')
        .select('*')
        .in('id', pkg.services);
      
      if (error) throw error;
      
      setLoadedServices(prev => ({ 
        ...prev, 
        [packageId]: data as Service[]
      }));
    } catch (error) {
      console.error('Error loading package services:', error);
      toast({
        title: 'Error',
        description: 'Failed to load package services',
        variant: 'destructive',
      });
      setLoadedServices(prev => ({ ...prev, [packageId]: [] }));
    } finally {
      setLoadingServices(prev => ({ ...prev, [packageId]: false }));
    }
  };

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
      
      // Log action in audit log
      const userId = supabase.auth.getUser()?.data?.user?.id;
      if (userId) {
        supabase
          .from('AuditLog')
          .insert({
            action: 'CREATE',
            resource: 'PACKAGE',
            userId,
            details: { message: 'Package created' }
          })
          .then(({ error }) => {
            if (error) {
              console.error('Error logging action:', error);
            }
          });
      }
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast({
        title: 'Package updated',
        description: 'The package has been updated successfully',
      });
      setEditingPackage(null);
      
      // Clear cached services for this package to force reload
      if (data && data.id) {
        setLoadedServices(prev => {
          const newState = { ...prev };
          delete newState[data.id];
          return newState;
        });
      }
      
      // Log action in audit log
      const userId = supabase.auth.getUser()?.data?.user?.id;
      if (userId) {
        supabase
          .from('AuditLog')
          .insert({
            action: 'UPDATE',
            resource: 'PACKAGE',
            userId,
            details: { message: 'Package updated' }
          })
          .then(({ error }) => {
            if (error) {
              console.error('Error logging action:', error);
            }
          });
      }
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

  // Get package client usage count
  const getPackageClientCount = async (packageId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('ClientService')
        .select('*', { count: 'exact', head: true })
        .eq('packageId', packageId)
        .eq('status', 'ACTIVE');
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting package client count:', error);
      return 0;
    }
  };

  // Delete a package
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if there are client services using this package
      const clientCount = await getPackageClientCount(id);
      
      const { error } = await supabase
        .from('Package')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, clientCount };
    },
    onSuccess: ({ id, clientCount }) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      
      let message = 'The package has been deleted successfully';
      if (clientCount > 0) {
        message += `. ${clientCount} client ${clientCount === 1 ? 'subscription was' : 'subscriptions were'} affected.`;
      }
      
      toast({
        title: 'Package deleted',
        description: message,
      });
      
      setIsDeleteDialogOpen(false);
      setPackageToDelete(null);
      
      // Remove from loaded services state
      setLoadedServices(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      
      // Log action in audit log
      const userId = supabase.auth.getUser()?.data?.user?.id;
      if (userId) {
        supabase
          .from('AuditLog')
          .insert({
            action: 'DELETE',
            resource: 'PACKAGE',
            userId,
            details: { 
              message: 'Package deleted',
              clientServicesAffected: clientCount
            }
          })
          .then(({ error }) => {
            if (error) {
              console.error('Error logging action:', error);
            }
          });
      }
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
    searchTerm,
    setSearchTerm,
    clientCounts,
    getPackageClientCount,
    loadPackageServices,
    loadedServices,
    loadingServices,
  };
};
