
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Plus, Filter } from 'lucide-react';
import { useUsers } from '@/hooks/users/useUsers';
import UserSearchBar from '@/components/users/UserSearchBar';
import UsersTable from '@/components/users/UsersTable';
import UserAddDialog from '@/components/users/UserAddDialog';
import { useToast } from '@/hooks/use-toast';
import UserEditDialog from '@/components/users/UserEditDialog';

const UsersPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { users, isLoading, deleteUser, addUser, editUser, changeRole } = useUsers(searchQuery);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { toast } = useToast();

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Users' }
  ];

  const handleViewUser = (userId: string) => {
    // Navigate to user details page
    navigate(`/admin/accounts/users/${userId}`);
  };

  const handleEditUser = (userId: string) => {
    // Find the user to edit
    const userToEdit = users.find(user => user.id === userId);
    if (!userToEdit) return;
    
    // Open edit user dialog with pre-filled data
    setSelectedUser(userToEdit);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user? This will remove all associated data and cannot be undone.")) {
      const success = await deleteUser(userId);
      if (success) {
        toast({
          title: "User deleted",
          description: "The user has been permanently removed",
        });
      }
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    const success = await changeRole(userId, newRole as 'ADMIN' | 'STAFF' | 'CLIENT' | 'OBSERVER');
    if (success) {
      toast({
        title: "Role updated",
        description: `User role has been changed to ${newRole}`,
      });
    }
  };

  const handleAddUser = (userData: any) => {
    addUser(userData).then(success => {
      if (success) {
        setIsAddDialogOpen(false);
        toast({
          title: "User added",
          description: "New user has been created successfully",
        });
      }
    });
  };

  const handleSubmitEditUser = (userData: any) => {
    if (!selectedUser) return;
    
    editUser(selectedUser.id, userData).then(success => {
      if (success) {
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        toast({
          title: "User updated",
          description: "User has been updated successfully",
        });
      }
    });
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
      title="User Management"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <UserSearchBar 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <UsersTable 
              users={users}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onView={handleViewUser}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onChangeRole={handleChangeRole}
            />
          </CardContent>
        </Card>
      </div>

      <UserAddDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddUser}
      />

      {selectedUser && (
        <UserEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={handleSubmitEditUser}
          user={selectedUser}
        />
      )}
    </DashboardLayout>
  );
};

export default UsersPage;
