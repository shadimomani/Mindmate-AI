import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, Loader2, CheckCircle, XCircle, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface PlannerAnalysis {
  page_code: string | null;
  tasks_completed: boolean;
  mood: string;
  notes: string;
  completion_rate: number;
  commitment_score: number;
  feedback_message: string;
}

export const PlannerAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PlannerAnalysis | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();

  const translations = {
    en: {
      title: "Analyze Planner Page",
      description: "Upload a photo of your daily planner page to get AI-powered insights",
      uploadButton: "Upload Photo",
      analyzing: "Analyzing...",
      results: "Analysis Results",
      pageCode: "Page Code",
      tasksCompleted: "All Tasks Completed",
      mood: "Mood",
      notes: "Notes",
      completionRate: "Completion Rate",
      commitmentScore: "Commitment Score",
      feedback: "Feedback",
      yes: "Yes",
      no: "No",
      noNotes: "No notes",
      analyzeAnother: "Analyze Another Page",
    },
    ar: {
      title: "تحليل صفحة المخطط",
      description: "قم بتحميل صورة من صفحة مخططك اليومي للحصول على رؤى مدعومة بالذكاء الاصطناعي",
      uploadButton: "تحميل صورة",
      analyzing: "جاري التحليل...",
      results: "نتائج التحليل",
      pageCode: "رمز الصفحة",
      tasksCompleted: "تم إكمال جميع المهام",
      mood: "المزاج",
      notes: "الملاحظات",
      completionRate: "نسبة الإكمال",
      commitmentScore: "درجة الالتزام",
      feedback: "التغذية الراجعة",
      yes: "نعم",
      no: "لا",
      noNotes: "لا توجد ملاحظات",
      analyzeAnother: "تحليل صفحة أخرى",
    }
  };

  const t = translations[language];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(language === 'ar' ? 'الرجاء تحميل ملف صورة' : 'Please upload an image file');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreviewImage(base64);
      await analyzePlanner(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzePlanner = async (imageBase64: string) => {
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-planner', {
        body: { image: imageBase64 }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data);
      toast.success(language === 'ar' ? 'تم تحليل صفحة المخطط بنجاح!' : 'Planner page analyzed successfully!');
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || (language === 'ar' ? 'فشل في تحليل الصفحة' : 'Failed to analyze page'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderStars = (score: number) => {
    return Array.from({ length: 10 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < score ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`}
      />
    ));
  };

  return (
    <Card className="bg-card shadow-soft border-border">
      <CardHeader>
        <CardTitle className="text-xl font-serif flex items-center gap-2">
          <Camera className="w-5 h-5 text-accent" />
          {t.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {previewImage && (
              <div className="relative rounded-lg overflow-hidden">
                <img 
                  src={previewImage} 
                  alt="Planner preview" 
                  className="w-full h-48 object-cover"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t.analyzing}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!previewImage && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.analyzing}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {t.uploadButton}
                  </>
                )}
              </Button>
            )}
          </>
        )}

        {analysis && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t.results}</h3>
            
            <div className="grid gap-3">
              {analysis.page_code && (
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">{t.pageCode}</span>
                  <span className="font-mono text-sm">{analysis.page_code}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">{t.tasksCompleted}</span>
                {analysis.tasks_completed ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              
              {analysis.mood && (
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">{t.mood}</span>
                  <span className="capitalize">{analysis.mood}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">{t.completionRate}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent transition-all" 
                      style={{ width: `${analysis.completion_rate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{analysis.completion_rate}%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">{t.commitmentScore}</span>
                <div className="flex gap-0.5">
                  {renderStars(analysis.commitment_score)}
                </div>
              </div>
              
              {analysis.notes && (
                <div className="py-2 border-b border-border">
                  <span className="text-muted-foreground block mb-1">{t.notes}</span>
                  <p className="text-sm">{analysis.notes || t.noNotes}</p>
                </div>
              )}
              
              <div className="py-3 px-4 bg-accent/10 rounded-lg">
                <span className="text-muted-foreground text-sm block mb-1">{t.feedback}</span>
                <p className="text-foreground font-medium">{analysis.feedback_message}</p>
              </div>
            </div>

            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              {t.analyzeAnother}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
