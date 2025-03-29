
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface UserTableActionsProps {
  userId: string;
  onView: (userId: string) => void;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
}

const UserTableActions: React.FC<UserTableActionsProps> = ({ 
  userId, 
  onView, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="icon" onClick={() => onView(userId)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onEdit(userId)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onDelete(userId)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default UserTableActions;
