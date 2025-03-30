
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { supabase } from '@/integrations/supabase/client';
import LeadMetricsCards from '@/components/leads/LeadMetricsCards';
import LeadFilters from '@/components/leads/LeadFilters';
import LeadTable from '@/components/leads/LeadTable';
import LeadFormDialog from '@/components/leads/LeadFormDialog';
import LeadConvertDialog from '@/components/leads/LeadConvertDialog';
import LeadAssignDialog from '@/components/leads/LeadAssignDialog';
import { Lead } from '@/types/lead';
import { useToast } from '@/components/ui/use-toast';

const LeadManagementPage = () => {
  const { toast } = useToast();
  const {
    leads,
    isLoading,
    metrics,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    staffFilter,
    setStaffFilter,
    sourceFilter,
    setSourceFilter,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    resetFilters,
    createLead,
    updateLead,
    deleteLead,
    convertLeadToClient,
    assignLeadToStaff
  } = useLeads();
  
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assigningLead, setAssigningLead] = useState<Lead | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);

  // Fetch staff members
  useEffect(() => {
    const fetchStaffMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('User')
          .select('id, firstName, lastName, email')
          .eq('role', 'STAFF');
        
        if (error) throw error;
        setStaffMembers(data || []);
      } catch (error: any) {
        console.error('Error fetching staff members:', error);
        toast({
          title: "Error loading staff",
          description: error.message,
          variant: "destructive"
        });
      }
    };

    fetchStaffMembers();
  }, [toast]);

  // Handle filter by metric card click
  const handleMetricClick = (filter: { status?: string; source?: string }) => {
    if (filter.status) {
      setStatusFilter(filter.status);
    } else if (filter.source) {
      setSourceFilter(filter.source);
    } else {
      resetFilters();
    }
  };

  // Handle lead form submission
  const handleLeadFormSubmit = async (values: any) => {
    if (editingLead) {
      await updateLead(editingLead.id, values);
      setIsEditDialogOpen(false);
      setEditingLead(null);
    } else {
      await createLead(values);
      setIsAddDialogOpen(false);
    }
  };

  // Handle lead deletion
  const handleDeleteConfirm = async () => {
    if (deletingLeadId) {
      await deleteLead(deletingLeadId);
      setIsDeleteConfirmOpen(false);
      setDeletingLeadId(null);
    }
  };

  // Handle lead conversion
  const handleConvertSubmit = async (values: any) => {
    if (convertingLead) {
      await convertLeadToClient(convertingLead.id, values);
      setIsConvertDialogOpen(false);
      setConvertingLead(null);
    }
  };

  // Handle lead assignment
  const handleAssignSubmit = async (staffId: string | null) => {
    if (assigningLead) {
      await assignLeadToStaff(assigningLead.id, staffId);
      setIsAssignDialogOpen(false);
      setAssigningLead(null);
    }
  };

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Engagements', href: '/admin/engagements' },
    { label: 'Lead Management' }
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Lead Management</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Lead
          </Button>
        </div>
        
        <LeadMetricsCards 
          metrics={{
            totalLeads: metrics.totalLeads,
            newLeads: metrics.newLeads,
            convertedLeads: metrics.convertedLeads,
            lostLeads: metrics.lostLeads,
            leadsBySource: metrics.leadsBySource
          }}
          onFilterClick={handleMetricClick}
        />
        
        <Card>
          <CardContent className="p-6 space-y-6">
            <LeadFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
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
            
            <LeadTable
              leads={leads}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onEdit={(lead) => {
                setEditingLead(lead);
                setIsEditDialogOpen(true);
              }}
              onDelete={(leadId) => {
                setDeletingLeadId(leadId);
                setIsDeleteConfirmOpen(true);
              }}
              onConvert={(lead) => {
                setConvertingLead(lead);
                setIsConvertDialogOpen(true);
              }}
              onAssign={(lead) => {
                setAssigningLead(lead);
                setIsAssignDialogOpen(true);
              }}
              onView={(lead) => {
                setEditingLead(lead);
                setIsEditDialogOpen(true);
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Add Lead Dialog */}
      <LeadFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleLeadFormSubmit}
        title="Add Lead"
        staffMembers={staffMembers}
      />

      {/* Edit Lead Dialog */}
      <LeadFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleLeadFormSubmit}
        lead={editingLead}
        title="Edit Lead"
        staffMembers={staffMembers}
      />

      {/* Convert Lead Dialog */}
      {convertingLead && (
        <LeadConvertDialog
          open={isConvertDialogOpen}
          onOpenChange={setIsConvertDialogOpen}
          onSubmit={handleConvertSubmit}
          leadName={convertingLead.name}
        />
      )}

      {/* Assign Lead Dialog */}
      {assigningLead && (
        <LeadAssignDialog
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          onSubmit={handleAssignSubmit}
          staffMembers={staffMembers}
          leadName={assigningLead.name}
          currentStaffId={assigningLead.assignedToId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {/* This would be implemented as a separate component if needed */}
    </DashboardLayout>
  );
};

export default LeadManagementPage;
