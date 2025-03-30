
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Package } from '@/hooks/usePackages';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { toast } from '@/components/ui/use-toast';
import { Service } from '@/hooks/useServices';
import { PackageFormDialog } from '@/components/portfolio/PackageFormDialog';
import { PackageDeleteDialog } from '@/components/portfolio/PackageDeleteDialog';

const PackageDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [packageData, setPackageData] = useState<Package | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [clientCount, setClientCount] = useState<number>(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch the package details
  useEffect(() => {
    const fetchPackageDetails = async () => {
      if (!id) {
        navigate('/admin/portfolio/packages');
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('Package')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setPackageData(data as Package);
          fetchServices(data.services);
          getClientCount(id);
        } else {
          // No data found
          toast({
            variant: "destructive",
            title: "Package not found",
            description: "The requested package couldn't be found."
          });
          navigate('/admin/portfolio/packages');
        }
      } catch (error) {
        console.error('Error fetching package details:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load package details."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackageDetails();
  }, [id, navigate]);

  // Fetch the services included in the package
  const fetchServices = async (serviceIds: string[]) => {
    if (!serviceIds || serviceIds.length === 0) {
      setServices([]);
      return;
    }

    try {
      setIsLoadingServices(true);
      const { data, error } = await supabase
        .from('Service')
        .select('*')
        .in('id', serviceIds);

      if (error) {
        throw error;
      }

      setServices(data as Service[]);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setIsLoadingServices(false);
    }
  };

  // Get client usage count
  const getClientCount = async (packageId: string) => {
    try {
      const { count, error } = await supabase
        .from('ClientService')
        .select('*', { count: 'exact', head: true })
        .eq('packageId', packageId)
        .eq('status', 'ACTIVE');

      if (error) {
        throw error;
      }

      setClientCount(count || 0);
    } catch (error) {
      console.error('Error getting package client count:', error);
    }
  };

  // Handle edit package
  const handleEditPackage = async (values: any) => {
    try {
      const { data, error } = await supabase
        .from('Package')
        .update({
          name: values.name,
          description: values.description,
          price: values.price,
          discount: values.discount,
          monthlyPrice: values.monthlyPrice,
          services: values.services,
          availability: values.availability,
          customFields: values.customFields,
          updatedAt: new Date()
        })
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      if (data && data[0]) {
        setPackageData(data[0] as Package);
        fetchServices(data[0].services);
        
        toast({
          title: "Package updated",
          description: "The package has been updated successfully."
        });
      }
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update package."
      });
    } finally {
      setIsEditDialogOpen(false);
    }
  };

  // Handle delete package
  const handleDeletePackage = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('Package')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Package deleted",
        description: "The package has been deleted successfully."
      });

      navigate('/admin/portfolio/packages');
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete package."
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Format breadcrumbs
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Portfolio', href: '/admin/portfolio' },
    { label: 'Packages', href: '/admin/portfolio/packages' },
    { label: packageData?.name || 'Package Details' }
  ];

  // Render loading state
  if (isLoading) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs} role="admin">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading package details...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Render not found state
  if (!packageData) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs} role="admin">
        <div className="flex flex-col items-center justify-center h-64">
          <h1 className="text-xl font-semibold mb-2">Package Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested package does not exist or has been deleted.</p>
          <Button onClick={() => navigate('/admin/portfolio/packages')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Packages
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4"
              onClick={() => navigate('/admin/portfolio/packages')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">{packageData.name}</h1>
            <Badge 
              className="ml-2" 
              variant={
                packageData.availability === 'ACTIVE' ? 'default' :
                packageData.availability === 'DISCONTINUED' ? 'outline' : 'secondary'
              }
            >
              {packageData.availability}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Package Details */}
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Package Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Description</h3>
                <p className="mt-1">{packageData.description || 'No description available'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Price</h3>
                  <p className="mt-1 text-lg font-medium">{formatCurrency(packageData.price)}</p>
                </div>
                {packageData.monthlyPrice !== null && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Monthly Price</h3>
                    <p className="mt-1 text-lg font-medium">{formatCurrency(packageData.monthlyPrice)}</p>
                  </div>
                )}
                {packageData.discount !== null && packageData.discount > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Discount</h3>
                    <p className="mt-1">{packageData.discount}%</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Services Included</h3>
                {isLoadingServices ? (
                  <p className="text-sm text-muted-foreground">Loading services...</p>
                ) : services.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {services.map(service => (
                      <div key={service.id} className="border p-3 rounded-md">
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(service.price || 0)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No services included in this package</p>
                )}
              </div>

              {packageData.customFields && Object.keys(packageData.customFields).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">Additional Details</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(packageData.customFields).map(([key, value]) => (
                        <div key={key}>
                          <h4 className="font-medium text-sm text-muted-foreground">{key}</h4>
                          <p className="mt-1">{value?.toString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Client Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Client Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-3xl font-bold">{clientCount}</p>
                <p className="text-muted-foreground">Active client subscriptions</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate(`/admin/accounts/clients?packageId=${id}`)}
              >
                View Clients
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Edit Package Dialog */}
      <PackageFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEditPackage}
        initialData={packageData}
        title="Edit Package"
      />

      {/* Delete Package Dialog */}
      <PackageDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        package={packageData}
        clientCount={clientCount}
        onConfirm={handleDeletePackage}
      />
    </DashboardLayout>
  );
};

export default PackageDetailsPage;
