
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PlusCircle, Search, Edit, Trash2 } from 'lucide-react';

type ContactType = "PRIMARY" | "BILLING" | "TECHNICAL" | "SUPPORT";
type ContactStatus = "ACTIVE" | "INACTIVE";
type ContactMethod = "EMAIL" | "PHONE";

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  contactType: ContactType;
  preferredContactMethod: ContactMethod;
  isPrimary: boolean;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  contactType: ContactType;
  preferredContactMethod: ContactMethod;
  isPrimary: boolean;
  status: ContactStatus;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

const ContactsPage = () => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactTypeFilter, setContactTypeFilter] = useState<ContactType | 'ALL'>('ALL');
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const form = useForm<ContactForm>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      contactType: 'PRIMARY',
      preferredContactMethod: 'EMAIL',
      isPrimary: false,
    },
  });

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      if (!clientId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No client ID provided",
        });
        return;
      }

      const { data, error } = await supabase
        .from('Contact')
        .select('*')
        .eq('clientId', clientId);

      if (error) {
        throw error;
      }

      setContacts(data as Contact[]);
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
    if (clientId) {
      fetchContacts();
    }
  }, [clientId]);

  const resetForm = () => {
    form.reset({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      contactType: 'PRIMARY',
      preferredContactMethod: 'EMAIL',
      isPrimary: false,
    });
    setIsEditMode(false);
    setCurrentContact(null);
  };

  const openEditDialog = (contact: Contact) => {
    setCurrentContact(contact);
    setIsEditMode(true);
    
    form.reset({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      role: contact.role || '',
      contactType: contact.contactType || 'PRIMARY',
      preferredContactMethod: contact.preferredContactMethod || 'EMAIL',
      isPrimary: contact.isPrimary
    });
    
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('Contact')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });

      fetchContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete contact",
      });
    }
  };

  const onSubmit = async (values: ContactForm) => {
    try {
      if (isEditMode && currentContact) {
        // Update existing contact
        const { error } = await supabase
          .from('Contact')
          .update({
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone,
            role: values.role,
            contactType: values.contactType,
            preferredContactMethod: values.preferredContactMethod,
            isPrimary: values.isPrimary,
            updatedAt: new Date().toISOString()
          })
          .eq('id', currentContact.id);
          
        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Contact updated successfully",
        });
        
      } else {
        // Create new contact
        const { error } = await supabase
          .from('Contact')
          .insert([
            {
              clientId: clientId,
              firstName: values.firstName,
              lastName: values.lastName,
              email: values.email,
              phone: values.phone,
              role: values.role,
              contactType: values.contactType,
              preferredContactMethod: values.preferredContactMethod,
              isPrimary: values.isPrimary,
              status: "ACTIVE" as ContactStatus
            }
          ]);

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Contact created successfully",
        });
      }

      fetchContacts();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving contact:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save contact",
      });
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.phone && contact.phone.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesContactType = contactTypeFilter === 'ALL' || contact.contactType === contactTypeFilter;

    return matchesSearch && matchesContactType;
  });

  // Generate submenu items for client navigation
  const subMenuItems = clientId ? [
    { label: 'Overview', href: `/admin/accounts/clients/${clientId}/overview`, value: 'overview' },
    { label: 'Services', href: `/admin/accounts/clients/${clientId}/services`, value: 'services' },
    { label: 'Invoices', href: `/admin/accounts/clients/${clientId}/invoices`, value: 'invoices' },
    { label: 'Support', href: `/admin/accounts/clients/${clientId}/support`, value: 'support' },
    { label: 'Contacts', href: `/admin/accounts/clients/${clientId}/contacts`, value: 'contacts' }
  ] : [];

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Clients', href: '/admin/accounts/clients' },
    { label: 'Contacts' }
  ];

  return (
    <DashboardLayout
      breadcrumbs={breadcrumbs}
      role="admin"
      subMenuItems={subMenuItems}
      subMenuBasePath={`/admin/accounts/clients/${clientId}`}
      title="Client Contacts"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">Contact Management</h2>
          <Button onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={contactTypeFilter}
                onValueChange={(value) => setContactTypeFilter(value as ContactType | 'ALL')}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Contact Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="PRIMARY">Primary</SelectItem>
                  <SelectItem value="BILLING">Billing</SelectItem>
                  <SelectItem value="TECHNICAL">Technical</SelectItem>
                  <SelectItem value="SUPPORT">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>
              Manage contacts for this client
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading contacts...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {searchQuery || contactTypeFilter !== 'ALL'
                  ? "No contacts match your filters"
                  : "No contacts found for this client. Add a contact to get started."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Preferred Method</TableHead>
                      <TableHead>Primary</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.firstName} {contact.lastName}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.phone}</TableCell>
                        <TableCell>{contact.role}</TableCell>
                        <TableCell>{contact.contactType}</TableCell>
                        <TableCell>{contact.preferredContactMethod}</TableCell>
                        <TableCell>{contact.isPrimary ? 'Yes' : 'No'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(contact)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(contact.id)}>
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
            <DialogTitle>{isEditMode ? 'Edit Contact' : 'Create Contact'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update contact information' : 'Add a new contact to the client account'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Input placeholder="Email" type="email" {...field} />
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
                      <Input placeholder="Phone" {...field} />
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
                      <Input placeholder="Role" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                      <FormLabel>Preferred Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                control={form.control}
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Primary Contact</FormLabel>
                      <FormDescription>
                        Set as the primary contact for the account.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{isEditMode ? 'Save Changes' : 'Create Contact'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ContactsPage;
