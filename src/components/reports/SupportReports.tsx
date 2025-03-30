
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/reports/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { PieChart, Pie, Sector, Cell as PieCell } from 'recharts';
import { ChevronDown, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SupportReportsProps {
  startDate?: Date;
  endDate?: Date;
  dateRange?: DateRange | undefined;
  setDateRange?: (dateRange: DateRange | undefined) => void;
}

// Sample data - in a real application, this would come from your backend
const ticketStatusData = [
  { name: 'Open', value: 15 },
  { name: 'In Progress', value: 25 },
  { name: 'Resolved', value: 45 },
  { name: 'Closed', value: 15 },
];

const ticketCategoryData = [
  { name: 'Technical', value: 40 },
  { name: 'Billing', value: 30 },
  { name: 'General', value: 20 },
  { name: 'Feature Request', value: 10 },
];

const resolutionTimeData = [
  { month: 'Jan', avgDays: 2.5 },
  { month: 'Feb', avgDays: 2.3 },
  { month: 'Mar', avgDays: 2.1 },
  { month: 'Apr', avgDays: 1.9 },
  { month: 'May', avgDays: 1.8 },
  { month: 'Jun', avgDays: 1.7 },
];

const clientSatisfactionData = [
  { name: 'Very Satisfied', value: 55 },
  { name: 'Satisfied', value: 30 },
  { name: 'Neutral', value: 10 },
  { name: 'Dissatisfied', value: 3 },
  { name: 'Very Dissatisfied', value: 2 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const SupportReports: React.FC<SupportReportsProps> = ({ 
  startDate, 
  endDate, 
  dateRange,
  setDateRange 
}) => {
  const [view, setView] = useState<string>('status');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Select 
            value={view} 
            onValueChange={(value) => setView(value)}
          >
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Ticket Status</SelectItem>
              <SelectItem value="category">Ticket Categories</SelectItem>
              <SelectItem value="resolution">Resolution Time</SelectItem>
              <SelectItem value="satisfaction">Client Satisfaction</SelectItem>
            </SelectContent>
          </Select>

          {dateRange && setDateRange && (
            <DatePickerWithRange 
              dateRange={dateRange} 
              setDateRange={setDateRange} 
            />
          )}
        </div>

        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {view === 'status' && (
        <Card>
          <CardHeader>
            <CardTitle>Support Ticket Status Distribution</CardTitle>
            <CardDescription>
              Current breakdown of ticket statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ticketStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {ticketStatusData.map((entry, index) => (
                      <PieCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'category' && (
        <Card>
          <CardHeader>
            <CardTitle>Support Ticket Categories</CardTitle>
            <CardDescription>
              Distribution of tickets by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ticketCategoryData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Number of Tickets" fill="#8884d8">
                    {ticketCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'resolution' && (
        <Card>
          <CardHeader>
            <CardTitle>Average Resolution Time</CardTitle>
            <CardDescription>
              Trend of average ticket resolution time in days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={resolutionTimeData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} days`, 'Avg. Resolution Time']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avgDays" 
                    name="Average Resolution Time" 
                    stroke="#8884d8" 
                    strokeWidth={2} 
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter>
            <div className="text-center w-full">
              <p className="text-sm text-muted-foreground">Current average resolution time: <span className="font-medium">1.7 days</span></p>
            </div>
          </CardFooter>
        </Card>
      )}

      {view === 'satisfaction' && (
        <Card>
          <CardHeader>
            <CardTitle>Client Satisfaction</CardTitle>
            <CardDescription>
              Based on support ticket feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clientSatisfactionData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {clientSatisfactionData.map((entry, index) => (
                      <PieCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter>
            <div className="text-center w-full">
              <p className="text-sm text-muted-foreground">
                Overall satisfaction rate: <span className="font-medium">85%</span>
              </p>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default SupportReports;
