import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Image, Upload, X } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const Photos = () => {
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos: string[] = [];
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          newPhotos.push(url);
        }
      });
      setUploadedPhotos([...uploadedPhotos, ...newPhotos]);
      toast({
        title: "Photos uploaded",
        description: `${newPhotos.length} photo(s) added to your gallery.`,
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = uploadedPhotos.filter((_, i) => i !== index);
    setUploadedPhotos(newPhotos);
    toast({
      title: "Photo removed",
      description: "Photo has been removed from your gallery.",
    });
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

        <div className="bg-card rounded-xl p-8 shadow-soft border border-border">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            multiple
            className="hidden"
          />
          <div 
            className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-accent transition-base"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Upload Photos</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click to browse or drag and drop your photos here
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or WEBP. Max 5MB per file.
            </p>
          </div>
        </div>

        {uploadedPhotos.length > 0 && (
          <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-serif font-semibold text-foreground">
                Your Photos ({uploadedPhotos.length})
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Add More
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedPhotos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={photo} 
                    alt={`Upload ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadedPhotos.length === 0 && (
          <div className="bg-card rounded-xl p-12 shadow-soft border border-border text-center">
            <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No photos yet</h3>
            <p className="text-sm text-muted-foreground">
              Upload your first photos to get started
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Photos;
