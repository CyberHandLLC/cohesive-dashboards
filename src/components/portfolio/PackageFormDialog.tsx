
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Package } from '@/hooks/usePackages';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    },
  });

  const handleSubmit = (values: FormData) => {
    // Here we need to make sure all required fields are included
    const formattedValues = {
      name: values.name,
      description: values.description,
      price: values.price,
      discount: values.discount,
      monthlyPrice: values.monthlyPrice,
      services: values.services || [],
      availability: values.availability,
    };
    onSubmit(formattedValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
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
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount</FormLabel>
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
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
