
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

interface ServiceTierDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: ServiceTier | null;
  onConfirm: () => void;
}

export function ServiceTierDeleteDialog({
  open,
  onOpenChange,
  tier,
  onConfirm,
}: ServiceTierDeleteDialogProps) {
  if (!tier) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Service Tier</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the tier "{tier.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
