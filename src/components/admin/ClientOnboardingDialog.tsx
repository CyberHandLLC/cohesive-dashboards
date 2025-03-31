
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UserPlus, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServiceRequest } from '@/types/service-request';

// Form schema for client onboarding
const clientOnboardingSchema = z.object({
  // Client company details
  companyName: z.string().min(2, 'Company name is required'),
  industry: z.string().optional(),
  websiteUrl: z.string().url('Must be a valid URL').optional().or(z.string().length(0)),
  
  // Primary contact details
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  
  // User account details
  createUserAccount: z.boolean().default(false),
  userExists: z.boolean().default(false),

  // Service details
  serviceStartDate: z.string(),
  serviceId: z.string().min(1, 'Service is required'),
  
  // Notes
  notes: z.string().optional(),
});

type ClientOnboardingFormValues = z.infer<typeof clientOnboardingSchema>;

interface ClientOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRequestData: ServiceRequest | null;
  onSuccess: () => void;
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
  const [userExists, setUserExists] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const form = useForm<ClientOnboardingFormValues>({
    resolver: zodResolver(clientOnboardingSchema),
    defaultValues: {
      companyName: serviceRequestData?.companyName || '',
      industry: '',
      websiteUrl: '',
      firstName: serviceRequestData?.firstName || '',
      lastName: serviceRequestData?.lastName || '',
      email: serviceRequestData?.email || '',
      phone: serviceRequestData?.phone || '',
      createUserAccount: false,
      userExists: false,
      serviceStartDate: new Date().toISOString().split('T')[0],
      serviceId: serviceRequestData?.serviceId || '',
      notes: '',
    },
  });

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('Service')
          .select('*')
          .order('name');
        
        if (error) {
          throw error;
        }
        
        setServices(data || []);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };

    fetchServices();
  }, []);

  // Update form values when serviceRequestData changes
  useEffect(() => {
    if (serviceRequestData) {
      form.reset({
        ...form.getValues(),
        companyName: serviceRequestData.companyName || '',
        firstName: serviceRequestData.firstName || '',
        lastName: serviceRequestData.lastName || '',
        email: serviceRequestData.email || '',
        phone: serviceRequestData.phone || '',
        serviceId: serviceRequestData.serviceId || '',
      });

      // Check if user with this email already exists
      checkEmailExists(serviceRequestData.email);
    }
  }, [serviceRequestData, form]);

  // Check if user with email exists
  const checkEmailExists = async (email: string) => {
    if (!email) return;
    
    setIsCheckingEmail(true);
    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const exists = !!data;
      setEmailExists(exists);
      setUserExists(exists);
      form.setValue('userExists', exists);
    } catch (error) {
      console.error('Error checking email:', error);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Handle form submission
  const onSubmit = async (values: ClientOnboardingFormValues) => {
    setIsSubmitting(true);
    
    try {
      // 1. Create the client
      const { data: clientData, error: clientError } = await supabase
        .from('Client')
        .insert({
          companyName: values.companyName,
          industry: values.industry || null,
          websiteUrl: values.websiteUrl || null,
          serviceStartDate: values.serviceStartDate,
          status: 'ACTIVE',
          notes: values.notes || null,
        })
        .select()
        .single();

      if (clientError) throw clientError;
      
      const clientId = clientData.id;
      
      // 2. Create primary contact
      const { error: contactError } = await supabase
        .from('Contact')
        .insert({
          clientId,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone || null,
          isPrimary: true,
          contactType: 'PRIMARY',
          status: 'ACTIVE',
        });
      
      if (contactError) throw contactError;
      
      // 3. Update user if exists or create new user account
      let userId = null;
      
      if (values.userExists) {
        // Update existing user to link with client
        const { data: userData, error: userUpdateError } = await supabase
          .from('User')
          .update({
            clientId,
            role: 'CLIENT',
          })
          .eq('email', values.email)
          .select()
          .single();
        
        if (userUpdateError) throw userUpdateError;
        userId = userData.id;
      } else if (values.createUserAccount) {
        // A new account needs to be created through auth system
        toast({
          title: 'Note',
          description: 'Please manually create a user account for this client through the User Management page.',
        });
      }
      
      // 4. Add service to client
      const { error: clientServiceError } = await supabase
        .from('ClientService')
        .insert({
          clientId,
          serviceId: values.serviceId,
          startDate: values.serviceStartDate,
        });
      
      if (clientServiceError) throw clientServiceError;
      
      // 5. Update service request status to APPROVED
      if (serviceRequestData) {
        const { error: requestError } = await supabase
          .from('ServiceRequest')
          .update({
            status: 'APPROVED',
            processedAt: new Date().toISOString(),
          })
          .eq('id', serviceRequestData.id);
        
        if (requestError) throw requestError;
      }
      
      toast({
        title: 'Client onboarded successfully',
        description: 'The client has been created and service has been assigned.',
      });
      
      onOpenChange(false);
      onSuccess();
      
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Client Onboarding</DialogTitle>
          <DialogDescription>
            Create a new client account and assign services.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Service request information if provided */}
            {serviceRequestData && (
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium">Service Request</h3>
                    <Badge variant="outline" className={serviceRequestData.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}>
                      {serviceRequestData.status}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <p><strong>Requested:</strong> {new Date(serviceRequestData.createdAt).toLocaleDateString()}</p>
                    <p><strong>Service:</strong> {serviceRequestData.service?.name}</p>
                    <p><strong>Message:</strong> {serviceRequestData.message}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Client Information */}
            <div className="pb-2">
              <h3 className="text-lg font-medium">Company Information</h3>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="Industry (optional)" {...field} />
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
                      <Input placeholder="https://example.com (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Primary Contact */}
            <div className="pt-4 pb-2">
              <h3 className="text-lg font-medium">Primary Contact</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="Email" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            checkEmailExists(e.target.value);
                          }}
                        />
                        {isCheckingEmail && (
                          <Loader2 className="animate-spin h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2" />
                        )}
                        {emailExists && !isCheckingEmail && (
                          <UserPlus className="h-4 w-4 text-green-600 absolute right-3 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                    </FormControl>
                    {emailExists && (
                      <FormDescription className="text-green-600">
                        Existing user found! They will be linked to this client.
                      </FormDescription>
                    )}
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
                      <Input placeholder="Phone (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* User Account */}
            <div className="pt-4 pb-2">
              <h3 className="text-lg font-medium">User Account</h3>
            </div>

            {emailExists ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">
                  A user with this email already exists. They will be assigned the CLIENT role and linked to this client.
                </p>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="createUserAccount"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Create User Account</FormLabel>
                      <FormDescription>
                        Create a user account with CLIENT role for this contact.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* Service Information */}
            <div className="pt-4 pb-2">
              <h3 className="text-lg font-medium">Service Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
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
                name="serviceStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes about the client or service..." 
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Create Client & Assign Service'
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
