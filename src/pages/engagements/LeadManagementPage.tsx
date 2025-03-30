
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

import LeadMetricsCards from '@/components/leads/LeadMetricsCards';
import LeadFilters from '@/components/leads/LeadFilters';
import LeadTable from '@/components/leads/LeadTable';
import LeadFormDialog from '@/components/leads/LeadFormDialog';
import LeadConvertDialog from '@/components/leads/LeadConvertDialog';

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
  convertedClientId: string | null;
  convertedClient?: {
    companyName: string;
    id: string;
  };
  createdAt: string;
  updatedAt: string;
}

const LeadManagementPage = () => {
  // State Management
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [staffFilter, setStaffFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  
  // Dialog States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState<boolean>(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Data States
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    newLeads: 0,
    convertedLeads: 0,
    lostLeads: 0,
    leadsBySource: {} as Record<string, number>
  });
  
  const { toast } = useToast();

  // Setup breadcrumbs
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Engagements', href: '/admin/engagements' },
    { label: 'Lead Management' }
  ];

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchLeads();
    fetchStaffMembers();
    fetchMetrics();
  }, [searchQuery, statusFilter, staffFilter, sourceFilter, startDateFilter, endDateFilter]);

  // Data Fetching Functions
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
          ),
          convertedClient:convertedClientId (
            companyName,
            id
          )
        `)
        .order('createdAt', { ascending: false });
      
      // Apply filters
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,notes->content.ilike.%${searchQuery}%`);
      }
      
      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }
      
      if (staffFilter !== 'ALL') {
        if (staffFilter === 'unassigned') {
          query = query.is('assignedToId', null);
        } else {
          query = query.eq('assignedToId', staffFilter);
        }
      }
      
      if (sourceFilter !== 'ALL') {
        query = query.eq('leadSource', sourceFilter);
      }
      
      if (startDateFilter) {
        query = query.gte('createdAt', startDateFilter);
      }
      
      if (endDateFilter) {
        // Add one day to include the end date in the filter
        const nextDay = new Date(endDateFilter);
        nextDay.setDate(nextDay.getDate() + 1);
        query = query.lt('createdAt', nextDay.toISOString().split('T')[0]);
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

  const fetchMetrics = async () => {
    try {
      // Get total count
      const { data: totalCount, error: totalError } = await supabase
        .from('Lead')
        .select('*', { count: 'exact', head: true });
        
      if (totalError) throw totalError;
      
      // Get new leads count
      const { data: newCount, error: newError } = await supabase
        .from('Lead')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'NEW');
        
      if (newError) throw newError;
      
      // Get converted leads count  
      const { data: convertedCount, error: convertedError } = await supabase
        .from('Lead')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'CONVERTED');
        
      if (convertedError) throw convertedError;
      
      // Get lost leads count
      const { data: lostCount, error: lostError } = await supabase
        .from('Lead')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'LOST');
        
      if (lostError) throw lostError;
      
      // Get leads by source
      const { data: sourceData, error: sourceError } = await supabase
        .from('Lead')
        .select('leadSource')
        .not('leadSource', 'is', null);
        
      if (sourceError) throw sourceError;
      
      // Count leads by source
      const sourceCount: Record<string, number> = {};
      sourceData?.forEach(lead => {
        if (lead.leadSource) {
          sourceCount[lead.leadSource] = (sourceCount[lead.leadSource] || 0) + 1;
        }
      });
      
      setMetrics({
        totalLeads: totalCount?.count || 0,
        newLeads: newCount?.count || 0,
        convertedLeads: convertedCount?.count || 0,
        lostLeads: lostCount?.count || 0,
        leadsBySource: sourceCount
      });
      
    } catch (error: any) {
      console.error('Error fetching metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load lead metrics",
        variant: "destructive"
      });
    }
  };

  // Action Handlers
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
          assignedToId: values.assignedToId === 'unassigned' ? null : values.assignedToId || null,
          notes: values.notes ? { content: values.notes } : null,
          followUpDate: values.followUpDate || null,
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      // Log the action
      await supabase.from('AuditLog').insert({
        userId: (await supabase.auth.getUser()).data.user?.id,
        action: 'CREATE',
        resource: 'LEAD',
        details: { leadId: data[0].id, leadName: values.name }
      });
      
      toast({
        title: "Success",
        description: "Lead added successfully",
        variant: "default"
      });
      
      setIsAddDialogOpen(false);
      fetchLeads();
      fetchMetrics();
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
          assignedToId: values.assignedToId === 'unassigned' ? null : values.assignedToId || null,
          notes: values.notes ? { content: values.notes } : null,
          followUpDate: values.followUpDate || null,
        })
        .eq('id', selectedLead.id);
      
      if (error) {
        throw error;
      }
      
      // Log the action
      await supabase.from('AuditLog').insert({
        userId: (await supabase.auth.getUser()).data.user?.id,
        action: 'UPDATE',
        resource: 'LEAD',
        details: { leadId: selectedLead.id, leadName: values.name }
      });
      
      toast({
        title: "Success",
        description: "Lead updated successfully",
        variant: "default"
      });
      
      setIsEditDialogOpen(false);
      setSelectedLead(null);
      fetchLeads();
      fetchMetrics();
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
        // Get the lead details before deleting for audit log
        const { data: leadData } = await supabase
          .from('Lead')
          .select('name')
          .eq('id', leadId)
          .single();
          
        const { error } = await supabase
          .from('Lead')
          .delete()
          .eq('id', leadId);
          
        if (error) {
          throw error;
        }
        
        // Log the action
        await supabase.from('AuditLog').insert({
          userId: (await supabase.auth.getUser()).data.user?.id,
          action: 'DELETE',
          resource: 'LEAD',
          details: { leadId, leadName: leadData?.name }
        });
        
        toast({
          title: "Success",
          description: "Lead deleted successfully",
          variant: "default"
        });
        
        fetchLeads();
        fetchMetrics();
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
      // Create a new client record
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
      
      // Update the lead status to converted and link it to the client
      const { error: updateError } = await supabase
        .from('Lead')
        .update({
          status: 'CONVERTED',
          convertedClientId: newClient[0].id,
        })
        .eq('id', selectedLead.id);
      
      if (updateError) throw updateError;
      
      // Create a primary contact for the client
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
      
      // Log the action
      await supabase.from('AuditLog').insert({
        userId: (await supabase.auth.getUser()).data.user?.id,
        action: 'CONVERT',
        resource: 'LEAD',
        details: { 
          leadId: selectedLead.id, 
          leadName: selectedLead.name,
          clientId: newClient[0].id,
          clientName: values.companyName
        }
      });
      
      toast({
        title: "Success",
        description: "Lead converted to client successfully",
        variant: "default"
      });
      
      setIsConvertDialogOpen(false);
      setSelectedLead(null);
      fetchLeads();
      fetchMetrics();
    } catch (error: any) {
      console.error('Error converting lead:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to convert lead to client",
        variant: "destructive"
      });
    }
  };

  // Dialog Open Handlers
  const openAddDialog = () => {
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditDialogOpen(true);
  };

  const openConvertDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setIsConvertDialogOpen(true);
  };

  const onMetricFilterClick = (filter: { status?: string; source?: string }) => {
    if (filter.status) {
      setStatusFilter(filter.status as StatusFilter);
    } else if (filter.source) {
      setSourceFilter(filter.source);
    } else {
      // Reset filters
      resetFilters();
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setStaffFilter('ALL');
    setSourceFilter('ALL');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
      title="Lead Management"
    >
      <div className="space-y-6">
        {/* Metrics Cards */}
        <LeadMetricsCards 
          metrics={metrics} 
          onFilterClick={onMetricFilterClick}
        />
        
        {/* Search and Filters */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Lead Management</h2>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" /> Add Lead
          </Button>
        </div>
        
        <LeadFilters 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={(value) => setStatusFilter(value as StatusFilter)}
          staffFilter={staffFilter}
          onStaffFilterChange={setStaffFilter}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          startDateFilter={startDateFilter}
          onStartDateFilterChange={setStartDateFilter}
          endDateFilter={endDateFilter}
          onEndDateFilterChange={setEndDateFilter}
          staffMembers={staffMembers}
          onResetFilters={resetFilters}
        />
        
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="bg-muted w-full flex border-b rounded-none justify-start">
                <TabsTrigger value="active" className="flex-1 max-w-[200px]">Active Leads</TabsTrigger>
                <TabsTrigger value="converted" className="flex-1 max-w-[200px]">Converted</TabsTrigger>
                <TabsTrigger value="lost" className="flex-1 max-w-[200px]">Lost</TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="p-4">
                <LeadTable 
                  leads={leads.filter(lead => ['NEW', 'CONTACTED', 'QUALIFIED'].includes(lead.status))}
                  isLoading={isLoading}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteLead}
                  onConvert={openConvertDialog}
                  onAssign={openEditDialog}
                />
              </TabsContent>
              <TabsContent value="converted" className="p-4">
                <LeadTable 
                  leads={leads.filter(lead => lead.status === 'CONVERTED')}
                  isLoading={isLoading}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteLead}
                  onConvert={openConvertDialog}
                  onAssign={openEditDialog}
                />
              </TabsContent>
              <TabsContent value="lost" className="p-4">
                <LeadTable 
                  leads={leads.filter(lead => lead.status === 'LOST')}
                  isLoading={isLoading}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteLead}
                  onConvert={openConvertDialog}
                  onAssign={openEditDialog}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <LeadFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddLead}
        staffMembers={staffMembers}
      />

      {selectedLead && (
        <LeadFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={handleEditLead}
          staffMembers={staffMembers}
          isEditing={true}
          defaultValues={{
            name: selectedLead.name,
            email: selectedLead.email,
            phone: selectedLead.phone || '',
            status: selectedLead.status,
            leadSource: selectedLead.leadSource || '',
            assignedToId: selectedLead.assignedToId || 'unassigned',
            notes: selectedLead.notes?.content || '',
            followUpDate: selectedLead.followUpDate ? new Date(selectedLead.followUpDate).toISOString().split('T')[0] : '',
          }}
          title={`Edit Lead: ${selectedLead.name}`}
        />
      )}

      {selectedLead && (
        <LeadConvertDialog
          open={isConvertDialogOpen}
          onOpenChange={setIsConvertDialogOpen}
          onSubmit={handleConvertLead}
          leadName={selectedLead.name}
        />
      )}
    </DashboardLayout>
  );
};

export default LeadManagementPage;
