
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'PAST';

interface Client {
  id: string;
  companyName: string;
  status: ClientStatus;
  industry: string;
  websiteUrl: string | null;
  serviceStartDate: string | null;
  serviceEndDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const AdminClientProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Define breadcrumbs for navigation
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Clients', href: '/admin/accounts/clients' },
    { label: client?.companyName || 'Client Details' }
  ];
  
  const subMenuItems = [
    { label: 'Overview', value: 'overview' },
    { label: 'Services', value: 'services' },
    { label: 'Invoices', value: 'invoices' },
    { label: 'Support', value: 'support' },
    { label: 'Contacts', value: 'contacts' },
  ];

  useEffect(() => {
    const fetchClientDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('Client')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          console.error('Error fetching client details:', error);
        } else {
          setClient(data);
        }
      } catch (error) {
        console.error('Error in client fetch operation:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClientDetails();
  }, [id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: ClientStatus) => {
    switch(status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-amber-100 text-amber-800">Inactive</Badge>;
      case 'PAST':
        return <Badge className="bg-gray-100 text-gray-800">Past</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs} 
      role="admin"
      title={client?.companyName || 'Client Details'}
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Loading client details...</p>
        </div>
      ) : client ? (
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              {subMenuItems.map((item) => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getStatusBadge(client.status)}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Industry</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{client.industry || 'Not specified'}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Service Start</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{formatDate(client.serviceStartDate)}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Service End</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{formatDate(client.serviceEndDate)}</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Client Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {client.websiteUrl && (
                      <div>
                        <h4 className="font-medium">Website</h4>
                        <a 
                          href={client.websiteUrl.startsWith('http') ? client.websiteUrl : `https://${client.websiteUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {client.websiteUrl}
                        </a>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium">Client Since</h4>
                      <p>{formatDate(client.createdAt)}</p>
                    </div>
                    
                    {client.notes && (
                      <div>
                        <h4 className="font-medium">Notes</h4>
                        <p className="text-muted-foreground">{client.notes}</p>
                      </div>
                    )}
                    
                    <Button variant="outline" className="mt-2">
                      Edit Client Details
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">No recent activity to display.</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="services">
              <Card>
                <CardHeader>
                  <CardTitle>Client Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Client services will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="invoices">
              <Card>
                <CardHeader>
                  <CardTitle>Client Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Client invoices will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="support">
              <Card>
                <CardHeader>
                  <CardTitle>Support Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Support tickets will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="contacts">
              <Card>
                <CardHeader>
                  <CardTitle>Client Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Client contacts will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <p>Client not found</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminClientProfilePage;
