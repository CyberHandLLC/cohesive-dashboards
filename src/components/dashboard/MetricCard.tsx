
import React, { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}

const MetricCard = ({
  title,
  value,
  icon,
  description,
  trend,
  className,
  valuePrefix = "",
  valueSuffix = ""
}: MetricCardProps) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {valuePrefix}{value}{valueSuffix}
        </div>
        
        {trend && (
          <div className="flex items-center mt-1">
            {trend.positive ? (
              <ArrowUpIcon className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <ArrowDownIcon className="h-3 w-3 text-red-600 mr-1" />
            )}
            <p className={cn(
              "text-xs",
              trend.positive ? "text-green-600" : "text-red-600"
            )}>
              {trend.value}% from previous period
            </p>
          </div>
        )}
        
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
