
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useStaffTasks } from '@/hooks/staff/useStaffTasks';

// Import the new components
import StaffPerformanceCards from '@/components/staff/StaffPerformanceCards';
import StaffList from '@/components/staff/StaffList';
import StaffAddDialog from '@/components/staff/StaffAddDialog';
import StaffEditDialog from '@/components/staff/StaffEditDialog';
import StaffSearchBar from '@/components/staff/StaffSearchBar';
import TaskAssignmentDialog from '@/components/staff/TaskAssignmentDialog';
import StaffPerformanceSummary from '@/components/staff/StaffPerformanceSummary';

interface StaffMember {
  id: string;
  userId: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  title: string | null;
  department: string | null;
  bio: string | null;
  skills: string[] | null;
  hireDate: string | null;
  createdAt: string;
}

const StaffManagementPage = () => {
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isAssignTaskDialogOpen, setIsAssignTaskDialogOpen] = useState<boolean>(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<any[]>([]);
  const { toast } = useToast();
  const { createTask } = useStaffTasks();

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Staff Management' }
  ];

  useEffect(() => {
    fetchStaffMembers();
    fetchStaffPerformance();
  }, [searchQuery]);

  const fetchStaffMembers = async () => {
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('Staff')
        .select(`
          id, 
          userId, 
          title, 
          department, 
          bio, 
          skills, 
          hireDate, 
          createdAt,
          user:userId (
            firstName,
            lastName,
            email
          )
        `)
        .order('createdAt', { ascending: false });
      
      if (searchQuery) {
        query = query.or(`user.firstName.ilike.%${searchQuery}%,user.lastName.ilike.%${searchQuery}%,user.email.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching staff members:', error);
        toast({
          title: "Error fetching staff members",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setStaffMembers(data || []);
      }
    } catch (error: any) {
      console.error('Error in staff fetch operation:', error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffPerformance = async () => {
    try {
      // For each staff member, fetch their performance metrics
      const performanceData = await Promise.all(staffMembers.map(async (staff) => {
        // Fetch resolved tickets count
        const { data: resolvedTickets, error: ticketsError } = await supabase
          .from('SupportTicket')
          .select('id', { count: 'exact' })
          .eq('staffId', staff.userId)
          .eq('status', 'RESOLVED');
          
        if (ticketsError) throw ticketsError;
        
        // Fetch completed tasks count
        const { data: completedTasks, error: tasksError } = await supabase
          .from('Task')
          .select('id', { count: 'exact' })
          .eq('userId', staff.userId)
          .eq('status', 'COMPLETED');
          
        if (tasksError) throw tasksError;
        
        return {
          id: staff.id,
          userId: staff.userId,
          name: `${staff.user.firstName || ''} ${staff.user.lastName || ''}`.trim() || staff.user.email,
          ticketsResolved: resolvedTickets?.length || 0,
          tasksCompleted: completedTasks?.length || 0,
          efficiency: Math.floor(Math.random() * 40) + 60 // Mock data for efficiency rating
        };
      }));
      
      setStaffPerformance(performanceData);
      
    } catch (error) {
      console.error('Error fetching staff performance:', error);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const { data: staffUsers, error: staffError } = await supabase
        .from('User')
        .select('id, firstName, lastName, email')
        .eq('role', 'STAFF');
      
      if (staffError) throw staffError;

      const { data: existingStaff, error: existingStaffError } = await supabase
        .from('Staff')
        .select('userId');
      
      if (existingStaffError) throw existingStaffError;

      const existingUserIds = existingStaff?.map(staff => staff.userId) || [];
      const availableUsersData = staffUsers?.filter(user => !existingUserIds.includes(user.id)) || [];
      
      setAvailableUsers(availableUsersData);
    } catch (error: any) {
      console.error('Error fetching available users:', error);
      toast({
        title: "Error",
        description: "Failed to load available users",
        variant: "destructive"
      });
    }
  };

  const handleAddStaff = async (values: any) => {
    try {
      const skillsArray = values.skills ? values.skills.split(',').map((skill: string) => skill.trim()) : null;
      
      const { data, error } = await supabase
        .from('Staff')
        .insert({
          userId: values.userId,
          title: values.title || null,
          department: values.department || null,
          bio: values.bio || null,
          skills: skillsArray,
          hireDate: values.hireDate || null,
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Staff member added successfully",
        variant: "default"
      });
      
      setIsAddDialogOpen(false);
      fetchStaffMembers();
    } catch (error: any) {
      console.error('Error adding staff member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add staff member",
        variant: "destructive"
      });
    }
  };

  const handleEditStaff = async (values: any) => {
    if (!selectedStaff) return;
    
    try {
      const skillsArray = values.skills ? values.skills.split(',').map((skill: string) => skill.trim()) : null;
      
      const { error } = await supabase
        .from('Staff')
        .update({
          title: values.title || null,
          department: values.department || null,
          bio: values.bio || null,
          skills: skillsArray,
          hireDate: values.hireDate || null,
        })
        .eq('id', selectedStaff.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Staff member updated successfully",
        variant: "default"
      });
      
      setIsEditDialogOpen(false);
      setSelectedStaff(null);
      fetchStaffMembers();
    } catch (error: any) {
      console.error('Error updating staff member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update staff member",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      try {
        const { error } = await supabase
          .from('Staff')
          .delete()
          .eq('id', staffId);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: "Success",
          description: "Staff member deleted successfully",
          variant: "default"
        });
        
        fetchStaffMembers();
      } catch (error: any) {
        console.error('Error deleting staff member:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete staff member",
          variant: "destructive"
        });
      }
    }
  };

  const handleAssignTask = async (taskData: any) => {
    const success = await createTask(taskData);
    if (success) {
      toast({
        title: "Success",
        description: "Task assigned successfully",
        variant: "default"
      });
      setIsAssignTaskDialogOpen(false);
    }
  };

  const handleViewStaff = (staff: StaffMember) => {
    navigate(`/admin/accounts/staff/${staff.id}`);
  };

  const openAddDialog = () => {
    fetchAvailableUsers();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsEditDialogOpen(true);
  };

  const openAssignTaskDialog = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsAssignTaskDialogOpen(true);
  };

  const handlePerformanceStaffSelect = (staffId: string) => {
    const staffMember = staffMembers.find(s => s.id === staffId);
    if (staffMember) setSelectedStaff(staffMember);
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <StaffSearchBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddClick={openAddDialog}
          onAssignTaskClick={() => setIsAssignTaskDialogOpen(true)}
        />
        
        <Tabs defaultValue="staff_list">
          <TabsList>
            <TabsTrigger value="staff_list">Staff List</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="staff_list" className="space-y-4 py-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Staff Management</CardTitle>
              </CardHeader>
              <CardContent>
                <StaffList 
                  staffMembers={staffMembers}
                  isLoading={isLoading}
                  searchQuery={searchQuery}
                  onView={handleViewStaff}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteStaff}
                  onAssignTask={openAssignTaskDialog}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4 py-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Staff Performance</CardTitle>
                <CardDescription>Key performance metrics for staff members</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <p>Loading performance data...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {selectedStaff ? (
                      <StaffPerformanceSummary userId={selectedStaff.userId} />
                    ) : (
                      <StaffPerformanceCards 
                        staffPerformance={staffPerformance}
                        onSelectStaff={handlePerformanceStaffSelect}
                      />
                    )}
                    
                    {selectedStaff && (
                      <div className="flex justify-start">
                        <Button variant="outline" onClick={() => setSelectedStaff(null)}>
                          Back to Overview
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <StaffAddDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddStaff}
        availableUsers={availableUsers}
      />
      
      <StaffEditDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEditStaff}
        selectedStaff={selectedStaff}
      />

      <TaskAssignmentDialog 
        open={isAssignTaskDialogOpen}
        onOpenChange={setIsAssignTaskDialogOpen}
        onSubmit={handleAssignTask}
        staff={staffMembers}
        selectedStaffId={selectedStaff?.userId}
      />
    </DashboardLayout>
  );
};

export default StaffManagementPage;
