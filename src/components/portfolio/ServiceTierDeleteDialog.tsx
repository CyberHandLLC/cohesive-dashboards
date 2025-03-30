
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
import { ServiceTier } from '@/hooks/useServiceTiers';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ServiceTierDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: ServiceTier | null;
  onConfirm: () => void;
  clientCount?: number;
}

export function ServiceTierDeleteDialog({
  open,
  onOpenChange,
  tier,
  onConfirm,
  clientCount = 0,
}: ServiceTierDeleteDialogProps) {
  if (!tier) return null;

  const hasClients = clientCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Delete Service Tier
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete the tier "{tier.name}"? This action cannot be undone.
            </p>
            
            {hasClients && (
              <div className="mt-2 p-3 bg-destructive/10 rounded-md text-destructive font-medium">
                <p>
                  Warning: This tier is currently used by {clientCount} {clientCount === 1 ? 'client' : 'clients'}. 
                  Deleting it will affect their service subscriptions.
                </p>
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
