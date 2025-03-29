
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import UserRoleBadge from './UserRoleBadge';
import UserStatusBadge from './UserStatusBadge';
import UserTableActions from './UserTableActions';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  createdAt: string;
}

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  searchQuery: string;
  onView: (userId: string) => void;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  isLoading,
  searchQuery,
  onView,
  onEdit,
  onDelete,
}) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length > 0 ? (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.firstName || user.lastName || 'No name provided'}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell><UserRoleBadge role={user.role} /></TableCell>
                <TableCell><UserStatusBadge status={user.status} /></TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <UserTableActions 
                    userId={user.id} 
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                {searchQuery ? 'No users match your search criteria' : 'No users found'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersTable;
