import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistance } from 'date-fns';

export interface ExpiringService {
  id: string;
  clientId: string;
  serviceId: string;
  startDate: string;
  endDate: string;
  status: string;
  price: number;
  daysUntilExpiration: number;
  client: {
    id: string;
    companyName: string;
  };
  service: {
    id: string;
    name: string;
    description?: string;
  };
}

export type ExpirationRange = 'week' | 'month' | 'quarter' | 'all';

export const useExpiringServices = (
  range: ExpirationRange = 'month',
  status: string = 'ACTIVE'
) => {
  const [services, setServices] = useState<ExpiringService[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchExpiringServices = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Calculate the date thresholds based on range
        const today = new Date();
        let endDate = new Date();
        
        switch (range) {
          case 'week':
            endDate.setDate(today.getDate() + 7);
            break;
          case 'month':
            endDate.setMonth(today.getMonth() + 1);
            break;
          case 'quarter':
            endDate.setMonth(today.getMonth() + 3);
            break;
          case 'all':
            // No specific end date for 'all', just fetch everything that's active
            break;
        }
        
        // Query for services expiring within the threshold
        let query = supabase
          .from('ClientService')
          .select(`
            *,
            client:clientId(id, companyName),
            service:serviceId(id, name, description)
          `)
          .eq('status', status);
        
        // Only add date filters for ranges other than 'all'
        if (range !== 'all') {
          query = query
            .gte('endDate', today.toISOString())
            .lte('endDate', endDate.toISOString());
        }
        
        const { data, error: apiError } = await query.order('endDate');
        
        if (apiError) throw apiError;
        
        if (data) {
          // Calculate days until expiration and add to each service
          const processedServices = data.map(service => {
            const endDate = new Date(service.endDate);
            const now = new Date();
            const diffTime = endDate.getTime() - now.getTime();
            const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return {
              ...service,
              daysUntilExpiration
            } as ExpiringService;
          });
          
          setServices(processedServices);
        }
      } catch (err: any) {
        console.error('Error fetching expiring services:', err);
        setError(err.message || 'Failed to fetch expiring services');
        toast({
          title: 'Error',
          description: 'Failed to load expiring services. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExpiringServices();
  }, [range, status, toast]);
  
  // Helper function to get a human-readable expiration time
  const getExpirationText = (service: ExpiringService) => {
    if (!service.endDate) return 'No expiration date';
    
    const endDate = new Date(service.endDate);
    if (endDate < new Date()) {
      return `Expired ${formatDistance(endDate, new Date(), { addSuffix: true })}`;
    }
    
    return `Expires ${formatDistance(endDate, new Date(), { addSuffix: true })}`;
  };
  
  // Group services by expiration timeframe
  const grouped = {
    expired: services.filter(s => new Date(s.endDate) < new Date()),
    critical: services.filter(s => s.daysUntilExpiration >= 0 && s.daysUntilExpiration <= 7),
    soon: services.filter(s => s.daysUntilExpiration > 7 && s.daysUntilExpiration <= 30),
    upcoming: services.filter(s => s.daysUntilExpiration > 30)
  };
  
  return {
    services,
    grouped,
    isLoading,
    error,
    getExpirationText
  };
};
