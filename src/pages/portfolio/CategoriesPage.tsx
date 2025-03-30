
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { CategoriesTable } from '@/components/portfolio/CategoriesTable';
import { CategoryFormDialog } from '@/components/portfolio/CategoryFormDialog';
import { CategoryDeleteDialog } from '@/components/portfolio/CategoryDeleteDialog';

const CategoriesPage = () => {
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

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Portfolio', href: '/admin/portfolio' },
    { label: 'Categories' }
  ];

  const handleEdit = (category: any) => {
    setEditingCategory(category);
  };

  const handleDelete = (category: any) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
    }
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
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-6 text-center text-muted-foreground">Loading categories...</div>
            ) : (
              <CategoriesTable 
                categories={categories || []} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Category Dialog */}
      <CategoryFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={(values) => createCategory(values)}
        title="Add Category"
      />

      {/* Edit Category Dialog */}
      <CategoryFormDialog
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        onSubmit={(values) => editingCategory && updateCategory({ id: editingCategory.id, updates: values })}
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
