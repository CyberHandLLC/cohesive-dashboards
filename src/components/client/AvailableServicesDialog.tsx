import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Search, ArrowRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface AvailableServicesDialogProps {
  clientId: string | null;
  userData?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Service request form schema
const serviceRequestSchema = z.object({
  message: z.string().min(10, 'Please provide more details about your request'),
  serviceId: z.string().min(1, 'Service ID is required'),
});

type ServiceRequestFormValues = z.infer<typeof serviceRequestSchema>;

// Define service interface to avoid type issues
interface Service {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  price?: number;
  monthlyPrice?: number;
  features?: string[];
  availability?: string;
  category?: {
    name: string;
  };
}

const AvailableServicesDialog: React.FC<AvailableServicesDialogProps> = ({
  clientId,
  userData,
  open,
  onOpenChange,
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form setup for the service request
  const form = useForm<ServiceRequestFormValues>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      message: '',
      serviceId: '',
    },
  });

  // Fetch available services that the client doesn't already have
  useEffect(() => {
    if (open) {
      console.log("Fetching available services, clientId:", clientId);
      fetchAvailableServices();
    }
  }, [open, clientId]);

  const fetchAvailableServices = async () => {
    try {
      setIsLoading(true);
      
      // Use either clientId from props or from userData if available
      const effectiveClientId = clientId || userData?.clientId;
      
      // If no clientId is available, just show all active services
      if (!effectiveClientId) {
        console.log("No clientId available, showing all active services");
        const { data: allServices, error: servicesError } = await supabase
          .from('Service')
          .select('*, category:Category(name)')
          .eq('availability', 'ACTIVE')
          .order('name');
        
        if (servicesError) throw servicesError;
        
        // Type assertion instead of relying on inference
        const typedServices = (allServices || []) as Service[];
        setServices(typedServices);
        setFilteredServices(typedServices);
        setIsLoading(false);
        return;
      }
      
      // First, get the services this client already has
      console.log("Fetching client services for clientId:", effectiveClientId);
      const { data: clientServices, error: clientError } = await supabase
        .from('ClientService')
        .select('serviceId')
        .eq('clientId', effectiveClientId);
      
      if (clientError) {
        console.error("Error fetching client services:", clientError);
        throw clientError;
      }
      
      console.log("Client services:", clientServices);
      
      // Get the IDs of services the client already has
      const existingServiceIds = clientServices?.map(cs => cs.serviceId) || [];
      console.log("Existing service IDs:", existingServiceIds);
      
      // Get all active services
      const { data: allServices, error: servicesError } = await supabase
        .from('Service')
        .select('*, category:Category(name)')
        .eq('availability', 'ACTIVE')
        .order('name');
      
      if (servicesError) {
        console.error("Error fetching all services:", servicesError);
        throw servicesError;
      }
      
      console.log("All services:", allServices?.length || 0);
      
      // Filter out services the client already has
      const availableServices = allServices?.filter(
        service => !existingServiceIds.includes(service.id)
      ) || [];
      
      console.log("Available services:", availableServices.length);
      
      // Type assertion to avoid deep type instantiation
      const typedServices = (availableServices || []) as Service[];
      
      setServices(typedServices);
      setFilteredServices(typedServices);
    } catch (error) {
      console.error('Error fetching available services:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available services. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter services based on search term
  useEffect(() => {
    if (services.length > 0) {
      if (searchTerm.trim() === '') {
        setFilteredServices(services);
      } else {
        const term = searchTerm.toLowerCase();
        const filtered = services.filter(
          service =>
            service.name.toLowerCase().includes(term) ||
            (service.description && service.description.toLowerCase().includes(term)) ||
            (service.category?.name && service.category.name.toLowerCase().includes(term))
        );
        setFilteredServices(filtered);
      }
    }
  }, [searchTerm, services]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    form.setValue('serviceId', service.id);
    setIsRequestFormOpen(true);
  };

  const submitServiceRequest = async (values: ServiceRequestFormValues) => {
    // Use either clientId from props or from userData if available
    const effectiveClientId = clientId || userData?.clientId;
    
    if (!userData || !effectiveClientId) {
      toast({
        title: 'Error',
        description: 'Unable to retrieve your information. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get current user information
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to request services',
          variant: 'destructive',
        });
        return;
      }
      
      // Create a service request in the database - using lowercase column names that match the DB schema
      const { error: requestError } = await supabase
        .from('ServiceRequest')
        .insert({
          userid: user.id,
          serviceid: values.serviceId,
          firstname: userData.firstName || '',
          lastname: userData.lastName || '',
          companyname: userData.companyName || '',
          email: userData.email || '',
          message: values.message,
          status: 'PENDING'
        });
        
      if (requestError) throw requestError;
      
      // Success
      toast({
        title: 'Service request submitted',
        description: 'Your request has been submitted and will be reviewed by our team.',
      });
      
      // Close dialogs
      setIsRequestFormOpen(false);
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Error submitting service request:', error);
      toast({
        title: 'Request failed',
        description: error.message || 'An error occurred while submitting your request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Additional Services</DialogTitle>
            <DialogDescription>
              Browse our available services and submit a request for any service you'd like to add to your account.
            </DialogDescription>
          </DialogHeader>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search services..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading available services...</p>
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredServices.map((service) => (
                <Card key={service.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {service.category && (
                      <CardDescription className="text-xs">
                        Category: {service.category.name}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm line-clamp-2">
                      {service.description || 'No description available.'}
                    </p>
                    <div className="mt-2">
                      <p className="text-sm font-medium">
                        {service.monthlyPrice
                          ? `$${service.monthlyPrice}/month`
                          : service.price
                          ? `$${service.price}`
                          : 'Price on request'}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleServiceSelect(service)}
                    >
                      <span>Request This Service</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              {searchTerm ? (
                <>
                  <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    No services found matching "{searchTerm}".
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm('')}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                  <p>You already have all available services.</p>
                </>
              )}
            </div>
          )}
          
          <DialogClose asChild>
            <Button variant="outline" className="mt-4">Cancel</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Service Request Form Dialog */}
      {selectedService && (
        <Dialog open={isRequestFormOpen} onOpenChange={setIsRequestFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Request Service: {selectedService.name}</DialogTitle>
              <DialogDescription>
                Complete this form to request this service. Our team will review your request and contact you.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submitServiceRequest)} className="space-y-6">
                <div className="grid gap-4">
                  {/* Display service name */}
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium">Service: {selectedService.name}</p>
                  </div>
                  
                  {/* Prefilled information (readonly) */}
                  {userData && (
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Name</p>
                          <p className="text-sm">{userData.firstName} {userData.lastName}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Company</p>
                          <p className="text-sm">{userData.companyName || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm">{userData.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Message field */}
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please let us know why you're interested in this service and any specific requirements you may have."
                            {...field}
                            rows={5}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRequestFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AvailableServicesDialog;
