
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ServiceCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  monthlyPrice: number | null;
  features: string[];
  onRequestService: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  name,
  description,
  price,
  monthlyPrice,
  features,
  onRequestService,
}) => {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-4">
          {price > 0 && (
            <div className="text-2xl font-bold">
              {formatCurrency(price)}
              {monthlyPrice ? (
                <span className="text-sm font-normal"> one-time setup</span>
              ) : null}
            </div>
          )}
          {monthlyPrice ? (
            <div className="text-lg font-semibold">
              {formatCurrency(monthlyPrice)}
              <span className="text-sm font-normal"> /month</span>
            </div>
          ) : null}
        </div>
        
        <div className="space-y-2">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onRequestService} className="w-full">
          Request Service
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;
