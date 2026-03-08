import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Globe, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/LanguageContext";

const Profile = () => {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

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
      <div className="max-w-lg mx-auto space-y-8 animate-in fade-in duration-500">
        <div>
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
              checked={language === "ar"}
              onCheckedChange={(checked) => setLanguage(checked ? "ar" : "en")}
            />
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
