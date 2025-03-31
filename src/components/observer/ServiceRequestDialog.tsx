
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ServiceRequestForm from './ServiceRequestForm';

interface ServiceRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  serviceName: string;
}

const ServiceRequestDialog: React.FC<ServiceRequestDialogProps> = ({ 
  open, 
  onOpenChange,
  serviceId,
  serviceName
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Request Service</DialogTitle>
          <DialogDescription>
            Complete this form to request the service. Our team will review your request and contact you.
          </DialogDescription>
        </DialogHeader>
        <ServiceRequestForm serviceId={serviceId} serviceName={serviceName} />
      </DialogContent>
    </Dialog>
  );
};

export default ServiceRequestDialog;
