import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart2, Calendar, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ServiceLifecycleManager from '@/components/services/ServiceLifecycleManager';
import { useClientId } from '@/hooks/useClientId';

const ClientServiceLifecyclePage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { clientId, isLoading: clientIdLoading } = useClientId();
  const [serviceData, setServiceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('lifecycle');
  const { toast } = useToast();

  // Fetch service details
  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!serviceId || !clientId) return;
      
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
            client:clientId (id, companyName),
            service:serviceId (id, name, description, categoryId, price, monthlyPrice, features)
          `)
          .eq('id', serviceId)
          .eq('clientId', clientId)
          .single();

        if (error) throw error;

        if (!data) {
          throw new Error('Service not found or you do not have access to it');
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

    if (!clientIdLoading) {
      fetchServiceDetails();
    }
  }, [serviceId, clientId, clientIdLoading, toast]);

  const breadcrumbs = [
    { label: 'Client', href: '/client' },
    { label: 'Accounts', href: '/client/accounts' },
    { label: 'Services', href: '/client/accounts/services' },
    { label: serviceData?.service?.name || 'Service Lifecycle' }
  ];

  // Create a consistent subMenuItems array for client navigation
  const subMenuItems = [
    { label: 'Services', href: '/client/accounts/services', value: 'services' },
    { label: 'Invoices', href: '/client/accounts/invoices', value: 'invoices' },
    { label: 'Support', href: '/client/accounts/support', value: 'support' },
    { label: 'Profile', href: '/client/accounts/profile', value: 'profile' },
  ];

  if (loading || clientIdLoading) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        subMenuItems={subMenuItems}
        role="client"
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
        role="client"
      >
        <div className="p-6">
          <div className="mb-6">
            <Button variant="outline" size="sm" asChild>
              <Link to="/client/accounts/services">
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
                <Link to="/client/accounts/services">
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
      role="client"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="flex items-center">
              <Button variant="outline" size="sm" className="mr-2" asChild>
                <Link to="/client/accounts/services">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">{serviceData.service.name}</h1>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to={`/client/accounts/services/dashboard/${serviceId}`}>
                <BarChart2 className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/client/support?serviceId=${serviceId}`}>
                <Settings className="h-4 w-4 mr-2" />
                Request Support
              </Link>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="lifecycle">
              <Calendar className="h-4 w-4 mr-2" />
              Service Status
            </TabsTrigger>
            <TabsTrigger value="details">
              <Settings className="h-4 w-4 mr-2" />
              Service Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lifecycle">
            <ServiceLifecycleManager
              clientServiceId={serviceId}
              serviceName={serviceData.service.name}
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
                </div>
                
                {serviceData.service.description && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-muted-foreground">{serviceData.service.description}</p>
                  </div>
                )}
                
                {serviceData.service.features && serviceData.service.features.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-1">Included Features</p>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {serviceData.service.features.map((feature: string, index: number) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-lg font-medium mb-2">Need Changes?</h3>
                  <p className="text-muted-foreground mb-4">
                    If you need to make changes to your service or have questions, please contact your account manager or submit a support ticket.
                  </p>
                  <div className="flex gap-2">
                    <Button asChild>
                      <Link to="/client/support">Contact Support</Link>
                    </Button>
                    {serviceData.lifecycleState === 'ACTIVE' && (
                      <Button variant="outline" onClick={() => setActiveTab('lifecycle')}>
                        Manage Service Status
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ClientServiceLifecyclePage;
