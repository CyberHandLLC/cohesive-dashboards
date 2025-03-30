
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UserRoleBadge from '@/components/users/UserRoleBadge';
import UserStatusBadge from '@/components/users/UserStatusBadge';
import { ArrowLeft, Edit, UserCog } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import UserEditDialog from '@/components/users/UserEditDialog';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  emailVerified: boolean;
  clientId?: string;
  securityVersion?: number;
  client?: {
    companyName: string;
  };
  createdAt: string;
  updatedAt?: string;
}

const UserDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Users', href: '/admin/accounts/users' },
    { label: 'User Details' }
  ];
  
  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('User')
          .select(`
            id, 
            email, 
            firstName, 
            lastName, 
            role, 
            status, 
            emailVerified,
            clientId,
            securityVersion,
            createdAt,
            updatedAt,
            client:clientId (
              companyName
            )
          `)
          .eq('id', id)
          .single();
          
        if (error) {
          throw error;
        }
        
        setUser(data);
      } catch (error: any) {
        console.error('Error fetching user:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user details',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, [id, toast]);
  
  const handleEditUser = (userData: any) => {
    if (!user) return;
    
    const updateUser = async () => {
      try {
        // Update user data
        const { error } = await supabase
          .from('User')
          .update({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            status: userData.status,
            emailVerified: userData.emailVerified,
            clientId: userData.clientId === "none" ? null : userData.clientId
          })
          .eq('id', user.id);
          
        if (error) throw error;
        
        // If password was updated
        if (userData.password) {
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: userData.password }
          );
          
          if (passwordError) throw passwordError;
          
          // Increment security version
          await supabase.rpc('increment_security_version', { user_id: user.id });
        }
        
        // Refresh user data
        const { data: refreshedData, error: refreshError } = await supabase
          .from('User')
          .select(`
            id, 
            email, 
            firstName, 
            lastName, 
            role, 
            status, 
            emailVerified,
            clientId,
            securityVersion,
            createdAt,
            updatedAt,
            client:clientId (
              companyName
            )
          `)
          .eq('id', user.id)
          .single();
          
        if (refreshError) throw refreshError;
        
        setUser(refreshedData);
        setIsEditDialogOpen(false);
        
        toast({
          title: 'Success',
          description: 'User updated successfully',
          variant: 'default'
        });
      } catch (error: any) {
        console.error('Error updating user:', error);
        toast({
          title: 'Error',
          description: 'Failed to update user: ' + error.message,
          variant: 'destructive'
        });
      }
    };
    
    updateUser();
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };
  
  const getUserInitials = () => {
    if (!user) return '??';
    
    const firstInitial = user.firstName ? user.firstName.charAt(0).toUpperCase() : '';
    const lastInitial = user.lastName ? user.lastName.charAt(0).toUpperCase() : '';
    
    return firstInitial + lastInitial || user.email.charAt(0).toUpperCase();
  };

  if (isLoading) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        role="admin"
        title="User Details"
      >
        <div className="flex justify-center py-8">
          <p>Loading user details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout 
        breadcrumbs={breadcrumbs}
        role="admin"
        title="User Details"
      >
        <div className="flex flex-col items-center py-8">
          <p className="text-center text-muted-foreground mb-4">User not found</p>
          <Button onClick={() => navigate('/admin/accounts/users')} variant="default">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
      title="User Details"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button 
            onClick={() => navigate('/admin/accounts/users')} 
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </Button>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsEditDialogOpen(true)}
              variant="default"
            >
              <Edit className="mr-2 h-4 w-4" /> Edit User
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-4">
              <Avatar className="h-12 w-12 border">
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div>
                {user.firstName && user.lastName ? 
                  `${user.firstName} ${user.lastName}` : 
                  user.email}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p>{user.email}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
                  <div className="mt-1"><UserRoleBadge role={user.role} /></div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <div className="mt-1"><UserStatusBadge status={user.status} /></div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email Verified</h3>
                  <p>{user.emailVerified ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Associated Client</h3>
                  <p>{user.client?.companyName || 'None'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Security Version</h3>
                  <p>{user.securityVersion || '1'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
                  <p>{formatDate(user.createdAt)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                  <p>{formatDate(user.updatedAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {user.role === 'STAFF' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Staff Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                View staff details in the Staff Management section.
              </p>
              <Button 
                className="mt-4"
                variant="outline"
                onClick={() => navigate(`/admin/accounts/staff`)}
              >
                <UserCog className="mr-2 h-4 w-4" /> View Staff Profile
              </Button>
            </CardContent>
          </Card>
        )}
        
        {user.role === 'CLIENT' && user.clientId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                View client details in the Clients Management section.
              </p>
              <Button 
                className="mt-4"
                variant="outline"
                onClick={() => navigate(`/admin/accounts/clients/${user.clientId}/overview`)}
              >
                View Client Profile
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {isEditDialogOpen && user && (
        <UserEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={handleEditUser}
          user={user}
        />
      )}
    </DashboardLayout>
  );
};

export default UserDetailsPage;
