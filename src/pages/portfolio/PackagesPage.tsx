
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePackages } from '@/hooks/usePackages';
import { PackagesTable } from '@/components/portfolio/PackagesTable';
import { PackageFormDialog } from '@/components/portfolio/PackageFormDialog';
import { PackageDeleteDialog } from '@/components/portfolio/PackageDeleteDialog';

const PackagesPage = () => {
  const {
    packages,
    isLoading,
    createPackage,
    updatePackage,
    deletePackage,
    isAddDialogOpen,
    setIsAddDialogOpen,
    editingPackage,
    setEditingPackage,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    packageToDelete,
    setPackageToDelete,
  } = usePackages();

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Portfolio', href: '/admin/portfolio' },
    { label: 'Packages' }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Packages Management</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Package
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Packages</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-6 text-center text-muted-foreground">Loading packages...</div>
            ) : (
              <PackagesTable 
                packages={packages || []} 
                onEdit={setEditingPackage} 
                onDelete={(pkg) => {
                  setPackageToDelete(pkg);
                  setIsDeleteDialogOpen(true);
                }} 
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Package Dialog */}
      <PackageFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={(values) => createPackage(values)}
        title="Add Package"
      />

      {/* Edit Package Dialog */}
      <PackageFormDialog
        open={!!editingPackage}
        onOpenChange={(open) => !open && setEditingPackage(null)}
        onSubmit={(values) => editingPackage && updatePackage({ id: editingPackage.id, updates: values })}
        initialData={editingPackage}
        title="Edit Package"
      />

      {/* Delete Package Dialog */}
      <PackageDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        package={packageToDelete}
        onConfirm={() => {
          if (packageToDelete) {
            deletePackage(packageToDelete.id);
          }
        }}
      />
    </DashboardLayout>
  );
};

export default PackagesPage;
