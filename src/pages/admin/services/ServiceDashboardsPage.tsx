import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart2, ExternalLink, ChevronRight, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ServiceDashboardsPage: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch services with dashboard capabilities
        const { data: serviceData, error: serviceError } = await supabase
          .from('Service')
          .select('*')
          .eq('hasDashboard', true)
          .order('name');

        if (serviceError) throw serviceError;
        
        // Fetch active clients
        const { data: clientData, error: clientError } = await supabase
          .from('Client')
          .select('id, companyName')
          .eq('status', 'ACTIVE')
          .order('companyName');

        if (clientError) throw clientError;
        
        setServices(serviceData || []);
        setClients(clientData || []);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard information',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Define breadcrumbs for the page
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Portfolio', href: '/admin/portfolio' },
    { label: 'Service Dashboards' }
  ];

  // Define sub menu items
  const subMenuItems = [
    { label: 'Categories', href: '/admin/portfolio/categories', value: 'categories' },
    { label: 'Services', href: '/admin/portfolio/services', value: 'services' },
    { label: 'Packages', href: '/admin/portfolio/packages', value: 'packages' },
    { label: 'Service Expirations', href: '/admin/portfolio/service-expirations', value: 'expirations' },
    { label: 'Service Dashboards', href: '/admin/portfolio/service-dashboards', value: 'dashboards' },
  ];

  const renderDashboardCards = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <p>Loading dashboards...</p>
        </div>
      );
    }

    if (services.length === 0) {
      return (
        <Card>
          <CardContent className="pt-6">
            <CardDescription>No services with dashboards are available.</CardDescription>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <Badge variant="outline" className="ml-2">Dashboard</Badge>
              </div>
              <CardDescription className="mt-2 line-clamp-2">{service.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-2">
                <div className="flex items-center justify-center bg-muted/50 p-6 rounded-md">
                  <BarChart2 className="h-12 w-12 text-primary/70" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 p-4 pt-2">
              <p className="text-sm text-muted-foreground">View client-specific dashboards:</p>
              <div className="flex flex-wrap gap-2">
                {clients.length > 0 ? (
                  <Button variant="outline" size="sm" asChild className="w-full mt-2">
                    <Link to={`/admin/accounts/clients`}>
                      Choose Client <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled className="w-full mt-2">
                    No clients available
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      subMenuItems={subMenuItems}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Service Dashboards</h2>
            <p className="text-muted-foreground">
              Monitor performance metrics across all client service dashboards
            </p>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Dashboards</TabsTrigger>
            <TabsTrigger value="website">Website Performance</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="ai">AI Integration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {renderDashboardCards()}
          </TabsContent>
          
          <TabsContent value="website" className="space-y-4">
            {renderDashboardCards()}
          </TabsContent>
          
          <TabsContent value="marketing" className="space-y-4">
            {renderDashboardCards()}
          </TabsContent>
          
          <TabsContent value="ai" className="space-y-4">
            {renderDashboardCards()}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ServiceDashboardsPage;
