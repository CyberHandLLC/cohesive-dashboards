import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Phone, Mail, UserPlus, Edit, Trash2, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
type StatusFilter = LeadStatus | 'ALL';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: LeadStatus;
  leadSource: string | null;
  followUpDate: string | null;
  notes: any | null;
  assignedToId: string | null;
  assignedTo?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const LeadManagementPage = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState<boolean>(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const { toast } = useToast();

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Engagements', href: '/admin/engagements' },
    { label: 'Lead Management' }
  ];

  const addLeadForm = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      status: 'NEW',
      leadSource: '',
      assignedToId: '',
      notes: '',
      followUpDate: '',
    },
  });

  const editLeadForm = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      status: '',
      leadSource: '',
      assignedToId: '',
      notes: '',
      followUpDate: '',
    },
  });

  const convertLeadForm = useForm({
    defaultValues: {
      companyName: '',
      industry: '',
      websiteUrl: '',
    },
  });

  useEffect(() => {
    fetchLeads();
    fetchStaffMembers();
  }, [searchQuery, statusFilter]);

  const fetchLeads = async () => {
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('Lead')
        .select(`
          *,
          assignedTo:assignedToId (
            firstName,
            lastName,
            email
          )
        `)
        .order('createdAt', { ascending: false });
      
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
      }
      
      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching leads:', error);
        toast({
          title: "Error fetching leads",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setLeads(data || []);
      }
    } catch (error: any) {
      console.error('Error in lead fetch operation:', error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('id, firstName, lastName, email')
        .eq('role', 'STAFF');
      
      if (error) {
        throw error;
      }
      
      setStaffMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching staff members:', error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive"
      });
    }
  };

  const handleAddLead = async (values: any) => {
    try {
      const { data, error } = await supabase
        .from('Lead')
        .insert({
          name: values.name,
          email: values.email,
          phone: values.phone || null,
          status: values.status,
          leadSource: values.leadSource || null,
          assignedToId: values.assignedToId || null,
          notes: values.notes ? { content: values.notes } : null,
          followUpDate: values.followUpDate || null,
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Lead added successfully",
        variant: "default"
      });
      
      setIsAddDialogOpen(false);
      addLeadForm.reset();
      fetchLeads();
    } catch (error: any) {
      console.error('Error adding lead:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add lead",
        variant: "destructive"
      });
    }
  };

  const handleEditLead = async (values: any) => {
    if (!selectedLead) return;
    
    try {
      const { error } = await supabase
        .from('Lead')
        .update({
          name: values.name,
          email: values.email,
          phone: values.phone || null,
          status: values.status,
          leadSource: values.leadSource || null,
          assignedToId: values.assignedToId || null,
          notes: values.notes ? { content: values.notes } : null,
          followUpDate: values.followUpDate || null,
        })
        .eq('id', selectedLead.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Lead updated successfully",
        variant: "default"
      });
      
      setIsEditDialogOpen(false);
      setSelectedLead(null);
      editLeadForm.reset();
      fetchLeads();
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update lead",
        variant: "destructive"
      });
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      try {
        const { error } = await supabase
          .from('Lead')
          .delete()
          .eq('id', leadId);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: "Success",
          description: "Lead deleted successfully",
          variant: "default"
        });
        
        fetchLeads();
      } catch (error: any) {
        console.error('Error deleting lead:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete lead",
          variant: "destructive"
        });
      }
    }
  };

  const handleConvertLead = async (values: any) => {
    if (!selectedLead) return;
    
    try {
      const { data: newClient, error: clientError } = await supabase
        .from('Client')
        .insert({
          companyName: values.companyName || selectedLead.name,
          industry: values.industry || null,
          websiteUrl: values.websiteUrl || null,
          status: 'ACTIVE',
        })
        .select();
      
      if (clientError) throw clientError;
      
      if (!newClient || newClient.length === 0) {
        throw new Error("Failed to create client record");
      }
      
      const { error: updateError } = await supabase
        .from('Lead')
        .update({
          status: 'CONVERTED',
          convertedClientId: newClient[0].id,
        })
        .eq('id', selectedLead.id);
      
      if (updateError) throw updateError;
      
      const { error: contactError } = await supabase
        .from('Contact')
        .insert({
          clientId: newClient[0].id,
          firstName: selectedLead.name.split(' ')[0] || '',
          lastName: selectedLead.name.split(' ').slice(1).join(' ') || '',
          email: selectedLead.email,
          phone: selectedLead.phone || '',
          isPrimary: true,
          status: 'ACTIVE',
          contactType: 'PRIMARY',
        });
      
      if (contactError) throw contactError;
      
      toast({
        title: "Success",
        description: "Lead converted to client successfully",
        variant: "default"
      });
      
      setIsConvertDialogOpen(false);
      setSelectedLead(null);
      convertLeadForm.reset();
      fetchLeads();
    } catch (error: any) {
      console.error('Error converting lead:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to convert lead to client",
        variant: "destructive"
      });
    }
  };

  const openAddDialog = () => {
    addLeadForm.reset({
      name: '',
      email: '',
      phone: '',
      status: 'NEW',
      leadSource: '',
      assignedToId: '',
      notes: '',
      followUpDate: '',
    });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (lead: Lead) => {
    setSelectedLead(lead);
    editLeadForm.reset({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      status: lead.status,
      leadSource: lead.leadSource || '',
      assignedToId: lead.assignedToId || '',
      notes: lead.notes?.content || '',
      followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : '',
    });
    setIsEditDialogOpen(true);
  };

  const openConvertDialog = (lead: Lead) => {
    setSelectedLead(lead);
    convertLeadForm.reset({
      companyName: lead.name,
      industry: '',
      websiteUrl: '',
    });
    setIsConvertDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'NEW':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">New</Badge>;
      case 'CONTACTED':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Contacted</Badge>;
      case 'QUALIFIED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Qualified</Badge>;
      case 'CONVERTED':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Converted</Badge>;
      case 'LOST':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Lost</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
              placeholder="Search leads..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Select 
              value={statusFilter} 
              onValueChange={(value: StatusFilter) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                <SelectItem value="CONVERTED">Converted</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openAddDialog} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Lead
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Lead Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="active">Active Leads</TabsTrigger>
                <TabsTrigger value="converted">Converted</TabsTrigger>
                <TabsTrigger value="lost">Lost</TabsTrigger>
              </TabsList>
              <TabsContent value="active">
                {renderLeadsTable(['NEW', 'CONTACTED', 'QUALIFIED'])}
              </TabsContent>
              <TabsContent value="converted">
                {renderLeadsTable(['CONVERTED'])}
              </TabsContent>
              <TabsContent value="lost">
                {renderLeadsTable(['LOST'])}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Create a new lead in the system.
            </DialogDescription>
          </DialogHeader>
          <Form {...addLeadForm}>
            <form onSubmit={addLeadForm.handleSubmit(handleAddLead)} className="space-y-4">
              <FormField
                control={addLeadForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addLeadForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addLeadForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addLeadForm.control}
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
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="CONTACTED">Contacted</SelectItem>
                        <SelectItem value="QUALIFIED">Qualified</SelectItem>
                        <SelectItem value="LOST">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addLeadForm.control}
                name="leadSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Source</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="WEBSITE">Website</SelectItem>
                        <SelectItem value="REFERRAL">Referral</SelectItem>
                        <SelectItem value="ADVERTISEMENT">Advertisement</SelectItem>
                        <SelectItem value="EVENT">Event</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addLeadForm.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {staffMembers.map(staff => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.firstName || staff.lastName ? 
                              `${staff.firstName || ''} ${staff.lastName || ''} (${staff.email})` : 
                              staff.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addLeadForm.control}
                name="followUpDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addLeadForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter any notes about this lead..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Lead</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update lead information.
            </DialogDescription>
          </DialogHeader>
          <Form {...editLeadForm}>
            <form onSubmit={editLeadForm.handleSubmit(handleEditLead)} className="space-y-4">
              <FormField
                control={editLeadForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editLeadForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editLeadForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editLeadForm.control}
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
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="CONTACTED">Contacted</SelectItem>
                        <SelectItem value="QUALIFIED">Qualified</SelectItem>
                        <SelectItem value="CONVERTED">Converted</SelectItem>
                        <SelectItem value="LOST">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editLeadForm.control}
                name="leadSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Source</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">None</SelectItem>
                        <SelectItem value="WEBSITE">Website</SelectItem>
                        <SelectItem value="REFERRAL">Referral</SelectItem>
                        <SelectItem value="ADVERTISEMENT">Advertisement</SelectItem>
                        <SelectItem value="EVENT">Event</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editLeadForm.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                        {staffMembers.map(staff => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.firstName || staff.lastName ? 
                              `${staff.firstName || ''} ${staff.lastName || ''} (${staff.email})` : 
                              staff.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editLeadForm.control}
                name="followUpDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editLeadForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter any notes about this lead..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Lead</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Convert Lead to Client</DialogTitle>
            <DialogDescription>
              Create a client record from this lead.
            </DialogDescription>
          </DialogHeader>
          <Form {...convertLeadForm}>
            <form onSubmit={convertLeadForm.handleSubmit(handleConvertLead)} className="space-y-4">
              <FormField
                control={convertLeadForm.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Company Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={convertLeadForm.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="Industry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={convertLeadForm.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsConvertDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Convert to Client</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );

  function renderLeadsTable(statusArray: string[]) {
    const filteredLeads = statusFilter === 'ALL' 
      ? leads.filter(lead => statusArray.includes(lead.status))
      : leads;
    
    return isLoading ? (
      <div className="flex justify-center py-8">
        <p>Loading leads...</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="flex items-center">
                        <Mail className="h-3 w-3 mr-2" />{lead.email}
                      </span>
                      {lead.phone && (
                        <span className="flex items-center">
                          <Phone className="h-3 w-3 mr-2" />{lead.phone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(lead.status)}</TableCell>
                  <TableCell>{lead.leadSource || 'Not specified'}</TableCell>
                  <TableCell>
                    {lead.assignedTo ? 
                      (lead.assignedTo.firstName || lead.assignedTo.lastName ? 
                        `${lead.assignedTo.firstName || ''} ${lead.assignedTo.lastName || ''}` : 
                        lead.assignedTo.email) : 
                      'Unassigned'
                    }
                  </TableCell>
                  <TableCell>{formatDate(lead.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {lead.status !== 'CONVERTED' && (
                        <Button variant="ghost" size="icon" onClick={() => openConvertDialog(lead)}>
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(lead)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteLead(lead.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  {searchQuery ? 'No leads match your search criteria' : 'No leads found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  }
};

export default LeadManagementPage;
