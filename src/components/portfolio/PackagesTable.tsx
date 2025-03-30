
import React from 'react';
import { Package } from '@/hooks/usePackages';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';

interface PackagesTableProps {
  packages: Package[];
  onEdit: (pkg: Package) => void;
  onDelete: (pkg: Package) => void;
}

export function PackagesTable({ packages, onEdit, onDelete }: PackagesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Discount</TableHead>
          <TableHead>Monthly Price</TableHead>
          <TableHead>Availability</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {packages.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
              No packages found
            </TableCell>
          </TableRow>
        ) : (
          packages.map((pkg) => (
            <TableRow key={pkg.id}>
              <TableCell className="font-medium">{pkg.name}</TableCell>
              <TableCell>{formatCurrency(pkg.price)}</TableCell>
              <TableCell>{pkg.discount ? `${pkg.discount}%` : '-'}</TableCell>
              <TableCell>{pkg.monthlyPrice ? formatCurrency(pkg.monthlyPrice) : '-'}</TableCell>
              <TableCell>
                <Badge variant={
                  pkg.availability === 'ACTIVE' ? 'default' :
                  pkg.availability === 'INACTIVE' ? 'outline' : 'secondary'
                }>
                  {pkg.availability}
                </Badge>
              </TableCell>
              <TableCell>{new Date(pkg.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(pkg)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(pkg)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
