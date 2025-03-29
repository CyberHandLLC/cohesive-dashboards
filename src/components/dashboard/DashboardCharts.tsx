
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface ChartData {
  name: string;
  [key: string]: string | number;
}

interface ChartConfig {
  [key: string]: {
    label?: React.ReactNode;
    color?: string;
    theme?: {
      light: string;
      dark: string;
    };
  };
}

interface DashboardLineChartProps {
  data: ChartData[];
  title: string;
  height?: number | string;
  dataKeys: string[];
  showGrid?: boolean;
  config?: ChartConfig;
  className?: string;
}

export const DashboardLineChart = ({
  data,
  title,
  height = 300,
  dataKeys,
  showGrid = true,
  config = {},
  className
}: DashboardLineChartProps) => {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height, width: '100%' }}>
          <ChartContainer config={config}>
            <LineChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={(props) => (
                <ChartTooltipContent {...props} />
              )} />
              <Legend />
              {dataKeys.map((key) => (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={`var(--color-${key})`} 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

interface DashboardBarChartProps {
  data: ChartData[];
  title: string;
  height?: number | string;
  dataKeys: string[];
  showGrid?: boolean;
  config?: ChartConfig;
  className?: string;
  stacked?: boolean;
}

export const DashboardBarChart = ({
  data,
  title,
  height = 300,
  dataKeys,
  showGrid = true,
  config = {},
  className,
  stacked = false
}: DashboardBarChartProps) => {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height, width: '100%' }}>
          <ChartContainer config={config}>
            <BarChart data={data}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={(props) => (
                <ChartTooltipContent {...props} />
              )} />
              <Legend />
              {dataKeys.map((key) => (
                <Bar 
                  key={key} 
                  dataKey={key} 
                  fill={`var(--color-${key})`}
                  fillOpacity={0.9}
                  stackId={stacked ? "stack" : undefined}
                />
              ))}
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface DashboardPieChartProps {
  data: PieChartData[];
  title: string;
  height?: number | string;
  config?: ChartConfig;
  className?: string;
  innerRadius?: number;
}

export const DashboardPieChart = ({
  data,
  title,
  height = 300,
  config = {},
  className,
  innerRadius = 0
}: DashboardPieChartProps) => {
  const colors = data.map(item => item.color || `var(--color-${item.name.replace(/\s+/g, '')})`);
  
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height, width: '100%' }}>
          <ChartContainer 
            config={config || data.reduce((acc, item) => {
              const key = item.name.replace(/\s+/g, '');
              return { 
                ...acc, 
                [key]: { 
                  label: item.name,
                  theme: { light: item.color || "#333", dark: item.color || "#ccc" } 
                } 
              };
            }, {})}
          >
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                innerRadius={innerRadius}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={(props) => (
                <ChartTooltipContent {...props} />
              )} />
              <Legend />
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};
