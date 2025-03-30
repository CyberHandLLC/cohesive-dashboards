
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  AlertCircle, 
  Search, 
  Target, 
  Phone, 
  Mail, 
  Calendar 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClientId } from '@/hooks/useClientId';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/formatters';

// Define lead status and source types
type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
type LeadSource = 'WEBSITE' | 'REFERRAL' | 'ADVERTISEMENT' | 'EVENT' | 'OTHER';

const StaffLeadsPage = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchParams] = useSearchParams();
  const leadIdParam = searchParams.get('leadId');
  
  const { userId, isLoading: userIdLoading, error: userIdError } = useClientId();
  const { toast } = useToast();
  
  const breadcrumbs = [
    { label: 'Staff', href: '/staff' },
    { label: 'Accounts', href: '/staff/accounts' },
    { label: 'Leads' }
  ];

  useEffect(() => {
    if (userId) {
      fetchLeads();
    }
  }, [userId, searchQuery, statusFilter, sourceFilter, leadIdParam]);

  const fetchLeads = async () => {
    if (!userId) return;
    
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
          convertedClientId,
          createdAt,
          updatedAt
        `)
        .eq('assignedToId', userId);
      
      // Apply filters with type casting for safety
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as LeadStatus);
      }
      
      if (sourceFilter && sourceFilter !== 'all') {
        query = query.eq('leadSource', sourceFilter as LeadSource);
      }
      
      if (leadIdParam) {
        query = query.eq('id', leadIdParam);
      }
      
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      
      const { data: leadData, error: leadError } = await query.order('createdAt', { ascending: false });
      
      if (leadError) throw leadError;
      
      setLeads(leadData || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Could not fetch lead data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const { error } = await supabase
        .from('Lead')
        .update({ status: newStatus })
        .eq('id', leadId);
        
      if (error) throw error;
      
      toast({
        title: "Lead Updated",
        description: `Lead status changed to ${newStatus}`,
      });
      
      // Update the local state
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: "Error",
        description: "Could not update lead status",
        variant: "destructive",
      });
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSourceFilter('all');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONVERTED':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800">
          Converted
        </span>;
      case 'LOST':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-800">
          Lost
        </span>;
      case 'QUALIFIED':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800">
          Qualified
        </span>;
      case 'CONTACTED':
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-yellow-100 text-yellow-800">
          Contacted
        </span>;
      default: // NEW
        return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-purple-100 text-purple-800">
          New
        </span>;
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
          <Button asChild variant="outline">
            <Link to="/login">Log in again</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
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
                  <SelectTrigger className="w-[140px]">
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
                {(searchQuery || statusFilter !== 'all' || sourceFilter !== 'all') && (
                  <Button variant="outline" onClick={resetFilters}>
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Lead List */}
        <Card>
          <CardHeader>
            <CardTitle>Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading leads...</p>
              </div>
            ) : leads.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="hidden lg:table-cell">Follow-up</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{lead.email}</TableCell>
                        <TableCell>{getStatusBadge(lead.status)}</TableCell>
                        <TableCell>{lead.leadSource || "Unknown"}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {lead.followUpDate ? formatDate(lead.followUpDate) : "Not scheduled"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {(lead.status !== 'CONVERTED' && lead.status !== 'LOST') && (
                              <Button variant="outline" size="icon" title="Schedule Follow-up">
                                <Calendar className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="outline" size="icon" title="Email Lead" asChild>
                              <a href={`mailto:${lead.email}`}>
                                <Mail className="h-4 w-4" />
                              </a>
                            </Button>
                            {lead.phone && (
                              <Button variant="outline" size="icon" title="Call Lead" asChild>
                                <a href={`tel:${lead.phone}`}>
                                  <Phone className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button variant="default" size="sm" asChild>
                              <Link to={`/staff/accounts/leads/${lead.id}`}>
                                View
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-xl mb-1">No leads found</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  There are no leads assigned to you or none match your current filters.
                </p>
                {(searchQuery || statusFilter !== 'all' || sourceFilter !== 'all') && (
                  <Button variant="outline" onClick={resetFilters} className="mt-4">
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffLeadsPage;
