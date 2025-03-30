
import React, { useState } from 'react';
import { Service } from '@/hooks/useServices';
import { ServiceTier } from '@/hooks/useServiceTiers';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';

interface ServicesTableProps {
  services: Service[];
  tiers: Record<string, ServiceTier[]>;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onAddTier: (serviceId: string) => void;
  onEditTier: (tier: ServiceTier) => void;
  onDeleteTier: (tier: ServiceTier) => void;
  loadingTiers: Record<string, boolean>;
}

export function ServicesTable({
  services,
  tiers,
  onEdit,
  onDelete,
  onAddTier,
  onEditTier,
  onDeleteTier,
  loadingTiers
}: ServicesTableProps) {
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});

  const toggleExpanded = (serviceId: string) => {
    setExpandedServices(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead style={{ width: '30px' }}></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Monthly Price</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
              No services found
            </TableCell>
          </TableRow>
        ) : (
          services.map((service) => (
            <React.Fragment key={service.id}>
              <TableRow>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleExpanded(service.id)}
                  >
                    {expandedServices[service.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell>{service.category?.name || '-'}</TableCell>
                <TableCell>{service.price !== null ? formatCurrency(service.price) : '-'}</TableCell>
                <TableCell>{service.monthlyPrice !== null ? formatCurrency(service.monthlyPrice) : '-'}</TableCell>
                <TableCell>{new Date(service.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(service)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(service)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

              {expandedServices[service.id] && (
                <TableRow>
                  <TableCell colSpan={7} className="p-0 bg-muted/30">
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium">Service Tiers</h4>
                        <Button size="sm" onClick={() => onAddTier(service.id)}>
                          <Plus className="h-3 w-3 mr-1" /> Add Tier
                        </Button>
                      </div>
                      
                      {loadingTiers[service.id] ? (
                        <div className="text-center py-4 text-muted-foreground">Loading tiers...</div>
                      ) : !tiers[service.id] || tiers[service.id].length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No tiers for this service</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Monthly Price</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tiers[service.id].map((tier) => (
                              <TableRow key={tier.id}>
                                <TableCell className="font-medium">{tier.name}</TableCell>
                                <TableCell>{formatCurrency(tier.price)}</TableCell>
                                <TableCell>{tier.monthlyPrice !== null ? formatCurrency(tier.monthlyPrice) : '-'}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    tier.availability === 'ACTIVE' ? 'default' :
                                    tier.availability === 'INACTIVE' ? 'outline' : 'secondary'
                                  }>
                                    {tier.availability}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => onEditTier(tier)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => onDeleteTier(tier)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))
        )}
      </TableBody>
    </Table>
  );
}
