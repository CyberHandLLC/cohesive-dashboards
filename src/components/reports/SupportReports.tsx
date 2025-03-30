
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/reports/DateRangePicker';

interface SupportReportsProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const STATUS_COLORS = {
  OPEN: '#FF8042',
  IN_PROGRESS: '#FFBB28',
  RESOLVED: '#00C49F',
  CLOSED: '#0088FE'
};

const PRIORITY_COLORS = {
  HIGH: '#ff4d4f',
  MEDIUM: '#faad14',
  LOW: '#52c41a'
};

const SupportReports: React.FC<SupportReportsProps> = ({ 
  startDate, 
  endDate, 
  dateRange, 
  setDateRange 
}) => {
  const [ticketStatusData, setTicketStatusData] = useState<any[]>([]);
  const [ticketResolutionTime, setTicketResolutionTime] = useState<number | null>(null);
  const [ticketCategoryData, setTicketCategoryData] = useState<any[]>([]);
  const [ticketPriorityData, setTicketPriorityData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSupportData();
  }, [startDate, endDate]);

  const fetchSupportData = async () => {
    setIsLoading(true);
    try {
      // Fetch all support tickets
      let query = supabase
        .from('SupportTicket')
        .select('*');
        
      if (startDate) {
        query = query.gte('createdAt', startDate.toISOString());
      }
      
      if (endDate) {
        query = query.lte('createdAt', endDate.toISOString());
      }
      
      const { data: ticketData, error: ticketError } = await query;
      
      if (ticketError) throw ticketError;
      
      // Process tickets by status
      const ticketsByStatus = aggregateTicketsByStatus(ticketData || []);
      setTicketStatusData(ticketsByStatus);
      
      // Calculate average resolution time
      const avgResolutionTime = calculateAverageResolutionTime(ticketData || []);
      setTicketResolutionTime(avgResolutionTime);
      
      // Process tickets by category
      const ticketsByCategory = aggregateTicketsByCategory(ticketData || []);
      setTicketCategoryData(ticketsByCategory);
      
      // Process tickets by priority
      const ticketsByPriority = aggregateTicketsByPriority(ticketData || []);
      setTicketPriorityData(ticketsByPriority);
    } catch (error: any) {
      console.error('Error fetching support data:', error.message);
      toast({
        title: "Error",
        description: "Could not fetch support reports.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const aggregateTicketsByStatus = (data: any[]) => {
    // Group by status and count tickets
    const statusGroups = data.reduce((acc: {[key: string]: number}, ticket) => {
      const status = ticket.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Convert to array for chart
    return Object.entries(statusGroups)
      .map(([status, count]) => ({
        status,
        value: count
      }));
  };

  const calculateAverageResolutionTime = (data: any[]) => {
    // Filter resolved tickets with both creation and resolution dates
    const resolvedTickets = data.filter(ticket => 
      ticket.status === 'RESOLVED' && ticket.createdAt && ticket.resolvedAt
    );
    
    if (resolvedTickets.length === 0) {
      return null;
    }
    
    // Calculate total resolution time in days
    const totalDays = resolvedTickets.reduce((sum, ticket) => {
      const createdDate = parseISO(ticket.createdAt);
      const resolvedDate = parseISO(ticket.resolvedAt);
      return sum + differenceInDays(resolvedDate, createdDate);
    }, 0);
    
    // Return average
    return totalDays / resolvedTickets.length;
  };

  const aggregateTicketsByCategory = (data: any[]) => {
    // Group by category and count tickets
    const categoryGroups = data.reduce((acc: {[key: string]: number}, ticket) => {
      const category = ticket.category || 'UNCATEGORIZED';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    // Convert to array for chart
    return Object.entries(categoryGroups)
      .map(([category, count]) => ({
        category,
        value: count
      }))
      .sort((a, b) => b.value - a.value);
  };

  const aggregateTicketsByPriority = (data: any[]) => {
    // Group by priority and count tickets
    const priorityGroups = data.reduce((acc: {[key: string]: number}, ticket) => {
      const priority = ticket.priority || 'MEDIUM';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});
    
    // Convert to array for chart
    return Object.entries(priorityGroups)
      .map(([priority, count]) => ({
        priority,
        value: count
      }));
  };

  const handleExport = (reportType: string, data: any[]) => {
    try {
      // Convert data to CSV format
      let csvContent = '';
      
      switch (reportType) {
        case 'ticket-status':
          csvContent = 'Status,Count\n';
          data.forEach(item => {
            csvContent += `${item.status},${item.value}\n`;
          });
          break;
          
        case 'ticket-category':
          csvContent = 'Category,Count\n';
          data.forEach(item => {
            csvContent += `${item.category},${item.value}\n`;
          });
          break;
          
        case 'ticket-priority':
          csvContent = 'Priority,Count\n';
          data.forEach(item => {
            csvContent += `${item.priority},${item.value}\n`;
          });
          break;
          
        default:
          throw new Error('Unknown report type');
      }
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportType}-report.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: `${reportType} report has been downloaded.`,
      });
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const renderTicketStatusChart = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-[300px]" />;
    }

    if (ticketStatusData.length === 0) {
      return <div className="text-center py-10">No ticket status data available.</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex justify-center">
          <ResponsiveContainer width={300} height={300}>
            <PieChart>
              <Pie
                data={ticketStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {ticketStatusData.map((entry) => (
                  <Cell 
                    key={`cell-${entry.status}`} 
                    fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#8884d8'} 
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Tickets']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Ticket Status Breakdown</h4>
          <div className="space-y-2">
            {ticketStatusData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 mr-2 rounded-sm" 
                    style={{ backgroundColor: STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#8884d8' }}
                  />
                  <span>{entry.status}</span>
                </div>
                <span className="font-medium">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTicketCategoryChart = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-[300px]" />;
    }

    if (ticketCategoryData.length === 0) {
      return <div className="text-center py-10">No ticket category data available.</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={ticketCategoryData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis 
            type="category"
            dataKey="category" 
            width={150}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" name="Tickets" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderTicketPriorityChart = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-[300px]" />;
    }

    if (ticketPriorityData.length === 0) {
      return <div className="text-center py-10">No ticket priority data available.</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex justify-center">
          <ResponsiveContainer width={300} height={300}>
            <PieChart>
              <Pie
                data={ticketPriorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {ticketPriorityData.map((entry) => (
                  <Cell 
                    key={`cell-${entry.priority}`} 
                    fill={PRIORITY_COLORS[entry.priority as keyof typeof PRIORITY_COLORS] || '#8884d8'} 
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Tickets']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Ticket Priority Breakdown</h4>
          <div className="space-y-2">
            {ticketPriorityData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 mr-2 rounded-sm" 
                    style={{ backgroundColor: PRIORITY_COLORS[entry.priority as keyof typeof PRIORITY_COLORS] || '#8884d8' }}
                  />
                  <span>{entry.priority}</span>
                </div>
                <span className="font-medium">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DatePickerWithRange dateRange={dateRange} setDateRange={setDateRange} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ticket Status Breakdown</CardTitle>
          <Button variant="outline" size="sm" onClick={() => handleExport('ticket-status', ticketStatusData)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {renderTicketStatusChart()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Average Resolution Time</CardTitle>
            {ticketResolutionTime !== null && (
              <div className="mt-2 text-3xl font-bold">
                {ticketResolutionTime.toFixed(1)} days
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-[100px]" />
          ) : ticketResolutionTime === null ? (
            <div className="text-center py-10">No resolved tickets available for calculation.</div>
          ) : (
            <div className="py-2">
              <p className="text-muted-foreground">
                Average time between ticket creation and resolution
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tickets by Category</CardTitle>
          <Button variant="outline" size="sm" onClick={() => handleExport('ticket-category', ticketCategoryData)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {renderTicketCategoryChart()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tickets by Priority</CardTitle>
          <Button variant="outline" size="sm" onClick={() => handleExport('ticket-priority', ticketPriorityData)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {renderTicketPriorityChart()}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportReports;
