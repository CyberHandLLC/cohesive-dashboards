
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StaffDashboardMetrics {
  assignedClients: number;
  openTickets: number;
  activeLeads: number;
  pendingTasks: number;
}

export interface StaffDashboardData {
  metrics: StaffDashboardMetrics;
  recentClients: any[];
  recentTickets: any[];
  recentLeads: any[];
  recentActivity: any[];
}

export const useStaffDashboard = (userId: string | null) => {
  const [dashboardData, setDashboardData] = useState<StaffDashboardData>({
    metrics: {
      assignedClients: 0,
      openTickets: 0,
      activeLeads: 0,
      pendingTasks: 0
    },
    recentClients: [],
    recentTickets: [],
    recentLeads: [],
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        // Get staff record 
        const { data: staffData, error: staffError } = await supabase
          .from('Staff')
          .select('id')
          .eq('userId', userId)
          .single();

        if (staffError) {
          throw new Error('Could not fetch staff record');
        }

        const staffId = staffData.id;

        // Fetch assigned clients count
        const { count: clientsCount, error: clientsError } = await supabase
          .from('Client')
          .select('*', { count: 'exact', head: true })
          .eq('accountManagerId', staffId);
          
        if (clientsError) {
          console.error('Error fetching client count:', clientsError);
        }

        // Fetch open tickets count
        const { count: ticketsCount, error: ticketsError } = await supabase
          .from('SupportTicket')
          .select('*', { count: 'exact', head: true })
          .eq('staffId', userId)
          .eq('status', 'OPEN');
          
        if (ticketsError) {
          console.error('Error fetching ticket count:', ticketsError);
        }

        // Fetch active leads count
        const { count: leadsCount, error: leadsError } = await supabase
          .from('Lead')
          .select('*', { count: 'exact', head: true })
          .eq('assignedToId', userId)
          .not('status', 'in', '("CONVERTED","LOST")');
          
        if (leadsError) {
          console.error('Error fetching lead count:', leadsError);
        }

        // Fetch pending tasks count - either from Tasks table or combine tickets and leads
        const { count: tasksCount, error: tasksError } = await supabase
          .from('Task')
          .select('*', { count: 'exact', head: true })
          .eq('userId', userId)
          .not('status', 'eq', 'COMPLETED');
          
        if (tasksError) {
          console.error('Error fetching task count:', tasksError);
        }

        // Fetch recent assigned clients
        const { data: recentClients, error: recentClientsError } = await supabase
          .from('Client')
          .select('id, companyName, status, industry, createdAt')
          .eq('accountManagerId', staffId)
          .order('createdAt', { ascending: false })
          .limit(5);
          
        if (recentClientsError) {
          console.error('Error fetching recent clients:', recentClientsError);
        }

        // Fetch recent tickets
        const { data: recentTickets, error: recentTicketsError } = await supabase
          .from('SupportTicket')
          .select('id, title, status, priority, clientId, createdAt')
          .eq('staffId', userId)
          .order('createdAt', { ascending: false })
          .limit(5);
          
        if (recentTicketsError) {
          console.error('Error fetching recent tickets:', recentTicketsError);
        }

        // Fetch recent leads
        const { data: recentLeads, error: recentLeadsError } = await supabase
          .from('Lead')
          .select('id, name, email, status, leadSource, createdAt')
          .eq('assignedToId', userId)
          .order('createdAt', { ascending: false })
          .limit(5);
          
        if (recentLeadsError) {
          console.error('Error fetching recent leads:', recentLeadsError);
        }

        // Fetch recent audit logs
        const { data: recentActivity, error: activityError } = await supabase
          .from('AuditLog')
          .select('*')
          .eq('userId', userId)
          .order('timestamp', { ascending: false })
          .limit(5);
          
        if (activityError) {
          console.error('Error fetching activity logs:', activityError);
        }

        // Combine all data
        setDashboardData({
          metrics: {
            assignedClients: clientsCount || 0,
            openTickets: ticketsCount || 0,
            activeLeads: leadsCount || 0,
            pendingTasks: tasksCount || 0
          },
          recentClients: recentClients || [],
          recentTickets: recentTickets || [],
          recentLeads: recentLeads || [],
          recentActivity: recentActivity || []
        });
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId, toast]);

  return { dashboardData, isLoading, error };
};
