
import React, { useState, useEffect } from 'react';
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
import { Package } from '@/hooks/usePackages';
import { AlertCircle } from 'lucide-react';

interface PackageDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package: Package | null;
  onConfirm: () => void;
  clientCount?: number;
}

export function PackageDeleteDialog({
  open,
  onOpenChange,
  package: pkg,
  onConfirm,
  clientCount = 0,
}: PackageDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsDeleting(false);
    }
  }, [open]);

  if (!pkg) return null;

  const hasClients = clientCount > 0;

  const handleConfirmDelete = () => {
    setIsDeleting(true);
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Delete Package
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete the package "{pkg.name}"? This action cannot be undone.
            </p>
            
            {hasClients && (
              <div className="mt-2 p-3 bg-destructive/10 rounded-md text-destructive font-medium">
                <p>
                  Warning: This package is currently used by {clientCount} {clientCount === 1 ? 'client' : 'clients'}. 
                  Deleting it will affect their subscriptions.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmDelete} 
            className="bg-destructive hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
