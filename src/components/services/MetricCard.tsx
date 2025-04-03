import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MetricSummary } from '@/types/metrics';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  summary: MetricSummary;
  unit?: string;
  precision?: number;
  className?: string;
  fullWidth?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  summary,
  unit = '',
  precision = 1,
  className,
  fullWidth = false
}) => {
  const {
    current,
    previous,
    changePercentage,
    trend,
    status
  } = summary;
  
  // Format the value based on its type and precision
  const formatValue = (value: number): string => {
    if (value === 0) return '0';
    
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(precision)}M`;
    }
    
    if (value >= 1000) {
      return `${(value / 1000).toFixed(precision)}K`;
    }
    
    return value.toFixed(precision);
  };
  
  // Determine status color
  const getStatusColor = (): string => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-amber-500';
      case 'error': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };
  
  // Determine trend indicator
  const TrendIndicator = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className={cn("h-4 w-4", 
          status === 'error' ? "text-destructive" : "text-green-500"
        )} />;
      case 'down':
        return <TrendingDown className={cn("h-4 w-4", 
          status === 'error' ? "text-green-500" : "text-destructive"
        )} />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className={cn(
      "shadow-sm h-[120px]",
      status === 'error' && "border-destructive border-2",
      status === 'warning' && "border-amber-500 border-2",
      fullWidth ? "w-full" : "w-[220px]",
      className
    )}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {status === 'error' && (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
          
          <div className="flex flex-col">
            <div className="text-2xl font-bold">
              {formatValue(current)}{unit}
            </div>
            
            <div className="flex items-center text-xs mt-1">
              <TrendIndicator />
              <span className={cn(
                "ml-1",
                trend === 'up' && status !== 'error' && "text-green-500",
                trend === 'down' && status !== 'success' && "text-destructive",
                trend === 'stable' && "text-muted-foreground"
              )}>
                {Math.abs(changePercentage)}%
              </span>
              <span className="text-muted-foreground ml-1">
                {trend === 'stable' ? 'unchanged' : trend === 'up' ? 'increase' : 'decrease'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
