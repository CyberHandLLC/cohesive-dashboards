import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ClientService } from '@/types/client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import WebsitePerformanceDashboard from './WebsitePerformanceDashboard';
import MarketingPerformanceDashboard from './MarketingPerformanceDashboard';
import AIIntegrationDashboard from './AIIntegrationDashboard';
import { cn } from '@/lib/utils';

// Extend the ClientService type with the category property in the service field
interface ExtendedClientService extends Omit<ClientService, 'service'> {
  service?: {
    name: string;
    description: string;
    price: number;
    monthlyPrice: number | null;
    features: string[];
    customFields?: Record<string, any> | null;
    categoryId?: string;
    category?: {
      id: string;
      name: string;
    };
  };
}

interface ClientServiceDashboardProps {
  clientId: string;
  initialServiceId?: string;
}

const ClientServiceDashboard: React.FC<ClientServiceDashboardProps> = ({
  clientId,
  initialServiceId
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId || '');
  
  // Fetch client services
  const { data: clientServices, isLoading } = useQuery({
    queryKey: ['clientServices', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ClientService')
        .select(`
          *,
          service:serviceId (
            name,
            description,
            price,
            monthlyPrice,
            features,
            customFields,
            categoryId,
            category:categoryId (
              id,
              name
            )
          )
        `)
        .eq('clientId', clientId)
        .eq('status', 'ACTIVE');
        
      if (error) throw error;
      return data as ExtendedClientService[];
    },
    enabled: !!clientId
  });
  
  // Get company name for the client
  const { data: clientInfo, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Client')
        .select('companyName')
        .eq('id', clientId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!clientId
  });
  
  // Set initial service selection if not already set
  React.useEffect(() => {
    if (!selectedServiceId && clientServices && clientServices.length > 0) {
      setSelectedServiceId(clientServices[0].id);
    }
  }, [clientServices, selectedServiceId]);
  
  // Get the selected service details
  const selectedService = clientServices?.find(service => service.id === selectedServiceId);
  
  // Determine the service type based on the category or service name
  const getServiceType = (): 'website' | 'marketing' | 'ai' | 'general' => {
    if (!selectedService) return 'general';
    
    const categoryName = selectedService.service?.category?.name?.toLowerCase() || '';
    const serviceName = selectedService.service?.name?.toLowerCase() || '';
    
    if (
      categoryName.includes('web') || 
      categoryName.includes('site') ||
      serviceName.includes('web') ||
      serviceName.includes('site') ||
      serviceName.includes('hosting')
    ) {
      return 'website';
    }
    
    if (
      categoryName.includes('market') || 
      categoryName.includes('seo') ||
      categoryName.includes('social') ||
      serviceName.includes('market') ||
      serviceName.includes('seo') ||
      serviceName.includes('social') ||
      serviceName.includes('campaign')
    ) {
      return 'marketing';
    }
    
    if (
      categoryName.includes('ai') || 
      categoryName.includes('intelligence') ||
      categoryName.includes('ml') ||
      serviceName.includes('ai') ||
      serviceName.includes('intelligence') ||
      serviceName.includes('ml') ||
      serviceName.includes('chatbot')
    ) {
      return 'ai';
    }
    
    return 'general';
  };
  
  if (isLoading || isLoadingClient) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-32">
          <p className="text-lg text-muted-foreground">Loading client services...</p>
        </div>
      </div>
    );
  }
  
  if (!clientServices || clientServices.length === 0) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <h3 className="text-lg font-medium mb-2">No Active Services</h3>
            <p className="text-muted-foreground text-center">
              This client doesn't have any active services. Add services to see performance metrics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Service Dashboard</h1>
          <p className="text-muted-foreground">
            Performance metrics for {clientInfo?.companyName || 'client'} services
          </p>
        </div>
        
        <div className="w-full sm:w-[260px]">
          <Select
            value={selectedServiceId}
            onValueChange={setSelectedServiceId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              {clientServices.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.service?.name || 'Unnamed Service'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {selectedService && (
        <div className="mt-6">
          {getServiceType() === 'website' && (
            <WebsitePerformanceDashboard
              clientServiceId={selectedService.id}
              serviceName={selectedService.service?.name || 'Website Service'}
            />
          )}
          
          {getServiceType() === 'marketing' && (
            <MarketingPerformanceDashboard
              clientServiceId={selectedService.id}
              serviceName={selectedService.service?.name || 'Marketing Service'}
            />
          )}
          
          {getServiceType() === 'ai' && (
            <AIIntegrationDashboard
              clientServiceId={selectedService.id}
              serviceName={selectedService.service?.name || 'AI Service'}
            />
          )}
          
          {getServiceType() === 'general' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedService.service?.name || 'Service'} Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-1">Service Details</h3>
                      <p className="text-muted-foreground">
                        {selectedService.service?.description || 'No description available'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground mb-2">Status</div>
                        <div className="text-xl font-bold">{selectedService.status}</div>
                      </div>
                      
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground mb-2">Start Date</div>
                        <div className="text-xl font-bold">
                          {new Date(selectedService.startDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground mb-2">End Date</div>
                        <div className="text-xl font-bold">
                          {selectedService.endDate 
                            ? new Date(selectedService.endDate).toLocaleDateString()
                            : 'Ongoing'}
                        </div>
                      </div>
                    </div>
                    
                    {selectedService.service?.features && selectedService.service.features.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2">Features</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {selectedService.service.features.map((feature, index) => (
                            <li key={index} className="text-sm">{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="mt-6">
                      <p className="text-sm text-muted-foreground">
                        Detailed performance metrics are not available for this service type.
                        Consider updating the service category for more detailed analytics.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientServiceDashboard;
