
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription, 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Edit, Calendar, Briefcase, Users, MessageSquare } from 'lucide-react';

interface StaffMember {
  id: string;
  userId: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
    status: string;
  };
  title: string | null;
  department: string | null;
  bio: string | null;
  skills: string[] | null;
  hireDate: string | null;
  createdAt: string;
  notes: string | null;
}

interface Client {
  id: string;
  companyName: string;
  industry: string | null;
  status: string;
}

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  client: {
    companyName: string;
  } | null;
}

interface Task {
  id: string;
  title: string;
  progress: number;
  dueDate: string | null;
}

const StaffDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [assignedClients, setAssignedClients] = useState<Client[]>([]);
  const [supportTickets, setSupportTickets] = useState<Ticket[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingRelations, setIsLoadingRelations] = useState<boolean>(true);
  const { toast } = useToast();

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Staff', href: '/admin/accounts/staff' },
    { label: 'Staff Details' }
  ];

  useEffect(() => {
    const fetchStaffDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('Staff')
          .select(`
            *,
            user:userId (
              firstName,
              lastName,
              email,
              role,
              status
            )
          `)
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setStaffMember(data as StaffMember);
          await fetchRelatedData(data.userId);
        }
      } catch (error: any) {
        console.error('Error fetching staff details:', error);
        toast({
          title: "Error loading staff details",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStaffDetails();
  }, [id, toast]);

  const fetchRelatedData = async (userId: string) => {
    setIsLoadingRelations(true);
    try {
      // Fetch clients where this staff member is the account manager
      const { data: clientsData, error: clientsError } = await supabase
        .from('Client')
        .select('id, companyName, industry, status')
        .eq('accountManagerId', userId);
      
      if (clientsError) {
        throw clientsError;
      }
      
      setAssignedClients(clientsData || []);
      
      // Fetch support tickets assigned to this staff member
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('SupportTicket')
        .select(`
          id, 
          title, 
          status, 
          priority, 
          createdAt,
          client:clientId (
            companyName
          )
        `)
        .eq('staffId', id);
      
      if (ticketsError) {
        throw ticketsError;
      }
      
      setSupportTickets(ticketsData || []);
      
      // For demo purposes, we'll use the mock tasks since there's no actual tasks table
      // In a real application, you would fetch tasks from your database
      setTasks([
        { id: '1', title: 'Project Alpha Completion', progress: 75, dueDate: '2023-07-15' },
        { id: '2', title: 'Client Onboarding', progress: 50, dueDate: '2023-07-20' },
        { id: '3', title: 'Bug Fixes', progress: 90, dueDate: '2023-07-10' },
      ]);
      
    } catch (error: any) {
      console.error('Error fetching related data:', error);
      toast({
        title: "Error loading related data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoadingRelations(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const handleEditStaff = () => {
    // Navigate to edit staff page or open edit modal
    navigate(`/admin/accounts/staff/${id}/edit`);
  };

  const handleBackClick = () => {
    navigate('/admin/accounts/staff');
  };

  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbs={breadcrumbs}
        role="admin"
      >
        <div className="flex justify-center items-center h-64">
          <p>Loading staff details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!staffMember) {
    return (
      <DashboardLayout
        breadcrumbs={breadcrumbs}
        role="admin"
      >
        <Card>
          <CardContent className="flex flex-col items-center py-10">
            <h2 className="text-xl font-semibold mb-2">Staff member not found</h2>
            <p className="text-muted-foreground mb-6">The requested staff member does not exist or has been removed.</p>
            <Button onClick={handleBackClick}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Staff List
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleBackClick}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={handleEditStaff}>
            <Edit className="mr-2 h-4 w-4" /> Edit Staff
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">
                  {staffMember.user.firstName && staffMember.user.lastName
                    ? `${staffMember.user.firstName} ${staffMember.user.lastName}`
                    : staffMember.user.firstName || staffMember.user.lastName || 'No name provided'}
                </CardTitle>
                <CardDescription>{staffMember.title || 'No title specified'}</CardDescription>
              </div>
              <Badge>{staffMember.user.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{staffMember.user.email}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Department</p>
                <p>{staffMember.department || 'Not specified'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Hire Date</p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p>{staffMember.hireDate ? formatDate(staffMember.hireDate) : 'Not specified'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p>{formatDate(staffMember.createdAt)}</p>
                </div>
              </div>
            </div>

            {staffMember.bio && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Bio</p>
                <p className="text-sm">{staffMember.bio}</p>
              </div>
            )}

            {staffMember.skills && staffMember.skills.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {staffMember.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="assigned_clients">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="assigned_clients">
              <Users className="h-4 w-4 mr-2" /> Assigned Clients
            </TabsTrigger>
            <TabsTrigger value="tickets">
              <MessageSquare className="h-4 w-4 mr-2" /> Support Tickets
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <Briefcase className="h-4 w-4 mr-2" /> Tasks
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assigned_clients">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Clients</CardTitle>
                <CardDescription>Clients this staff member is managing</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRelations ? (
                  <div className="text-center py-10">Loading assigned clients...</div>
                ) : assignedClients.length > 0 ? (
                  <div className="grid gap-4">
                    {assignedClients.map((client) => (
                      <div key={client.id} className="border rounded-md p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{client.companyName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {client.industry || 'No industry specified'}
                            </p>
                          </div>
                          <Badge variant={client.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {client.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    No clients assigned to this staff member yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>Tickets assigned to this staff member</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRelations ? (
                  <div className="text-center py-10">Loading support tickets...</div>
                ) : supportTickets.length > 0 ? (
                  <div className="grid gap-4">
                    {supportTickets.map((ticket) => (
                      <div key={ticket.id} className="border rounded-md p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{ticket.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {ticket.client?.companyName || 'No client'} • {formatDate(ticket.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={ticket.status === 'OPEN' ? 'default' : ticket.status === 'IN_PROGRESS' ? 'secondary' : 'outline'}>
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant={ticket.priority === 'HIGH' ? 'destructive' : ticket.priority === 'MEDIUM' ? 'default' : 'outline'}>
                              {ticket.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    No support tickets assigned to this staff member yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tasks</CardTitle>
                    <CardDescription>Tasks assigned to this staff member</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingRelations ? (
                  <div className="text-center py-10">Loading tasks...</div>
                ) : tasks.length > 0 ? (
                  <div className="space-y-6">
                    {tasks.map((task) => (
                      <div key={task.id}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">{task.title}</p>
                          <div className="flex items-center gap-4">
                            <p className="text-sm text-muted-foreground">{task.progress}%</p>
                            {task.dueDate && (
                              <p className="text-xs text-muted-foreground">
                                Due: {formatDate(task.dueDate)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    No tasks assigned to this staff member yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StaffDetailsPage;
