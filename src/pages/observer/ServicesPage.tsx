
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ServiceCard from '@/components/observer/ServiceCard';
import ServiceRequestDialog from '@/components/observer/ServiceRequestDialog';

const ServicesPage = () => {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const breadcrumbs = [
    { label: 'Observer', href: '/observer' },
    { label: 'Services' }
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('Service')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      setServices(data || []);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast({
        title: 'Error',
        description: 'Failed to load services. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestService = (service: any) => {
    setSelectedService(service);
    setIsDialogOpen(true);
  };

  return (
    <DashboardLayout
      breadcrumbs={breadcrumbs}
      role="observer"
      title="Our Services"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Available Services</h1>
          <p className="text-muted-foreground">
            Browse our services and submit a request for the ones you're interested in.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <p>Loading services...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                name={service.name}
                description={service.description || ''}
                price={service.price || 0}
                monthlyPrice={service.monthlyPrice}
                features={service.features || []}
                onRequestService={() => handleRequestService(service)}
              />
            ))}
          </div>
        )}

        {services.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p>No services available at the moment.</p>
          </div>
        )}
      </div>

      {selectedService && (
        <ServiceRequestDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          serviceId={selectedService.id}
          serviceName={selectedService.name}
        />
      )}
    </DashboardLayout>
  );
};

export default ServicesPage;
