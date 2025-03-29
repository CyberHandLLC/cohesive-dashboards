
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Mail, Phone, User, Edit, Trash2, Plus, Search } from 'lucide-react';
import SubMenuTabs from '@/components/navigation/SubMenuTabs';
import type { SubMenuItem } from '@/components/navigation/SubMenuTabs';

interface Contact {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
  status: string;
  contactType: string | null;
  preferredContactMethod: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ClientInfo {
  id: string;
  companyName: string;
}

const ContactsPage = () => {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const addContactForm = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      isPrimary: false,
      contactType: 'PRIMARY',
      preferredContactMethod: 'EMAIL',
    },
  });

  const editContactForm = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      isPrimary: false,
      contactType: '',
      preferredContactMethod: '',
    },
  });

  useEffect(() => {
    if (clientId) {
      fetchClient();
      fetchContacts();
    } else {
      navigate('/admin/accounts/clients');
    }
  }, [clientId, searchQuery]);

  const fetchClient = async () => {
    if (!clientId) return;

    try {
      const { data, error } = await supabase
        .from('Client')
        .select('id, companyName')
        .eq('id', clientId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setClient(data);
      }
    } catch (error: any) {
      console.error('Error fetching client:', error);
      toast({
        title: "Error",
        description: "Failed to load client information",
        variant: "destructive"
      });
    }
  };

  const fetchContacts = async () => {
    if (!clientId) return;
    
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('Contact')
        .select('*')
        .eq('clientId', clientId);
      
      if (searchQuery) {
        query = query.or(`firstName.ilike.%${searchQuery}%,lastName.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setContacts(data || []);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async (values: any) => {
    if (!clientId) return;
    
    try {
      const { data, error } = await supabase
        .from('Contact')
        .insert({
          clientId,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone || null,
          role: values.role || null,
          isPrimary: values.isPrimary,
          contactType: values.contactType,
          preferredContactMethod: values.preferredContactMethod,
          status: 'ACTIVE',
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Contact added successfully",
        variant: "default"
      });
      
      setIsAddDialogOpen(false);
      addContactForm.reset();
      fetchContacts();
    } catch (error: any) {
      console.error('Error adding contact:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add contact",
        variant: "destructive"
      });
    }
  };

  const handleEditContact = async (values: any) => {
    if (!selectedContact) return;
    
    try {
      const { error } = await supabase
        .from('Contact')
        .update({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone || null,
          role: values.role || null,
          isPrimary: values.isPrimary,
          contactType: values.contactType,
          preferredContactMethod: values.preferredContactMethod,
        })
        .eq('id', selectedContact.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Contact updated successfully",
        variant: "default"
      });
      
      setIsEditDialogOpen(false);
      setSelectedContact(null);
      editContactForm.reset();
      fetchContacts();
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update contact",
        variant: "destructive"
      });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      try {
        const { error } = await supabase
          .from('Contact')
          .delete()
          .eq('id', contactId);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: "Success",
          description: "Contact deleted successfully",
          variant: "default"
        });
        
        fetchContacts();
      } catch (error: any) {
        console.error('Error deleting contact:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete contact",
          variant: "destructive"
        });
      }
    }
  };

  const openAddDialog = () => {
    addContactForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      isPrimary: false,
      contactType: 'PRIMARY',
      preferredContactMethod: 'EMAIL',
    });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (contact: Contact) => {
    setSelectedContact(contact);
    editContactForm.reset({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      role: contact.role || '',
      isPrimary: contact.isPrimary,
      contactType: contact.contactType || '',
      preferredContactMethod: contact.preferredContactMethod || '',
    });
    setIsEditDialogOpen(true);
  };

  const subMenuItems: SubMenuItem[] = [
    { 
      label: 'Overview', 
      href: `/admin/accounts/clients/${clientId}/overview`,
      value: 'overview'
    },
    { 
      label: 'Services', 
      href: `/admin/accounts/clients/services?clientId=${clientId}`,
      value: 'services'
    },
    { 
      label: 'Invoices', 
      href: `/admin/accounts/clients/invoices?clientId=${clientId}`,
      value: 'invoices'
    },
    { 
      label: 'Support', 
      href: `/admin/accounts/clients/support?clientId=${clientId}`,
      value: 'support'
    },
    { 
      label: 'Contacts', 
      href: `/admin/accounts/clients/contacts?clientId=${clientId}`,
      value: 'contacts'
    },
  ];

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Clients', href: '/admin/accounts/clients' },
    { label: client?.companyName || 'Client', href: `/admin/accounts/clients/${clientId}/overview` },
    { label: 'Contacts' }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      subMenuItems={subMenuItems}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button onClick={openAddDialog} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Contact
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Contact Management</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading contacts...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Contact Info</th>
                      <th className="text-left py-3 px-4 font-medium">Role</th>
                      <th className="text-left py-3 px-4 font-medium">Type</th>
                      <th className="text-center py-3 px-4 font-medium">Primary</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.length > 0 ? (
                      contacts.map((contact) => (
                        <tr key={contact.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            {contact.firstName} {contact.lastName}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="flex items-center">
                                <Mail className="h-3 w-3 mr-2" />{contact.email}
                              </span>
                              {contact.phone && (
                                <span className="flex items-center">
                                  <Phone className="h-3 w-3 mr-2" />{contact.phone}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {contact.role || <span className="text-muted-foreground">Not specified</span>}
                          </td>
                          <td className="py-3 px-4">
                            {contact.contactType || <span className="text-muted-foreground">Not specified</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {contact.isPrimary ? (
                              <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Primary</span>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(contact)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteContact(contact.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-muted-foreground">
                          {searchQuery ? 'No contacts match your search criteria' : 'No contacts found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Create a new contact for this client.
            </DialogDescription>
          </DialogHeader>
          <Form {...addContactForm}>
            <form onSubmit={addContactForm.handleSubmit(handleAddContact)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addContactForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addContactForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={addContactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addContactForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone Number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addContactForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input placeholder="Role" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addContactForm.control}
                  name="contactType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PRIMARY">Primary</SelectItem>
                          <SelectItem value="BILLING">Billing</SelectItem>
                          <SelectItem value="TECHNICAL">Technical</SelectItem>
                          <SelectItem value="DECISION_MAKER">Decision Maker</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addContactForm.control}
                  name="preferredContactMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EMAIL">Email</SelectItem>
                          <SelectItem value="PHONE">Phone</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={addContactForm.control}
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Primary Contact
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Add Contact</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information.
            </DialogDescription>
          </DialogHeader>
          <Form {...editContactForm}>
            <form onSubmit={editContactForm.handleSubmit(handleEditContact)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editContactForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editContactForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editContactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editContactForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone Number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editContactForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input placeholder="Role" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editContactForm.control}
                  name="contactType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PRIMARY">Primary</SelectItem>
                          <SelectItem value="BILLING">Billing</SelectItem>
                          <SelectItem value="TECHNICAL">Technical</SelectItem>
                          <SelectItem value="DECISION_MAKER">Decision Maker</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editContactForm.control}
                  name="preferredContactMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EMAIL">Email</SelectItem>
                          <SelectItem value="PHONE">Phone</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editContactForm.control}
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Primary Contact
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Update Contact</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ContactsPage;
