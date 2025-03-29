
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface UserRoleBadgeProps {
  role: string;
}

const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ role }) => {
  switch(role) {
    case 'ADMIN':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Admin</Badge>;
    case 'STAFF':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Staff</Badge>;
    case 'CLIENT':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Client</Badge>;
    case 'OBSERVER':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Observer</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
};

export default UserRoleBadge;
