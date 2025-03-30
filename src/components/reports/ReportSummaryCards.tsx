
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Users, Briefcase, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SummaryMetric {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  href?: string;
}

const ReportSummaryCards: React.FC = () => {
  const [metrics, setMetrics] = useState<SummaryMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    setIsLoading(true);
    
    try {
      // Total Revenue (from PAID invoices)
      const { data: revenueData, error: revenueError } = await supabase
        .from('Invoice')
        .select('amount')
        .eq('status', 'PAID');
        
      if (revenueError) throw revenueError;
      const totalRevenue = revenueData.reduce((sum, invoice) => sum + invoice.amount, 0);
      
      // Total Clients
      const { count: clientCount, error: clientError } = await supabase
        .from('Client')
        .select('*', { count: 'exact', head: true });
        
      if (clientError) throw clientError;
      
      // Total Active Services
      const { count: serviceCount, error: serviceError } = await supabase
        .from('Service')
        .select('*', { count: 'exact', head: true });
        
      if (serviceError) throw serviceError;
      
      // Total Open Support Tickets
      const { count: ticketCount, error: ticketError } = await supabase
        .from('SupportTicket')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'OPEN');
        
      if (ticketError) throw ticketError;
      
      setMetrics([
        {
          title: 'Total Revenue',
          value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalRevenue),
          description: 'From paid invoices',
          icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
          href: '/admin/documents/invoices'
        },
        {
          title: 'Total Clients',
          value: clientCount || 0,
          description: 'Active accounts',
          icon: <Users className="h-4 w-4 text-muted-foreground" />,
          href: '/admin/accounts/clients'
        },
        {
          title: 'Active Services',
          value: serviceCount || 0,
          description: 'Available services',
          icon: <Briefcase className="h-4 w-4 text-muted-foreground" />,
          href: '/admin/portfolio/services'
        },
        {
          title: 'Open Support Tickets',
          value: ticketCount || 0,
          description: 'Requiring attention',
          icon: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
          href: '/admin/accounts/clients/support'
        }
      ]);
    } catch (error) {
      console.error('Error fetching summary metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-8 w-[80px] mb-2" />
              <Skeleton className="h-4 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="hover:bg-muted/50 transition-colors cursor-pointer">
          <a href={metric.href} className="block">
            <CardContent className="p-6">
              <div className="flex items-center mb-2 text-muted-foreground">
                {metric.icon}
                <span className="ml-2 text-sm font-medium">{metric.title}</span>
              </div>
              <div className="text-2xl font-bold mb-1">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </CardContent>
          </a>
        </Card>
      ))}
    </div>
  );
};

export default ReportSummaryCards;
