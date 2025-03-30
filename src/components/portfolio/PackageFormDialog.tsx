
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Package } from '@/hooks/usePackages';
import { Service } from '@/hooks/useServices';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  price: z.preprocess(
    (a) => (a === '' ? undefined : Number(a)),
    z.number().min(0, { message: "Price cannot be negative" })
  ),
  discount: z.preprocess(
    (a) => (a === '' ? undefined : Number(a)),
    z.number().min(0, { message: "Discount cannot be negative" }).optional()
  ),
  monthlyPrice: z.preprocess(
    (a) => (a === '' ? undefined : Number(a)),
    z.number().min(0, { message: "Monthly price cannot be negative" }).optional()
  ),
  services: z.array(z.string()).default([]),
  availability: z.enum(['ACTIVE', 'DISCONTINUED', 'COMING_SOON']).default('ACTIVE'),
  customFields: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => void;
  initialData?: Package | null;
  title: string;
}

export function PackageFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
}: PackageFormDialogProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [customFields, setCustomFields] = useState<Array<{ key: string, value: string }>>([]);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price || undefined,
      discount: initialData?.discount || undefined,
      monthlyPrice: initialData?.monthlyPrice || undefined,
      services: initialData?.services || [],
      availability: initialData?.availability || 'ACTIVE',
      customFields: initialData?.customFields || {},
    },
  });

  // Load available services when dialog opens
  useEffect(() => {
    if (open) {
      loadServices();
      
      // Initialize custom fields for editing
      if (initialData?.customFields) {
        const fields = Object.entries(initialData.customFields).map(([key, value]) => ({
          key,
          value: String(value)
        }));
        setCustomFields(fields);
      } else {
        setCustomFields([]);
      }
    }
  }, [open, initialData]);

  const loadServices = async () => {
    setIsLoadingServices(true);
    try {
      const { data, error } = await supabase
        .from('Service')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const handleAddCustomField = () => {
    if (newFieldKey.trim() && newFieldValue.trim()) {
      setCustomFields([...customFields, { key: newFieldKey.trim(), value: newFieldValue.trim() }]);
      setNewFieldKey('');
      setNewFieldValue('');
    }
  };

  const handleRemoveCustomField = (index: number) => {
    const updatedFields = [...customFields];
    updatedFields.splice(index, 1);
    setCustomFields(updatedFields);
  };

  const handleSubmit = (values: FormData) => {
    // Convert custom fields array to object
    const customFieldsObject = customFields.reduce((acc, field) => {
      acc[field.key] = field.value;
      return acc;
    }, {} as Record<string, string>);

    // Here we need to make sure all required fields are included
    const formattedValues = {
      name: values.name,
      description: values.description,
      price: values.price,
      discount: values.discount,
      monthlyPrice: values.monthlyPrice,
      services: values.services || [],
      availability: values.availability,
      customFields: Object.keys(customFieldsObject).length > 0 ? customFieldsObject : null,
    };
    onSubmit(formattedValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
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
                    <Input placeholder="Package name" {...field} />
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
                    <Textarea placeholder="Package description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount %</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} value={field.value || ''} />
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
                      <Input type="number" placeholder="0.00" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="availability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Availability</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              name="services"
              render={() => (
                <FormItem>
                  <FormLabel>Included Services</FormLabel>
                  <div className="border rounded-md p-4">
                    {isLoadingServices ? (
                      <div className="text-center py-2 text-muted-foreground">Loading services...</div>
                    ) : services.length === 0 ? (
                      <div className="text-center py-2 text-muted-foreground">No services available</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {services.map((service) => (
                          <FormField
                            key={service.id}
                            control={form.control}
                            name="services"
                            render={({ field }) => {
                              return (
                                <FormItem key={service.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(service.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, service.id])
                                          : field.onChange(field.value?.filter((value) => value !== service.id))
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="cursor-pointer">
                                      {service.name}
                                      {service.price && (
                                        <span className="text-muted-foreground text-xs ml-1">
                                          ({formatCurrency(service.price)})
                                        </span>
                                      )}
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Custom Fields Section */}
            <div>
              <FormLabel>Custom Fields</FormLabel>
              <div className="space-y-2 mt-1">
                {customFields.map((field, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={field.key}
                      onChange={(e) => {
                        const updatedFields = [...customFields];
                        updatedFields[index].key = e.target.value;
                        setCustomFields(updatedFields);
                      }}
                      placeholder="Field Name"
                      className="flex-1"
                    />
                    <Input
                      value={field.value}
                      onChange={(e) => {
                        const updatedFields = [...customFields];
                        updatedFields[index].value = e.target.value;
                        setCustomFields(updatedFields);
                      }}
                      placeholder="Field Value"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCustomField(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newFieldKey}
                    onChange={(e) => setNewFieldKey(e.target.value)}
                    placeholder="New Field Name"
                    className="flex-1"
                  />
                  <Input
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    placeholder="New Field Value"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomField}
                    disabled={!newFieldKey.trim() || !newFieldValue.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to format currency values
function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}
