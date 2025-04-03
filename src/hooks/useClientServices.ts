import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClientService } from '@/types/client';
import { useToast } from '@/hooks/use-toast';

export const useClientServices = (clientId: string | null) => {
  const [services, setServices] = useState<ClientService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ClientService | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  const fetchServices = useCallback(async (clientId: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('ClientService')
        .select(`
          *,
          service:serviceId (
            name,
            description,
            price,
            monthlyPrice,
            features,
            customFields
          )
        `)
        .eq('clientId', clientId);
      
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query.order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const typedData = data as unknown as ClientService[];
        
        // Filter by search term if needed
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const filtered = typedData.filter(service => 
            (service.service?.name?.toLowerCase().includes(term) || false) ||
            (service.service?.description?.toLowerCase().includes(term) || false) ||
            (service.service?.features?.some(feature => 
              feature.toLowerCase().includes(term)
            ) || false)
          );
          setServices(filtered);
        } else {
          setServices(typedData);
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error loading services",
        description: "Failed to load your services. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchTerm, toast]);

  useEffect(() => {
    if (clientId) {
      fetchServices(clientId);
    } else {
      // If clientId is null, set loading to false to prevent infinite loading state
      setIsLoading(false);
    }
  }, [clientId, fetchServices]);

  const setupRealTimeSubscriptions = useCallback(() => {
    if (!clientId) return () => {};
    
    const channel = supabase
      .channel('client-services-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ClientService'
        },
        (payload) => {
          // Check that payload has the expected structure and clientId matches
          if (clientId && payload.new && 'clientId' in payload.new && payload.new.clientId === clientId) {
            fetchServices(clientId);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, fetchServices]);

  useEffect(() => {
    const cleanup = setupRealTimeSubscriptions();
    return () => cleanup();
  }, [setupRealTimeSubscriptions]);

  const filteredServices = services.filter(service => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nameMatch = service.service?.name?.toLowerCase().includes(term) || false;
      const descriptionMatch = service.service?.description?.toLowerCase().includes(term) || false;
      const featuresMatch = service.service?.features?.some(feature => 
        feature.toLowerCase().includes(term)
      ) || false;
      return nameMatch || descriptionMatch || featuresMatch;
    }
    return true;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter(null);
  };

  const handleViewDetails = (service: ClientService) => {
    setSelectedService(service);
    setIsDetailsOpen(true);
  };

  return {
    services: filteredServices,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedService,
    setSelectedService,
    isDetailsOpen,
    setIsDetailsOpen,
    resetFilters,
    handleViewDetails
  };
};
