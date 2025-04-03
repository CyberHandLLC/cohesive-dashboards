import React from 'react';
import { ServiceLifecycleState, ServiceLifecycleAction } from '@/types/serviceLifecycle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Loader,
  XCircle,
  PauseCircle,
  Archive,
  AlertTriangle,
} from 'lucide-react';

interface ServiceLifecycleStatusProps {
  state: ServiceLifecycleState;
  validActions: ServiceLifecycleAction[];
  isTransitioning: boolean;
  onActionClick: (action: ServiceLifecycleAction) => void;
  className?: string;
}

// Helper function to get the appropriate icon based on state
const getStateIcon = (state: ServiceLifecycleState) => {
  switch (state) {
    case 'ACTIVE':
      return <CheckCircle className="h-4 w-4" />;
    case 'REQUESTED':
    case 'PENDING_INFO':
    case 'PENDING_RENEWAL':
      return <Clock className="h-4 w-4" />;
    case 'WARNING':
      return <AlertTriangle className="h-4 w-4" />;
    case 'PROVISIONING':
    case 'RENEWING':
      return <Loader className="h-4 w-4" />;
    case 'MAINTENANCE':
      return <RefreshCw className="h-4 w-4" />;
    case 'SUSPENDED':
      return <PauseCircle className="h-4 w-4" />;
    case 'REJECTED':
    case 'EXPIRED':
      return <XCircle className="h-4 w-4" />;
    case 'ARCHIVED':
      return <Archive className="h-4 w-4" />;
    case 'EXPIRING_SOON':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

// Helper function to get the badge variant based on state
const getStateVariant = (state: ServiceLifecycleState) => {
  switch (state) {
    case 'ACTIVE':
    case 'READY':
      return 'success';
    case 'REQUESTED':
    case 'APPROVED':
    case 'PENDING_INFO':
    case 'PENDING_RENEWAL':
      return 'pending';
    case 'WARNING':
    case 'EXPIRING_SOON':
      return 'warning';
    case 'PROVISIONING':
    case 'MAINTENANCE':
    case 'RENEWING':
      return 'maintenance';
    case 'SUSPENDED':
      return 'suspended';
    case 'REJECTED':
    case 'EXPIRED':
    case 'CANCELLED':
    case 'CANCELLING':
      return 'danger';
    case 'ARCHIVED':
      return 'default';
    default:
      return 'default';
  }
};

// Helper function to get a user-friendly title for actions
const getActionTitle = (action: ServiceLifecycleAction) => {
  switch (action) {
    case 'APPROVE': return 'Approve';
    case 'REJECT': return 'Reject';
    case 'REQUEST_INFO': return 'Request Info';
    case 'PROVIDE_INFO': return 'Provide Info';
    case 'START_PROVISION': return 'Start Provisioning';
    case 'COMPLETE_PROVISION': return 'Complete Provisioning';
    case 'ACTIVATE': return 'Activate';
    case 'START_MAINTENANCE': return 'Start Maintenance';
    case 'COMPLETE_MAINTENANCE': return 'Complete Maintenance';
    case 'FLAG_ISSUE': return 'Flag Issue';
    case 'RESOLVE_ISSUE': return 'Resolve Issue';
    case 'NOTIFY_EXPIRATION': return 'Notify Expiration';
    case 'REQUEST_RENEWAL': return 'Request Renewal';
    case 'PROCESS_RENEWAL': return 'Process Renewal';
    case 'COMPLETE_RENEWAL': return 'Complete Renewal';
    case 'REQUEST_CANCELLATION': return 'Request Cancellation';
    case 'PROCESS_CANCELLATION': return 'Process Cancellation';
    case 'SUSPEND': return 'Suspend';
    case 'REACTIVATE': return 'Reactivate';
    case 'EXPIRE': return 'Expire';
    case 'ARCHIVE': return 'Archive';
    default: return action;
  }
};

// Custom CSS classes for different variants
const variantClasses = {
  success: 'bg-green-100 text-green-800 hover:bg-green-200',
  pending: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  warning: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  maintenance: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  suspended: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  danger: 'bg-red-100 text-red-800 hover:bg-red-200',
  default: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
};

const ServiceLifecycleStatus: React.FC<ServiceLifecycleStatusProps> = ({
  state,
  validActions,
  isTransitioning,
  onActionClick,
  className = '',
}) => {
  const variant = getStateVariant(state);
  const icon = getStateIcon(state);

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center mb-4">
        <Badge 
          variant="outline"
          className={`flex items-center space-x-1 px-3 py-1 ${variantClasses[variant as keyof typeof variantClasses]}`}
        >
          {icon}
          <span className="ml-1">{state}</span>
        </Badge>
        {isTransitioning && (
          <div className="ml-2 flex items-center text-sm text-muted-foreground">
            <Loader className="h-3 w-3 animate-spin mr-1" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {validActions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <TooltipProvider>
            {validActions.map((action) => (
              <Tooltip key={action}>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isTransitioning}
                    onClick={() => onActionClick(action)}
                  >
                    {getActionTitle(action)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Change service state with action: {action}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      )}
    </div>
  );
};

export default ServiceLifecycleStatus;
