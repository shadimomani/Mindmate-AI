import { Home, CheckSquare, Heart, MessageCircle, BarChart3, User, Brain, Image, LogOut } from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo-mindmate.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Daily Planner", href: "/planner", icon: CheckSquare },
  { name: "Habits", href: "/habits", icon: Heart },
  { name: "Reflections", href: "/reflections", icon: MessageCircle },
  { name: "Insights", href: "/insights", icon: BarChart3 },
  { name: "Photos", href: "/photos", icon: Image },
  { name: "Profile", href: "/profile", icon: User },
];

export const AppSidebar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const { state } = useSidebar();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    } else {
      navigate('/auth');
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="MindMate" className="w-10 h-10 shrink-0" />
          {state === "expanded" && (
            <div>
              <h1 className="text-xl font-serif font-bold text-foreground">MindMate</h1>
              <p className="text-xs text-muted-foreground">Your AI Productivity Companion</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                      <NavLink to={item.href} end>
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted">
          <Brain className="w-5 h-5 text-accent shrink-0" />
          {state === "expanded" && (
            <div className="flex-1">
              <p className="text-sm font-medium">AI Assistant</p>
              <p className="text-xs text-muted-foreground">Always here to help</p>
            </div>
          )}
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Sign Out">
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
