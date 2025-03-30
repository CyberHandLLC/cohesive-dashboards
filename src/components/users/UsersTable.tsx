
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
import { UserRole, UserStatus } from '@/hooks/users/useUsers';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified?: boolean;
  clientId?: string;
  client?: {
    companyName: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  searchQuery: string;
  onView: (userId: string) => void;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
  onChangeRole?: (userId: string, newRole: UserRole) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  isLoading,
  searchQuery,
  onView,
  onEdit,
  onDelete,
  onChangeRole,
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
            <TableHead>Verified</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length > 0 ? (
            users.map((user) => (
              <TableRow 
                key={user.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onView(user.id)}
              >
                <TableCell>
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.firstName || user.lastName || 'No name provided'}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell><UserRoleBadge role={user.role} /></TableCell>
                <TableCell><UserStatusBadge status={user.status} /></TableCell>
                <TableCell>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    user.emailVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.emailVerified ? 'Yes' : 'No'}
                  </span>
                </TableCell>
                <TableCell>
                  {user.client?.companyName || 
                    (user.role === 'CLIENT' && !user.clientId ? 
                      <span className="text-amber-600">Not assigned</span> : 
                      'N/A')}
                </TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <UserTableActions 
                    userId={user.id} 
                    userRole={user.role}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onChangeRole={onChangeRole}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
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
