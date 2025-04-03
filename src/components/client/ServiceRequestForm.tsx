import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

const serviceRequestSchema = z.object({
  message: z.string().min(10, 'Please provide more details about your request'),
  serviceId: z.string().min(1, 'Service ID is required'),
});

type ServiceRequestFormValues = z.infer<typeof serviceRequestSchema>;

interface ServiceRequestFormProps {
  serviceId: string;
  serviceName: string;
  clientId: string | null;
  onSuccess?: () => void;
}

const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({ 
  serviceId, 
  serviceName, 
  clientId,
  onSuccess 
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  const form = useForm<ServiceRequestFormValues>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      message: '',
      serviceId,
    },
  });

  // Get user data for the form
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Get the user's details from the User table
          const { data, error } = await supabase
            .from('User')
            .select('firstName, lastName, email')
            .eq('id', user.id)
            .single();
            
          if (error) throw error;
          
          if (data) {
            setUserData(data);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
  }, []);

  // Get client company info
  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) return;
      
      try {
        const { data, error } = await supabase
          .from('Client')
          .select('companyName')
          .eq('id', clientId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setUserData(prev => ({
            ...prev,
            companyName: data.companyName
          }));
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
      }
    };
    
    fetchClientData();
  }, [clientId]);

  const onSubmit = async (values: ServiceRequestFormValues) => {
    if (!userData || !clientId) {
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
          userId: user.id,
          serviceId: values.serviceId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          companyName: userData.companyName,
          email: userData.email,
          message: values.message,
          status: 'PENDING',
          clientId: clientId // Store the client ID for easy reference
        });
        
      if (requestError) throw requestError;
      
      // Success
      toast({
        title: 'Service request submitted',
        description: 'Your request has been submitted and will be reviewed by our team.',
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4">
          {/* Display service name */}
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">Service: {serviceName}</p>
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
  );
};

export default ServiceRequestForm;
