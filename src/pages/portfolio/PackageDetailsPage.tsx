
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { usePackages } from '@/hooks/usePackages';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PackageFormDialog } from '@/components/portfolio/PackageFormDialog';
import { PackageDeleteDialog } from '@/components/portfolio/PackageDeleteDialog';

const PackageDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [packageClientCount, setPackageClientCount] = useState<number>(0);
  
  const {
    packages,
    isLoading,
    updatePackage,
    deletePackage,
    loadPackageServices,
    loadedServices,
    loadingServices,
    getPackageClientCount
  } = usePackages();
  
  const packageDetails = packages?.find(pkg => pkg.id === id);
  
  useEffect(() => {
    if (id) {
      loadPackageServices(id);
      
      // Get client count for the package
      getPackageClientCount(id).then(count => {
        setPackageClientCount(count);
      });
    }
  }, [id, loadPackageServices, getPackageClientCount]);
  
  const handleDelete = async () => {
    if (id) {
      await deletePackage(id);
      navigate('/admin/portfolio/packages');
    }
  };

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Portfolio', href: '/admin/portfolio' },
    { label: 'Packages', href: '/admin/portfolio/packages' },
    { label: packageDetails?.name || 'Package Details' }
  ];

  if (isLoading) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        role="admin"
      >
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading package details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!packageDetails) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        role="admin"
      >
        <div className="flex flex-col justify-center items-center h-64">
          <p className="text-muted-foreground mb-4">Package not found</p>
          <Button variant="outline" onClick={() => navigate('/admin/portfolio/packages')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Packages
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/portfolio/packages')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h1 className="text-2xl font-bold">{packageDetails.name}</h1>
            <Badge variant={
              packageDetails.availability === 'ACTIVE' ? 'default' :
              packageDetails.availability === 'DISCONTINUED' ? 'outline' : 'secondary'
            }>
              {packageDetails.availability}
            </Badge>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="clients">Client Usage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Package Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                    <p>{packageDetails.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                    <p>{formatCurrency(packageDetails.price)}</p>
                  </div>
                  
                  {packageDetails.monthlyPrice !== null && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Monthly Price</h3>
                      <p>{formatCurrency(packageDetails.monthlyPrice)}</p>
                    </div>
                  )}
                  
                  {packageDetails.discount !== null && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Discount</h3>
                      <p>{packageDetails.discount}%</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <p>{packageDetails.availability}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                    <p>{new Date(packageDetails.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <p>{packageDetails.description || 'No description provided'}</p>
                  </div>
                </div>
                
                {packageDetails.customFields && Object.keys(packageDetails.customFields).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Custom Fields</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(packageDetails.customFields).map(([key, value]) => (
                        <div key={key}>
                          <h4 className="text-xs font-medium text-muted-foreground">{key}</h4>
                          <p>{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Included Services</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingServices[id!] ? (
                  <p className="text-muted-foreground">Loading services...</p>
                ) : loadedServices[id!]?.length > 0 ? (
                  <ul className="space-y-2">
                    {loadedServices[id!].map(service => (
                      <li key={service.id} className="p-2 border rounded-md flex justify-between items-center">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(service.price || 0)}</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/admin/portfolio/services?serviceId=${service.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No services included in this package</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Client Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <h3 className="text-3xl font-semibold mb-2">{packageClientCount}</h3>
                  <p className="text-muted-foreground">Active client subscriptions</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate(`/admin/accounts/clients?packageId=${id}`)}
                  >
                    View Client List
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit Package Dialog */}
      <PackageFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={(values) => updatePackage({ id: id!, updates: values })}
        initialData={packageDetails}
        title="Edit Package"
      />
      
      {/* Delete Package Dialog */}
      <PackageDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        package={packageDetails}
        clientCount={packageClientCount}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
};

export default PackageDetailsPage;
