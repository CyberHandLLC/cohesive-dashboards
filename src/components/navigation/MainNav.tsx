import React from 'react';
import { Link } from 'react-router-dom';
import { 
  NavigationMenu, 
  NavigationMenuList, 
  NavigationMenuItem, 
  NavigationMenuLink,
  NavigationMenuContent,
  NavigationMenuTrigger
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { ChevronDown, Home, Users, FileText, BarChart2, Settings, PieChart, Target } from 'lucide-react';

const MainNav = () => {
  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList className="flex space-x-4">
        <NavigationMenuItem>
          <Link to="/admin" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <Home className="mr-1 h-4 w-4" />
            Dashboard
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <NavigationMenuTrigger className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <Users className="mr-1 h-4 w-4" />
            Accounts
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[200px] gap-2 p-4">
              <li>
                <Link to="/admin/accounts/clients" className="block p-2 hover:bg-accent rounded-md">
                  Clients
                </Link>
              </li>
              <li>
                <Link to="/admin/accounts/users" className="block p-2 hover:bg-accent rounded-md">
                  Users
                </Link>
              </li>
              <li>
                <Link to="/admin/accounts/staff" className="block p-2 hover:bg-accent rounded-md">
                  Staff Management
                </Link>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <NavigationMenuTrigger className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <PieChart className="mr-1 h-4 w-4" />
            Portfolio
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[200px] gap-2 p-4">
              <li>
                <Link to="/admin/portfolio/categories" className="block p-2 hover:bg-accent rounded-md">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/admin/portfolio/services" className="block p-2 hover:bg-accent rounded-md">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/admin/portfolio/packages" className="block p-2 hover:bg-accent rounded-md">
                  Packages
                </Link>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <NavigationMenuTrigger className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <FileText className="mr-1 h-4 w-4" />
            Documents
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[200px] gap-2 p-4">
              <li>
                <Link to="/admin/documents/invoices" className="block p-2 hover:bg-accent rounded-md">
                  Invoices
                </Link>
              </li>
              <li>
                <Link to="/admin/documents/reports" className="block p-2 hover:bg-accent rounded-md">
                  Reports
                </Link>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <NavigationMenuTrigger className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <Target className="mr-1 h-4 w-4" />
            Engagements
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[200px] gap-2 p-4">
              <li>
                <Link to="/admin/engagements/service-requests" className="block p-2 hover:bg-accent rounded-md">
                  Service Requests
                </Link>
              </li>
              <li>
                <Link to="/admin/engagements/content" className="block p-2 hover:bg-accent rounded-md">
                  Content Management
                </Link>
              </li>
              <li>
                <Link to="/admin/engagements/leads" className="block p-2 hover:bg-accent rounded-md">
                  Lead Management
                </Link>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link to="/admin/analytics" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <BarChart2 className="mr-1 h-4 w-4" />
            Analytics
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link to="/admin/settings" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <Settings className="mr-1 h-4 w-4" />
            Settings
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default MainNav;
