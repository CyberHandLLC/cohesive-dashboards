
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

const StaffDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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
                <div className="text-center py-10 text-muted-foreground">
                  No clients assigned to this staff member yet
                </div>
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
                <div className="text-center py-10 text-muted-foreground">
                  No support tickets assigned to this staff member yet
                </div>
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
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Project Alpha Completion</p>
                      <p className="text-sm text-muted-foreground">75%</p>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Client Onboarding</p>
                      <p className="text-sm text-muted-foreground">50%</p>
                    </div>
                    <Progress value={50} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Bug Fixes</p>
                      <p className="text-sm text-muted-foreground">90%</p>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StaffDetailsPage;
