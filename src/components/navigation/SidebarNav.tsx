import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Home, Users, FileText, BarChart2, PieChart, Settings, CreditCard, MessageSquare, Target, Calendar, CheckSquare } from 'lucide-react';

interface SidebarNavProps {
  role?: 'admin' | 'staff' | 'client' | 'observer';
}

interface NavItem {
  title: string;
  icon: React.ElementType;
  path?: string;
  active: boolean;
  isCategory?: boolean;
  subItems?: { title: string; path: string }[];
}

const SidebarNav = ({ role = 'admin' }: SidebarNavProps) => {
  const location = useLocation();

  // Admin navigation items
  const adminItems: NavItem[] = [
    {
      title: 'Dashboard',
      icon: Home,
      path: '/admin',
      active: location.pathname === '/admin',
    },
    {
      title: 'Accounts',
      icon: Users,
      isCategory: true,
      active: location.pathname.startsWith('/admin/accounts'),
      subItems: [
        { title: 'Clients', path: '/admin/accounts/clients' },
        { title: 'Users', path: '/admin/accounts/users' },
        { title: 'Staff Management', path: '/admin/accounts/staff' },
      ],
    },
    {
      title: 'Portfolio',
      icon: PieChart,
      isCategory: true,
      active: location.pathname.startsWith('/admin/portfolio'),
      subItems: [
        { title: 'Categories', path: '/admin/portfolio/categories' },
        { title: 'Services', path: '/admin/portfolio/services' },
        { title: 'Packages', path: '/admin/portfolio/packages' },
        { title: 'Service Expirations', path: '/admin/portfolio/service-expirations' },
        { title: 'Service Dashboards', path: '/admin/portfolio/service-dashboards' },
      ],
    },
    {
      title: 'Documents',
      icon: FileText,
      isCategory: true,
      active: location.pathname.startsWith('/admin/documents'),
      subItems: [
        { title: 'Invoices', path: '/admin/documents/invoices' },
        { title: 'Recurring Billing', path: '/admin/documents/recurring-billing' },
        { title: 'Reports', path: '/admin/documents/reports' },
      ],
    },
    {
      title: 'Engagements',
      icon: Target,
      isCategory: true,
      active: location.pathname.startsWith('/admin/engagements'),
      subItems: [
        { title: 'Service Requests', path: '/admin/engagements/service-requests' },
        { title: 'Content Management', path: '/admin/engagements/content' },
        { title: 'Lead Management', path: '/admin/engagements/leads' },
      ],
    },
    {
      title: 'Settings',
      icon: Settings,
      path: '/admin/settings',
      active: location.pathname === '/admin/settings',
    },
  ];

  // Staff navigation items - updated based on requirements
  const staffItems: NavItem[] = [
    {
      title: 'Dashboard',
      icon: Home,
      path: '/staff',
      active: location.pathname === '/staff',
    },
    {
      title: 'Accounts',
      icon: Users,
      isCategory: true,
      active: location.pathname.startsWith('/staff/accounts'),
      subItems: [
        { title: 'Clients', path: '/staff/accounts/clients' },
        { title: 'Support Tickets', path: '/staff/accounts/support' },
        { title: 'Leads', path: '/staff/accounts/leads' },
      ],
    },
    {
      title: 'Tasks',
      icon: CheckSquare,
      path: '/staff/tasks',
      active: location.pathname === '/staff/tasks' || 
              location.pathname.startsWith('/staff/tasks'),
    },
    {
      title: 'Calendar',
      icon: Calendar,
      path: '/staff/calendar',
      active: location.pathname === '/staff/calendar',
    },
    {
      title: 'Settings',
      icon: Settings,
      path: '/staff/settings',
      active: location.pathname === '/staff/settings',
    },
  ];

  // Client navigation items
  const clientItems: NavItem[] = [
    {
      title: 'Dashboard',
      icon: Home,
      path: '/client',
      active: location.pathname === '/client',
    },
    {
      title: 'Accounts',
      icon: Users,
      isCategory: true,
      active: location.pathname.startsWith('/client/accounts'),
      subItems: [
        { title: 'Services', path: '/client/accounts/services' },
        { title: 'Invoices', path: '/client/accounts/invoices' },
        { title: 'Support Tickets', path: '/client/accounts/support' },
        { title: 'Profile', path: '/client/accounts/profile' },
      ],
    },
  ];

  // Observer navigation items
  const observerItems: NavItem[] = [
    {
      title: 'Dashboard',
      icon: Home,
      path: '/observer',
      active: location.pathname === '/observer',
    },
    {
      title: 'Explore',
      icon: PieChart,
      isCategory: true,
      active: location.pathname.startsWith('/observer/explore'),
      subItems: [
        { title: 'Services', path: '/observer/explore/services' },
        { title: 'Packages', path: '/observer/explore/packages' },
        { title: 'Blog', path: '/observer/explore/blog' },
        { title: 'Contact Us', path: '/observer/explore/contact' },
      ],
    },
  ];

  // Select navigation items based on role
  const navItems = {
    admin: adminItems,
    staff: staffItems,
    client: clientItems,
    observer: observerItems,
  }[role] || adminItems;

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center px-4 py-2">
        <span className="text-xl font-bold">CyberHand</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.isCategory ? (
                  // Category items - not clickable
                  <SidebarMenuButton 
                    isActive={item.active}
                    className="cursor-default"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                ) : (
                  // Regular menu items - clickable links
                  <SidebarMenuButton 
                    asChild 
                    isActive={item.active}
                  >
                    <Link to={item.path || '#'}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
                
                {item.subItems && (
                  <SidebarMenuSub>
                    {item.subItems.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location.pathname === subItem.path}
                        >
                          <Link to={subItem.path}>
                            {subItem.title}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default SidebarNav;
