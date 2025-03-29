
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CircleDollarSign, Clock, FileText, Package2 } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import RecentUpdatesList from '@/components/dashboard/RecentUpdatesList';
import { DashboardBarChart, DashboardLineChart, DashboardPieChart } from '@/components/dashboard/DashboardCharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

// Define types for our data
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
}

interface ClientDashboardData {
  services: ClientService[];
  invoices: Invoice[];
  metrics: {
    activeServices: number;
    totalSpent: number;
    pendingInvoices: number;
    upcomingRenewals: number;
  };
}

const ClientDashboard = () => {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<ClientDashboardData>({
    services: [],
    invoices: [],
    metrics: {
      activeServices: 0,
      totalSpent: 0,
      pendingInvoices: 0,
      upcomingRenewals: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Mock client ID for demo purposes - would normally come from auth context
  const clientId = '123e4567-e89b-12d3-a456-426614174001';

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // In a real app, we'd get the actual client ID from auth
        const userId = '00000000-0000-0000-0000-000000000000';

        // Get client ID from user
        const { data: userData } = await supabase
          .from('User')
          .select('clientId')
          .eq('id', userId)
          .single();

        if (!userData?.clientId) {
          toast({
            title: "Error",
            description: "Could not fetch client information",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Fetch client services
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
          .eq('clientId', userData.clientId);

        // Fetch client invoices
        const { data: invoicesData } = await supabase
          .from('Invoice')
          .select('*')
          .eq('clientId', userData.clientId)
          .order('createdAt', { ascending: false });

        // Calculate metrics
        const activeServices = servicesData?.filter(s => s.status === 'ACTIVE').length || 0;
        const totalSpent = invoicesData?.filter(i => i.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0) || 0;
        const pendingInvoices = invoicesData?.filter(i => i.status === 'PENDING').length || 0;
        
        // Calculate upcoming renewals (services ending in the next 30 days)
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);
        
        const upcomingRenewals = servicesData?.filter(s => {
          if (!s.endDate) return false;
          const endDate = new Date(s.endDate);
          return endDate >= now && endDate <= thirtyDaysFromNow;
        }).length || 0;

        setDashboardData({
          services: servicesData || [],
          invoices: invoicesData || [],
          metrics: {
            activeServices,
            totalSpent,
            pendingInvoices,
            upcomingRenewals
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

    fetchDashboardData();
  }, [toast]);

  // Prepare chart data
  const serviceUsageData = dashboardData.services.length > 0
    ? dashboardData.services.reduce((acc: any, service) => {
        const serviceName = service.service?.name || 'Unknown Service';
        const existingEntry = acc.find((entry: any) => entry.name === serviceName);
        
        if (existingEntry) {
          existingEntry.value++;
        } else {
          acc.push({
            name: serviceName,
            value: 1,
            // Assign a color based on index for visual differentiation
            color: `hsl(${(acc.length * 40) % 360}, 70%, 50%)`
          });
        }
        return acc;
      }, [])
    : [{ name: 'No Services', value: 1, color: '#ccc' }];

  // Monthly invoice data
  const monthlyInvoiceData = [
    { name: 'Jan', paid: 1200, pending: 300 },
    { name: 'Feb', paid: 1100, pending: 400 },
    { name: 'Mar', paid: 1300, pending: 200 },
    { name: 'Apr', paid: 900, pending: 400 },
    { name: 'May', paid: 1500, pending: 300 },
    { name: 'Jun', paid: 1200, pending: 100 },
  ];

  // Service usage history data
  const serviceUsageHistory = [
    { name: 'Jan', usage: 65 },
    { name: 'Feb', usage: 59 },
    { name: 'Mar', usage: 80 },
    { name: 'Apr', usage: 81 },
    { name: 'May', usage: 56 },
    { name: 'Jun', usage: 75 },
  ];

  // Create chart configs
  const invoiceChartConfig = {
    paid: { label: 'Paid Invoices', theme: { light: '#4ade80', dark: '#4ade80' } },
    pending: { label: 'Pending Invoices', theme: { light: '#fb923c', dark: '#fb923c' } },
  };

  const usageChartConfig = {
    usage: { label: 'Service Usage', theme: { light: '#60a5fa', dark: '#60a5fa' } },
  };

  // Recent updates list items for the dashboard
  const recentUpdates = dashboardData.invoices.slice(0, 5).map(invoice => ({
    id: invoice.id,
    title: `Invoice ${invoice.id.substring(0, 8)}`,
    description: `Amount: $${invoice.amount}`,
    date: new Date(invoice.createdAt),
    badge: {
      text: invoice.status,
      variant: invoice.status === 'PAID' ? 'default' : 
               invoice.status === 'PENDING' ? 'secondary' : 'outline'
    },
  }));

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
        {/* Stats overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Active Services"
            value={dashboardData.metrics.activeServices}
            icon={<Package2 className="h-4 w-4" />}
            description="Current active service subscriptions"
          />
          <MetricCard
            title="Total Spent"
            value={dashboardData.metrics.totalSpent}
            valuePrefix="$"
            icon={<CircleDollarSign className="h-4 w-4" />}
            description="Lifetime value"
          />
          <MetricCard
            title="Pending Invoices"
            value={dashboardData.metrics.pendingInvoices}
            icon={<FileText className="h-4 w-4" />}
            description="Awaiting payment"
          />
          <MetricCard
            title="Upcoming Renewals"
            value={dashboardData.metrics.upcomingRenewals}
            icon={<Clock className="h-4 w-4" />}
            description="Services renewing in the next 30 days"
          />
        </div>

        {/* Charts and Recent Updates */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Service distribution */}
          <DashboardPieChart
            title="Service Distribution"
            data={serviceUsageData}
            height={300}
          />

          {/* Monthly Invoices */}
          <DashboardBarChart
            title="Monthly Invoices"
            data={monthlyInvoiceData}
            dataKeys={['paid', 'pending']}
            height={300}
            config={invoiceChartConfig}
          />

          {/* Recent Updates */}
          <RecentUpdatesList
            title="Recent Invoices & Updates"
            items={recentUpdates}
            emptyMessage="No recent updates"
          />
        </div>

        {/* Service Usage Trends */}
        <DashboardLineChart
          title="Service Usage Trends"
          data={serviceUsageHistory}
          dataKeys={['usage']}
          height={300}
          config={usageChartConfig}
          className="col-span-3"
        />
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;
