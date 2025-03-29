import React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardChartsProps {
  data: {
    date: string
    revenue: number
  }[]
  engagementData: {
    date: string
    engagement: number
  }[]
  pieData: {
    name: string
    value: number
  }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            Date
          </span>
          <span className="font-bold text-muted-foreground">
            {label}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            Revenue
          </span>
          <span className="font-bold">${payload[0].value}</span>
        </div>
      </div>
    </div>
  );
};

export function DashboardCharts({ data, engagementData, pieData }: DashboardChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-1 md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                content={<CustomTooltip />}
                contentStyle={{ backgroundColor: "transparent", border: "none", boxShadow: "none" }}
                cursor={{ stroke: "var(--muted)" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={engagementData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                content={<LineCustomTooltip />}
                contentStyle={{ backgroundColor: "transparent", border: "none", boxShadow: "none" }}
                cursor={{ stroke: "var(--muted)" }}
              />
              <Line type="monotone" dataKey="engagement" stroke="var(--primary)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-2 lg:col-span-7">
        <CardHeader>
          <CardTitle>Traffic Source</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie dataKey="value" data={pieData} cx="50%" cy="50%" outerRadius={80} fill="var(--primary)" label />
              <Tooltip 
                content={<PieCustomTooltip />}
                contentStyle={{ backgroundColor: "transparent", border: "none", boxShadow: "none" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

const LineCustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            Date
          </span>
          <span className="font-bold text-muted-foreground">
            {label}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            Engagement
          </span>
          <span className="font-bold">{payload[0].value}%</span>
        </div>
      </div>
    </div>
  );
};

const PieCustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="flex flex-col">
        <span className="text-[0.70rem] uppercase text-muted-foreground">
          {payload[0].name}
        </span>
        <span className="font-bold">
          {payload[0].value}%
        </span>
      </div>
    </div>
  );
};
