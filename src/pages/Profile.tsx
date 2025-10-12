import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const [avatarUrl, setAvatarUrl] = useState("");
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a local URL for preview
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
      toast({
        title: "Photo uploaded",
        description: "Your profile photo has been updated.",
      });
    }
  };

  const handleSave = () => {
    toast({
      title: "Profile saved",
      description: "Your changes have been saved successfully.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Profile</h1>
            <p className="text-muted-foreground">Manage your account settings</p>
          </div>
          <User className="w-8 h-8 text-accent" />
        </div>

        <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
          <h2 className="text-xl font-serif font-semibold text-foreground mb-6">Profile Picture</h2>
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-accent text-accent-foreground text-2xl">
                {name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG or WEBP. Max 5MB.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
          <h2 className="text-xl font-serif font-semibold text-foreground mb-6">Personal Information</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                placeholder="Tell us about yourself"
              />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
          <h2 className="text-xl font-serif font-semibold text-foreground mb-6">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive daily reminders and updates</p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Theme</p>
                <p className="text-sm text-muted-foreground">Customize your experience</p>
              </div>
              <Button variant="outline">Change</Button>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Save Changes
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
