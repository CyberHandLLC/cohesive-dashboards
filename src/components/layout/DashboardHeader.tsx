import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Bell, LogOut, User, Settings } from 'lucide-react';
import MainNav from '@/components/navigation/MainNav';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const DashboardHeader = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      // Log the logout action in AuditLog
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase
          .from('AuditLog')
          .insert({
            userId: userData.user.id,
            action: 'LOGOUT',
            resource: 'AUTH',
            details: { message: 'User logged out successfully' },
            timestamp: new Date()
          });
      }

      // Clear any sessions in the Session table
      if (userData?.user) {
        await supabase
          .from('Session')
          .update({ status: 'EXPIRED' })
          .eq('userId', userData.user.id)
          .eq('status', 'ACTIVE');
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Show success toast
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });

      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center">
          <SidebarTrigger />
          <Link to="/dashboard" className="ml-2 md:ml-4 flex items-center">
            <span className="text-xl font-bold">CyberHand</span>
          </Link>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="search"
              placeholder="Search..." 
              className="hidden md:flex h-9 w-[180px] rounded-md border border-input bg-background px-8 text-sm" 
            />
          </div>
          
          <Button size="icon" variant="ghost">
            <Bell className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <span className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground font-medium">
                    US
                  </span>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
