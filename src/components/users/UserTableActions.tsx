import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, UserCog } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserRole } from '@/types/user';

interface UserTableActionsProps {
  userId: string;
  userRole?: string;
  onView: (userId: string) => void;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
  onChangeRole?: (userId: string, newRole: string) => void;
}

const UserTableActions: React.FC<UserTableActionsProps> = ({ 
  userId, 
  userRole = '', 
  onView, 
  onEdit, 
  onDelete,
  onChangeRole
}) => {
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  
  const availableRoles: UserRole[] = ['ADMIN', 'STAFF', 'CLIENT', 'OBSERVER'];

  return (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="icon" onClick={() => onView(userId)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onEdit(userId)}>
        <Edit className="h-4 w-4" />
      </Button>
      
      {onChangeRole && (
        <DropdownMenu open={isRoleMenuOpen} onOpenChange={setIsRoleMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <UserCog className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Change Role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableRoles.map(role => (
              <DropdownMenuItem 
                key={role}
                disabled={role === userRole}
                onClick={() => {
                  onChangeRole(userId, role);
                  setIsRoleMenuOpen(false);
                }}
              >
                {role === userRole ? `${role} (Current)` : role}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Button variant="ghost" size="icon" onClick={() => onDelete(userId)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default UserTableActions;
