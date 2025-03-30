
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Plus, Search, Trash2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCategories } from '@/hooks/useCategories';
import { CategoriesTable } from '@/components/portfolio/CategoriesTable';
import { CategoryFormDialog } from '@/components/portfolio/CategoryFormDialog';
import { CategoryDeleteDialog } from '@/components/portfolio/CategoryDeleteDialog';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

const CategoriesPage = () => {
  // Get category functionality from hook
  const {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    isAddDialogOpen,
    setIsAddDialogOpen,
    editingCategory,
    setEditingCategory,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    categoryToDelete,
    setCategoryToDelete,
  } = useCategories();

  // States for enhanced functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState(categories || []);
  const [serviceCounts, setServiceCounts] = useState<Record<string, number>>({});
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Portfolio', href: '/admin/portfolio' },
    { label: 'Categories' }
  ];

  // Filter categories based on search term
  useEffect(() => {
    if (!categories) return;
    
    if (searchTerm.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (category.description?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  // Fetch service counts for each category
  useEffect(() => {
    const fetchServiceCounts = async () => {
      if (!categories || categories.length === 0) return;
      
      try {
        const counts: Record<string, number> = {};
        
        for (const category of categories) {
          const { count, error } = await supabase
            .from('Service')
            .select('*', { count: 'exact', head: true })
            .eq('categoryId', category.id);
          
          if (error) throw error;
          counts[category.id] = count || 0;
        }
        
        setServiceCounts(counts);
      } catch (error) {
        console.error('Error fetching service counts:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch service counts',
          variant: 'destructive',
        });
      }
    };

    fetchServiceCounts();
  }, [categories]);

  // Set up realtime subscription for categories
  useEffect(() => {
    const channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Category'
        },
        (payload) => {
          // This will trigger refetch via React Query
          console.log('Category change detected:', payload);
          toast({
            title: 'Category Updated',
            description: 'The categories list has been updated',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleEdit = (category: any) => {
    setEditingCategory(category);
  };

  const handleDelete = (category: any) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      // Check if category has associated services
      const { count, error: countError } = await supabase
        .from('Service')
        .select('*', { count: 'exact', head: true })
        .eq('categoryId', categoryToDelete.id);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        // If there are services, show a warning and offer reassignment
        toast({
          title: 'Warning',
          description: `This category has ${count} associated services. Please reassign them before deleting.`,
          variant: 'destructive',
        });
        
        // Navigate to services page filtered by this category
        navigate(`/admin/portfolio/services?categoryId=${categoryToDelete.id}`);
        setIsDeleteDialogOpen(false);
        return;
      }
      
      // If no services are linked, proceed with deletion
      await deleteCategory(categoryToDelete.id);
      
      // Log the action in audit log
      await supabase.from('AuditLog').insert({
        action: 'DELETE',
        resource: 'CATEGORY',
        userId: (await supabase.auth.getUser()).data.user?.id,
        details: { categoryId: categoryToDelete.id, categoryName: categoryToDelete.name }
      });
    } catch (error) {
      console.error('Error during category deletion:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  const handleServiceCountClick = (categoryId: string) => {
    navigate(`/admin/portfolio/services?categoryId=${categoryId}`);
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Service Categories</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Categories</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-6 text-center text-muted-foreground">Loading categories...</div>
            ) : filteredCategories.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                {searchTerm ? 'No categories found matching your search' : 'No categories found'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Name</th>
                      <th className="text-left p-4">Description</th>
                      <th className="text-left p-4">Created At</th>
                      <th className="text-center p-4">Services</th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category) => (
                      <tr key={category.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{category.name}</td>
                        <td className="p-4 text-muted-foreground">{category.description || '-'}</td>
                        <td className="p-4">{new Date(category.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-center">
                          <Badge 
                            variant="outline" 
                            className="cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => handleServiceCountClick(category.id)}
                          >
                            {serviceCounts[category.id] || 0} 
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(category)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Category Dialog */}
      <CategoryFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={async (values) => {
          await createCategory(values);
          
          // Log the action in audit log
          await supabase.from('AuditLog').insert({
            action: 'CREATE',
            resource: 'CATEGORY',
            userId: (await supabase.auth.getUser()).data.user?.id,
            details: { categoryName: values.name }
          });
        }}
        title="Add Category"
      />

      {/* Edit Category Dialog */}
      <CategoryFormDialog
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        onSubmit={async (values) => {
          if (editingCategory) {
            await updateCategory({ id: editingCategory.id, updates: values });
            
            // Log the action in audit log
            await supabase.from('AuditLog').insert({
              action: 'UPDATE',
              resource: 'CATEGORY',
              userId: (await supabase.auth.getUser()).data.user?.id,
              details: { 
                categoryId: editingCategory.id, 
                categoryName: values.name,
                previousName: editingCategory.name 
              }
            });
          }
        }}
        initialData={editingCategory}
        title="Edit Category"
      />

      {/* Delete Category Dialog */}
      <CategoryDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        category={categoryToDelete}
        onConfirm={confirmDelete}
      />
    </DashboardLayout>
  );
};

export default CategoriesPage;
