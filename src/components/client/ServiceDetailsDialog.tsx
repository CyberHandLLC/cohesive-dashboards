
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ClientService } from '@/types/client';

interface ServiceDetailsDialogProps {
  service: ClientService | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ServiceDetailsDialog: React.FC<ServiceDetailsDialogProps> = ({ 
  service, 
  isOpen, 
  onOpenChange 
}) => {
  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Service Details</DialogTitle>
          <DialogDescription>
            View detailed information about this service
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{service.service?.name}</h3>
              <span className={`px-2 py-1 text-xs rounded-md ${
                service.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                service.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                service.status === 'EXPIRED' ? 'bg-gray-100 text-gray-800' :
                service.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {service.status}
              </span>
            </div>
            
            {service.service?.description && (
              <p className="text-muted-foreground text-sm">
                {service.service.description}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Start Date</p>
              <p className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(service.startDate)}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">End Date</p>
              <p className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                {service.endDate ? formatDate(service.endDate) : 'Not specified'}
              </p>
            </div>
            
            {service.service?.price && (
              <div className="space-y-1">
                <p className="text-sm font-medium">One-time Price</p>
                <p className="text-muted-foreground">
                  {formatCurrency(service.service.price)}
                </p>
              </div>
            )}
            
            {service.service?.monthlyPrice && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Monthly Price</p>
                <p className="text-muted-foreground">
                  {formatCurrency(service.service.monthlyPrice)}/month
                </p>
              </div>
            )}
          </div>
          
          {service.service?.features && service.service.features.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Features</h4>
              <ul className="space-y-1">
                {service.service.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2 mt-0.5">✓</span>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {service.service?.customFields && Object.keys(service.service.customFields).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Additional Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(service.service.customFields).map(([key, value]) => (
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
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDetailsDialog;
