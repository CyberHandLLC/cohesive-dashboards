
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { ClientStatus } from '@/types/client';

const clientOnboardingSchema = z.object({
  // Client Information
  companyName: z.string().min(1, 'Company name is required'),
  industry: z.string().optional(),
  websiteUrl: z.string().url('Must be a valid URL').or(z.string().length(0)).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PAST']),
  
  // Contact Information
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  
  // Service Information
  serviceId: z.string().min(1, 'Service is required'),
  price: z.number().min(0),
});

type ClientOnboardingFormValues = z.infer<typeof clientOnboardingSchema>;

interface ClientOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRequestData?: any;
  onSuccess?: () => void;
}

const ClientOnboardingDialog: React.FC<ClientOnboardingDialogProps> = ({
  open,
  onOpenChange,
  serviceRequestData,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  
  const form = useForm<ClientOnboardingFormValues>({
    resolver: zodResolver(clientOnboardingSchema),
    defaultValues: {
      companyName: serviceRequestData?.companyName || '',
      industry: '',
      websiteUrl: '',
      status: 'ACTIVE' as ClientStatus,
      firstName: serviceRequestData?.firstName || '',
      lastName: serviceRequestData?.lastName || '',
      email: serviceRequestData?.email || '',
      phone: serviceRequestData?.phone || '',
      serviceId: serviceRequestData?.serviceId || '',
      price: 0,
    },
  });
  
  useEffect(() => {
    if (open) {
      fetchServices();
      fetchStaffMembers();
      
      // Update form values when serviceRequestData changes
      if (serviceRequestData) {
        form.reset({
          companyName: serviceRequestData.companyName || '',
          industry: '',
          websiteUrl: '',
          status: 'ACTIVE',
          firstName: serviceRequestData.firstName || '',
          lastName: serviceRequestData.lastName || '',
          email: serviceRequestData.email || '',
          phone: serviceRequestData.phone || '',
          serviceId: serviceRequestData.serviceId || '',
          price: 0,
        });
      }
    }
  }, [open, serviceRequestData]);
  
  useEffect(() => {
    const selectedServiceId = form.watch('serviceId');
    if (selectedServiceId && services.length > 0) {
      const service = services.find((s) => s.id === selectedServiceId);
      if (service) {
        form.setValue('price', service.price || 0);
      }
    }
  }, [form.watch('serviceId'), services]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('Service')
        .select('*')
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('Staff')
        .select('id, title, User!inner(firstName, lastName)')
        .order('User.firstName');

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error) {
      console.error('Error fetching staff members:', error);
    }
  };

  const onSubmit = async (values: ClientOnboardingFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Start by checking if a user with this email exists
      const { data: existingUser, error: userCheckError } = await supabase
        .from('User')
        .select('id, clientId')
        .eq('email', values.email)
        .maybeSingle();
        
      if (userCheckError) throw userCheckError;
      
      let userId = existingUser?.id;
      let clientId = existingUser?.clientId;
      
      // If no clientId exists, create a new client
      if (!clientId) {
        // Create new client
        const { data: newClient, error: clientError } = await supabase
          .from('Client')
          .insert({
            companyName: values.companyName,
            industry: values.industry || null,
            websiteUrl: values.websiteUrl || null,
            status: values.status,
          })
          .select('id')
          .single();
          
        if (clientError) throw clientError;
        
        clientId = newClient.id;
      }
      
      // Create a contact record
      const { error: contactError } = await supabase
        .from('Contact')
        .insert({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone || null,
          clientId: clientId,
          isPrimary: true,
          status: 'ACTIVE',
          contactType: 'PRIMARY',
        });
        
      if (contactError) throw contactError;
      
      // If user exists, update their clientId and role
      if (userId) {
        const { error: userUpdateError } = await supabase
          .from('User')
          .update({
            clientId: clientId,
            role: 'CLIENT',
          })
          .eq('id', userId);
          
        if (userUpdateError) throw userUpdateError;
      }
      
      // Create client service record
      const { error: serviceError } = await supabase
        .from('ClientService')
        .insert({
          clientId: clientId,
          serviceId: values.serviceId,
          status: 'ACTIVE',
          price: values.price,
          startDate: new Date().toISOString(),
        });
        
      if (serviceError) throw serviceError;
      
      // If this came from a service request, update its status
      if (serviceRequestData?.id) {
        await supabase
          .from('ServiceRequest')
          .update({
            status: 'APPROVED',
            processedAt: new Date().toISOString(),
          })
          .eq('id', serviceRequestData.id);
      }
      
      toast({
        title: 'Client onboarded successfully',
        description: `${values.companyName} has been added as a client`,
      });
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Error onboarding client:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to onboard client',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Onboard New Client</DialogTitle>
          <DialogDescription>
            Enter client information to set up a new account and assign services.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter company name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter industry" value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="https://example.com" 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="First Name" />
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
                        <Input {...field} placeholder="Last Name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Email" type="email" />
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
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Phone Number" value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Service Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="serviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value || 0} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Create Client'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientOnboardingDialog;
