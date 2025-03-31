
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AlertCircle, Edit, Search, Trash2, UserCheck, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useClientId } from '@/hooks/useClientId';
import { formatDate } from '@/lib/formatters';
import { Column, ResponsiveTable } from '@/components/ui/responsive-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Lead, LeadStatus, LeadSource } from '@/types/lead';
import LeadConvertDialog, { ConvertFormValues } from '@/components/leads/LeadConvertDialog';
import { CreateClientData } from '@/types/client';

interface StaffLeadsPage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: LeadStatus;
  leadSource: LeadSource;
  notes: Record<string, any> | null;
  followUpDate: string | null;
  createdAt: string;
  updatedAt: string;
  assignedToId: string | null;
  convertedClientId: string | null;
  assignedTo?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

const StaffLeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Selected lead for conversion
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { userId, staffId, isLoading: userIdLoading, error: userIdError } = useClientId();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadIdParam = searchParams.get('leadId');
  
  const breadcrumbs = [
    { label: 'Staff', href: '/staff' },
    { label: 'Accounts', href: '/staff/accounts' },
    { label: 'Leads' }
  ];

  useEffect(() => {
    if (staffId) {
      fetchLeads();
    }
  }, [staffId, searchQuery, statusFilter, sourceFilter, startDate, endDate, leadIdParam]);

  const fetchLeads = async () => {
    if (!staffId) return;
    
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('Lead')
        .select(`
          id, 
          name, 
          email, 
          phone, 
          status, 
          leadSource, 
          notes, 
          followUpDate, 
          createdAt,
          updatedAt,
          assignedToId,
          convertedClientId,
          assignedTo:User!assignedToId(firstName, lastName, email)
        `)
        .eq('assignedToId', staffId);
      
      // Apply filters
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as LeadStatus);
      }
      
      if (sourceFilter && sourceFilter !== 'all') {
        query = query.eq('leadSource', sourceFilter as LeadSource);
      }
      
      if (startDate) {
        const formattedStartDate = format(startDate, 'yyyy-MM-dd');
        query = query.gte('createdAt', formattedStartDate);
      }
      
      if (endDate) {
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');
        // Add a day to include the end date fully
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query = query.lt('createdAt', format(nextDay, 'yyyy-MM-dd'));
      }
      
      if (leadIdParam) {
        query = query.eq('id', leadIdParam);
      }
      
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query.order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      setLeads(data as Lead[]);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSourceFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleEdit = (lead: Lead) => {
    // Navigate to the lead edit page or open a modal
    console.log('Edit lead:', lead);
    toast({
      title: "Coming Soon",
      description: "Lead editing will be available soon",
    });
  };

  const handleDelete = (leadId: string) => {
    // Delete the lead or open a confirmation dialog
    console.log('Delete lead:', leadId);
    toast({
      title: "Coming Soon",
      description: "Lead deletion will be available soon",
    });
  };

  const handleConvert = (lead: Lead) => {
    // Open the convert dialog with the selected lead
    setSelectedLead(lead);
    setIsConvertDialogOpen(true);
  };

  const handleAssign = (lead: Lead) => {
    // Open a dialog to assign the lead to another staff member
    console.log('Assign lead:', lead);
    toast({
      title: "Coming Soon",
      description: "Lead assignment will be available soon",
    });
  };

  const handleConvertSubmit = async (values: ConvertFormValues) => {
    if (!selectedLead) return;
    
    setIsSubmitting(true);
    
    try {
      // 1. Create a client record
      const clientData: CreateClientData = {
        companyName: values.companyName,
        industry: values.industry || null,
        websiteUrl: values.websiteUrl || null,
        status: 'ACTIVE',
      };
      
      const { data: clientResult, error: clientError } = await supabase
        .from('Client')
        .insert(clientData)
        .select('id')
        .single();
      
      if (clientError) throw clientError;
      
      const clientId = clientResult.id;
      
      // 2. Create a contact record as the primary contact
      const contactData = {
        firstName: selectedLead.name.split(' ')[0] || '',
        lastName: selectedLead.name.split(' ').slice(1).join(' ') || '',
        email: values.contactEmail,
        phone: values.contactPhone || selectedLead.phone,
        clientId,
        isPrimary: true,
        status: 'ACTIVE',
        contactType: 'PRIMARY',
      };
      
      const { error: contactError } = await supabase
        .from('Contact')
        .insert(contactData);
      
      if (contactError) throw contactError;
      
      // 3. If createClientUser is true, find or create a user with CLIENT role
      if (values.createClientUser) {
        // Check if a user with this email already exists
        const { data: existingUser, error: userCheckError } = await supabase
          .from('User')
          .select('id, email, role, clientId')
          .eq('email', values.contactEmail)
          .maybeSingle();
        
        if (userCheckError) throw userCheckError;
        
        if (existingUser) {
          // Update existing user to CLIENT role and associate with the client
          const { error: userUpdateError } = await supabase
            .from('User')
            .update({
              role: 'CLIENT',
              clientId,
            })
            .eq('id', existingUser.id);
          
          if (userUpdateError) throw userUpdateError;
        } else {
          // We would send an invite or create a user here,
          // but for now we'll just show a message about manual user creation
          toast({
            title: "Note",
            description: "No existing user found with this email. You'll need to create a user account manually.",
          });
        }
      }
      
      // 4. Update the lead status to CONVERTED and link to the new client
      const { error: leadUpdateError } = await supabase
        .from('Lead')
        .update({
          status: 'CONVERTED',
          convertedClientId: clientId,
        })
        .eq('id', selectedLead.id);
      
      if (leadUpdateError) throw leadUpdateError;
      
      // 5. Close the dialog and refresh the leads
      setIsConvertDialogOpen(false);
      setSelectedLead(null);
      fetchLeads();
      
      toast({
        title: "Lead Converted",
        description: `${selectedLead.name} has been successfully converted to a client.`,
      });
      
    } catch (error: any) {
      console.error('Error converting lead to client:', error);
      toast({
        title: "Conversion Failed",
        description: error.message || "An error occurred while converting the lead to a client.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display loading or error state if needed
  if (userIdLoading) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        role="staff"
      >
        <div className="flex justify-center items-center h-[60vh]">
          <p>Loading user information...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (userIdError) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        role="staff"
      >
        <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Authentication Error</h2>
          <p>{userIdError}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!staffId) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        role="staff"
      >
        <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Staff Record Not Found</h2>
          <p>Your user account is not associated with a staff record</p>
        </div>
      </DashboardLayout>
    );
  }

  // Define columns for the responsive table
  const columns: Column<Lead>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: (lead) => <span className="font-medium">{lead.name}</span>
    },
    {
      id: 'email',
      header: 'Email',
      cell: (lead) => lead.email,
      responsive: true
    },
    {
      id: 'status',
      header: 'Status',
      cell: (lead) => {
        const getStatusBadgeClass = () => {
          switch (lead.status) {
            case 'NEW': return 'bg-blue-100 text-blue-800';
            case 'CONTACTED': return 'bg-indigo-100 text-indigo-800';
            case 'QUALIFIED': return 'bg-green-100 text-green-800';
            case 'CONVERTED': return 'bg-purple-100 text-purple-800';
            case 'LOST': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
          }
        };
        
        return (
          <Badge variant="outline" className={getStatusBadgeClass()}>
            {lead.status}
          </Badge>
        );
      }
    },
    {
      id: 'source',
      header: 'Source',
      cell: (lead) => {
        const getSourceBadgeClass = () => {
          switch (lead.leadSource) {
            case 'WEBSITE': return 'bg-green-50 text-green-700';
            case 'REFERRAL': return 'bg-blue-50 text-blue-700';
            case 'ADVERTISEMENT': return 'bg-purple-50 text-purple-700';
            case 'EVENT': return 'bg-orange-50 text-orange-700';
            default: return 'bg-gray-50 text-gray-700';
          }
        };
        
        return (
          <Badge variant="outline" className={getSourceBadgeClass()}>
            {lead.leadSource}
          </Badge>
        );
      },
      responsive: true
    },
    {
      id: 'followUpDate',
      header: 'Follow-Up',
      cell: (lead) => formatDate(lead.followUpDate) || '-'
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (lead) => formatDate(lead.createdAt),
      responsive: true
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (lead) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {lead.status !== 'CONVERTED' && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleConvert(lead)}
              title="Convert to client"
            >
              <UserCheck className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleAssign(lead)}
            title="Assign staff"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleEdit(lead)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleDelete(lead.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: "text-right"
    }
  ];

  return (
    <DashboardLayout
      breadcrumbs={breadcrumbs}
      role="staff"
      title="Lead Management"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Assigned Leads</h1>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search leads by name, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="CONTACTED">Contacted</SelectItem>
                    <SelectItem value="QUALIFIED">Qualified</SelectItem>
                    <SelectItem value="CONVERTED">Converted</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="WEBSITE">Website</SelectItem>
                    <SelectItem value="REFERRAL">Referral</SelectItem>
                    <SelectItem value="ADVERTISEMENT">Advertisement</SelectItem>
                    <SelectItem value="EVENT">Event</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {startDate ? format(startDate, 'PPP') : "Start Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {endDate ? format(endDate, 'PPP') : "End Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {(searchQuery || statusFilter !== 'all' || sourceFilter !== 'all' || startDate || endDate) && (
                <div className="flex justify-end">
                  <Button variant="outline" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Leads List */}
        <Card>
          <CardHeader>
            <CardTitle>Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveTable
              columns={columns}
              data={leads}
              keyField="id"
              isLoading={isLoading}
              emptyMessage="No leads found"
              searchQuery={searchQuery}
              onRowClick={(lead) => {
                // Handle row click, maybe navigate to lead details
                console.log('Lead clicked:', lead);
                toast({
                  title: "Lead Selected",
                  description: `You clicked on ${lead.name}`,
                });
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Lead Convert Dialog */}
      {selectedLead && (
        <LeadConvertDialog
          open={isConvertDialogOpen}
          onOpenChange={setIsConvertDialogOpen}
          onSubmit={handleConvertSubmit}
          leadName={selectedLead.name}
          leadEmail={selectedLead.email}
          leadPhone={selectedLead.phone}
          isSubmitting={isSubmitting}
        />
      )}
    </DashboardLayout>
  );
};

export default StaffLeadsPage;
