import React, { useState } from 'react';
import { ExpiringService } from '@/hooks/useExpiringServices';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, addMonths, addYears } from 'date-fns';
import { Loader2, Calendar, CreditCard, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface ServiceRenewalDialogProps {
  service: ExpiringService;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRenewalComplete: () => void;
}

interface RenewalTermOption {
  id: string;
  name: string;
  months: number;
  description: string;
}

export function ServiceRenewalDialog({
  service,
  open,
  onOpenChange,
  onRenewalComplete
}: ServiceRenewalDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string>('6months');
  const [customPrice, setCustomPrice] = useState<string>(service.price?.toString() || '0');
  const [generateInvoice, setGenerateInvoice] = useState<boolean>(true);
  const [sendNotification, setSendNotification] = useState<boolean>(true);
  
  const renewalTerms: RenewalTermOption[] = [
    { 
      id: '3months', 
      name: '3 Months', 
      months: 3, 
      description: 'Short-term renewal' 
    },
    { 
      id: '6months', 
      name: '6 Months', 
      months: 6, 
      description: 'Standard renewal term' 
    },
    { 
      id: '1year', 
      name: '1 Year', 
      months: 12, 
      description: 'Annual renewal (recommended)' 
    },
    { 
      id: '2years', 
      name: '2 Years', 
      months: 24, 
      description: 'Extended renewal with best value' 
    },
  ];
  
  const selectedOption = renewalTerms.find(term => term.id === selectedTerm);
  
  const calculateNewEndDate = () => {
    if (!selectedOption) return new Date();
    
    // If service is expired, start from current date
    const startDate = new Date(service.endDate) < new Date() 
      ? new Date() 
      : new Date(service.endDate);
      
    return addMonths(startDate, selectedOption.months);
  };
  
  const handleRenewal = async () => {
    setIsSubmitting(true);
    
    try {
      const newEndDate = calculateNewEndDate();
      const priceValue = parseFloat(customPrice);
      
      if (isNaN(priceValue)) {
        throw new Error("Invalid price value");
      }
      
      // Get current user for audit log
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Authentication required");
      }
      
      // Update the ClientService record
      const { error: updateError } = await supabase
        .from('ClientService')
        .update({
          endDate: newEndDate.toISOString(),
          price: priceValue,
          status: 'ACTIVE', // Ensure status is set to active
          updatedAt: new Date().toISOString()
        })
        .eq('id', service.id);
        
      if (updateError) throw updateError;
      
      // Create a record in the audit log
      const { error: auditError } = await supabase
        .from('AuditLog')
        .insert({
          action: 'UPDATE',
          resource: 'SERVICE', // Using a valid resource type from the allowed list
          userId: user.id,
          details: {
            actionType: 'SERVICE_RENEWAL',
            clientServiceId: service.id, // Include the actual service ID for reference
            clientId: service.clientId,
            serviceId: service.serviceId,
            previousEndDate: service.endDate,
            newEndDate: newEndDate.toISOString(),
            renewalTerm: selectedOption?.name,
            price: priceValue
          }
        });
        
      if (auditError) console.error('Error logging audit:', auditError);
      
      // Generate invoice if option is selected
      if (generateInvoice) {
        // Code to generate invoice would go here
        // This would typically call a separate service or function
        console.log('Generate invoice for renewal:', {
          clientId: service.clientId,
          serviceId: service.serviceId,
          serviceName: service.service.name,
          amount: priceValue,
          term: selectedOption?.name
        });
      }
      
      // Send notification if option is selected
      if (sendNotification) {
        // Code to send notification would go here
        console.log('Send renewal notification for:', {
          clientId: service.clientId,
          clientName: service.client.companyName,
          serviceName: service.service.name,
          newEndDate: format(newEndDate, 'MMM d, yyyy')
        });
      }
      
      toast({
        title: "Service renewed successfully",
        description: `${service.service.name} for ${service.client.companyName} has been renewed until ${format(newEndDate, 'MMM d, yyyy')}.`,
      });
      
      onRenewalComplete();
    } catch (error: any) {
      console.error('Error renewing service:', error);
      toast({
        title: "Renewal failed",
        description: error.message || "There was a problem renewing the service. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Renew Service: {service.service.name}</DialogTitle>
          <DialogDescription>
            Extend the service period for {service.client.companyName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* Current Status */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current End Date:</span>
                  <span className="text-sm font-medium">
                    {format(new Date(service.endDate), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="text-sm font-medium">
                    {new Date(service.endDate) < new Date() ? (
                      <span className="text-red-600">Expired</span>
                    ) : (
                      <span className="text-green-600">Active</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Price:</span>
                  <span className="text-sm font-medium">${service.price?.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Renewal Term */}
          <div className="space-y-2">
            <Label>Renewal Term</Label>
            <RadioGroup 
              value={selectedTerm} 
              onValueChange={setSelectedTerm}
              className="space-y-3"
            >
              {renewalTerms.map((term) => (
                <div
                  key={term.id}
                  className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent"
                >
                  <RadioGroupItem value={term.id} id={term.id} />
                  <Label
                    htmlFor={term.id}
                    className="flex flex-1 cursor-pointer justify-between font-normal"
                  >
                    <div>
                      <span className="font-medium">{term.name}</span>
                      <p className="text-sm text-muted-foreground">{term.description}</p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                $
              </span>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                className="pl-7"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
              />
            </div>
          </div>
          
          {/* New End Date Preview */}
          <div className="space-y-2">
            <Label>New End Date</Label>
            <div className="flex items-center text-sm bg-muted p-3 rounded-md">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{format(calculateNewEndDate(), 'MMM d, yyyy')}</span>
            </div>
          </div>
          
          {/* Options */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="invoice" className="flex items-center space-x-2 cursor-pointer">
                <span>Generate Invoice</span>
              </Label>
              <Switch
                id="invoice"
                checked={generateInvoice}
                onCheckedChange={setGenerateInvoice}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="notification" className="flex items-center space-x-2 cursor-pointer">
                <span>Send Client Notification</span>
              </Label>
              <Switch
                id="notification"
                checked={sendNotification}
                onCheckedChange={setSendNotification}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex space-x-2 sm:space-x-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRenewal} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Renewing...
              </>
            ) : (
              'Renew Service'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
