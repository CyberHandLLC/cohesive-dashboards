
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { Eye, Search, Plus, Filter, Edit, Trash2 } from 'lucide-react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Client {
  id: string;
  companyName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PAST';
  industry: string | null;
  websiteUrl: string | null;
  serviceStartDate: string | null;
  serviceEndDate: string | null;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isPrimary: boolean;
}

interface ClientFormValues {
  companyName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PAST';
  industry: string;
  websiteUrl: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [primaryContacts, setPrimaryContacts] = useState<Record<string, Contact | null>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<ClientFormValues>({
    defaultValues: {
      companyName: '',
      status: 'ACTIVE',
      industry: '',
      websiteUrl: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    }
  });

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Clients' }
  ];

  useEffect(() => {
    fetchClients();
  }, [searchQuery]);

  const fetchClients = async () => {
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('Client')
        .select('id, companyName, status, industry, websiteUrl, serviceStartDate, serviceEndDate')
        .order('companyName', { ascending: true });
      
      if (searchQuery) {
        query = query.or(`companyName.ilike.%${searchQuery}%,industry.ilike.%${searchQuery}%`);
      }
      
      const { data: clientsData, error } = await query;
      
      if (error) {
        console.error('Error fetching clients:', error);
        toast({
          title: "Error",
          description: "Could not fetch clients",
          variant: "destructive",
        });
      } else {
        setClients(clientsData || []);
        
        // Fetch primary contacts for each client
        if (clientsData && clientsData.length > 0) {
          const contactsPromises = clientsData.map(client => 
            supabase
              .from('Contact')
              .select('id, firstName, lastName, email, phone, isPrimary')
              .eq('clientId', client.id)
              .eq('isPrimary', true)
              .maybeSingle()
          );
          
          const contactsResults = await Promise.all(contactsPromises);
          const contactsMap: Record<string, Contact | null> = {};
          
          clientsData.forEach((client, index) => {
            contactsMap[client.id] = contactsResults[index].data;
          });
          
          setPrimaryContacts(contactsMap);
        }
      }
    } catch (error) {
      console.error('Error in clients fetch operation:', error);
      toast({
        title: "Error",
        description: "Could not fetch clients",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewClient = (clientId: string) => {
    navigate(`/admin/accounts/clients/${clientId}/overview`);
  };

  const handleAddClient = async (data: ClientFormValues) => {
    try {
      // First insert the client
      const { data: clientData, error: clientError } = await supabase
        .from('Client')
        .insert({
          companyName: data.companyName,
          status: data.status,
          industry: data.industry || null,
          websiteUrl: data.websiteUrl || null
        })
        .select();
      
      if (clientError) throw clientError;
      
      const newClient = clientData[0];
      
      // Then insert the primary contact
      const { error: contactError } = await supabase
        .from('Contact')
        .insert({
          clientId: newClient.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || null,
          isPrimary: true
        });
      
      if (contactError) throw contactError;
      
      toast({
        title: "Success",
        description: "Client added successfully",
      });
      
      setIsAddDialogOpen(false);
      form.reset();
      fetchClients();
    } catch (error: any) {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: error.message || "Could not add client",
        variant: "destructive",
      });
    }
  };

  const handleEditClient = async (data: ClientFormValues) => {
    if (!currentClient) return;
    
    try {
      // Update client info
      const { error: clientError } = await supabase
        .from('Client')
        .update({
          companyName: data.companyName,
          status: data.status,
          industry: data.industry || null,
          websiteUrl: data.websiteUrl || null
        })
        .eq('id', currentClient.id);
      
      if (clientError) throw clientError;
      
      // Check if primary contact exists
      const { data: existingContact } = await supabase
        .from('Contact')
        .select('id')
        .eq('clientId', currentClient.id)
        .eq('isPrimary', true)
        .maybeSingle();
      
      if (existingContact) {
        // Update existing primary contact
        const { error: contactError } = await supabase
          .from('Contact')
          .update({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone || null
          })
          .eq('id', existingContact.id);
        
        if (contactError) throw contactError;
      } else {
        // Create new primary contact
        const { error: contactError } = await supabase
          .from('Contact')
          .insert({
            clientId: currentClient.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone || null,
            isPrimary: true
          });
        
        if (contactError) throw contactError;
      }
      
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
      
      setIsEditDialogOpen(false);
      setCurrentClient(null);
      fetchClients();
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: error.message || "Could not update client",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    
    try {
      const { error } = await supabase
        .from('Client')
        .delete()
        .eq('id', clientToDelete);
      
      if (error) throw error;
      
      setClients(clients.filter(client => client.id !== clientToDelete));
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: error.message || "Could not delete client",
        variant: "destructive",
      });
    } finally {
      setClientToDelete(null);
    }
  };

  const openEditDialog = async (client: Client) => {
    setCurrentClient(client);
    
    // Fetch primary contact
    const { data: contact } = await supabase
      .from('Contact')
      .select('firstName, lastName, email, phone')
      .eq('clientId', client.id)
      .eq('isPrimary', true)
      .maybeSingle();
    
    form.reset({
      companyName: client.companyName,
      status: client.status,
      industry: client.industry || '',
      websiteUrl: client.websiteUrl || '',
      firstName: contact?.firstName || '',
      lastName: contact?.lastName || '',
      email: contact?.email || '',
      phone: contact?.phone || ''
    });
    
    setIsEditDialogOpen(true);
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Enter the client details and primary contact information.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAddClient)} className="space-y-4">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Client Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input {...field} required />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
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
                                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                                  <SelectItem value="PAST">Past</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="industry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Industry</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="websiteUrl"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Website URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Primary Contact</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} required />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} required />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" required />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Save Client</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">All Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading clients...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Industry</TableHead>
                      <TableHead className="hidden md:table-cell">Primary Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.length > 0 ? (
                      clients.map((client) => (
                        <TableRow key={client.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{client.companyName}</TableCell>
                          <TableCell>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              client.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800' 
                                : client.status === 'INACTIVE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {client.status}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {client.industry || <span className="text-muted-foreground">Not specified</span>}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {primaryContacts[client.id] ? (
                              `${primaryContacts[client.id]?.firstName} ${primaryContacts[client.id]?.lastName}`
                            ) : (
                              <span className="text-muted-foreground">No primary contact</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewClient(client.id)}
                              >
                                <Eye className="mr-2 h-4 w-4" /> View
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openEditDialog(client)}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setClientToDelete(client.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the client
                                      and all associated data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setClientToDelete(null)}>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteClient}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          {searchQuery ? 'No clients match your search criteria' : 'No clients found'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client details and primary contact information.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditClient)} className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Client Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
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
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            <SelectItem value="PAST">Past</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="websiteUrl"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Primary Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Client</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClientsPage;
