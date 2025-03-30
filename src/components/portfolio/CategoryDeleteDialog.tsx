
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Category } from '@/hooks/useCategories';
import { AlertCircle } from 'lucide-react';

interface CategoryDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onConfirm: () => void;
  hasServices?: boolean;
  serviceCount?: number;
}

export function CategoryDeleteDialog({
  open,
  onOpenChange,
  category,
  onConfirm,
  hasServices = false,
  serviceCount = 0,
}: CategoryDeleteDialogProps) {
  if (!category) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Delete Category
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete the category "{category.name}"? This action cannot be undone.
            </p>
            {hasServices && (
              <div className="mt-2 p-3 bg-destructive/10 rounded-md text-destructive font-medium">
                Warning: This category has {serviceCount} {serviceCount === 1 ? 'service' : 'services'} associated with it. 
                Deleting this category will require reassigning these services.
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
