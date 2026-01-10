import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { User, Camera } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { profileSchema, photoUploadSchema } from "@/lib/validation";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/LanguageContext";

const Profile = () => {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setDisplayName(data.display_name || '');
      setBio(data.bio || '');
      if (data.avatar_url) {
        const { data: urlData } = await supabase.storage.from('avatars').createSignedUrl(data.avatar_url, 3600);
        if (urlData?.signedUrl) {
          setAvatarUrl(urlData.signedUrl);
        }
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const validation = photoUploadSchema.safeParse({ file });

      if (!validation.success) {
        toast({
          title: t('validationError'),
          description: validation.error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }

      setUploadingAvatar(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const { data: urlData } = await supabase.storage.from('avatars').createSignedUrl(filePath, 3600);
      if (urlData?.signedUrl) {
        setAvatarUrl(urlData.signedUrl);
      }
      
      toast({
        title: t('success'),
        description: 'Avatar updated successfully',
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: 'Failed to upload avatar',
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const validation = profileSchema.safeParse({ displayName, bio });

      if (!validation.success) {
        toast({
          title: t('validationError'),
          description: validation.error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName, bio: bio })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: t('success'),
        description: 'Profile updated successfully',
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-foreground mb-1 sm:mb-2 truncate">{t('profile')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{t('manageAccountSettings')}</p>
          </div>
          <User className="w-6 h-6 sm:w-8 sm:h-8 text-accent shrink-0" />
        </div>

        <div className="bg-card rounded-xl p-4 sm:p-6 shadow-soft border border-border space-y-4 sm:space-y-6">
          <div>
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-foreground mb-3 sm:mb-4">{t('profilePicture')}</h3>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 sm:p-2.5 bg-accent rounded-full hover:bg-accent/90 transition-base disabled:opacity-50 touch-manipulation"
                  aria-label="Upload profile picture"
                >
                  <Camera className="w-4 h-4 text-accent-foreground" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm text-muted-foreground">
                  {uploadingAvatar ? t('uploading') : t('clickCameraToUpload')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('photoSpecs')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-foreground">{t('personalInformation')}</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm sm:text-base">{t('displayName')}</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('yourName')}
                maxLength={100}
                className="h-11 sm:h-10 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted h-11 sm:h-10 text-base"
              />
              <p className="text-xs text-muted-foreground">{t('emailCannotBeChanged')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm sm:text-base">{t('bio')}</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t('tellUsAboutYourself')}
                className="min-h-[100px] text-base"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{bio.length}/500 {t('characters')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-foreground">{t('preferences')}</h3>
            
            <div className="flex items-center justify-between gap-4 py-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">{t('emailNotifications')}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('receiveUpdatesViaEmail')}</p>
              </div>
              <Switch className="shrink-0" />
            </div>

            <div className="flex items-center justify-between gap-4 py-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">{t('darkMode')}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('toggleDarkMode')}</p>
              </div>
              <Switch 
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                className="shrink-0"
              />
            </div>

            <div className="flex items-center justify-between gap-4 py-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">{t('language')}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('switchToArabic')}</p>
              </div>
              <Switch 
                checked={language === "ar"}
                onCheckedChange={(checked) => setLanguage(checked ? "ar" : "en")}
                className="shrink-0"
              />
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full h-11 sm:h-10 bg-accent hover:bg-accent/90 text-accent-foreground text-base touch-manipulation"
          >
            {loading ? t('saving') : t('saveChanges')}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
