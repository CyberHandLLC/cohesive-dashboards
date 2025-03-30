
import React from 'react';
import { CircleDollarSign, Clock, FileText, Package2, MessageSquare, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import MetricCard from '@/components/dashboard/MetricCard';
import { ClientMetrics } from '@/types/client';

interface ClientMetricsSectionProps {
  metrics: ClientMetrics;
}

const ClientMetricsSection: React.FC<ClientMetricsSectionProps> = ({ metrics }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <MetricCard
        title="Active Services"
        value={metrics.activeServices}
        icon={<Package2 className="h-4 w-4" />}
        description="Current subscriptions"
      />
      <MetricCard
        title="Outstanding Invoices"
        value={formatCurrency(metrics.pendingInvoices)}
        icon={<CircleDollarSign className="h-4 w-4" />}
        description="Pending payments"
      />
      <MetricCard
        title="Total Spent"
        value={formatCurrency(metrics.totalSpent)}
        icon={<FileText className="h-4 w-4" />}
        description="Lifetime value"
      />
      <MetricCard
        title="Upcoming Renewals"
        value={metrics.upcomingRenewals}
        icon={<Calendar className="h-4 w-4" />}
        description="Next 30 days"
      />
      <MetricCard
        title="Support Tickets"
        value={metrics.openSupportTickets}
        icon={<MessageSquare className="h-4 w-4" />}
        description="Open tickets"
      />
    </div>
  );
};

export default ClientMetricsSection;
