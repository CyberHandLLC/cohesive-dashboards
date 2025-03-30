
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServiceReportsProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
}

const ServiceReports: React.FC<ServiceReportsProps> = ({ startDate, endDate }) => {
  const [serviceUsageData, setServiceUsageData] = useState<any[]>([]);
  const [tierUsageData, setTierUsageData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchServiceData();
  }, [startDate, endDate, categoryFilter]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('Category')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error.message);
    }
  };

  const fetchServiceData = async () => {
    setIsLoading(true);
    try {
      // Fetch services
      let servicesQuery = supabase
        .from('Service')
        .select('id, name, categoryId, Category(name)');
        
      if (categoryFilter) {
        servicesQuery = servicesQuery.eq('categoryId', categoryFilter);
      }
      
      const { data: servicesData, error: servicesError } = await servicesQuery;
      
      if (servicesError) throw servicesError;

      // For each service, count the client services
      const servicePromises = servicesData?.map(async (service) => {
        let clientServicesQuery = supabase
          .from('ClientService')
          .select('id', { count: 'exact' })
          .eq('serviceId', service.id);
          
        if (startDate) {
          clientServicesQuery = clientServicesQuery.gte('startDate', startDate.toISOString());
        }
        
        if (endDate) {
          clientServicesQuery = clientServicesQuery.lte('startDate', endDate.toISOString());
        }
        
        const { count, error } = await clientServicesQuery;
        
        return {
          serviceId: service.id,
          serviceName: service.name,
          categoryName: service.Category?.name || 'Uncategorized',
          clientCount: count || 0
        };
      });
      
      const serviceUsage = await Promise.all(servicePromises || []);
      setServiceUsageData(serviceUsage.sort((a, b) => b.clientCount - a.clientCount));
      
      // Fetch all service tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from('ServiceTier')
        .select('id, name, serviceId, Service(name)');
        
      if (tiersError) throw tiersError;
      
      // For each tier, count the client services
      const tierPromises = tiersData?.map(async (tier) => {
        // In this example, we're assuming ClientService has a tierId field
        // This may need to be adjusted based on your actual database schema
        let clientTiersQuery = supabase
          .from('ClientService')
          .select('id', { count: 'exact' })
          .eq('serviceId', tier.serviceId);
          
        if (startDate) {
          clientTiersQuery = clientTiersQuery.gte('startDate', startDate.toISOString());
        }
        
        if (endDate) {
          clientTiersQuery = clientTiersQuery.lte('startDate', endDate.toISOString());
        }
        
        const { count, error } = await clientTiersQuery;
        
        return {
          tierId: tier.id,
          tierName: tier.name,
          serviceName: tier.Service?.name || 'Unknown Service',
          clientCount: count || 0
        };
      });
      
      const tierUsage = await Promise.all(tierPromises || []);
      setTierUsageData(tierUsage.filter(tier => tier.clientCount > 0).sort((a, b) => b.clientCount - a.clientCount));
    } catch (error: any) {
      console.error('Error fetching service data:', error.message);
      toast({
        title: "Error",
        description: "Could not fetch service reports.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (reportType: string, data: any[]) => {
    try {
      // Convert data to CSV format
      let csvContent = '';
      
      if (reportType === 'service-usage') {
        csvContent = 'Service Name,Category,Client Count\n';
        data.forEach(item => {
          csvContent += `${item.serviceName},${item.categoryName},${item.clientCount}\n`;
        });
      } else if (reportType === 'tier-usage') {
        csvContent = 'Tier Name,Service Name,Client Count\n';
        data.forEach(item => {
          csvContent += `${item.tierName},${item.serviceName},${item.clientCount}\n`;
        });
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

  const renderServiceUsageChart = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-[300px]" />;
    }

    if (serviceUsageData.length === 0) {
      return <div className="text-center py-10">No service usage data available for the selected criteria.</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart 
          data={serviceUsageData.slice(0, 10)} 
          layout="vertical"
          margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis 
            type="category"
            dataKey="serviceName" 
            width={150}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Bar dataKey="clientCount" fill="#8884d8" name="Client Count" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderTierUsageChart = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-[300px]" />;
    }

    if (tierUsageData.length === 0) {
      return <div className="text-center py-10">No tier usage data available.</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart 
          data={tierUsageData.slice(0, 10)} 
          layout="vertical"
          margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis 
            type="category"
            dataKey="tierName" 
            width={150}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Bar dataKey="clientCount" fill="#82ca9d" name="Client Count" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="w-64">
          <Select value={categoryFilter || 'all'} onValueChange={(value) => setCategoryFilter(value === 'all' ? null : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Service Usage</CardTitle>
          <Button variant="outline" size="sm" onClick={() => handleExport('service-usage', serviceUsageData)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {renderServiceUsageChart()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tier Usage</CardTitle>
          <Button variant="outline" size="sm" onClick={() => handleExport('tier-usage', tierUsageData)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {renderTierUsageChart()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceReports;
