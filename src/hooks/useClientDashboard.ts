
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClientDashboardData } from '@/types/client';

export const useClientDashboard = (clientId: string | null, userId: string | null) => {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<ClientDashboardData>({
    services: [],
    invoices: [],
    supportTickets: [],
    auditLogs: [],
    metrics: {
      activeServices: 0,
      totalSpent: 0,
      pendingInvoices: 0,
      upcomingRenewals: 0,
      openSupportTickets: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async (clientId: string) => {
    setIsLoading(true);
    try {
      // Fetch services with their details
      const { data: servicesData } = await supabase
        .from('ClientService')
        .select(`
          *,
          service:serviceId (
            name,
            price,
            description,
            features,
            customFields
          )
        `)
        .eq('clientId', clientId);

      // Fetch invoices
      const { data: invoicesData } = await supabase
        .from('Invoice')
        .select('*')
        .eq('clientId', clientId)
        .order('createdAt', { ascending: false });

      // Fetch support tickets
      const { data: supportTicketsData } = await supabase
        .from('SupportTicket')
        .select('*')
        .eq('clientId', clientId)
        .order('createdAt', { ascending: false });

      // Fetch audit logs
      const { data: auditLogsData } = await supabase
        .from('AuditLog')
        .select('*')
        .eq('userId', userId)
        .order('timestamp', { ascending: false })
        .limit(10);

      // Calculate metrics
      const activeServices = servicesData?.filter(s => s.status === 'ACTIVE').length || 0;
      const totalSpent = invoicesData?.filter(i => i.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0) || 0;
      const pendingInvoices = invoicesData?.filter(i => i.status === 'PENDING').reduce((sum, inv) => sum + inv.amount, 0) || 0;
      const openSupportTickets = supportTicketsData?.filter(t => t.status === 'OPEN').length || 0;
      
      // Calculate upcoming renewals (services ending in next 30 days)
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);
      
      const upcomingRenewals = servicesData?.filter(s => {
        if (!s.endDate) return false;
        const endDate = new Date(s.endDate);
        return endDate >= now && endDate <= thirtyDaysFromNow;
      }).length || 0;

      // Fetch user's last login time
      const { data: userAuthData } = await supabase.auth.getUser();
      const lastLogin = userAuthData?.user?.last_sign_in_at;

      setDashboardData({
        services: servicesData || [],
        invoices: invoicesData || [],
        supportTickets: supportTicketsData || [],
        auditLogs: auditLogsData || [],
        metrics: {
          activeServices,
          totalSpent,
          pendingInvoices,
          upcomingRenewals,
          openSupportTickets,
          lastLogin
        }
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, userId]);

  useEffect(() => {
    if (clientId) {
      fetchDashboardData(clientId);
    }
  }, [clientId, fetchDashboardData]);

  const setupRealTimeSubscriptions = useCallback(() => {
    if (!clientId) return () => {};

    const clientServicesChannel = supabase
      .channel('client-services-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ClientService'
        },
        (payload) => {
          if (clientId && payload.new.clientId === clientId) {
            fetchDashboardData(clientId);
          }
        }
      )
      .subscribe();
    
    const invoicesChannel = supabase
      .channel('invoices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Invoice'
        },
        (payload) => {
          if (clientId && payload.new.clientId === clientId) {
            fetchDashboardData(clientId);
          }
        }
      )
      .subscribe();
    
    const supportTicketsChannel = supabase
      .channel('support-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'SupportTicket'
        },
        (payload) => {
          if (clientId && payload.new.clientId === clientId) {
            fetchDashboardData(clientId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(clientServicesChannel);
      supabase.removeChannel(invoicesChannel);
      supabase.removeChannel(supportTicketsChannel);
    };
  }, [clientId, fetchDashboardData]);

  useEffect(() => {
    const cleanup = setupRealTimeSubscriptions();
    return cleanup;
  }, [setupRealTimeSubscriptions]);

  return { dashboardData, isLoading, refetchDashboardData: fetchDashboardData };
};
