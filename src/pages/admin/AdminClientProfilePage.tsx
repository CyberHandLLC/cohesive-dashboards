
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminClientProfilePage = () => {
  const { id: clientId } = useParams();
  const [client, setClient] = useState({
    id: '',
    companyName: '',
    websiteUrl: '',
    industry: '',
    status: '',
    serviceStartDate: '',
    serviceEndDate: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Clients', href: '/admin/accounts/clients' },
    { label: client.companyName || 'Client Profile' }
  ];
  
  useEffect(() => {
    const fetchClientDetails = async () => {
      if (!clientId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('Client')
          .select('*')
          .eq('id', clientId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setClient({
            id: data.id,
            companyName: data.companyName || '',
            websiteUrl: data.websiteUrl || '',
            industry: data.industry || '',
            status: data.status || '',
            serviceStartDate: data.serviceStartDate ? new Date(data.serviceStartDate).toISOString().split('T')[0] : '',
            serviceEndDate: data.serviceEndDate ? new Date(data.serviceEndDate).toISOString().split('T')[0] : '',
            notes: data.notes || ''
          });
        }
      } catch (error) {
        console.error('Error fetching client details:', error);
        toast({
          title: "Error",
          description: "Failed to load client details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchClientDetails();
  }, [clientId, toast]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setClient(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('Client')
        .update({
          companyName: client.companyName,
          websiteUrl: client.websiteUrl,
          industry: client.industry,
          status: client.status,
          serviceStartDate: client.serviceStartDate || null,
          serviceEndDate: client.serviceEndDate || null,
          notes: client.notes,
          updatedAt: new Date()
        })
        .eq('id', clientId);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Client profile has been updated",
      });
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "Failed to update client profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
      title={`Client: ${client.companyName}`}
    >
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 pt-4">
            <Card>
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-4">Loading client data...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input 
                          id="companyName"
                          name="companyName"
                          value={client.companyName}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input 
                          id="industry"
                          name="industry"
                          value={client.industry}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="websiteUrl">Website</Label>
                        <Input 
                          id="websiteUrl"
                          name="websiteUrl"
                          value={client.websiteUrl}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Input 
                          id="status"
                          name="status"
                          value={client.status}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serviceStartDate">Service Start Date</Label>
                        <Input 
                          id="serviceStartDate"
                          name="serviceStartDate"
                          type="date"
                          value={client.serviceStartDate}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serviceEndDate">Service End Date</Label>
                        <Input 
                          id="serviceEndDate"
                          name="serviceEndDate"
                          type="date"
                          value={client.serviceEndDate}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Input 
                          id="notes"
                          name="notes"
                          value={client.notes || ''}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={loading || saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Client Services</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Services for this client will be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Client Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Invoices for this client will be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle>Client Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Contact information for this client will be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="support">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Support tickets for this client will be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminClientProfilePage;
