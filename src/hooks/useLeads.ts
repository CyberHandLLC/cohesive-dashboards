
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Lead, LeadStatus, LeadSource, LeadMetrics } from '@/types/lead';

export const useLeads = (initialSearchQuery = '') => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [staffFilter, setStaffFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [metrics, setMetrics] = useState<LeadMetrics>({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0,
    convertedLeads: 0,
    lostLeads: 0,
    leadsBySource: {}
  });
  
  // Fetch leads with filtering
  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('Lead')
        .select(`
          *,
          assignedTo:assignedToId(id, firstName, lastName, email),
          convertedClient:convertedClientId(id, name, companyName)
        `);
      
      // Apply search filter
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`);
      }
      
      // Apply status filter
      if (statusFilter && statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }
      
      // Apply staff filter
      if (staffFilter && staffFilter !== 'ALL') {
        if (staffFilter === 'unassigned') {
          query = query.is('assignedToId', null);
        } else {
          query = query.eq('assignedToId', staffFilter);
        }
      }
      
      // Apply source filter
      if (sourceFilter && sourceFilter !== 'ALL') {
        query = query.eq('leadSource', sourceFilter as LeadSource);
      }
      
      // Apply date filters
      if (startDateFilter) {
        query = query.gte('createdAt', startDateFilter);
      }
      
      if (endDateFilter) {
        query = query.lte('createdAt', endDateFilter);
      }
      
      // Execute the query
      const { data, error } = await query.order('createdAt', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setLeads(data || []);
      
      // Fetch metrics after loading leads
      await fetchLeadMetrics();
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error loading leads",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch lead metrics
  const fetchLeadMetrics = async () => {
    try {
      // Get total count
      const { count: totalCount } = await supabase
        .from('Lead')
        .select('*', { count: 'exact', head: true });
      
      // Get counts by status
      const getStatusCount = async (status: LeadStatus) => {
        const { count } = await supabase
          .from('Lead')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);
        return count || 0;
      };
      
      // Get leads by source
      const { data: sourceData } = await supabase
        .from('Lead')
        .select('leadSource')
        .order('leadSource');
      
      const leadsBySource: Record<string, number> = {};
      
      if (sourceData) {
        sourceData.forEach(lead => {
          const source = lead.leadSource;
          leadsBySource[source] = (leadsBySource[source] || 0) + 1;
        });
      }
      
      setMetrics({
        totalLeads: totalCount || 0,
        newLeads: await getStatusCount('NEW'),
        contactedLeads: await getStatusCount('CONTACTED'),
        qualifiedLeads: await getStatusCount('QUALIFIED'),
        convertedLeads: await getStatusCount('CONVERTED'),
        lostLeads: await getStatusCount('LOST'),
        leadsBySource
      });
    } catch (error: any) {
      console.error('Error fetching lead metrics:', error);
    }
  };

  // Create a new lead
  const createLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('Lead')
        .insert([leadData])
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Lead created",
        description: `${leadData.name} has been added as a lead.`
      });
      
      await fetchLeads();
      return data[0];
    } catch (error: any) {
      console.error('Error creating lead:', error);
      toast({
        title: "Failed to create lead",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  // Update an existing lead
  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      const { error } = await supabase
        .from('Lead')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Lead updated",
        description: `Lead information has been updated.`
      });
      
      await fetchLeads();
      return true;
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast({
        title: "Failed to update lead",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Delete a lead
  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('Lead')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Lead deleted",
        description: `Lead has been removed from the system.`
      });
      
      await fetchLeads();
      return true;
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      toast({
        title: "Failed to delete lead",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Convert a lead to a client
  const convertLeadToClient = async (leadId: string, clientData: { 
    companyName: string; 
    industry?: string;
    websiteUrl?: string;
  }) => {
    try {
      // Get the lead data first
      const { data: leadData, error: leadError } = await supabase
        .from('Lead')
        .select('name, email, phone')
        .eq('id', leadId)
        .single();
      
      if (leadError) throw leadError;
      
      // Create the client
      const { data: clientData, error: clientError } = await supabase
        .from('Client')
        .insert([{
          name: leadData.name,
          companyName: clientData.companyName,
          industry: clientData.industry || null,
          websiteUrl: clientData.websiteUrl || null,
          contactEmail: leadData.email,
          contactPhone: leadData.phone || null,
          status: 'ACTIVE'
        }])
        .select();
      
      if (clientError) throw clientError;
      
      // Update the lead with the client ID
      const { error: updateError } = await supabase
        .from('Lead')
        .update({
          status: 'CONVERTED' as LeadStatus,
          convertedClientId: clientData[0].id
        })
        .eq('id', leadId);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Lead converted",
        description: `${leadData.name} has been converted to a client.`
      });
      
      await fetchLeads();
      return true;
    } catch (error: any) {
      console.error('Error converting lead to client:', error);
      toast({
        title: "Failed to convert lead",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Assign a lead to a staff member
  const assignLeadToStaff = async (leadId: string, staffId: string | null) => {
    try {
      const { error } = await supabase
        .from('Lead')
        .update({ assignedToId: staffId })
        .eq('id', leadId);
      
      if (error) throw error;
      
      toast({
        title: "Lead assigned",
        description: staffId 
          ? `Lead has been assigned to staff member.` 
          : `Lead has been unassigned.`
      });
      
      await fetchLeads();
      return true;
    } catch (error: any) {
      console.error('Error assigning lead:', error);
      toast({
        title: "Failed to assign lead",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setStaffFilter('ALL');
    setSourceFilter('ALL');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, staffFilter, sourceFilter, startDateFilter, endDateFilter]);

  return {
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
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    convertLeadToClient,
    assignLeadToStaff
  };
};
