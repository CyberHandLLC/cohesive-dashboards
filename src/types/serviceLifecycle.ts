/**
 * Service Lifecycle State Machine
 * 
 * This module defines types for the service lifecycle state machine, 
 * which tracks services from initial request through activation, 
 * maintenance, and eventual renewal or expiration.
 */

/**
 * All possible states in the service lifecycle
 */
export type ServiceLifecycleState = 
  // Initial states
  | 'REQUESTED'     // Client has requested the service
  | 'APPROVED'      // Admin has approved the service request
  | 'REJECTED'      // Admin has rejected the service request
  | 'PENDING_INFO'  // Waiting for additional information from client
  
  // Provisioning states
  | 'PROVISIONING'  // Service is being set up
  | 'READY'         // Service is ready for activation
  
  // Active states
  | 'ACTIVE'        // Service is active and in good standing
  | 'MAINTENANCE'   // Service is temporarily under maintenance
  | 'WARNING'       // Service has issues that need attention
  
  // End-of-lifecycle states
  | 'EXPIRING_SOON' // Service is approaching its end date
  | 'PENDING_RENEWAL' // Client has been prompted for renewal
  | 'RENEWING'      // Service is in the process of renewing
  | 'CANCELLING'    // Service is being cancelled by request
  | 'SUSPENDED'     // Service access temporarily suspended (e.g., payment issues)
  | 'EXPIRED'       // Service has reached its end date without renewal
  | 'ARCHIVED';     // Service is no longer active and has been archived

/**
 * Actions that can trigger state transitions
 */
export type ServiceLifecycleAction =
  | 'REQUEST'         // Client requests a service
  | 'APPROVE'         // Admin approves the request
  | 'REJECT'          // Admin rejects the request
  | 'REQUEST_INFO'    // Admin requests more information
  | 'PROVIDE_INFO'    // Client provides requested information
  | 'START_PROVISION' // Begin provisioning the service
  | 'COMPLETE_PROVISION' // Finish provisioning, ready for activation
  | 'ACTIVATE'        // Activate the service for client use
  | 'START_MAINTENANCE' // Put service into maintenance mode
  | 'COMPLETE_MAINTENANCE' // Complete maintenance and restore service
  | 'FLAG_ISSUE'      // Flag a problem with the service
  | 'RESOLVE_ISSUE'   // Resolve a previously flagged issue
  | 'NOTIFY_EXPIRATION' // Notify client about upcoming expiration
  | 'REQUEST_RENEWAL' // Client requests to renew the service
  | 'PROCESS_RENEWAL' // Admin processes the renewal
  | 'COMPLETE_RENEWAL' // Complete the renewal process
  | 'REQUEST_CANCELLATION' // Client requests to cancel the service
  | 'PROCESS_CANCELLATION' // Admin processes the cancellation
  | 'SUSPEND'         // Suspend the service (typically due to payment issues)
  | 'REACTIVATE'      // Reactivate a suspended service
  | 'EXPIRE'          // Let the service expire
  | 'ARCHIVE';        // Archive an expired or cancelled service

/**
 * Transition rule defines what happens when an action is applied to a state
 */
export interface ServiceLifecycleTransition {
  from: ServiceLifecycleState;
  action: ServiceLifecycleAction;
  to: ServiceLifecycleState;
  requiredRole: 'ADMIN' | 'STAFF' | 'CLIENT' | 'SYSTEM';
  automaticNextAction?: ServiceLifecycleAction;
  notifyRoles?: Array<'ADMIN' | 'STAFF' | 'CLIENT'>;
}

/**
 * Service lifecycle history entry
 */
export interface ServiceLifecycleHistoryEntry {
  id: string;
  clientServiceId: string;
  state: ServiceLifecycleState;
  action: ServiceLifecycleAction;
  performedBy: string; // User ID
  performedByRole: 'ADMIN' | 'STAFF' | 'CLIENT' | 'SYSTEM';
  comments?: string;
  timestamp: string;
}

/**
 * Service lifecycle event with additional metadata
 */
export interface ServiceLifecycleEvent {
  id: string;
  clientServiceId: string;
  state: ServiceLifecycleState;
  action: ServiceLifecycleAction;
  scheduledTime?: string;
  isCompleted: boolean;
  completedTime?: string;
  assignedTo?: string; // User ID
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notifiedUsers?: string[]; // Array of User IDs
}

/**
 * Service lifecycle task for staff/admin to complete
 */
export interface ServiceLifecycleTask {
  id: string;
  eventId: string;
  title: string;
  description: string;
  assignedTo?: string; // User ID
  dueDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  completedBy?: string; // User ID
  completedAt?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

/**
 * The complete lifecycle transition ruleset
 * Defines all allowed state transitions
 */
export const SERVICE_LIFECYCLE_TRANSITIONS: ServiceLifecycleTransition[] = [
  // Initial Request Flow
  { from: 'REQUESTED', action: 'APPROVE', to: 'APPROVED', requiredRole: 'ADMIN', notifyRoles: ['CLIENT'] },
  { from: 'REQUESTED', action: 'REJECT', to: 'REJECTED', requiredRole: 'ADMIN', notifyRoles: ['CLIENT'] },
  { from: 'REQUESTED', action: 'REQUEST_INFO', to: 'PENDING_INFO', requiredRole: 'ADMIN', notifyRoles: ['CLIENT'] },
  { from: 'PENDING_INFO', action: 'PROVIDE_INFO', to: 'REQUESTED', requiredRole: 'CLIENT', notifyRoles: ['ADMIN'] },
  
  // Provisioning Flow
  { from: 'APPROVED', action: 'START_PROVISION', to: 'PROVISIONING', requiredRole: 'STAFF', notifyRoles: ['CLIENT'] },
  { from: 'PROVISIONING', action: 'COMPLETE_PROVISION', to: 'READY', requiredRole: 'STAFF', notifyRoles: ['ADMIN', 'CLIENT'] },
  
  // Activation Flow
  { from: 'READY', action: 'ACTIVATE', to: 'ACTIVE', requiredRole: 'ADMIN', notifyRoles: ['CLIENT'] },
  
  // Maintenance Flow
  { from: 'ACTIVE', action: 'START_MAINTENANCE', to: 'MAINTENANCE', requiredRole: 'STAFF', notifyRoles: ['CLIENT'] },
  { from: 'MAINTENANCE', action: 'COMPLETE_MAINTENANCE', to: 'ACTIVE', requiredRole: 'STAFF', notifyRoles: ['CLIENT'] },
  { from: 'ACTIVE', action: 'FLAG_ISSUE', to: 'WARNING', requiredRole: 'SYSTEM', notifyRoles: ['ADMIN', 'STAFF'] },
  { from: 'WARNING', action: 'RESOLVE_ISSUE', to: 'ACTIVE', requiredRole: 'STAFF', notifyRoles: ['CLIENT'] },
  
  // Expiration & Renewal Flow
  { from: 'ACTIVE', action: 'NOTIFY_EXPIRATION', to: 'EXPIRING_SOON', requiredRole: 'SYSTEM', notifyRoles: ['CLIENT', 'ADMIN'] },
  { from: 'EXPIRING_SOON', action: 'REQUEST_RENEWAL', to: 'PENDING_RENEWAL', requiredRole: 'CLIENT', notifyRoles: ['ADMIN'] },
  { from: 'PENDING_RENEWAL', action: 'PROCESS_RENEWAL', to: 'RENEWING', requiredRole: 'ADMIN', notifyRoles: ['CLIENT'] },
  { from: 'RENEWING', action: 'COMPLETE_RENEWAL', to: 'ACTIVE', requiredRole: 'ADMIN', notifyRoles: ['CLIENT'] },
  { from: 'EXPIRING_SOON', action: 'EXPIRE', to: 'EXPIRED', requiredRole: 'SYSTEM', notifyRoles: ['CLIENT', 'ADMIN'] },
  
  // Cancellation Flow
  { from: 'ACTIVE', action: 'REQUEST_CANCELLATION', to: 'CANCELLING', requiredRole: 'CLIENT', notifyRoles: ['ADMIN'] },
  { from: 'EXPIRING_SOON', action: 'REQUEST_CANCELLATION', to: 'CANCELLING', requiredRole: 'CLIENT', notifyRoles: ['ADMIN'] },
  { from: 'CANCELLING', action: 'PROCESS_CANCELLATION', to: 'EXPIRED', requiredRole: 'ADMIN', notifyRoles: ['CLIENT'] },
  
  // Suspension Flow
  { from: 'ACTIVE', action: 'SUSPEND', to: 'SUSPENDED', requiredRole: 'ADMIN', notifyRoles: ['CLIENT'] },
  { from: 'SUSPENDED', action: 'REACTIVATE', to: 'ACTIVE', requiredRole: 'ADMIN', notifyRoles: ['CLIENT'] },
  { from: 'SUSPENDED', action: 'EXPIRE', to: 'EXPIRED', requiredRole: 'SYSTEM', notifyRoles: ['CLIENT', 'ADMIN'] },
  
  // Archiving Flow
  { from: 'EXPIRED', action: 'ARCHIVE', to: 'ARCHIVED', requiredRole: 'ADMIN' },
  { from: 'REJECTED', action: 'ARCHIVE', to: 'ARCHIVED', requiredRole: 'ADMIN' },
];

/**
 * Helper function to find valid next states based on current state and user role
 */
export function getValidNextActions(
  currentState: ServiceLifecycleState,
  userRole: 'ADMIN' | 'STAFF' | 'CLIENT'
): ServiceLifecycleAction[] {
  return SERVICE_LIFECYCLE_TRANSITIONS
    .filter(transition => 
      transition.from === currentState && 
      (transition.requiredRole === userRole || 
       (transition.requiredRole === 'STAFF' && userRole === 'ADMIN'))
    )
    .map(transition => transition.action);
}

/**
 * Helper function to determine the next state based on current state and action
 */
export function getNextState(
  currentState: ServiceLifecycleState,
  action: ServiceLifecycleAction
): ServiceLifecycleState | null {
  const transition = SERVICE_LIFECYCLE_TRANSITIONS.find(
    t => t.from === currentState && t.action === action
  );
  
  return transition ? transition.to : null;
}
