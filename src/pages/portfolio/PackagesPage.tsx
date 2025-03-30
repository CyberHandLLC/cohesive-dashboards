
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePackages } from '@/hooks/usePackages';
import { PackagesTable } from '@/components/portfolio/PackagesTable';
import { PackageFormDialog } from '@/components/portfolio/PackageFormDialog';
import { PackageDeleteDialog } from '@/components/portfolio/PackageDeleteDialog';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

const PackagesPage = () => {
  const navigate = useNavigate();
  const [packageClientCount, setPackageClientCount] = useState<number>(0);
  
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
    searchTerm,
    setSearchTerm,
    loadPackageServices,
    loadedServices,
    loadingServices,
    getPackageClientCount,
  } = usePackages();

  // Handle deleting a package with checks
  const handleDeletePackage = async (pkg) => {
    // Get client count for warnings
    const clientCount = await getPackageClientCount(pkg.id);
    setPackageClientCount(clientCount);
    setPackageToDelete(pkg);
    setIsDeleteDialogOpen(true);
  };

  // Handle package expansion
  const handlePackageExpand = async (packageId: string) => {
    loadPackageServices(packageId);
  };

  // Handle package row click for navigation
  const handlePackageRowClick = (packageId: string) => {
    try {
      if (!packageId) {
        toast({
          variant: "destructive",
          title: "Navigation error",
          description: "Could not navigate to package details due to missing ID."
        });
        return;
      }
      
      console.log('Navigating to package details:', packageId);
      navigate(`/admin/portfolio/packages/${packageId}`);
    } catch (error) {
      console.error('Error navigating to package details:', error);
      toast({
        variant: "destructive",
        title: "Navigation error",
        description: "An error occurred while navigating to package details."
      });
    }
  };

  // Handle client usage click
  const handleClientUsageClick = (packageId: string) => {
    navigate(`/admin/accounts/clients?packageId=${packageId}`);
  };

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
                services={loadedServices}
                clientCounts={packages?.reduce((acc, pkg) => {
                  return { ...acc, [pkg.id]: 0 };  // Default to 0, will be updated via query
                }, {})}
                loadingServices={loadingServices}
                onEdit={setEditingPackage} 
                onDelete={handleDeletePackage}
                searchQuery={searchTerm}
                onSearchChange={setSearchTerm}
                onClientUsageClick={handleClientUsageClick}
                onPackageExpand={handlePackageExpand}
                onPackageRowClick={handlePackageRowClick}
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

      {/* Edit Package Dialog - Only kept for quick edits */}
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
        clientCount={packageClientCount}
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
