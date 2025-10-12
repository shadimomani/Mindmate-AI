import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Image, Upload, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { photoUploadSchema } from "@/lib/validation";

interface Photo {
  id: string;
  storage_path: string;
  file_name: string;
  url?: string;
}

const Photos = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadPhotos();
    }
  }, [user]);

  const loadPhotos = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load photos',
        variant: 'destructive',
      });
      return;
    }

    const photosWithUrls = await Promise.all(
      (data || []).map(async (photo) => {
        const { data: urlData } = supabase.storage
          .from('photos')
          .getPublicUrl(photo.storage_path);
        return { ...photo, url: urlData.publicUrl };
      })
    );

    setPhotos(photosWithUrls);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        const validation = photoUploadSchema.safeParse({ file });

        if (!validation.success) {
          toast({
            title: 'Validation Error',
            description: `${file.name}: ${validation.error.errors[0].message}`,
            variant: 'destructive',
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from('photos').insert({
          user_id: user.id,
          storage_path: filePath,
          file_name: file.name,
          file_size: file.size,
        });

        if (dbError) throw dbError;
      } catch (error) {
        toast({
          title: 'Upload Error',
          description: `Failed to upload ${file.name}`,
          variant: 'destructive',
        });
      }
    }

    setUploading(false);
    loadPhotos();
    toast({
      title: 'Success',
      description: 'Photos uploaded successfully',
    });
  };

  const handleRemovePhoto = async (photo: Photo) => {
    if (!user) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([photo.storage_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id);

      if (dbError) throw dbError;

      setPhotos(photos.filter(p => p.id !== photo.id));
      toast({
        title: 'Success',
        description: 'Photo removed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove photo',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Photo Gallery</h1>
            <p className="text-muted-foreground">Upload and manage your photos</p>
          </div>
          <Image className="w-8 h-8 text-accent" />
        </div>

      <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
        <label htmlFor="photo-upload" className="cursor-pointer">
          <div className="border-2 border-dashed border-border rounded-lg p-8 hover:border-accent transition-base text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">
              {uploading ? 'Uploading...' : 'Click to upload photos'}
            </p>
            <p className="text-sm text-muted-foreground">
              JPG, PNG, WEBP or GIF. Max 5MB per file.
            </p>
          </div>
          <input
            id="photo-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handlePhotoUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group bg-card rounded-xl overflow-hidden shadow-soft border border-border"
            >
              <img
                src={photo.url}
                alt={photo.file_name}
                className="w-full h-64 object-cover"
              />
              <Button
                onClick={() => handleRemovePhoto(photo)}
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No photos yet. Upload your first photo above!
          </p>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};

export default Photos;
