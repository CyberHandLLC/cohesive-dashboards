
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
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const MetricCard = ({
  title,
  value,
  icon,
  description,
  trend,
  className,
  valuePrefix = "",
  valueSuffix = "",
  size = "md",
  variant = "default"
}: MetricCardProps) => {
  
  // Size variant styles
  const sizeStyles = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl"
  };
  
  // Color variant styles
  const variantStyles = {
    default: "",
    success: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
    warning: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800",
    danger: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
    info: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
  };

  // Trend color styles
  const trendColorStyles = {
    positive: "text-green-600",
    negative: "text-red-600"
  };

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className={cn("h-5 w-5 text-muted-foreground", {
          "text-green-500": variant === "success",
          "text-yellow-500": variant === "warning",
          "text-red-500": variant === "danger",
          "text-blue-500": variant === "info",
        })}>{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className={cn("font-bold", sizeStyles[size])}>
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
              trend.positive ? trendColorStyles.positive : trendColorStyles.negative
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
