import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

const GUIDE_PROMPT_KEY = "mindmate_guide_prompt_dismissed";

export const GuidePrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem(GUIDE_PROMPT_KEY);
    if (!dismissed) {
      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(GUIDE_PROMPT_KEY, "true");
    setIsVisible(false);
  };

  const handleGoToGuide = () => {
    localStorage.setItem(GUIDE_PROMPT_KEY, "true");
    setIsVisible(false);
    navigate("/guide");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 relative">
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                      <BookOpen className="h-8 w-8 text-primary" />
                    </motion.div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        {isRTL ? "للمستخدمين الجدد" : "For New Users"}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-foreground mt-1">
                      {isRTL ? "مرحباً بك!" : "Welcome!"}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {isRTL
                    ? "نوصيك بزيارة صفحة الدليل للتعرف على جميع ميزات التطبيق وكيفية الاستفادة منها بشكل أفضل."
                    : "We recommend visiting the Guide page to learn about all the app features and how to use them effectively."}
                </p>

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    onClick={handleGoToGuide}
                    className="w-full gap-2 h-12 text-base font-medium"
                  >
                    <BookOpen className="h-5 w-5" />
                    {isRTL ? "افتح الدليل" : "Open Guide"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleDismiss}
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    {isRTL ? "تخطي الآن" : "Skip for now"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
