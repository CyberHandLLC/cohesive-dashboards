
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

interface ServiceReportsProps {
  startDate?: Date;
  endDate?: Date;
}

// Sample data - in a real application, this would come from your backend
const serviceAdoptionData = [
  { name: 'Web Development', value: 42 },
  { name: 'Digital Marketing', value: 28 },
  { name: 'Cloud Hosting', value: 15 },
  { name: 'AI Integration', value: 9 },
  { name: 'Consulting', value: 6 },
];

const tierUsageData = [
  { name: 'Basic', value: 35 },
  { name: 'Standard', value: 40 },
  { name: 'Premium', value: 15 },
  { name: 'Enterprise', value: 10 },
];

const monthlyAdoptionData = [
  { month: 'Jan', webDev: 4, marketing: 3, hosting: 2, ai: 1, consulting: 1 },
  { month: 'Feb', webDev: 5, marketing: 4, hosting: 3, ai: 1, consulting: 1 },
  { month: 'Mar', webDev: 6, marketing: 4, hosting: 2, ai: 1, consulting: 0 },
  { month: 'Apr', webDev: 7, marketing: 5, hosting: 3, ai: 2, consulting: 1 },
  { month: 'May', webDev: 8, marketing: 6, hosting: 4, ai: 2, consulting: 1 },
  { month: 'Jun', webDev: 9, marketing: 6, hosting: 4, ai: 3, consulting: 2 },
];

const popularServicePairings = [
  { service1: 'Web Development', service2: 'Digital Marketing', count: 18 },
  { service1: 'Web Development', service2: 'Cloud Hosting', count: 15 },
  { service1: 'Digital Marketing', service2: 'AI Integration', count: 7 },
  { service1: 'Web Development', service2: 'Consulting', count: 5 },
  { service1: 'Digital Marketing', service2: 'Consulting', count: 4 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ServiceReports: React.FC<ServiceReportsProps> = ({ startDate, endDate }) => {
  const [view, setView] = useState<string>('adoption');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Select 
          value={view}
          onValueChange={(value) => setView(value)}
        >
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="adoption">Service Adoption</SelectItem>
            <SelectItem value="tiers">Tier Usage</SelectItem>
            <SelectItem value="monthly">Monthly Adoption</SelectItem>
            <SelectItem value="pairings">Popular Pairings</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {view === 'adoption' && (
        <Card>
          <CardHeader>
            <CardTitle>Service Adoption</CardTitle>
            <CardDescription>
              Number of clients using each service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceAdoptionData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {serviceAdoptionData.map((entry, index) => (
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

      {view === 'tiers' && (
        <Card>
          <CardHeader>
            <CardTitle>Tier Usage</CardTitle>
            <CardDescription>
              Distribution of clients across service tiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tierUsageData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {tierUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'monthly' && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Service Adoption</CardTitle>
            <CardDescription>
              Trend of service adoption over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyAdoptionData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="webDev" name="Web Development" fill="#0088FE" />
                  <Bar dataKey="marketing" name="Digital Marketing" fill="#00C49F" />
                  <Bar dataKey="hosting" name="Cloud Hosting" fill="#FFBB28" />
                  <Bar dataKey="ai" name="AI Integration" fill="#FF8042" />
                  <Bar dataKey="consulting" name="Consulting" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'pairings' && (
        <Card>
          <CardHeader>
            <CardTitle>Popular Service Pairings</CardTitle>
            <CardDescription>
              Services frequently purchased together
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service 1</TableHead>
                  <TableHead>Service 2</TableHead>
                  <TableHead className="text-right">Client Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popularServicePairings.map((pairing, i) => (
                  <TableRow key={i}>
                    <TableCell>{pairing.service1}</TableCell>
                    <TableCell>{pairing.service2}</TableCell>
                    <TableCell className="text-right">{pairing.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServiceReports;
