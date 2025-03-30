
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { DashboardBarChart, DashboardLineChart, DashboardPieChart } from '@/components/dashboard/DashboardCharts';
import ClientMetricsSection from '@/components/dashboard/ClientMetricsSection';
import ClientQuickLinks from '@/components/dashboard/ClientQuickLinks';
import ClientActivityCard from '@/components/dashboard/ClientActivityCard';
import { useClientId } from '@/hooks/useClientId';
import { useClientDashboard } from '@/hooks/useClientDashboard';

const ClientDashboard = () => {
  const { clientId, userId, isLoading: isClientIdLoading } = useClientId();
  const { dashboardData, isLoading: isDashboardDataLoading } = useClientDashboard(clientId, userId);

  const isLoading = isClientIdLoading || isDashboardDataLoading;

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
        <ClientMetricsSection metrics={dashboardData.metrics} />

        {/* Quick Links */}
        <ClientQuickLinks />

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

          <ClientActivityCard 
            updates={combinedUpdates}
            isLoading={isLoading}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;
