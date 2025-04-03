import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ServiceTier } from '@/hooks/useServiceTiers';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, X } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  price: z.preprocess(
    (a) => (a === '' ? undefined : Number(a)),
    z.number().min(0, { message: "Price cannot be negative" })
  ),
  monthlyPrice: z.preprocess(
    (a) => (a === '' ? undefined : Number(a)),
    z.number().min(0, { message: "Monthly price cannot be negative" }).optional()
  ),
  features: z.array(z.string()).default([]),
  availability: z.enum(['ACTIVE', 'DISCONTINUED', 'COMING_SOON']).default('ACTIVE'),
  serviceId: z.string().min(1, { message: "Service ID is required" }),
});

type FormData = z.infer<typeof formSchema>;

interface ServiceTierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => void;
  initialValues?: ServiceTier | { serviceId: string } | null;
  mode?: 'add' | 'edit';
}

export function ServiceTierFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  mode = 'add'
}: ServiceTierFormDialogProps) {
  const [featureInput, setFeatureInput] = useState('');
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: undefined,
      monthlyPrice: undefined,
      features: [],
      availability: 'ACTIVE',
      serviceId: '',
    },
  });

  // Update form values when initialValues changes or when dialog opens
  useEffect(() => {
    if (open && initialValues) {
      const hasFullData = 'name' in initialValues || 'description' in initialValues;
      
      form.reset({
        name: hasFullData && 'name' in initialValues ? initialValues.name || '' : '',
        description: hasFullData && 'description' in initialValues ? initialValues.description || '' : '',
        price: hasFullData && 'price' in initialValues ? initialValues.price : undefined,
        monthlyPrice: hasFullData && 'monthlyPrice' in initialValues ? initialValues.monthlyPrice : undefined,
        features: hasFullData && 'features' in initialValues ? initialValues.features || [] : [],
        availability: hasFullData && 'availability' in initialValues ? initialValues.availability || 'ACTIVE' : 'ACTIVE',
        serviceId: initialValues.serviceId || '',
      });
    } else if (!open) {
      // Reset form when dialog closes
      form.reset();
      setFeatureInput('');
    }
  }, [open, initialValues, form]);
  
  const features = form.watch('features') || [];

  const addFeature = () => {
    if (featureInput.trim() !== '') {
      form.setValue('features', [...features, featureInput.trim()]);
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    const updatedFeatures = [...features];
    updatedFeatures.splice(index, 1);
    form.setValue('features', updatedFeatures);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSubmit = (values: FormData) => {
    // Ensure features is an array
    const formattedValues = {
      ...values,
      features: values.features || [],
    };
    onSubmit(formattedValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Service Tier' : 'Edit Service Tier'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' 
              ? 'Create a new tier for this service with pricing and features.' 
              : 'Modify the details of this service tier.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Service tier name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Service tier description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monthlyPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Price</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="features"
              render={() => (
                <FormItem>
                  <FormLabel>Features</FormLabel>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input 
                        placeholder="Add feature" 
                        value={featureInput} 
                        onChange={(e) => setFeatureInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addFeature();
                          }
                        }}
                      />
                      <Button type="button" size="sm" onClick={addFeature}>
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      {features.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No features added</p>
                      ) : (
                        features.map((feature, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                            <span className="text-sm">{feature}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFeature(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="availability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Availability</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                      <SelectItem value="COMING_SOON">Coming Soon</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
              </DialogClose>
              <Button type="submit">{mode === 'add' ? 'Add' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
