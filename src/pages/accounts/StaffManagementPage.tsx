import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Eye, Edit, Trash2, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';

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
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const { toast } = useToast();

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Staff Management' }
  ];

  const form = useForm({
    defaultValues: {
      userId: '',
      title: '',
      department: '',
      bio: '',
      skills: '',
      hireDate: '',
    },
  });

  useEffect(() => {
    fetchStaffMembers();
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
      form.reset();
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
      form.reset();
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

  const handleViewStaff = (staff: StaffMember) => {
    navigate(`/admin/accounts/staff/${staff.id}`);
  };

  const openAddDialog = () => {
    fetchAvailableUsers();
    form.reset({
      userId: '',
      title: '',
      department: '',
      bio: '',
      skills: '',
      hireDate: '',
    });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (staff: StaffMember) => {
    setSelectedStaff(staff);
    form.reset({
      userId: staff.userId,
      title: staff.title || '',
      department: staff.department || '',
      bio: staff.bio || '',
      skills: staff.skills ? staff.skills.join(', ') : '',
      hireDate: staff.hireDate ? new Date(staff.hireDate).toISOString().split('T')[0] : '',
    });
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff members..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={openAddDialog} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Staff
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Staff Management</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading staff members...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Hire Date</TableHead>
                      <TableHead>Skills</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffMembers.length > 0 ? (
                      staffMembers.map((staff) => (
                        <TableRow 
                          key={staff.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewStaff(staff)}
                        >
                          <TableCell>
                            {staff.user.firstName && staff.user.lastName
                              ? `${staff.user.firstName} ${staff.user.lastName}`
                              : staff.user.firstName || staff.user.lastName || 'No name provided'}
                          </TableCell>
                          <TableCell>{staff.user.email}</TableCell>
                          <TableCell>{staff.title || 'Not specified'}</TableCell>
                          <TableCell>{staff.department || 'Not specified'}</TableCell>
                          <TableCell>{staff.hireDate ? formatDate(staff.hireDate) : 'Not specified'}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {staff.skills ? (
                                staff.skills.map((skill, index) => (
                                  <Badge key={index} variant="outline">{skill}</Badge>
                                ))
                              ) : (
                                'No skills listed'
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(staff);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteStaff(staff.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                          {searchQuery ? 'No staff members match your search criteria' : 'No staff members found'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>
              Create a new staff member record. Select a user with STAFF role.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddStaff)} className="space-y-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName || user.lastName ? 
                              `${user.firstName || ''} ${user.lastName || ''} (${user.email})` : 
                              user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select an existing user with STAFF role
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Senior Developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Engineering" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief bio..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. React, TypeScript, Node.js (comma-separated)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hire Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Staff</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member information.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditStaff)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Senior Developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Engineering" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief bio..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. React, TypeScript, Node.js (comma-separated)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hire Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Staff</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StaffManagementPage;
