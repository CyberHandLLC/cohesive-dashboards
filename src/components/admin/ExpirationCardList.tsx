import React, { useState } from 'react';
import { ExpiringService } from '@/hooks/useExpiringServices';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, isBefore } from 'date-fns';
import { AlertCircle, Calendar, Banknote, Building, RepeatIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ServiceRenewalDialog } from './ServiceRenewalDialog';

interface ExpirationCardListProps {
  services: ExpiringService[];
}

export function ExpirationCardList({ services }: ExpirationCardListProps) {
  const [selectedService, setSelectedService] = useState<ExpiringService | null>(null);
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  
  const handleRenew = (service: ExpiringService) => {
    setSelectedService(service);
    setRenewalDialogOpen(true);
  };
  
  const getStatusColor = (service: ExpiringService) => {
    const { endDate, daysUntilExpiration } = service;
    
    if (isBefore(new Date(endDate), new Date())) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    if (daysUntilExpiration <= 7) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    
    if (daysUntilExpiration <= 30) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };
  
  const getStatusText = (service: ExpiringService) => {
    const { endDate, daysUntilExpiration } = service;
    
    if (isBefore(new Date(endDate), new Date())) {
      return 'Expired';
    }
    
    if (daysUntilExpiration <= 7) {
      return 'Critical';
    }
    
    if (daysUntilExpiration <= 30) {
      return 'Expiring Soon';
    }
    
    return 'Upcoming';
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map((service) => (
        <Card 
          key={service.id} 
          className={cn("shadow-sm border-2", getStatusColor(service))}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{service.service.name}</CardTitle>
              <Badge variant="outline" className={cn("rounded-full", getStatusColor(service))}>
                {getStatusText(service)}
              </Badge>
            </div>
            <div className="text-sm font-medium flex items-center">
              <Building className="mr-1 h-4 w-4 text-muted-foreground" />
              {service.client.companyName}
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Expires:</span>
                <span className="ml-1 font-medium">
                  {format(new Date(service.endDate), 'MMM d, yyyy')}
                </span>
                {service.daysUntilExpiration > 0 ? (
                  <span className="ml-2 text-muted-foreground">
                    ({service.daysUntilExpiration} days left)
                  </span>
                ) : (
                  <span className="ml-2 text-red-600 font-medium">
                    (Expired)
                  </span>
                )}
              </div>
              
              <div className="flex items-center text-sm">
                <Banknote className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Price:</span>
                <span className="ml-1 font-medium">
                  ${service.price?.toFixed(2)}
                </span>
              </div>
              
              {service.service.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  {service.service.description}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button 
              variant={isBefore(new Date(service.endDate), new Date()) ? "default" : "outline"} 
              size="sm"
              className="flex-1"
              onClick={() => handleRenew(service)}
            >
              <RepeatIcon className="mr-2 h-4 w-4" />
              {isBefore(new Date(service.endDate), new Date()) ? "Renew Now" : "Renew"}
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              View Details
            </Button>
          </CardFooter>
        </Card>
      ))}
      
      {/* Renewal Dialog */}
      {selectedService && (
        <ServiceRenewalDialog
          service={selectedService}
          open={renewalDialogOpen}
          onOpenChange={setRenewalDialogOpen}
          onRenewalComplete={() => {
            // Handle renewal completion (e.g., refresh data)
            setRenewalDialogOpen(false);
            setSelectedService(null);
          }}
        />
      )}
    </div>
  );
}
