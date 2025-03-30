import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SubMenuTabs, { SubMenuItem } from '@/components/navigation/SubMenuTabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  CalendarIcon, 
  Building, 
  Globe, 
  FileText, 
  Package2, 
  CircleDollarSign, 
  MessageSquare,
  Users, 
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'PAST';

interface Client {
  id: string;
  companyName: string;
  status: ClientStatus;
  industry: string | null;
  websiteUrl: string | null;
  serviceStartDate: string | null;
  serviceEndDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ClientMetrics {
  serviceCount: number;
  invoiceCount: number;
  openTicketsCount: number;
  contactsCount: number;
}

interface ClientContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
}

const AdminClientProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [metrics, setMetrics] = useState<ClientMetrics>({
    serviceCount: 0,
    invoiceCount: 0,
    openTicketsCount: 0,
    contactsCount: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Define breadcrumbs for navigation
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Clients', href: '/admin/accounts/clients' },
    { label: client?.companyName || 'Client Details' }
  ];
  
  // Updated submenu items with correct paths
  const subMenuItems: SubMenuItem[] = [
    { label: 'Overview', href: `/admin/accounts/clients/${id}/overview`, value: 'overview' },
    { label: 'Services', href: `/admin/accounts/clients/${id}/services`, value: 'services' },
    { label: 'Invoices', href: `/admin/accounts/clients/${id}/invoices`, value: 'invoices' },
    { label: 'Support', href: `/admin/accounts/clients/${id}/support`, value: 'support' },
    { label: 'Contacts', href: `/admin/accounts/clients/${id}/contacts`, value: 'contacts' },
  ];

  useEffect(() => {
    if (id) {
      fetchClientDetails();
      fetchClientMetrics();
      fetchClientContacts();
    }
  }, [id]);

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
        toast({
          title: "Error",
          description: "Could not fetch client details",
          variant: "destructive",
        });
      } else {
        setClient(data);
      }
    } catch (error) {
      console.error('Error in client fetch operation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientMetrics = async () => {
    if (!id) return;
    
    try {
      // Get service count
      const { count: serviceCount, error: serviceError } = await supabase
        .from('ClientService')
        .select('*', { count: 'exact', head: true })
        .eq('clientId', id);
      
      // Get invoice count
      const { count: invoiceCount, error: invoiceError } = await supabase
        .from('Invoice')
        .select('*', { count: 'exact', head: true })
        .eq('clientId', id);
      
      // Get open support tickets count
      const { count: ticketsCount, error: ticketsError } = await supabase
        .from('SupportTicket')
        .select('*', { count: 'exact', head: true })
        .eq('clientId', id)
        .eq('status', 'OPEN');
      
      // Get contacts count
      const { count: contactsCount, error: contactsError } = await supabase
        .from('Contact')
        .select('*', { count: 'exact', head: true })
        .eq('clientId', id);
      
      setMetrics({
        serviceCount: serviceCount || 0,
        invoiceCount: invoiceCount || 0,
        openTicketsCount: ticketsCount || 0,
        contactsCount: contactsCount || 0
      });
    } catch (error) {
      console.error('Error fetching client metrics:', error);
    }
  };

  const fetchClientContacts = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('Contact')
        .select('id, firstName, lastName, email, phone, role, isPrimary')
        .eq('clientId', id)
        .order('isPrimary', { ascending: false });
      
      if (!error && data) {
        setContacts(data);
      }
    } catch (error) {
      console.error('Error fetching client contacts:', error);
    }
  };

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

  const handleEditClient = () => {
    // Would open a modal or navigate to edit page
    toast({
      title: "Edit Client",
      description: "Edit functionality will be implemented soon.",
    });
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
          <SubMenuTabs 
            items={subMenuItems}
            basePath={`/admin/accounts/clients/${id}`}
            className="mb-6"
          />
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                <Package2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.serviceCount}</div>
                <p className="text-xs text-muted-foreground">
                  Subscribed services
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invoices</CardTitle>
                <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.invoiceCount}</div>
                <p className="text-xs text-muted-foreground">
                  Total invoices
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.openTicketsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Open tickets
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contacts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.contactsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Registered contacts
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Client Details</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleEditClient}>
                  <Edit className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Status</div>
                  <div>{getStatusBadge(client.status)}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Industry</div>
                  <div className="flex items-center">
                    <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{client.industry || 'Not specified'}</span>
                  </div>
                </div>
                
                {client.websiteUrl && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Website</div>
                    <div className="flex items-center">
                      <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                      <a 
                        href={client.websiteUrl.startsWith('http') ? client.websiteUrl : `https://${client.websiteUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {client.websiteUrl}
                      </a>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Service Start</div>
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(client.serviceStartDate)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Service End</div>
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(client.serviceEndDate)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Client Since</div>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(client.createdAt)}</span>
                  </div>
                </div>
                
                {client.notes && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Notes</div>
                    <p className="text-sm">{client.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Primary Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                {contacts.length > 0 ? (
                  <div className="space-y-4">
                    {contacts.slice(0, 3).map((contact) => (
                      <div key={contact.id} className="border-b pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium">
                            {contact.firstName} {contact.lastName}
                            {contact.isPrimary && (
                              <Badge className="ml-2 bg-blue-100 text-blue-800">Primary</Badge>
                            )}
                          </div>
                          {contact.role && <span className="text-xs text-muted-foreground">{contact.role}</span>}
                        </div>
                        <div className="text-sm">{contact.email}</div>
                        {contact.phone && <div className="text-sm">{contact.phone}</div>}
                      </div>
                    ))}
                    
                    {contacts.length > 3 && (
                      <div className="text-sm text-center">
                        <Button 
                          variant="ghost" 
                          onClick={() => navigate(`/admin/accounts/clients/${id}/contacts`)}
                        >
                          View all ({contacts.length}) contacts
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No contacts found for this client.</p>
                )}
              </CardContent>
            </Card>
          </div>
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
