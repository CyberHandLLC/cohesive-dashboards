
import React, { useState } from 'react';
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

const UsersPage = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { users, isLoading, deleteUser } = useUsers(searchQuery);

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Accounts', href: '/admin/accounts' },
    { label: 'Users' }
  ];

  const handleViewUser = (userId: string) => {
    // Navigate to user details page
    console.log(`View user with ID: ${userId}`);
    // Implement navigation to user details page
  };

  const handleEditUser = (userId: string) => {
    // Open edit user modal or navigate to edit page
    console.log(`Edit user with ID: ${userId}`);
    // Implement user editing
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      await deleteUser(userId);
    }
  };

  const handleAddUser = () => {
    // Navigate to add user page or open modal
    console.log('Add new user');
    // Implement add user functionality
  };

  return (
    <DashboardLayout 
      breadcrumbs={breadcrumbs}
      role="admin"
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
            <Button onClick={handleAddUser} className="w-full sm:w-auto">
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
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UsersPage;
