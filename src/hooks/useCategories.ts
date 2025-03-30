
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export type Category = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CategoryInput = {
  name: string;
  description?: string | null;
};

export const useCategories = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Fetch all categories with optimized query
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Category')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    }
  });

  // Create a new category
  const createMutation = useMutation({
    mutationFn: async (newCategory: CategoryInput) => {
      const { data, error } = await supabase
        .from('Category')
        .insert([newCategory])
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Category created',
        description: 'The category has been created successfully',
      });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      });
    }
  });

  // Update a category with optimistic updates
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: CategoryInput }) => {
      const { data, error } = await supabase
        .from('Category')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['categories'] });

      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData<Category[]>(['categories']);

      // Optimistically update to the new value
      if (previousCategories) {
        queryClient.setQueryData(['categories'], 
          previousCategories.map(category => 
            category.id === id ? { ...category, ...updates } : category
          )
        );
      }

      return { previousCategories };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      // Also invalidate services query since category names might appear there
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        title: 'Category updated',
        description: 'The category has been updated successfully',
      });
      setEditingCategory(null);
    },
    onError: (error, variables, context) => {
      console.error('Error updating category:', error);
      // Restore previous categories on error
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories'], context.previousCategories);
      }
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      });
    }
  });

  // Delete a category with service check
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First check if there are any services using this category
      const { count, error: countError } = await supabase
        .from('Service')
        .select('*', { count: 'exact', head: true })
        .eq('categoryId', id);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        throw new Error(`This category has ${count} associated services that need to be reassigned first.`);
      }
      
      const { error } = await supabase
        .from('Category')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Category deleted',
        description: 'The category has been deleted successfully',
      });
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete category',
        variant: 'destructive',
      });
    }
  });

  return {
    categories,
    isLoading,
    error,
    createCategory: createMutation.mutate,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
    isAddDialogOpen,
    setIsAddDialogOpen,
    editingCategory,
    setEditingCategory,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    categoryToDelete,
    setCategoryToDelete,
  };
};
