
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/ui/use-toast';
import { usePackages, PackageInput } from '@/hooks/usePackages';
import { useServices } from '@/hooks/useServices';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const PackageDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    packages,
    isLoading: packagesLoading,
    updatePackage,
    loadPackageServices,
    loadedServices,
  } = usePackages();
  
  const { services: allServices, isLoading: servicesLoading } = useServices();
  
  const currentPackage = packages?.find(pkg => pkg.id === id);
  
  useEffect(() => {
    if (id && currentPackage) {
      loadPackageServices(id);
    }
  }, [id, currentPackage]);
  
  const formSchema = z.object({
    name: z.string().min(1, "Package name is required"),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "Price must be a non-negative number"),
    discount: z.coerce.number().min(0, "Discount must be a non-negative number").max(100, "Discount cannot exceed 100%").optional().nullable(),
    monthlyPrice: z.coerce.number().min(0, "Monthly price must be a non-negative number").optional().nullable(),
    services: z.array(z.string()).min(1, "At least one service is required"),
    availability: z.enum(["ACTIVE", "DISCONTINUED", "COMING_SOON"])
  });
  
  type FormValues = z.infer<typeof formSchema>;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentPackage?.name || "",
      description: currentPackage?.description || "",
      price: currentPackage?.price || 0,
      discount: currentPackage?.discount || null,
      monthlyPrice: currentPackage?.monthlyPrice || null,
      services: currentPackage?.services || [],
      availability: currentPackage?.availability || "ACTIVE"
    }
  });
  
  // Update form values when package data is loaded
  useEffect(() => {
    if (currentPackage) {
      form.reset({
        name: currentPackage.name,
        description: currentPackage.description || "",
        price: currentPackage.price,
        discount: currentPackage.discount,
        monthlyPrice: currentPackage.monthlyPrice,
        services: currentPackage.services,
        availability: currentPackage.availability
      });
    }
  }, [currentPackage, form]);
  
  const onSubmit = async (data: FormValues) => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      await updatePackage({ 
        id, 
        updates: data as PackageInput
      });
      
      toast({
        title: "Package updated",
        description: "Package has been updated successfully"
      });
    } catch (error) {
      console.error("Failed to update package:", error);
      toast({
        title: "Error",
        description: "Failed to update package",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Portfolio', href: '/admin/portfolio' },
    { label: 'Packages', href: '/admin/portfolio/packages' },
    { label: currentPackage?.name || 'Package Details' }
  ];
  
  if (!id) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent className="pt-6">
            <p>Invalid package ID. Please go back to the packages list.</p>
            <Button onClick={() => navigate('/admin/portfolio/packages')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Packages
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }
  
  if (packagesLoading || !currentPackage) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Package</h1>
          <Button variant="outline" onClick={() => navigate('/admin/portfolio/packages')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Packages
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Package Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
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
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
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
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                          />
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
                        <FormLabel>Discount (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="services"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-base">Included Services</FormLabel>
                          </div>
                          
                          {servicesLoading ? (
                            <div className="py-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                              Loading services...
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {allServices?.map((service) => (
                                <div key={service.id} className="flex items-center space-x-2">
                                  <FormField
                                    control={form.control}
                                    name="services"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={service.id}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(service.id)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...field.value, service.id])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) => value !== service.id
                                                      )
                                                    )
                                              }}
                                            />
                                          </FormControl>
                                          <div className="flex items-center gap-2">
                                            <div className="font-medium leading-none">
                                              {service.name}
                                            </div>
                                            {service.price && (
                                              <span className="text-sm text-muted-foreground">
                                                ({formatCurrency(service.price)})
                                              </span>
                                            )}
                                          </div>
                                        </FormItem>
                                      )
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={isLoading || packagesLoading}
                    className="w-full md:w-auto"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Included Services</CardTitle>
          </CardHeader>
          <CardContent>
            {loadedServices[id]?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loadedServices[id].map((service) => (
                  <Card key={service.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {service.description}
                            </p>
                          )}
                        </div>
                        <Badge>{formatCurrency(service.price || 0)}</Badge>
                      </div>
                      
                      {service.features && service.features.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Features</h4>
                          <ul className="text-sm space-y-1">
                            {service.features.map((feature, index) => (
                              <li key={index} className="flex items-center">
                                <span className="mr-2 text-green-500">•</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                {loadedServices[id] ? "No services added to this package" : "Loading services..."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PackageDetailsPage;
