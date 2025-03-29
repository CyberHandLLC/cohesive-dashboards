
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface UserSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const UserSearchBar: React.FC<UserSearchBarProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="relative flex-1 w-full sm:max-w-xs">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search users..."
        className="pl-9"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
};

export default UserSearchBar;
