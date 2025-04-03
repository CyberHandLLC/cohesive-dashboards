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
import { Service } from '@/hooks/useServices';
import { AlertCircle } from 'lucide-react';

interface ServiceDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onConfirm: () => void;
  clientCount?: number;
  tierCount?: number;
}

export function ServiceDeleteDialog({
  open,
  onOpenChange,
  service,
  onConfirm,
  clientCount = 0,
  tierCount = 0,
}: ServiceDeleteDialogProps) {
  if (!service) return null;

  const hasClients = clientCount > 0;
  const hasTiers = tierCount > 0;
  const hasWarnings = hasClients || hasTiers;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Delete Service
          </AlertDialogTitle>
          
          {/* Use a simple text content without div wrappers for AlertDialogDescription */}
          <AlertDialogDescription>
            Are you sure you want to delete the service "{service.name}"? This action cannot be undone.
          </AlertDialogDescription>
          
          {/* Move the warnings outside of AlertDialogDescription */}
          {hasWarnings && (
            <div className="mt-4 p-3 bg-destructive/10 rounded-md text-destructive font-medium space-y-2">
              <div className="font-bold">Warning:</div>
              
              {hasTiers && (
                <div>
                  This service has {tierCount} {tierCount === 1 ? 'tier' : 'tiers'} that will also be deleted.
                </div>
              )}
              
              {hasClients && (
                <div>
                  This service is currently used by {clientCount} {clientCount === 1 ? 'client' : 'clients'}. 
                  Deleting it will affect their service subscriptions.
                </div>
              )}
            </div>
          )}
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
