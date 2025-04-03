import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart2, Calendar, Settings, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ServiceLifecycleManager from '@/components/services/ServiceLifecycleManager';

const AdminServiceLifecyclePage: React.FC = () => {
  const { clientId, serviceId } = useParams<{ clientId: string; serviceId: string }>();
  const [serviceData, setServiceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('lifecycle');
  const { toast } = useToast();

  // Fetch service details
  useEffect(() => {
    const fetchServiceDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('ClientService')
          .select(`
            id,
            startDate,
            endDate,
            status,
            lifecycleState,
            price,
            client:clientId (id, companyName, industry),
            service:serviceId (id, name, description, categoryId, price, monthlyPrice, features)
          `)
          .eq('id', serviceId)
          .eq('clientId', clientId)
          .single();

        if (error) throw error;

        if (!data) {
          throw new Error('Service not found');
        }

        setServiceData(data);
      } catch (err: any) {
        console.error('Error fetching service details:', err);
        setError(err.message || 'Failed to load service details');
        toast({
          title: "Error",
          description: err.message || "Failed to load service details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (clientId && serviceId) {
      fetchServiceDetails();
    }
  }, [clientId, serviceId, toast]);

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Clients', href: '/admin/accounts/clients' },
    { 
      label: serviceData?.client?.companyName || 'Client', 
      href: `/admin/accounts/clients/${clientId}` 
    },
    { label: 'Services', href: `/admin/accounts/clients/${clientId}/services` },
    { label: serviceData?.service?.name || 'Service Lifecycle' }
  ];

  // Create submenu items for consistent navigation
  const subMenuItems = [
    { label: 'Overview', href: `/admin/accounts/clients/${clientId}/overview`, value: 'overview' },
    { label: 'Services', href: `/admin/accounts/clients/${clientId}/services`, value: 'services' },
    { label: 'Invoices', href: `/admin/accounts/clients/${clientId}/invoices`, value: 'invoices' },
    { label: 'Support', href: `/admin/accounts/clients/${clientId}/support`, value: 'support' },
    { label: 'Contacts', href: `/admin/accounts/clients/${clientId}/contacts`, value: 'contacts' }
  ];

  if (loading) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs} 
        subMenuItems={subMenuItems}
        role="admin"
      >
        <div className="flex justify-center items-center h-64">
          <p>Loading service details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !serviceData) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        subMenuItems={subMenuItems}
        role="admin"
      >
        <div className="p-6">
          <div className="mb-6">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/admin/accounts/clients/${clientId}/services`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Services
              </Link>
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold text-destructive mb-2">Error</h2>
              <p>{error || 'Failed to load service'}</p>
              <Button className="mt-4" asChild>
                <Link to={`/admin/accounts/clients/${clientId}/services`}>
                  Return to Services
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      subMenuItems={subMenuItems}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="flex items-center">
              <Button variant="outline" size="sm" className="mr-2" asChild>
                <Link to={`/admin/accounts/clients/${clientId}/services`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">{serviceData.service.name}</h1>
            </div>
            <p className="text-muted-foreground">
              Client: {serviceData.client.companyName}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to={`/admin/accounts/clients/${clientId}/service-dashboard/${serviceId}`}>
                <BarChart2 className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/admin/accounts/clients/${clientId}/services/edit/${serviceId}`}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Service
              </Link>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="lifecycle">
              <Calendar className="h-4 w-4 mr-2" />
              Lifecycle Management
            </TabsTrigger>
            <TabsTrigger value="details">
              <Settings className="h-4 w-4 mr-2" />
              Service Details
            </TabsTrigger>
            <TabsTrigger value="client">
              <User className="h-4 w-4 mr-2" />
              Client Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lifecycle">
            <ServiceLifecycleManager
              clientServiceId={serviceId}
              serviceName={serviceData.service.name}
              clientName={serviceData.client.companyName}
            />
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Service Type</p>
                    <p className="text-muted-foreground">{serviceData.service.name}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-muted-foreground">
                      {new Date(serviceData.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">End Date</p>
                    <p className="text-muted-foreground">
                      {serviceData.endDate 
                        ? new Date(serviceData.endDate).toLocaleDateString() 
                        : 'Not specified'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-muted-foreground">{serviceData.status}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Price</p>
                    <p className="text-muted-foreground">
                      ${serviceData.price?.toFixed(2) || 'Custom pricing'}
                    </p>
                  </div>
                  
                  {serviceData.service.monthlyPrice && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Monthly Price</p>
                      <p className="text-muted-foreground">
                        ${serviceData.service.monthlyPrice.toFixed(2)}/month
                      </p>
                    </div>
                  )}
                </div>
                
                {serviceData.service.description && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-muted-foreground">{serviceData.service.description}</p>
                  </div>
                )}
                
                {serviceData.service.features && serviceData.service.features.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-1">Features</p>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {serviceData.service.features.map((feature: string, index: number) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="client">
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Company Name</p>
                    <p className="text-muted-foreground">{serviceData.client.companyName}</p>
                  </div>
                  
                  {serviceData.client.industry && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Industry</p>
                      <p className="text-muted-foreground">{serviceData.client.industry}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <Button asChild>
                    <Link to={`/admin/accounts/clients/${clientId}`}>
                      View Full Client Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminServiceLifecyclePage;
