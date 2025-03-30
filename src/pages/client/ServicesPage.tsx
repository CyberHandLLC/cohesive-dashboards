
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Eye, Search, AlertCircle, Calendar, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Service {
  name: string;
  description: string | null;
  price: number | null;
  monthlyPrice: number | null;
  features: string[];
  customFields?: Record<string, any>;
}

interface ClientService {
  id: string;
  serviceId: string;
  startDate: string;
  endDate: string | null;
  status: string;
  price: number | null;
  createdAt: string;
  service?: Service;
}

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  PENDING: 'bg-amber-100 text-amber-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  SUSPENDED: 'bg-red-100 text-red-800'
};

const ClientServicesPage = () => {
  const [services, setServices] = useState<ClientService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ClientService | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();
  
  const breadcrumbs = [
    { label: 'Client', href: '/client' },
    { label: 'Accounts', href: '/client/accounts' },
    { label: 'Services' }
  ];

  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        const { data, error } = await supabase
          .from('User')
          .select('clientId')
          .eq('id', user.id)
          .single();
        
        if (error || !data.clientId) {
          console.error('Error fetching client ID:', error);
          return;
        }
        
        setClientId(data.clientId);
        fetchServices(data.clientId);
      } catch (error) {
        console.error('Error in client fetch operation:', error);
      }
    };

    fetchClientId();
    
    // Set up real-time subscription for service updates
    const channel = supabase
      .channel('client-services-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ClientService'
        },
        (payload) => {
          if (clientId && payload.new.clientId === clientId) {
            fetchServices(clientId);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchServices = async (clientId: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('ClientService')
        .select(`
          *,
          service:serviceId (
            name,
            description,
            price,
            monthlyPrice,
            features,
            customFields
          )
        `)
        .eq('clientId', clientId);
      
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query.order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      // Filter by search term if needed
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const filtered = data.filter(service => 
          (service.service?.name?.toLowerCase().includes(term) || false) ||
          (service.service?.description?.toLowerCase().includes(term) || false) ||
          (service.service?.features?.some((feature: string) => 
            feature.toLowerCase().includes(term)
          ) || false)
        );
        setServices(filtered);
      } else {
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error loading services",
        description: "Failed to load your services. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (clientId) {
      fetchServices(clientId);
    }
  }, [statusFilter, searchTerm, clientId]);

  const handleViewDetails = (service: ClientService) => {
    setSelectedService(service);
    setIsDetailsOpen(true);
  };

  const filteredServices = services.filter(service => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nameMatch = service.service?.name?.toLowerCase().includes(term) || false;
      const descriptionMatch = service.service?.description?.toLowerCase().includes(term) || false;
      const featuresMatch = service.service?.features?.some((feature: string) => 
        feature.toLowerCase().includes(term)
      ) || false;
      return nameMatch || descriptionMatch || featuresMatch;
    }
    return true;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter(null);
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="client"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Services</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Services</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full md:w-[200px]">
                <Select
                  value={statusFilter || ''}
                  onValueChange={(value) => setStatusFilter(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(searchTerm || statusFilter) && (
                <Button variant="ghost" onClick={resetFilters} className="md:self-start">
                  Reset
                </Button>
              )}
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading services...</p>
              </div>
            ) : filteredServices.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.service?.name}</TableCell>
                        <TableCell>
                          {service.service?.monthlyPrice ? (
                            <div>
                              <div>{formatCurrency(service.service.monthlyPrice)}/month</div>
                              {service.service.price && (
                                <div className="text-xs text-muted-foreground">
                                  {formatCurrency(service.service.price)} one-time
                                </div>
                              )}
                            </div>
                          ) : (
                            service.service?.price && formatCurrency(service.service.price)
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-md ${
                            statusColors[service.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                          }`}>
                            {service.status}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(service.startDate)}</TableCell>
                        <TableCell>{service.endDate ? formatDate(service.endDate) : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewDetails(service)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No services found</p>
                {(searchTerm || statusFilter) && (
                  <Button 
                    variant="outline" 
                    onClick={resetFilters} 
                    className="mt-4"
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Service Details</DialogTitle>
            <DialogDescription>
              View detailed information about this service
            </DialogDescription>
          </DialogHeader>
          
          {selectedService && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{selectedService.service?.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-md ${
                    statusColors[selectedService.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedService.status}
                  </span>
                </div>
                
                {selectedService.service?.description && (
                  <p className="text-muted-foreground text-sm">
                    {selectedService.service.description}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Start Date</p>
                  <p className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(selectedService.startDate)}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">End Date</p>
                  <p className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {selectedService.endDate ? formatDate(selectedService.endDate) : 'Not specified'}
                  </p>
                </div>
                
                {selectedService.service?.price && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">One-time Price</p>
                    <p className="text-muted-foreground">
                      {formatCurrency(selectedService.service.price)}
                    </p>
                  </div>
                )}
                
                {selectedService.service?.monthlyPrice && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Monthly Price</p>
                    <p className="text-muted-foreground">
                      {formatCurrency(selectedService.service.monthlyPrice)}/month
                    </p>
                  </div>
                )}
              </div>
              
              {selectedService.service?.features && selectedService.service.features.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Features</h4>
                  <ul className="space-y-1">
                    {selectedService.service.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2 mt-0.5">✓</span>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedService.service?.customFields && Object.keys(selectedService.service.customFields).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedService.service.customFields).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <p className="text-sm font-medium">{key}</p>
                        <p className="text-sm text-muted-foreground">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <Button 
                  onClick={() => setIsDetailsOpen(false)}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClientServicesPage;
