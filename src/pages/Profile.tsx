import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SEO } from "@/components/SEO";
import { User, Globe, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProfileScene } from "@/components/three/scenes/ProfileScene";

const Profile = () => {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      if (data?.display_name) setDisplayName(data.display_name);
    };
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user || !displayName.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("id", user.id);
      if (error) throw error;
      toast({ title: "Saved", description: "Profile updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <SEO
        path="/profile"
        title="Your Profile — MindMate"
        description="Manage your MindMate profile: theme, language, and personal preferences for your AI productivity companion."
      />
      <div className="relative max-w-lg mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="pointer-events-none absolute inset-x-0 -top-8 h-[380px] -z-10 overflow-hidden rounded-3xl">
          <ProfileScene orbColor="#E5B964" progress={0.6} />
        </div>
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">{t('profile')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('manageAccountSettings')}</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-soft space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">{t('displayName')}</Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('yourName')}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">{t('darkMode')}</p>
              <p className="text-xs text-muted-foreground">{t('toggleDarkMode')}</p>
            </div>
            <Switch
              aria-label="Toggle dark mode"
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">{t('language')}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'en' ? 'English' : 'العربية'}
                </p>
              </div>
            </div>
            <Switch
              aria-label="Toggle Arabic language"
              checked={language === "ar"}
              onCheckedChange={async (checked) => {
                const newLang = checked ? "ar" : "en";
                setLanguage(newLang);
                if (user) {
                  await supabase.from("profiles").update({ language: newLang }).eq("id", user.id);
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">{t('restartOnboarding')}</p>
                <p className="text-xs text-muted-foreground">{t('restartOnboardingDesc')}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!user) return;
                await Promise.all([
                  supabase.from('profiles').update({ onboarded: false, goals_completed: false }).eq('id', user.id),
                  supabase.from('tasks').delete().eq('user_id', user.id),
                  supabase.from('user_goals').delete().eq('user_id', user.id),
                ]);
                (window as any).__recheckOnboarding?.();
                navigate('/onboarding', { replace: true });
              }}
            >
              {t('restart')}
            </Button>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {loading ? t('saving') : t('saveChanges')}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
