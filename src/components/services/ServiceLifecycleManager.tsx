import React, { useState } from 'react';
import { useServiceLifecycle } from '@/hooks/useServiceLifecycle';
import { ServiceLifecycleAction, ServiceLifecycleState } from '@/types/serviceLifecycle';
import ServiceLifecycleStatus from './ServiceLifecycleStatus';
import ServiceLifecycleTimeline from './ServiceLifecycleTimeline';
import ServiceTransitionDialog from './ServiceTransitionDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { LayoutGrid, Clock, CalendarClock, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ServiceLifecycleManagerProps {
  clientServiceId: string;
  serviceName: string;
  clientName?: string;
}

const ServiceLifecycleManager: React.FC<ServiceLifecycleManagerProps> = ({
  clientServiceId,
  serviceName,
  clientName,
}) => {
  const [selectedAction, setSelectedAction] = useState<ServiceLifecycleAction | null>(null);
  const [isTransitionDialogOpen, setIsTransitionDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const {
    currentState,
    historyData,
    eventsData,
    tasksData,
    isLoading,
    isTransitioning,
    error,
    validActions,
    performTransition,
    completeEvent,
    completeTask
  } = useServiceLifecycle({ 
    clientServiceId 
  });

  const handleActionClick = (action: ServiceLifecycleAction) => {
    setSelectedAction(action);
    setIsTransitionDialogOpen(true);
  };

  const handleTransitionConfirm = (action: ServiceLifecycleAction, comments?: string) => {
    performTransition({ action, comments });
    setIsTransitionDialogOpen(false);
  };

  const handleCompleteEvent = (eventId: string) => {
    completeEvent({ eventId });
  };

  const handleCompleteTask = (taskId: string) => {
    completeTask({ taskId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading service lifecycle information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md">
        <h3 className="text-red-800 font-medium mb-2">Error Loading Service Lifecycle</h3>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  if (!currentState) {
    return (
      <div className="p-4 border border-amber-200 bg-amber-50 rounded-md">
        <h3 className="text-amber-800 font-medium mb-2">Service Lifecycle Not Found</h3>
        <p className="text-amber-600">Could not determine the current lifecycle state for this service.</p>
      </div>
    );
  }

  // Get the latest history entry
  const latestHistoryEntry = historyData && historyData.length > 0 ? historyData[0] : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{serviceName}</CardTitle>
              {clientName && (
                <CardDescription>Client: {clientName}</CardDescription>
              )}
            </div>
            <ServiceLifecycleStatus
              state={currentState}
              validActions={validActions}
              isTransitioning={isTransitioning}
              onActionClick={handleActionClick}
            />
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Clock className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <CalendarClock className="h-4 w-4 mr-2" />
            Scheduled Events
            {eventsData && eventsData.length > 0 && (
              <Badge variant="secondary" className="ml-2">{eventsData.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckCircle className="h-4 w-4 mr-2" />
            Tasks
            {tasksData && tasksData.length > 0 && (
              <Badge variant="secondary" className="ml-2">{tasksData.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service Lifecycle Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current State</p>
                  <ServiceLifecycleStatus
                    state={currentState}
                    validActions={[]}
                    isTransitioning={isTransitioning}
                    onActionClick={() => {}}
                  />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-muted-foreground">
                    {latestHistoryEntry ? (
                      format(parseISO(latestHistoryEntry.timestamp), 'PPpp')
                    ) : (
                      'No history available'
                    )}
                  </p>
                </div>
                
                {latestHistoryEntry?.performedByRole && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Last Updated By</p>
                    <p className="text-muted-foreground">
                      {latestHistoryEntry.performedByRole}
                    </p>
                  </div>
                )}
                
                {eventsData && eventsData.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Upcoming Events</p>
                    <p className="text-muted-foreground">
                      {eventsData.length} scheduled event{eventsData.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Recent History */}
              {historyData && historyData.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Recent Activity</h4>
                  <ServiceLifecycleTimeline
                    historyEntries={historyData.slice(0, 3)}
                  />
                  {historyData.length > 3 && (
                    <Button
                      variant="link"
                      className="mt-2 p-0 h-auto"
                      onClick={() => setActiveTab('timeline')}
                    >
                      View Full Timeline
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service Lifecycle Timeline</CardTitle>
              <CardDescription>
                Complete history of state changes and actions taken on this service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceLifecycleTimeline
                historyEntries={historyData || []}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scheduled Events</CardTitle>
              <CardDescription>
                Upcoming service lifecycle events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(!eventsData || eventsData.length === 0) ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No scheduled events for this service.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {eventsData.map(event => (
                    <div
                      key={event.id}
                      className="flex items-start justify-between p-4 border rounded-md"
                    >
                      <div>
                        <div className="flex items-center mb-1">
                          <h4 className="font-medium">{event.action}</h4>
                          <Badge className="ml-2">
                            {event.state}
                          </Badge>
                          {event.priority === 'HIGH' || event.priority === 'URGENT' ? (
                            <Badge variant="destructive" className="ml-2">
                              {event.priority}
                            </Badge>
                          ) : null}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {event.scheduledTime ? (
                            <>Scheduled for: {format(parseISO(event.scheduledTime), 'PPp')}</>
                          ) : (
                            <>Not scheduled</>
                          )}
                        </div>
                        
                        {event.assignedTo && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Assigned to staff
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Button
                          size="sm"
                          onClick={() => handleCompleteEvent(event.id)}
                        >
                          Complete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service Tasks</CardTitle>
              <CardDescription>
                Tasks associated with this service
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(!tasksData || tasksData.length === 0) ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No pending tasks for this service.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasksData.map(task => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between p-4 border rounded-md"
                    >
                      <div>
                        <div className="flex items-center mb-1">
                          <h4 className="font-medium">{task.title}</h4>
                          {task.priority === 'HIGH' || task.priority === 'URGENT' ? (
                            <Badge variant="destructive" className="ml-2">
                              {task.priority}
                            </Badge>
                          ) : (
                            <Badge className="ml-2">
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                        
                        {task.description && (
                          <p className="text-sm mb-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="text-xs text-muted-foreground">
                          {task.dueDate ? (
                            <>Due: {format(parseISO(task.dueDate), 'PPp')}</>
                          ) : (
                            <>No due date</>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Button
                          size="sm"
                          onClick={() => handleCompleteTask(task.id)}
                        >
                          Complete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ServiceTransitionDialog
        isOpen={isTransitionDialogOpen}
        onOpenChange={setIsTransitionDialogOpen}
        currentState={currentState}
        selectedAction={selectedAction}
        onConfirm={handleTransitionConfirm}
        isTransitioning={isTransitioning}
      />
    </div>
  );
};

export default ServiceLifecycleManager;
