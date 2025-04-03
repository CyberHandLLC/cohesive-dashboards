import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Service } from '@/hooks/useServices';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCategories } from '@/hooks/useCategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  price: z.preprocess(
    (a) => (a === '' ? undefined : Number(a)),
    z.number().min(0).optional()
  ),
  monthlyPrice: z.preprocess(
    (a) => (a === '' ? undefined : Number(a)),
    z.number().min(0).optional()
  ),
  categoryId: z.string().min(1, { message: "Category is required" }),
  features: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof formSchema>;

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => void;
  initialData?: Service | null;
  title: string;
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
}: ServiceFormDialogProps) {
  const { categories } = useCategories();
  const [featureInput, setFeatureInput] = useState('');
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: undefined,
      monthlyPrice: undefined,
      categoryId: '',
      features: [],
    },
  });

  // Update form values when initialData changes or when dialog opens
  useEffect(() => {
    if (open && initialData) {
      form.reset({
        name: initialData.name || '',
        description: initialData.description || '',
        price: initialData.price || undefined,
        monthlyPrice: initialData.monthlyPrice || undefined,
        categoryId: initialData.categoryId || '',
        features: initialData.features || [],
      });
      
      // Update custom fields when initialData changes
      setCustomFields(initialData.customFields as Record<string, string> || {});
    } else if (!open) {
      // Reset form when dialog closes
      form.reset();
      setCustomFields({});
      setFeatureInput('');
      setCustomFieldKey('');
      setCustomFieldValue('');
    }
  }, [open, initialData, form]);

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

  const addCustomField = () => {
    if (customFieldKey.trim() !== '' && customFieldValue.trim() !== '') {
      setCustomFields({
        ...customFields,
        [customFieldKey.trim()]: customFieldValue.trim()
      });
      setCustomFieldKey('');
      setCustomFieldValue('');
    }
  };

  const removeCustomField = (key: string) => {
    const newFields = { ...customFields };
    delete newFields[key];
    setCustomFields(newFields);
  };

  const handleSubmit = (values: FormData) => {
    const formattedValues = {
      ...values,
      features: values.features || [],
      customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
    };
    onSubmit(formattedValues);
  };

  const handleCancel = () => {
    onOpenChange(false);
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
                    <Input placeholder="Service name" {...field} />
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
                    <Textarea placeholder="Service description" {...field} />
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
                      <Input type="number" placeholder="0.00" {...field} value={field.value || ''} />
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <div className="space-y-2">
              <FormLabel>Custom Fields</FormLabel>
              <div className="flex space-x-2">
                <Input 
                  placeholder="Field name" 
                  value={customFieldKey} 
                  onChange={(e) => setCustomFieldKey(e.target.value)} 
                />
                <Input 
                  placeholder="Value" 
                  value={customFieldValue} 
                  onChange={(e) => setCustomFieldValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomField();
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={addCustomField}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 space-y-1">
                {Object.entries(customFields).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No custom fields added</p>
                ) : (
                  Object.entries(customFields).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between bg-muted p-2 rounded-md">
                      <div>
                        <span className="text-sm font-medium">{key}:</span>
                        <span className="text-sm ml-2">{value}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomField(key)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
              </DialogClose>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
