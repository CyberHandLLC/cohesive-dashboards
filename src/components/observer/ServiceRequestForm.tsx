
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const serviceRequestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Please provide more details about your request'),
  serviceId: z.string().min(1, 'Service ID is required'),
});

type ServiceRequestFormValues = z.infer<typeof serviceRequestSchema>;

interface ServiceRequestFormProps {
  serviceId: string;
  serviceName: string;
}

const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({ serviceId, serviceName }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ServiceRequestFormValues>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      phone: '',
      message: '',
      serviceId,
    },
  });

  const onSubmit = async (values: ServiceRequestFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Get current user information
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to request services',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }
      
      // Create a service request in the database
      const { error: requestError } = await supabase
        .from('ServiceRequest')
        .insert({
          userId: session.user.id,
          serviceId: values.serviceId,
          firstName: values.firstName,
          lastName: values.lastName,
          companyName: values.companyName,
          email: values.email,
          phone: values.phone || null,
          message: values.message,
          status: 'PENDING',
        });
        
      if (requestError) throw requestError;
      
      // Success
      toast({
        title: 'Service request submitted',
        description: 'An administrator will review your request shortly',
      });
      
      // Redirect to a confirmation page or dashboard
      navigate('/observer');
      
    } catch (error: any) {
      console.error('Error submitting service request:', error);
      toast({
        title: 'Failed to submit request',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium">Request "{serviceName}"</h3>
          <p className="text-sm text-muted-foreground">
            Fill out this form to request this service. An administrator will review your request 
            and contact you to complete the setup.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="First Name" {...field} />
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
                  <Input placeholder="Last Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Company Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="email@example.com" type="email" {...field} />
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
                  <Input placeholder="Phone Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Please provide details about your requirements and any questions you might have." 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Request...
            </>
          ) : (
            'Submit Service Request'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default ServiceRequestForm;
