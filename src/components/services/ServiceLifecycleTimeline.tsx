import React from 'react';
import { format, parseISO } from 'date-fns';
import { ServiceLifecycleHistoryEntry } from '@/types/serviceLifecycle';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  PauseCircle, 
  RefreshCw,
  Archive,
  Loader,
  User,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ServiceLifecycleTimelineProps {
  historyEntries: ServiceLifecycleHistoryEntry[];
  className?: string;
}

// Get icon based on action
const getActionIcon = (action: string) => {
  switch (action) {
    case 'APPROVE':
    case 'ACTIVATE':
    case 'COMPLETE_PROVISION':
    case 'COMPLETE_MAINTENANCE':
    case 'RESOLVE_ISSUE':
    case 'COMPLETE_RENEWAL':
    case 'REACTIVATE':
      return <CheckCircle className="h-4 w-4" />;
    
    case 'REJECT':
    case 'EXPIRE':
    case 'PROCESS_CANCELLATION':
      return <XCircle className="h-4 w-4" />;
    
    case 'REQUEST':
    case 'REQUEST_INFO':
    case 'PROVIDE_INFO':
    case 'REQUEST_RENEWAL':
    case 'PROCESS_RENEWAL':
    case 'REQUEST_CANCELLATION':
      return <Clock className="h-4 w-4" />;
    
    case 'NOTIFY_EXPIRATION':
    case 'FLAG_ISSUE':
      return <AlertCircle className="h-4 w-4" />;
    
    case 'SUSPEND':
      return <PauseCircle className="h-4 w-4" />;
    
    case 'START_MAINTENANCE':
      return <RefreshCw className="h-4 w-4" />;
    
    case 'ARCHIVE':
      return <Archive className="h-4 w-4" />;
    
    case 'START_PROVISION':
    case 'RENEWING':
      return <Loader className="h-4 w-4" />;
    
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

// Get color class based on state
const getStateColorClass = (state: string) => {
  switch (state) {
    case 'ACTIVE':
    case 'READY':
      return 'text-green-500 bg-green-50 border-green-200';
    
    case 'REQUESTED':
    case 'APPROVED':
    case 'PENDING_INFO':
    case 'PENDING_RENEWAL':
      return 'text-blue-500 bg-blue-50 border-blue-200';
    
    case 'WARNING':
    case 'EXPIRING_SOON':
      return 'text-amber-500 bg-amber-50 border-amber-200';
    
    case 'PROVISIONING':
    case 'MAINTENANCE':
    case 'RENEWING':
      return 'text-purple-500 bg-purple-50 border-purple-200';
    
    case 'SUSPENDED':
      return 'text-orange-500 bg-orange-50 border-orange-200';
    
    case 'REJECTED':
    case 'EXPIRED':
    case 'CANCELLING':
      return 'text-red-500 bg-red-50 border-red-200';
    
    case 'ARCHIVED':
      return 'text-gray-500 bg-gray-50 border-gray-200';
    
    default:
      return 'text-gray-500 bg-gray-50 border-gray-200';
  }
};

// Get a readable title for the timeline entry
const getTimelineTitle = (entry: ServiceLifecycleHistoryEntry) => {
  // Format based on action and state
  switch (entry.action) {
    case 'REQUEST':
      return 'Service Requested';
    case 'APPROVE':
      return 'Request Approved';
    case 'REJECT':
      return 'Request Rejected';
    case 'REQUEST_INFO':
      return 'Additional Information Requested';
    case 'PROVIDE_INFO':
      return 'Additional Information Provided';
    case 'START_PROVISION':
      return 'Service Provisioning Started';
    case 'COMPLETE_PROVISION':
      return 'Service Provisioning Completed';
    case 'ACTIVATE':
      return 'Service Activated';
    case 'START_MAINTENANCE':
      return 'Maintenance Started';
    case 'COMPLETE_MAINTENANCE':
      return 'Maintenance Completed';
    case 'FLAG_ISSUE':
      return 'Issue Flagged';
    case 'RESOLVE_ISSUE':
      return 'Issue Resolved';
    case 'NOTIFY_EXPIRATION':
      return 'Expiration Notice Sent';
    case 'REQUEST_RENEWAL':
      return 'Renewal Requested';
    case 'PROCESS_RENEWAL':
      return 'Renewal Processing Started';
    case 'COMPLETE_RENEWAL':
      return 'Renewal Completed';
    case 'REQUEST_CANCELLATION':
      return 'Cancellation Requested';
    case 'PROCESS_CANCELLATION':
      return 'Service Cancelled';
    case 'SUSPEND':
      return 'Service Suspended';
    case 'REACTIVATE':
      return 'Service Reactivated';
    case 'EXPIRE':
      return 'Service Expired';
    case 'ARCHIVE':
      return 'Service Archived';
    default:
      return `${entry.action} - State changed to ${entry.state}`;
  }
};

const ServiceLifecycleTimeline: React.FC<ServiceLifecycleTimelineProps> = ({ 
  historyEntries,
  className = ''
}) => {
  if (!historyEntries || historyEntries.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-muted-foreground">No history available for this service.</p>
      </div>
    );
  }

  return (
    <div className={cn("relative space-y-0", className)}>
      <TooltipProvider>
        {historyEntries.map((entry, index) => {
          const isFirst = index === 0;
          const isLast = index === historyEntries.length - 1;
          const colorClass = getStateColorClass(entry.state);
          
          return (
            <div key={entry.id} className="relative flex items-start mb-6">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute top-5 left-3.5 -bottom-5 w-0.5 bg-gray-200" />
              )}
              
              {/* Timeline dot */}
              <div className={cn(
                "rounded-full border-2 p-1 z-10 mr-4 flex-shrink-0", 
                colorClass
              )}>
                {getActionIcon(entry.action)}
              </div>
              
              {/* Content */}
              <div className="flex flex-col min-w-0 flex-1 pt-1">
                <div className="flex items-center mb-1">
                  <h4 className="text-sm font-medium">
                    {getTimelineTitle(entry)}
                  </h4>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge className={cn("ml-2", colorClass)}>
                        {entry.state}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Service state changed to: {entry.state}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                <div className="flex items-center text-xs text-muted-foreground mb-1">
                  <span className="mr-2">
                    {format(parseISO(entry.timestamp), 'MMM d, yyyy h:mm a')}
                  </span>
                  
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    <span>{entry.performedByRole}</span>
                  </div>
                </div>
                
                {entry.comments && (
                  <div className="mt-1 text-sm p-2 bg-gray-50 rounded-md">
                    {entry.comments}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </TooltipProvider>
    </div>
  );
};

// Badge component for the states
const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <span className={cn("px-2 py-0.5 text-xs rounded-full", className)}>
      {children}
    </span>
  );
};

export default ServiceLifecycleTimeline;
