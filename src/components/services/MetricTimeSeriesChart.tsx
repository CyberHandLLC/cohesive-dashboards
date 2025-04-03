import React, { useState, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { format } from 'date-fns';
import { MetricDataPoint, TimeRange } from '@/types/metrics';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MetricTimeSeriesChartProps {
  title: string;
  description?: string;
  data: MetricDataPoint[];
  unit?: string;
  color?: string;
  timeRange: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  className?: string;
  height?: number;
}

const MetricTimeSeriesChart: React.FC<MetricTimeSeriesChartProps> = ({
  title,
  description,
  data,
  unit = '',
  color = '#0ea5e9',
  timeRange,
  onTimeRangeChange,
  className,
  height = 300
}) => {
  // If no data is provided, show a placeholder
  if (!data || data.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Format the data for the chart
  const chartData = useMemo(() => {
    return data.map(point => ({
      timestamp: point.timestamp,
      value: point.value,
      ...point.metadata
    }));
  }, [data]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-background border border-border p-2 shadow-md rounded-md">
          <p className="text-xs text-muted-foreground">
            {format(new Date(dataPoint.timestamp), 'PPp')}
          </p>
          <p className="font-medium">
            {dataPoint.value.toFixed(2)}{unit}
          </p>
          {dataPoint.label && (
            <p className="text-xs">{dataPoint.label}</p>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Format the x-axis tick based on the time range
  const formatXAxis = (timestamp: string) => {
    const date = new Date(timestamp);
    switch (timeRange) {
      case 'day':
        return format(date, 'HH:mm');
      case 'week':
        return format(date, 'EEE');
      case 'month':
        return format(date, 'MMM d');
      case 'quarter':
      case 'year':
        return format(date, 'MMM');
      default:
        return format(date, 'MMM d');
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          
          {onTimeRangeChange && (
            <Tabs 
              defaultValue={timeRange} 
              onValueChange={(value) => onTimeRangeChange(value as TimeRange)}
              className="w-auto h-8"
            >
              <TabsList className="h-8">
                <TabsTrigger 
                  value="day" 
                  className="text-xs px-2 py-1 h-6"
                >
                  Day
                </TabsTrigger>
                <TabsTrigger 
                  value="week" 
                  className="text-xs px-2 py-1 h-6"
                >
                  Week
                </TabsTrigger>
                <TabsTrigger 
                  value="month" 
                  className="text-xs px-2 py-1 h-6"
                >
                  Month
                </TabsTrigger>
                <TabsTrigger 
                  value="quarter" 
                  className="text-xs px-2 py-1 h-6"
                >
                  Quarter
                </TabsTrigger>
                <TabsTrigger 
                  value="year" 
                  className="text-xs px-2 py-1 h-6"
                >
                  Year
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis 
                tickFormatter={(value) => `${value}${unit}`}
                width={40}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: 'white' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricTimeSeriesChart;
