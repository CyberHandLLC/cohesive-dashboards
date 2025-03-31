
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceRequest } from '@/types/service-request';
import { Loader2 } from 'lucide-react';

// Validation schema for client onboarding
const clientOnboardingSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
});

type ClientOnboardingFormValues = z.infer<typeof clientOnboardingSchema>;

interface ClientOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRequestData: ServiceRequest | null;
  onSuccess?: () => void;
}

const ClientOnboardingDialog: React.FC<ClientOnboardingDialogProps> = ({
  open,
  onOpenChange,
  serviceRequestData,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('new');
  const { toast } = useToast();

  // Initialize the form with react-hook-form
  const form = useForm<ClientOnboardingFormValues>({
    resolver: zodResolver(clientOnboardingSchema),
    defaultValues: {
      companyName: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      industry: '',
      website: '',
    },
  });

  // Set form values when service request data is provided
  useEffect(() => {
    if (serviceRequestData) {
      form.reset({
        companyName: serviceRequestData.companyname,
        firstName: serviceRequestData.firstname,
        lastName: serviceRequestData.lastname,
        email: serviceRequestData.email,
        phone: serviceRequestData.phone || '',
        industry: '',
        website: '',
      });
    }
  }, [serviceRequestData, form]);

  // Handle form submission
  const onSubmit = async (values: ClientOnboardingFormValues) => {
    setIsSubmitting(true);
    
    try {
      // 1. Create a new client record
      const { data: clientData, error: clientError } = await supabase
        .from('Client')
        .insert({
          companyName: values.companyName,
          industry: values.industry || null,
          websiteUrl: values.website || null,
          status: 'ACTIVE',
        })
        .select('id')
        .single();
      
      if (clientError) throw clientError;
      
      // 2. Create a new contact record for the client
      const { error: contactError } = await supabase
        .from('Contact')
        .insert({
          clientId: clientData.id,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone || null,
          isPrimary: true,
          status: 'ACTIVE',
        });
      
      if (contactError) throw contactError;
      
      // 3. If this is from a service request, process it
      if (serviceRequestData) {
        // Update the user role to CLIENT
        const { error: userError } = await supabase
          .from('User')
          .update({ 
            role: 'CLIENT',
            clientId: clientData.id
          })
          .eq('id', serviceRequestData.userid);
        
        if (userError) throw userError;
        
        // Add the requested service to the client
        const { error: serviceError } = await supabase
          .from('ClientService')
          .insert({
            clientId: clientData.id,
            serviceId: serviceRequestData.serviceid,
            status: 'ACTIVE'
          });
        
        if (serviceError) throw serviceError;
        
        // Update the service request status
        const { error: requestError } = await supabase
          .from('ServiceRequest')
          .update({
            status: 'APPROVED',
            processedat: new Date().toISOString()
          })
          .eq('id', serviceRequestData.id);
        
        if (requestError) throw requestError;
      }
      
      toast({
        title: 'Client onboarded successfully',
        description: 'The client has been added to the system',
      });
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error: any) {
      console.error('Error onboarding client:', error);
      toast({
        title: 'Failed to onboard client',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Client Onboarding</DialogTitle>
          <DialogDescription>
            {serviceRequestData ? 
              'Process the service request and onboard this client.' : 
              'Add a new client to the system.'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new" disabled={isSubmitting}>Client Information</TabsTrigger>
            <TabsTrigger value="services" disabled={isSubmitting}>Services</TabsTrigger>
          </TabsList>
          
          <TabsContent value="new" className="space-y-4 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact's first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact's last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Contact email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Technology, Healthcare" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {serviceRequestData && (
                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Service Request Details</h3>
                    <p className="text-sm mb-1"><span className="font-medium">Service:</span> {serviceRequestData.service?.name || "Unknown Service"}</p>
                    <p className="text-sm mb-1"><span className="font-medium">Request Date:</span> {new Date(serviceRequestData.createdat).toLocaleDateString()}</p>
                    <p className="text-sm mb-1"><span className="font-medium">Message:</span> {serviceRequestData.message}</p>
                  </div>
                )}
                
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      serviceRequestData ? 'Approve & Onboard Client' : 'Create Client'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="services" className="py-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You can select services for this client after creating the client account.
              </p>
              
              {serviceRequestData && (
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-2">Requested Service</h3>
                  <div className="border rounded-md p-3 bg-background">
                    <p className="font-medium">{serviceRequestData.service?.name || "Unknown Service"}</p>
                    <p className="text-sm text-muted-foreground">{serviceRequestData.service?.description}</p>
                    <div className="mt-2">
                      <p className="text-sm font-medium">Features:</p>
                      <ul className="text-sm list-disc list-inside">
                        {serviceRequestData.service?.features?.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ClientOnboardingDialog;
