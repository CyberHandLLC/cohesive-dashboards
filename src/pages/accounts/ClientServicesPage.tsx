import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';

interface ClientService {
  id: string;
  clientId: string;
  serviceId: string;
  service: {
    name: string;
    description: string | null;
    price: number | null;
    monthlyPrice: number | null;
  };
  startDate: string;
  endDate: string | null;
  price: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: string;
  companyName: string;
  status: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  monthlyPrice: number | null;
}

interface SubMenuItem {
  label: string;
  href: string;
  value: string;
}

const ClientServicesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const clientIdFromUrl = queryParams.get('clientId');
  
  const [clientServices, setClientServices] = useState<ClientService[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<ClientService | null>(null);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const { toast } = useToast();

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Clients', href: '/admin/accounts/clients' },
    { label: client ? client.companyName : 'Client' },
    { label: 'Services' }
  ];

  const addServiceForm = useForm({
    defaultValues: {
      serviceId: '',
      price: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'ACTIVE',
    },
  });

  const editServiceForm = useForm({
    defaultValues: {
      price: '',
      startDate: '',
      endDate: '',
      status: '',
    },
  });

  useEffect(() => {
    if (clientIdFromUrl) {
      fetchClient();
      fetchClientServices();
      fetchAvailableServices();
    } else {
      navigate('/admin/accounts/clients');
      toast({
        title: "Error",
        description: "No client selected",
        variant: "destructive"
      });
    }
  }, [clientIdFromUrl]);

  const fetchClient = async () => {
    if (!clientIdFromUrl) return;
    
    try {
      const { data, error } = await supabase
        .from('Client')
        .select('id, companyName, status')
        .eq('id', clientIdFromUrl)
        .single();
      
      if (error) {
        throw error;
      }
      
      setClient(data);
    } catch (error: any) {
      console.error('Error fetching client:', error);
      toast({
        title: "Error",
        description: "Failed to load client information",
        variant: "destructive"
      });
    }
  };

  const fetchClientServices = async () => {
    if (!clientIdFromUrl) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('ClientService')
        .select(`
          *,
          service:serviceId (
            name,
            description,
            price,
            monthlyPrice
          )
        `)
        .eq('clientId', clientIdFromUrl)
        .order('startDate', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setClientServices(data || []);
    } catch (error: any) {
      console.error('Error fetching client services:', error);
      toast({
        title: "Error",
        description: "Failed to load client services",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableServices = async () => {
    try {
      const { data, error } = await supabase
        .from('Service')
        .select('id, name, description, price, monthlyPrice')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setAvailableServices(data || []);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error",
        description: "Failed to load available services",
        variant: "destructive"
      });
    }
  };

  const handleAddService = async (values: any) => {
    if (!clientIdFromUrl) return;
    
    try {
      const selectedService = availableServices.find(service => service.id === values.serviceId);
      const servicePrice = values.price !== '' ? parseFloat(values.price) : 
                         selectedService?.price || selectedService?.monthlyPrice || 0;
      
      const { data, error } = await supabase
        .from('ClientService')
        .insert({
          clientId: clientIdFromUrl,
          serviceId: values.serviceId,
          startDate: values.startDate,
          endDate: values.endDate || null,
          price: servicePrice,
          status: values.status,
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Service added successfully",
        variant: "default"
      });
      
      setIsAddDialogOpen(false);
      addServiceForm.reset();
      fetchClientServices();
    } catch (error: any) {
      console.error('Error adding service:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add service",
        variant: "destructive"
      });
    }
  };

  const handleEditService = async (values: any) => {
    if (!selectedService) return;
    
    try {
      const { error } = await supabase
        .from('ClientService')
        .update({
          price: values.price !== '' ? parseFloat(values.price) : null,
          startDate: values.startDate,
          endDate: values.endDate || null,
          status: values.status,
        })
        .eq('id', selectedService.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Service updated successfully",
        variant: "default"
      });
      
      setIsEditDialogOpen(false);
      setSelectedService(null);
      editServiceForm.reset();
      fetchClientServices();
    } catch (error: any) {
      console.error('Error updating service:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
        variant: "destructive"
      });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (confirm("Are you sure you want to remove this service?")) {
      try {
        const { error } = await supabase
          .from('ClientService')
          .delete()
          .eq('id', serviceId);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: "Success",
          description: "Service removed successfully",
          variant: "default"
        });
        
        fetchClientServices();
      } catch (error: any) {
        console.error('Error deleting service:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete service",
          variant: "destructive"
        });
      }
    }
  };

  const openAddDialog = () => {
    addServiceForm.reset({
      serviceId: '',
      price: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'ACTIVE',
    });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (service: ClientService) => {
    setSelectedService(service);
    editServiceForm.reset({
      price: service.price?.toString() || '',
      startDate: service.startDate ? new Date(service.startDate).toISOString().split('T')[0] : '',
      endDate: service.endDate ? new Date(service.endDate).toISOString().split('T')[0] : '',
      status: service.status,
    });
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not set';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getServiceStatusBadge = (status: string) => {
    switch(status.toUpperCase()) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Expired</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const subMenuItems: SubMenuItem[] = [
    { label: "Overview", href: `/admin/accounts/clients?clientId=${clientIdFromUrl}`, value: "overview" },
    { label: "Services", href: `/admin/accounts/clients/services?clientId=${clientIdFromUrl}`, value: "services" },
    { label: "Invoices", href: `/admin/accounts/clients/invoices?clientId=${clientIdFromUrl}`, value: "invoices" },
    { label: "Support Tickets", href: `/admin/accounts/clients/support?clientId=${clientIdFromUrl}`, value: "support" },
    { label: "Contacts", href: `/admin/accounts/clients/contacts?clientId=${clientIdFromUrl}`, value: "contacts" }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      subMenuItems={subMenuItems}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <h2 className="text-2xl font-bold">
            {client ? `${client.companyName} - Services` : 'Client Services'}
          </h2>
          <Button onClick={openAddDialog} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Service
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Subscribed Services</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
              <TabsContent value="active">
                {renderServicesTable(['ACTIVE'])}
              </TabsContent>
              <TabsContent value="pending">
                {renderServicesTable(['PENDING'])}
              </TabsContent>
              <TabsContent value="inactive">
                {renderServicesTable(['EXPIRED', 'SUSPENDED'])}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
            <DialogDescription>
              Subscribe this client to a service.
            </DialogDescription>
          </DialogHeader>
          <Form {...addServiceForm}>
            <form onSubmit={addServiceForm.handleSubmit(handleAddService)} className="space-y-4">
              <FormField
                control={addServiceForm.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableServices.map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addServiceForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Custom price (leave empty for default)" {...field} />
                    </FormControl>
                    <FormDescription>
                      If left empty, the service's default price will be used.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addServiceForm.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addServiceForm.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addServiceForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Service</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update service subscription details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editServiceForm}>
            <form onSubmit={editServiceForm.handleSubmit(handleEditService)} className="space-y-4">
              <FormField
                control={editServiceForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Custom price" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editServiceForm.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editServiceForm.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editServiceForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Service</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );

  function renderServicesTable(statusArray: string[]) {
    const filteredServices = clientServices.filter(service => 
      statusArray.includes(service.status.toUpperCase())
    );
    
    return isLoading ? (
      <div className="flex justify-center py-8">
        <p>Loading services...</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.length > 0 ? (
              filteredServices.map((serviceItem) => (
                <TableRow key={serviceItem.id}>
                  <TableCell className="font-medium">{serviceItem.service.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                      {formatCurrency(serviceItem.price)}
                    </div>
                  </TableCell>
                  <TableCell>{getServiceStatusBadge(serviceItem.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                      {formatDate(serviceItem.startDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {serviceItem.endDate && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        {formatDate(serviceItem.endDate)}
                      </div>
                    )}
                    {!serviceItem.endDate && 'Ongoing'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(serviceItem)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteService(serviceItem.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No {statusArray.join(', ').toLowerCase()} services found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  }
};

export default ClientServicesPage;
