
import React from 'react';
import { Category } from '@/hooks/useCategories';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CategoriesTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  serviceCounts?: Record<string, number>;
  onServiceCountClick?: (categoryId: string) => void;
  isLoading?: boolean;
}

export function CategoriesTable({ 
  categories, 
  onEdit, 
  onDelete, 
  serviceCounts = {},
  onServiceCountClick,
  isLoading = false
}: CategoriesTableProps) {
  if (isLoading) {
    return (
      <div className="py-6 text-center text-muted-foreground">
        Loading categories...
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="py-6 text-center text-muted-foreground">
        No categories found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Created At</TableHead>
          {Object.keys(serviceCounts).length > 0 && (
            <TableHead className="text-center">Services</TableHead>
          )}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell className="font-medium">{category.name}</TableCell>
            <TableCell>{category.description || '-'}</TableCell>
            <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
            {Object.keys(serviceCounts).length > 0 && (
              <TableCell className="text-center">
                <Badge 
                  variant="outline" 
                  className={`
                    ${onServiceCountClick ? "cursor-pointer hover:bg-primary/10 transition-colors" : ""}
                  `}
                  onClick={() => onServiceCountClick?.(category.id)}
                >
                  {serviceCounts[category.id] || 0}
                  {onServiceCountClick && <ArrowRight className="ml-1 h-3 w-3" />}
                </Badge>
              </TableCell>
            )}
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(category)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
