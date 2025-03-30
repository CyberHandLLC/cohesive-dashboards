
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  User,
  Mail,
  Shield,
  Calendar,
  Building,
  ClipboardCheck,
  Trash2,
  Edit,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUsers, User as UserType, UserRole } from '@/hooks/users/useUsers';
import UserRoleBadge from '@/components/users/UserRoleBadge';
import UserStatusBadge from '@/components/users/UserStatusBadge';
import UserEditDialog from '@/components/users/UserEditDialog';
import { supabase } from '@/integrations/supabase/client';

const UserDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(true);
  const { toast } = useToast();
  const { getUserById, editUser, deleteUser } = useUsers();

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Users', href: '/admin/accounts/users' },
    { label: user?.email || 'User Details' }
  ];

  useEffect(() => {
    if (id) {
      fetchUserDetails();
      fetchAuditLogs();
    }
  }, [id]);

  const fetchUserDetails = async () => {
    if (!id) return;
    
    setIsLoading(true);
    const userData = await getUserById(id);
    setUser(userData);
    setIsLoading(false);
  };

  const fetchAuditLogs = async () => {
    if (!id) return;
    
    setIsLoadingAuditLogs(true);
    try {
      const { data, error } = await supabase
        .from('AuditLog')
        .select('*')
        .eq('userId', id)
        .order('timestamp', { ascending: false })
        .limit(20);
        
      if (error) {
        throw error;
      }
      
      setAuditLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error loading audit logs",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoadingAuditLogs(false);
    }
  };

  const handleEdit = async (userData: any) => {
    if (!id || !user) return;
    
    const success = await editUser(id, userData);
    if (success) {
      setIsEditDialogOpen(false);
      fetchUserDetails();
      toast({
        title: "User updated",
        description: "User details have been updated successfully",
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    const success = await deleteUser(id);
    if (success) {
      toast({
        title: "User deleted",
        description: "User has been permanently removed",
      });
      navigate('/admin/accounts/users');
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatLogAction = (log: any) => {
    const action = log.action || 'UNKNOWN';
    const resource = log.resource || 'UNKNOWN';
    const status = log.status || 'UNKNOWN';
    
    let message = `${action} on ${resource}`;
    if (status === 'FAILED') {
      message += ' (Failed)';
    }
    
    return message;
  };

  if (isLoading) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs} role="admin">
        <div className="flex justify-center py-8">
          <p>Loading user details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs} role="admin">
        <Card>
          <CardHeader>
            <CardTitle>User not found</CardTitle>
            <CardDescription>The user you are looking for does not exist or has been deleted.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate('/admin/accounts/users')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
            </Button>
          </CardFooter>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate('/admin/accounts/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit User
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete User
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email}
                </CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
              <div className="flex space-x-2">
                <UserRoleBadge role={user.role} />
                <UserStatusBadge status={user.status} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                  <span className="ml-2">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.firstName || user.lastName || 'Not provided'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{user.email}</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Role:</span>
                  <span className="ml-2"><UserRoleBadge role={user.role} /></span>
                </div>
                <div className="flex items-center">
                  <ClipboardCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Status:</span>
                  <span className="ml-2"><UserStatusBadge status={user.status} /></span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <ClipboardCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Email Verified:</span>
                  <span className="ml-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      user.emailVerified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.emailVerified ? 'Yes' : 'No'}
                    </span>
                  </span>
                </div>
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Client:</span>
                  <span className="ml-2">
                    {user.client?.companyName || 
                      (user.role === 'CLIENT' && !user.clientId ? 
                        <span className="text-amber-600">Not assigned</span> : 
                        'N/A')}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Created:</span>
                  <span className="ml-2">{formatDate(user.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Updated:</span>
                  <span className="ml-2">{formatDate(user.updatedAt)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="activity">
          <TabsList>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            {user.role === 'STAFF' && (
              <TabsTrigger value="staff">Staff Details</TabsTrigger>
            )}
            {user.role === 'CLIENT' && (
              <TabsTrigger value="client">Client Details</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Recent actions performed by or on this user account</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAuditLogs ? (
                  <div className="text-center py-4">Loading activity logs...</div>
                ) : auditLogs.length > 0 ? (
                  <div className="space-y-4">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="border-b pb-3">
                        <div className="flex justify-between">
                          <div className="font-medium">{formatLogAction(log)}</div>
                          <div className="text-muted-foreground text-sm">
                            {formatDate(log.timestamp)}
                          </div>
                        </div>
                        {log.details && (
                          <div className="text-sm mt-1 text-muted-foreground">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No activity logs found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage account security and authentication</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Button variant="outline">Reset Password</Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Send a password reset email to this user
                    </p>
                  </div>
                  <div className="border-t pt-4">
                    <Button variant={user.emailVerified ? "outline" : "default"}>
                      {user.emailVerified ? "Unverify Email" : "Verify Email"}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      {user.emailVerified 
                        ? "Mark this user's email as unverified" 
                        : "Mark this user's email as verified"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {user.role === 'STAFF' && (
            <TabsContent value="staff" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Staff Details</CardTitle>
                  <CardDescription>Staff-specific information and assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Staff details will be displayed here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          {user.role === 'CLIENT' && (
            <TabsContent value="client" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Details</CardTitle>
                  <CardDescription>Client-specific information and services</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Client details will be displayed here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <UserEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEdit}
        user={user}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default UserDetailsPage;
