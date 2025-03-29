
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface UserStatusBadgeProps {
  status: string;
}

const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status }) => {
  switch(status) {
    case 'ACTIVE':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
    case 'INACTIVE':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Inactive</Badge>;
    case 'SUSPENDED':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Suspended</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default UserStatusBadge;
