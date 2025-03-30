import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserRoleBadge } from '@/components/users/UserRoleBadge';
import { UserStatusBadge } from '@/components/users/UserStatusBadge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ChevronLeft, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  AlertCircle, 
  Check, 
  Key,
  UserCircle2,
  Building,
  IdCard
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { User as UserType } from '@/hooks/users/useUsers';

type UserRole = 'ADMIN' | 'STAFF' | 'CLIENT' | 'OBSERVER';

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';

// Fix the interface to correctly match the UserType from useUsers
interface User extends Omit<UserType, 'emailVerified'> {
  emailVerified?: boolean;
}

interface Client {
  id: string;
  companyName: string;
  industry: string | null;
  status: string;
}

const UserDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Users', href: '/admin/accounts/users' },
    { label: 'User Details' }
  ];

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('User')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setUser(data as User);
          await fetchClients(data.id);
        }
      } catch (error: any) {
        console.error('Error fetching user details:', error);
        toast({
          title: "Error loading user details",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [id, toast]);

  const fetchClients = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('Client')
        .select('id, companyName, industry, status')
        .eq('accountManagerId', userId);

      if (error) {
        throw error;
      }

      setClients(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error loading clients",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleBackClick = () => {
    navigate('/admin/accounts/users');
  };

  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbs={breadcrumbs}
        role="admin"
      >
        <div className="flex justify-center items-center h-64">
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
      >
        <Card>
          <CardContent className="flex flex-col items-center py-10">
            <h2 className="text-xl font-semibold mb-2">User not found</h2>
            <p className="text-muted-foreground mb-6">The requested user does not exist or has been removed.</p>
            <Button onClick={handleBackClick}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to User List
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
          <Button onClick={() => navigate(`/admin/accounts/users/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" /> Edit User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.firstName || user.lastName || 'No name provided'}
                </CardTitle>
                <CardDescription>
                  <UserRoleBadge role={user.role as UserRole} />
                </CardDescription>
              </div>
              <UserStatusBadge status={user.status as UserStatus} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p>{user.email}</p>
                  {user.emailVerified && (
                    <Check className="h-4 w-4 ml-2 text-green-500" title="Email Verified" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p>{user.phone || 'Not specified'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p>{formatDate(user.createdAt)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Last Login</p>
                <div className="flex items-center">
                  <Key className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p>{user.lastLogin ? formatDate(user.lastLogin) : 'Not specified'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                 <div className="flex items-center">
                  <IdCard className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p>{user.id}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Company</p>
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p>{user.companyName || 'Not specified'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Assigned Clients</p>
              {clients.length > 0 ? (
                <div className="grid gap-4">
                  {clients.map((client) => (
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
                <p className="text-muted-foreground">No clients assigned to this user.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <AlertCircle className="mr-2 h-4 w-4" />
              Disable User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently disable this user and remove their data from our servers.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="email" className="text-right">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={user.email}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/accounts/users')}>
                Cancel
              </Button>
              <Button type="submit" className="ml-2">
                Disable User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default UserDetailsPage;
