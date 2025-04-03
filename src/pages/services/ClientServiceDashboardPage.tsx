import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ClientServiceDashboard from '@/components/services/ClientServiceDashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRole } from '@/lib/hooks/use-role';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layout/DashboardLayout';

const ClientServiceDashboardPage: React.FC = () => {
  const { clientId, serviceId } = useParams<{ clientId?: string; serviceId?: string }>();
  const { role, isLoading: roleLoading } = useRole();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientServiceId, setClientServiceId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>('');
  const [serviceName, setServiceName] = useState<string>('');
  const { toast } = useToast();
  
  // Determine if user is admin or client
  const isAdmin = role === 'ADMIN';
  const isClient = role === 'CLIENT';
  
  useEffect(() => {
    const fetchServiceDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (isAdmin && clientId && serviceId) {
          // Admin viewing a client's service
          const { data, error } = await supabase
            .from('ClientService')
            .select(`
              id,
              clientId,
              client:clientId (companyName),
              service:serviceId (name)
            `)
            .eq('id', serviceId)
            .eq('clientId', clientId)
            .single();
            
          if (error) throw error;
          
          if (!data) {
            throw new Error("Service not found");
          }
          
          setClientServiceId(data.id);
          setClientName(data.client?.companyName || 'Unknown Client');
          setServiceName(data.service?.name || 'Unknown Service');
        } 
        else if (isClient && serviceId) {
          // Client viewing their own service
          // First get the user's clientId
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            throw new Error("Authentication required");
          }
          
          const { data: userData, error: userError } = await supabase
            .from('User')
            .select('clientId')
            .eq('id', user.id)
            .single();
            
          if (userError) throw userError;
          
          if (!userData || !userData.clientId) {
            throw new Error("Your account is not associated with a client");
          }
          
          // Check if the service belongs to the client
          const { data, error } = await supabase
            .from('ClientService')
            .select(`
              id,
              clientId,
              client:clientId (companyName),
              service:serviceId (name)
            `)
            .eq('id', serviceId)
            .eq('clientId', userData.clientId)
            .single();
            
          if (error) throw error;
          
          if (!data) {
            throw new Error("Service not found or you don't have access to it");
          }
          
          setClientServiceId(data.id);
          setClientName(data.client?.companyName || 'Your Company');
          setServiceName(data.service?.name || 'Unknown Service');
        } 
        else {
          throw new Error("Insufficient information to load dashboard");
        }
      } catch (error: any) {
        console.error('Error loading service dashboard:', error);
        setError(error.message || "Failed to load service dashboard");
        toast({
          title: "Error",
          description: error.message || "Failed to load service dashboard",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (!roleLoading) {
      fetchServiceDetails();
    }
  }, [clientId, serviceId, roleLoading, role, isAdmin, isClient, toast]);
  
  // Generate back button link based on role
  const getBackLink = () => {
    if (isAdmin && clientId) {
      return `/admin/accounts/clients/${clientId}/services`;
    } else if (isClient) {
      return '/client/accounts/services';
    }
    return '/'; // Default fallback
  };

  // Generate appropriate breadcrumbs based on user role
  const getBreadcrumbs = () => {
    if (isAdmin && clientId) {
      return [
        { label: 'Admin', href: '/admin' },
        { label: 'Accounts', href: '/admin/accounts' },
        { label: 'Clients', href: '/admin/accounts/clients' },
        { label: clientName || 'Client', href: `/admin/accounts/clients/${clientId}` },
        { label: 'Services', href: `/admin/accounts/clients/${clientId}/services` },
        { label: serviceName || 'Dashboard' }
      ];
    } else if (isClient) {
      return [
        { label: 'Client', href: '/client' },
        { label: 'Accounts', href: '/client/accounts' },
        { label: 'Services', href: '/client/accounts/services' },
        { label: serviceName || 'Dashboard' }
      ];
    }
    return [];
  };

  // Generate subMenuItems based on user role
  const getSubMenuItems = () => {
    if (isAdmin && clientId) {
      return [
        { label: 'Overview', href: `/admin/accounts/clients/${clientId}/overview`, value: 'overview' },
        { label: 'Services', href: `/admin/accounts/clients/${clientId}/services`, value: 'services' },
        { label: 'Invoices', href: `/admin/accounts/clients/${clientId}/invoices`, value: 'invoices' },
        { label: 'Support', href: `/admin/accounts/clients/${clientId}/support`, value: 'support' },
        { label: 'Contacts', href: `/admin/accounts/clients/${clientId}/contacts`, value: 'contacts' }
      ];
    } else if (isClient) {
      return [
        { label: 'Services', href: '/client/accounts/services', value: 'services' },
        { label: 'Invoices', href: '/client/accounts/invoices', value: 'invoices' },
        { label: 'Support', href: '/client/accounts/support', value: 'support' },
        { label: 'Profile', href: '/client/accounts/profile', value: 'profile' },
      ];
    }
    return [];
  };
  
  const renderContent = () => {
    if (loading || roleLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <p>Loading dashboard...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <Button variant="outline" size="sm" asChild>
              <Link to={getBackLink()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Services
              </Link>
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <CardTitle className="text-destructive mb-2">Error Loading Dashboard</CardTitle>
              <CardDescription>{error}</CardDescription>
              <div className="mt-4">
                <Button asChild>
                  <Link to={getBackLink()}>Return to Services</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link to={getBackLink()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Services
            </Link>
          </Button>
        </div>
        
        {clientServiceId && (
          <div className="mb-4">
            <h1 className="text-2xl font-bold">{serviceName} Dashboard</h1>
            <p className="text-muted-foreground">
              {isAdmin ? `Client: ${clientName}` : `Service performance metrics for ${serviceName}`}
            </p>
          </div>
        )}
        
        {clientServiceId && (
          <ClientServiceDashboard 
            clientId={clientId || ''} 
            initialServiceId={clientServiceId}
          />
        )}
      </div>
    );
  };

  return (
    <DashboardLayout 
      breadcrumbs={getBreadcrumbs()}
      subMenuItems={getSubMenuItems()}
      role={isAdmin ? "admin" : isClient ? "client" : "observer"}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default ClientServiceDashboardPage;
