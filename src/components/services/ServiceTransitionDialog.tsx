import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ServiceLifecycleAction, ServiceLifecycleState, getNextState } from '@/types/serviceLifecycle';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ServiceTransitionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentState: ServiceLifecycleState;
  selectedAction: ServiceLifecycleAction | null;
  onConfirm: (action: ServiceLifecycleAction, comments?: string) => void;
  isTransitioning: boolean;
}

// Create the form schema
const formSchema = z.object({
  comments: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ServiceTransitionDialog: React.FC<ServiceTransitionDialogProps> = ({
  isOpen,
  onOpenChange,
  currentState,
  selectedAction,
  onConfirm,
  isTransitioning,
}) => {
  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comments: '',
    },
  });

  // Calculate the next state
  const nextState = selectedAction ? getNextState(currentState, selectedAction) : null;

  // Get appropriate title for the dialog based on action
  const getDialogTitle = () => {
    if (!selectedAction) return 'Service Transition';

    switch (selectedAction) {
      case 'APPROVE':
        return 'Approve Service Request';
      case 'REJECT':
        return 'Reject Service Request';
      case 'REQUEST_INFO':
        return 'Request Additional Information';
      case 'START_PROVISION':
        return 'Start Service Provisioning';
      case 'COMPLETE_PROVISION':
        return 'Complete Service Provisioning';
      case 'ACTIVATE':
        return 'Activate Service';
      case 'START_MAINTENANCE':
        return 'Start Maintenance';
      case 'COMPLETE_MAINTENANCE':
        return 'Complete Maintenance';
      case 'FLAG_ISSUE':
        return 'Flag Service Issue';
      case 'RESOLVE_ISSUE':
        return 'Resolve Service Issue';
      case 'REQUEST_RENEWAL':
        return 'Request Service Renewal';
      case 'PROCESS_RENEWAL':
        return 'Process Renewal Request';
      case 'COMPLETE_RENEWAL':
        return 'Complete Service Renewal';
      case 'REQUEST_CANCELLATION':
        return 'Request Service Cancellation';
      case 'PROCESS_CANCELLATION':
        return 'Process Cancellation Request';
      case 'SUSPEND':
        return 'Suspend Service';
      case 'REACTIVATE':
        return 'Reactivate Service';
      case 'ARCHIVE':
        return 'Archive Service';
      default:
        return `${selectedAction} Service`;
    }
  };

  // Get appropriate description for the dialog based on action
  const getDialogDescription = () => {
    if (!selectedAction || !nextState) return '';

    return `This will change the service state from ${currentState} to ${nextState}.`;
  };

  // Get color for state badges
  const getStateColor = (state: ServiceLifecycleState) => {
    switch (state) {
      case 'ACTIVE':
      case 'READY':
        return 'bg-green-100 text-green-800';
      case 'REQUESTED':
      case 'APPROVED':
      case 'PENDING_INFO':
      case 'PENDING_RENEWAL':
        return 'bg-blue-100 text-blue-800';
      case 'WARNING':
      case 'EXPIRING_SOON':
        return 'bg-amber-100 text-amber-800';
      case 'PROVISIONING':
      case 'MAINTENANCE':
      case 'RENEWING':
        return 'bg-purple-100 text-purple-800';
      case 'SUSPENDED':
        return 'bg-orange-100 text-orange-800';
      case 'REJECTED':
      case 'EXPIRED':
      case 'CANCELLING':
        return 'bg-red-100 text-red-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    if (selectedAction) {
      onConfirm(selectedAction, values.comments);
    }
  };

  // Reset form when dialog opens or closes
  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  if (!selectedAction || !nextState) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <div className="mt-2 mb-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div className="flex items-center">
              <Badge className={getStateColor(currentState)}>{currentState}</Badge>
              <span className="mx-2">→</span>
              <Badge className={getStateColor(nextState)}>{nextState}</Badge>
            </div>
            <ActionIcon action={selectedAction} />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any comments or details about this transition..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    These comments will be visible in the service history.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isTransitioning}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isTransitioning}>
                {isTransitioning ? 'Processing...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Helper component to display an icon based on the action
const ActionIcon: React.FC<{ action: ServiceLifecycleAction }> = ({ action }) => {
  const positiveActions = [
    'APPROVE',
    'ACTIVATE',
    'COMPLETE_PROVISION',
    'COMPLETE_MAINTENANCE',
    'RESOLVE_ISSUE',
    'COMPLETE_RENEWAL',
    'REACTIVATE',
  ];

  const negativeActions = [
    'REJECT',
    'EXPIRE',
    'PROCESS_CANCELLATION',
    'SUSPEND',
  ];

  const warningActions = [
    'FLAG_ISSUE',
    'NOTIFY_EXPIRATION',
    'START_MAINTENANCE',
  ];

  if (positiveActions.includes(action)) {
    return <CheckCircle className="h-6 w-6 text-green-500" />;
  }

  if (negativeActions.includes(action)) {
    return <XCircle className="h-6 w-6 text-red-500" />;
  }

  if (warningActions.includes(action)) {
    return <AlertCircle className="h-6 w-6 text-amber-500" />;
  }

  return null;
};

export default ServiceTransitionDialog;
