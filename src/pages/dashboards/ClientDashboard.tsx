
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  CircleDollarSign, 
  Clock, 
  FileText, 
  Package2, 
  MessageSquare, 
  Calendar, 
  Activity 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import MetricCard from '@/components/dashboard/MetricCard';
import RecentUpdatesList from '@/components/dashboard/RecentUpdatesList';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { DashboardBarChart, DashboardLineChart, DashboardPieChart } from '@/components/dashboard/DashboardCharts';

interface ClientService {
  id: string;
  serviceId: string;
  startDate: string;
  endDate: string | null;
  status: string;
  price: number | null;
  service: {
    name: string;
    price: number | null;
    description: string | null;
  };
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  dueDate: string;
  createdAt: string;
  invoiceNumber?: string;
}

interface SupportTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  action: string;
  resource: string;
  timestamp: string;
  details?: any;
  status: string;
}

interface ClientDashboardData {
  services: ClientService[];
  invoices: Invoice[];
  supportTickets: SupportTicket[];
  auditLogs: AuditLogItem[];
  metrics: {
    activeServices: number;
    totalSpent: number;
    pendingInvoices: number;
    upcomingRenewals: number;
    openSupportTickets: number;
    lastLogin?: string;
  };
}

const ClientDashboard = () => {
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
  const [userId, setUserId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndClientId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Authentication Error",
            description: "You must be logged in to view this page",
            variant: "destructive",
          });
          return;
        }

        setUserId(user.id);
        
        const { data: userData } = await supabase
          .from('User')
          .select('clientId')
          .eq('id', user.id)
          .single();

        if (!userData?.clientId) {
          toast({
            title: "Error",
            description: "Could not fetch client information",
            variant: "destructive",
          });
          return;
        }

        setClientId(userData.clientId);
        fetchDashboardData(userData.clientId);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error",
          description: "Failed to load user information",
          variant: "destructive",
        });
      }
    };

    fetchUserAndClientId();

    // Set up real-time listeners for updates
    const setupSubscriptions = async () => {
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
    };

    setupSubscriptions();
  }, [toast]);

  const fetchDashboardData = async (clientId: string) => {
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
            description
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
  };

  // Prepare data for charts
  const serviceDistributionData = dashboardData.services.length > 0
    ? dashboardData.services.reduce((acc: any, service) => {
        const serviceName = service.service?.name || 'Unknown Service';
        const existingEntry = acc.find((entry: any) => entry.name === serviceName);
        
        if (existingEntry) {
          existingEntry.value++;
        } else {
          acc.push({
            name: serviceName,
            value: 1,
            color: `hsl(${(acc.length * 40) % 360}, 70%, 50%)`
          });
        }
        return acc;
      }, [])
    : [{ name: 'No Services', value: 1, color: '#ccc' }];

  // Monthly invoice data (could be calculated from actual data in a real application)
  const monthlyInvoiceData = [
    { name: 'Jan', paid: 1200, pending: 300 },
    { name: 'Feb', paid: 1100, pending: 400 },
    { name: 'Mar', paid: 1300, pending: 200 },
    { name: 'Apr', paid: 900, pending: 400 },
    { name: 'May', paid: 1500, pending: 300 },
    { name: 'Jun', paid: 1200, pending: 100 },
  ];

  const invoiceChartConfig = {
    paid: { label: 'Paid Invoices', theme: { light: '#4ade80', dark: '#4ade80' } },
    pending: { label: 'Pending Invoices', theme: { light: '#fb923c', dark: '#fb923c' } },
  };

  // Transform audit logs into RecentUpdatesList items
  const recentUpdates = dashboardData.auditLogs.map(log => ({
    id: log.id,
    title: `${log.action} ${log.resource}`,
    description: log.details ? JSON.stringify(log.details).substring(0, 50) : '',
    date: new Date(log.timestamp),
    badge: {
      text: log.status,
      variant: log.status === 'SUCCESS' ? 'success' : 
              log.status === 'FAILED' ? 'destructive' : 'outline'
    },
  }));

  // Combine recent invoices and support tickets for the recent updates section
  const combinedUpdates = [
    ...dashboardData.invoices.slice(0, 3).map(invoice => ({
      id: invoice.id,
      title: `Invoice ${invoice.invoiceNumber || invoice.id.substring(0, 8)}`,
      description: `Amount: ${formatCurrency(invoice.amount)}`,
      date: new Date(invoice.createdAt),
      badge: {
        text: invoice.status,
        variant: invoice.status === 'PAID' ? 'success' : 
                invoice.status === 'PENDING' ? 'warning' : 'outline'
      },
      link: `/client/accounts/invoices`
    })),
    ...dashboardData.supportTickets.slice(0, 3).map(ticket => ({
      id: ticket.id,
      title: ticket.title,
      description: `Priority: ${ticket.priority}`,
      date: new Date(ticket.createdAt),
      badge: {
        text: ticket.status,
        variant: ticket.status === 'RESOLVED' ? 'success' :
                ticket.status === 'OPEN' ? 'warning' : 'outline'
      },
      link: `/client/accounts/support`
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  const breadcrumbs = [
    { label: 'Client', href: '/client' },
  ];

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      title="Dashboard"
      role="client" 
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Active Services"
            value={dashboardData.metrics.activeServices}
            icon={<Package2 className="h-4 w-4" />}
            description="Current subscriptions"
          />
          <MetricCard
            title="Outstanding Invoices"
            value={formatCurrency(dashboardData.metrics.pendingInvoices)}
            icon={<CircleDollarSign className="h-4 w-4" />}
            description="Pending payments"
          />
          <MetricCard
            title="Total Spent"
            value={formatCurrency(dashboardData.metrics.totalSpent)}
            icon={<FileText className="h-4 w-4" />}
            description="Lifetime value"
          />
          <MetricCard
            title="Upcoming Renewals"
            value={dashboardData.metrics.upcomingRenewals}
            icon={<Calendar className="h-4 w-4" />}
            description="Next 30 days"
          />
          <MetricCard
            title="Support Tickets"
            value={dashboardData.metrics.openSupportTickets}
            icon={<MessageSquare className="h-4 w-4" />}
            description="Open tickets"
          />
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-4">
          <Button asChild variant="outline">
            <Link to="/client/accounts/services">View Services</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/client/accounts/invoices">Pay Invoices</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/client/accounts/support">Submit Support Ticket</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/client/accounts/profile">Update Profile</Link>
          </Button>
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DashboardPieChart
            title="Service Distribution"
            data={serviceDistributionData}
            height={300}
          />

          <DashboardBarChart
            title="Monthly Invoices"
            data={monthlyInvoiceData}
            dataKeys={['paid', 'pending']}
            height={300}
            config={invoiceChartConfig}
          />

          <Card className="col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity size={16} />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <p>Loading activity...</p>
                </div>
              ) : combinedUpdates.length > 0 ? (
                <div className="space-y-4">
                  {combinedUpdates.map((update) => (
                    <div key={update.id} className="flex flex-col space-y-1 border-b pb-3 last:border-0">
                      <div className="flex items-center justify-between">
                        <Link to={update.link || '#'} className="font-medium hover:underline">
                          {update.title}
                        </Link>
                        <div className={`px-2 py-1 text-xs rounded-md ${
                          update.badge.variant === 'success' ? 'bg-green-100 text-green-800' :
                          update.badge.variant === 'warning' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {update.badge.text}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{update.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(update.date.toISOString())}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;
