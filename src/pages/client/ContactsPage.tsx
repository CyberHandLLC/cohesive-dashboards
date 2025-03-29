
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, Search, Edit2, Trash2, Mail, Phone } from 'lucide-react';

type ContactStatus = 'ACTIVE' | 'INACTIVE';
type ContactType = 'PRIMARY' | 'BILLING' | 'TECHNICAL' | 'SUPPORT';
type ContactMethod = 'EMAIL' | 'PHONE' | 'BOTH';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string | null;
  status: ContactStatus;
  contactType: ContactType | null;
  preferredContactMethod: ContactMethod | null;
  isPrimary: boolean;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

interface ContactFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  contactType: ContactType | '';
  preferredContactMethod: ContactMethod | '';
  isPrimary: boolean;
}

const ClientContactsPage = () => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentContactId, setCurrentContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<ContactFormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      contactType: '',
      preferredContactMethod: '',
      isPrimary: false,
    },
  });

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase
        .from('User')
        .select('clientId')
        .eq('id', '00000000-0000-0000-0000-000000000000') // Replace with actual user ID when auth is implemented
        .single();

      if (userData?.clientId) {
        const { data, error } = await supabase
          .from('Contact')
          .select('*')
          .eq('clientId', userData.clientId)
          .order('isPrimary', { ascending: false })
          .order('lastName', { ascending: true });

        if (error) {
          throw error;
        }

        setContacts(data || []);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not find client information",
        });
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load contacts",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const openCreateDialog = () => {
    form.reset({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      contactType: '',
      preferredContactMethod: '',
      isPrimary: false,
    });
    setIsEditMode(false);
    setCurrentContactId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (contact: Contact) => {
    form.reset({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      role: contact.role || '',
      contactType: contact.contactType || '',
      preferredContactMethod: contact.preferredContactMethod || '',
      isPrimary: contact.isPrimary,
    });
    setIsEditMode(true);
    setCurrentContactId(contact.id);
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: ContactFormValues) => {
    try {
      // First get the client ID from the user table
      const { data: userData } = await supabase
        .from('User')
        .select('clientId')
        .eq('id', '00000000-0000-0000-0000-000000000000') // Replace with actual user ID when auth is implemented
        .single();

      if (!userData?.clientId) {
        throw new Error("Client ID not found");
      }

      const contactData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone || null,
        role: values.role || null,
        contactType: values.contactType || null,
        preferredContactMethod: values.preferredContactMethod || null,
        isPrimary: values.isPrimary,
      };

      let error;
      
      if (isEditMode && currentContactId) {
        // Update existing contact
        const { error: updateError } = await supabase
          .from('Contact')
          .update(contactData)
          .eq('id', currentContactId);
        
        error = updateError;
      } else {
        // Create new contact
        const { error: insertError } = await supabase
          .from('Contact')
          .insert([{
            ...contactData,
            clientId: userData.clientId,
            status: 'ACTIVE',
          }]);
        
        error = insertError;
      }

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: isEditMode ? "Contact updated successfully" : "Contact created successfully",
      });

      // Refresh contact list
      fetchContacts();
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error saving contact:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} contact`,
      });
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      try {
        const { error } = await supabase
          .from('Contact')
          .update({ status: 'INACTIVE' })
          .eq('id', id);

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Contact deleted successfully",
        });

        // Refresh contact list
        fetchContacts();
      } catch (error) {
        console.error("Error deleting contact:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete contact",
        });
      }
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.role && contact.role.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const breadcrumbs = [
    { label: 'Client', href: '/client' },
    { label: 'Contacts' }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="client"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Contacts</h1>
            <p className="text-muted-foreground">
              Manage contacts associated with your account
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Search Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Contact List</CardTitle>
            <CardDescription>
              People associated with your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading contacts...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {searchQuery ? "No contacts match your search" : "No contacts found"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">
                          {contact.firstName} {contact.lastName}
                          {contact.isPrimary && (
                            <Badge variant="secondary" className="ml-2 bg-blue-500">Primary</Badge>
                          )}
                        </TableCell>
                        <TableCell>{contact.role || '-'}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.phone || '-'}</TableCell>
                        <TableCell>{contact.contactType || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Send Email"
                              asChild
                            >
                              <a href={`mailto:${contact.email}`}>
                                <Mail className="h-4 w-4" />
                              </a>
                            </Button>
                            {contact.phone && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title="Call"
                                asChild
                              >
                                <a href={`tel:${contact.phone}`}>
                                  <Phone className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Edit Contact"
                              onClick={() => openEditDialog(contact)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Delete Contact"
                              onClick={() => handleDeleteContact(contact.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Update contact details below' 
                : 'Fill in the details to create a new contact'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
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
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email address" type="email" {...field} />
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
                      <Input placeholder="Phone number" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. CEO, Accountant, IT Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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
                            <SelectValue placeholder="Select contact type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          <SelectItem value="PRIMARY">Primary</SelectItem>
                          <SelectItem value="BILLING">Billing</SelectItem>
                          <SelectItem value="TECHNICAL">Technical</SelectItem>
                          <SelectItem value="SUPPORT">Support</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferredContactMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Contact Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select preferred method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          <SelectItem value="EMAIL">Email</SelectItem>
                          <SelectItem value="PHONE">Phone</SelectItem>
                          <SelectItem value="BOTH">Both</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Primary Contact</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        This contact will be the main point of contact for the account.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditMode ? 'Update' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClientContactsPage;
