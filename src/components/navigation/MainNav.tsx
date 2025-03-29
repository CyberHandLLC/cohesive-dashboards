
import React from 'react';
import { Link } from 'react-router-dom';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { ChevronDown, Home, Users, FileText, BarChart2, Settings } from 'lucide-react';

const MainNav = () => {
  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList className="flex space-x-4">
        <NavigationMenuItem>
          <Link to="/dashboard" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <Home className="mr-1 h-4 w-4" />
            Dashboard
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link to="/accounts" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <Users className="mr-1 h-4 w-4" />
            Accounts
            <ChevronDown className="ml-1 h-3 w-3" />
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link to="/documents" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <FileText className="mr-1 h-4 w-4" />
            Documents
            <ChevronDown className="ml-1 h-3 w-3" />
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link to="/analytics" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <BarChart2 className="mr-1 h-4 w-4" />
            Analytics
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link to="/settings" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <Settings className="mr-1 h-4 w-4" />
            Settings
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default MainNav;
