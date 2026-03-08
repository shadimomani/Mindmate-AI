import { Home, BarChart3, User, LogOut } from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo-mindmate.png";
import { useLanguage } from "@/contexts/LanguageContext";
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

export const AppSidebar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const { state } = useSidebar();
  const { t } = useLanguage();

  const navigation = [
    { name: t('dashboard'), href: "/", icon: Home },
    { name: t('insights'), href: "/insights", icon: BarChart3 },
    { name: t('profile'), href: "/profile", icon: User },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: t('error'),
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
              <h1 className="text-xl font-serif font-bold text-foreground">{t('appName')}</h1>
              <p className="text-xs text-muted-foreground">{t('appTagline')}</p>
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
                  <SidebarMenuItem key={item.href}>
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

      <SidebarFooter className="border-t border-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip={t('signOut')}>
              <LogOut className="w-5 h-5" />
              <span>{t('signOut')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};