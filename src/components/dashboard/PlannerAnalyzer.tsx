import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, Loader2, CheckCircle, XCircle, Star, History, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface PlannerAnalysis {
  page_code: string | null;
  tasks_completed: boolean;
  mood: string;
  notes: string;
  completion_rate: number;
  commitment_score: number;
  feedback_message: string;
}

interface SavedAnalysis extends PlannerAnalysis {
  id: string;
  created_at: string;
}

export const PlannerAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysis, setAnalysis] = useState<PlannerAnalysis | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();
  const { user } = useAuth();

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
      saveResult: "Save Result",
      saving: "Saving...",
      saved: "Result saved!",
      history: "History",
      noHistory: "No analysis history yet",
      viewHistory: "View History",
      hideHistory: "Hide History",
      delete: "Delete",
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
      saveResult: "حفظ النتيجة",
      saving: "جاري الحفظ...",
      saved: "تم حفظ النتيجة!",
      history: "السجل",
      noHistory: "لا يوجد سجل تحليل بعد",
      viewHistory: "عرض السجل",
      hideHistory: "إخفاء السجل",
      delete: "حذف",
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (user && showHistory) {
      loadHistory();
    }
  }, [user, showHistory]);

  const loadHistory = async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('planner_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(language === 'ar' ? 'الرجاء تحميل ملف صورة' : 'Please upload an image file');
      return;
    }

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

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysis(data);
      toast.success(language === 'ar' ? 'تم تحليل صفحة المخطط بنجاح!' : 'Planner page analyzed successfully!');
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || (language === 'ar' ? 'فشل في تحليل الصفحة' : 'Failed to analyze page'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveAnalysis = async () => {
    if (!analysis || !user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('planner_analyses')
        .insert({
          user_id: user.id,
          page_code: analysis.page_code,
          tasks_completed: analysis.tasks_completed,
          mood: analysis.mood,
          notes: analysis.notes,
          completion_rate: analysis.completion_rate,
          commitment_score: analysis.commitment_score,
          feedback_message: analysis.feedback_message,
        });

      if (error) throw error;

      toast.success(t.saved);
      if (showHistory) {
        loadHistory();
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(language === 'ar' ? 'فشل في حفظ النتيجة' : 'Failed to save result');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      const { error } = await supabase
        .from('planner_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success(language === 'ar' ? 'تم الحذف' : 'Deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(language === 'ar' ? 'فشل في الحذف' : 'Failed to delete');
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

  const renderAnalysisCard = (data: PlannerAnalysis, isHistory = false, id?: string, createdAt?: string) => (
    <div className="space-y-3">
      {isHistory && createdAt && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {format(new Date(createdAt), 'MMM dd, yyyy HH:mm')}
          </span>
          {id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteAnalysis(id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
      
      {data.page_code && (
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-muted-foreground">{t.pageCode}</span>
          <span className="font-mono text-sm">{data.page_code}</span>
        </div>
      )}
      
      <div className="flex justify-between items-center py-2 border-b border-border">
        <span className="text-muted-foreground">{t.tasksCompleted}</span>
        {data.tasks_completed ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
      </div>
      
      {data.mood && (
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-muted-foreground">{t.mood}</span>
          <span className="capitalize">{data.mood}</span>
        </div>
      )}
      
      <div className="flex justify-between items-center py-2 border-b border-border">
        <span className="text-muted-foreground">{t.completionRate}</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent transition-all" 
              style={{ width: `${data.completion_rate}%` }}
            />
          </div>
          <span className="text-sm font-medium">{data.completion_rate}%</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center py-2 border-b border-border">
        <span className="text-muted-foreground">{t.commitmentScore}</span>
        <div className="flex gap-0.5">
          {renderStars(data.commitment_score)}
        </div>
      </div>
      
      {data.notes && (
        <div className="py-2 border-b border-border">
          <span className="text-muted-foreground block mb-1">{t.notes}</span>
          <p className="text-sm">{data.notes || t.noNotes}</p>
        </div>
      )}
      
      <div className="py-3 px-4 bg-accent/10 rounded-lg">
        <span className="text-muted-foreground text-sm block mb-1">{t.feedback}</span>
        <p className="text-foreground font-medium">{data.feedback_message}</p>
      </div>
    </div>
  );

  return (
    <Card className="bg-card shadow-soft border-border">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-serif flex items-center gap-2">
              <Camera className="w-5 h-5 text-accent" />
              {t.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
          </div>
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4 mr-2" />
              {showHistory ? t.hideHistory : t.viewHistory}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showHistory ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t.history}</h3>
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t.noHistory}</p>
            ) : (
              <div className="space-y-6">
                {history.map((item) => (
                  <div key={item.id} className="border border-border rounded-lg p-4">
                    {renderAnalysisCard(item, true, item.id, item.created_at)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
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
                
                {renderAnalysisCard(analysis)}

                <div className="flex gap-2">
                  {user && (
                    <Button
                      onClick={saveAnalysis}
                      disabled={isSaving}
                      className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t.saving}
                        </>
                      ) : (
                        t.saveResult
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {t.analyzeAnother}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
