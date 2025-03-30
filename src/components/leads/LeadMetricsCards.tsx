
import React from 'react';
import { 
  BadgeCheck, 
  UserPlus, 
  XCircle, 
  Users, 
  PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LeadMetric {
  label: string;
  value: number | string;
  icon: React.ElementType;
  className?: string;
  onClick?: () => void;
}

interface LeadMetricsCardsProps {
  metrics: {
    totalLeads: number;
    newLeads: number;
    convertedLeads: number;
    lostLeads: number;
    leadsBySource: Record<string, number>;
  };
  onFilterClick?: (filter: { status?: string; source?: string }) => void;
}

const LeadMetricsCards: React.FC<LeadMetricsCardsProps> = ({ 
  metrics,
  onFilterClick 
}) => {
  const { totalLeads, newLeads, convertedLeads, lostLeads, leadsBySource } = metrics;
  
  const formatSourceBreakdown = (sources: Record<string, number>): string => {
    return Object.entries(sources)
      .map(([source, count]) => `${source}: ${count}`)
      .join(', ');
  };

  const metricCards: LeadMetric[] = [
    {
      label: 'Total Leads',
      value: totalLeads,
      icon: Users,
      className: 'bg-blue-50 text-blue-700',
      onClick: () => onFilterClick && onFilterClick({})
    },
    {
      label: 'New Leads',
      value: newLeads,
      icon: UserPlus,
      className: 'bg-green-50 text-green-700',
      onClick: () => onFilterClick && onFilterClick({ status: 'NEW' })
    },
    {
      label: 'Converted Leads',
      value: convertedLeads,
      icon: BadgeCheck,
      className: 'bg-purple-50 text-purple-700',
      onClick: () => onFilterClick && onFilterClick({ status: 'CONVERTED' })
    },
    {
      label: 'Lost Leads',
      value: lostLeads,
      icon: XCircle,
      className: 'bg-red-50 text-red-700',
      onClick: () => onFilterClick && onFilterClick({ status: 'LOST' })
    },
    {
      label: 'By Source',
      value: formatSourceBreakdown(leadsBySource),
      icon: PieChart,
      className: 'bg-yellow-50 text-yellow-700',
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6">
      {metricCards.map((metric, index) => (
        <Card 
          key={index} 
          className={cn(
            "cursor-pointer hover:shadow-md transition-all", 
            metric.onClick ? "hover:scale-105" : ""
          )}
          onClick={metric.onClick}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.label}
            </CardTitle>
            <metric.icon className={cn("h-4 w-4", metric.className)} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", index === 4 ? "text-sm" : "")}>
              {metric.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LeadMetricsCards;
