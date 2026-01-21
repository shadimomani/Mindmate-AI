import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  CheckSquare, 
  Heart, 
  Brain, 
  MessageCircle, 
  BarChart3, 
  Image, 
  User,
  Sparkles,
  PartyPopper
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";

const TOUR_COMPLETED_KEY = "mindmate_tour_completed";

interface TourStep {
  id: string;
  route: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: typeof Home;
  highlightSelector?: string;
}

const tourSteps: TourStep[] = [
  {
    id: "dashboard",
    route: "/",
    titleEn: "Dashboard",
    titleAr: "لوحة التحكم",
    descriptionEn: "Your central hub! View your daily stats, track tasks, habits, and mood all in one place. Start each day here to see your progress.",
    descriptionAr: "مركزك الرئيسي! شاهد إحصائياتك اليومية، تتبع المهام والعادات والمزاج في مكان واحد. ابدأ يومك هنا لمتابعة تقدمك.",
    icon: Home,
  },
  {
    id: "planner",
    route: "/planner",
    titleEn: "Daily Planner",
    titleAr: "المخطط اليومي",
    descriptionEn: "Plan your day with AI assistance! Add tasks, set priorities, and get smart suggestions based on your behavior patterns.",
    descriptionAr: "خطط ليومك بمساعدة الذكاء الاصطناعي! أضف المهام، حدد الأولويات، واحصل على اقتراحات ذكية بناءً على أنماط سلوكك.",
    icon: CheckSquare,
  },
  {
    id: "habits",
    route: "/habits",
    titleEn: "Habit Tracker",
    titleAr: "متتبع العادات",
    descriptionEn: "Build lasting habits! Create daily habits, track your streaks, and watch your consistency grow over time.",
    descriptionAr: "ابنِ عادات دائمة! أنشئ عادات يومية، تتبع سلسلة إنجازاتك، وشاهد اتساقك ينمو مع الوقت.",
    icon: Heart,
  },
  {
    id: "reflections",
    route: "/reflections",
    titleEn: "Reflections",
    titleAr: "التأملات",
    descriptionEn: "Journal your thoughts! Answer daily reflection questions to gain self-awareness and track your emotional journey.",
    descriptionAr: "دوّن أفكارك! أجب على أسئلة التأمل اليومية لتكتسب وعياً ذاتياً وتتبع رحلتك العاطفية.",
    icon: MessageCircle,
  },
  {
    id: "insights",
    route: "/insights",
    titleEn: "Insights & Analytics",
    titleAr: "الرؤى والتحليلات",
    descriptionEn: "Understand yourself better! View detailed analytics about your productivity, mood patterns, and AI learning insights.",
    descriptionAr: "افهم نفسك بشكل أفضل! شاهد تحليلات مفصلة عن إنتاجيتك وأنماط مزاجك ورؤى التعلم بالذكاء الاصطناعي.",
    icon: BarChart3,
  },
  {
    id: "photos",
    route: "/photos",
    titleEn: "Photo Gallery",
    titleAr: "معرض الصور",
    descriptionEn: "Save your memories! Upload photos to document your journey and celebrate your achievements.",
    descriptionAr: "احفظ ذكرياتك! ارفع الصور لتوثيق رحلتك والاحتفال بإنجازاتك.",
    icon: Image,
  },
  {
    id: "profile",
    route: "/profile",
    titleEn: "Your Profile",
    titleAr: "ملفك الشخصي",
    descriptionEn: "Personalize your experience! Update your profile, set your goals, and adjust language and theme preferences.",
    descriptionAr: "خصص تجربتك! حدّث ملفك الشخصي، حدد أهدافك، واضبط تفضيلات اللغة والمظهر.",
    icon: User,
  },
];

interface InteractiveTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveTour = ({ isOpen, onClose }: InteractiveTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isRTL } = useLanguage();

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  // Navigate to current step's route
  useEffect(() => {
    if (isOpen && step && location.pathname !== step.route) {
      setIsNavigating(true);
      navigate(step.route);
      const timer = setTimeout(() => setIsNavigating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentStep, step, location.pathname, navigate]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      localStorage.setItem(TOUR_COMPLETED_KEY, "true");
      onClose();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, tourSteps.length - 1));
    }
  }, [isLastStep, onClose]);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSkip = useCallback(() => {
    localStorage.setItem(TOUR_COMPLETED_KEY, "true");
    onClose();
  }, [onClose]);

  const handleStepClick = useCallback((index: number) => {
    setCurrentStep(index);
  }, []);

  if (!isOpen) return null;

  const Icon = step.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with pulse effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Tour Card */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 sm:bottom-8 sm:left-auto sm:right-8 sm:w-[420px] z-50"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Progress bar */}
              <div className="h-1 bg-muted">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary via-accent to-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Header */}
              <div className="p-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {isRTL ? `الخطوة ${currentStep + 1} من ${tourSteps.length}` : `Step ${currentStep + 1} of ${tourSteps.length}`}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                >
                  {isRTL ? "تخطي الجولة" : "Skip Tour"}
                  <X className="h-3 w-3 ml-1" />
                </Button>
              </div>

              {/* Step indicators */}
              <div className="px-4 py-2 flex justify-center gap-2">
                {tourSteps.map((s, i) => (
                  <motion.button
                    key={s.id}
                    onClick={() => handleStepClick(i)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentStep
                        ? "w-6 bg-primary"
                        : i < currentStep
                        ? "bg-primary/50"
                        : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 pt-2"
                >
                  {/* Icon and Title */}
                  <div className="flex items-center gap-4 mb-3">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                    >
                      <Icon className="h-7 w-7 text-primary" />
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {isRTL ? step.titleAr : step.titleEn}
                      </h3>
                      <span className="text-xs text-muted-foreground font-mono">
                        {step.route}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {isRTL ? step.descriptionAr : step.descriptionEn}
                  </p>

                  {/* Celebration for last step */}
                  {isLastStep && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 p-3 bg-accent/10 rounded-lg mb-4"
                    >
                      <PartyPopper className="h-5 w-5 text-accent" />
                      <span className="text-sm font-medium text-accent">
                        {isRTL ? "أنت جاهز للبدء!" : "You're ready to start!"}
                      </span>
                    </motion.div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      onClick={handlePrev}
                      disabled={isFirstStep || isNavigating}
                      className="flex-1 gap-2"
                    >
                      {isRTL ? (
                        <>
                          <ChevronRight className="h-4 w-4" />
                          السابق
                        </>
                      ) : (
                        <>
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={isNavigating}
                      className="flex-1 gap-2"
                    >
                      {isLastStep ? (
                        isRTL ? "ابدأ الآن" : "Start Now"
                      ) : isRTL ? (
                        <>
                          التالي
                          <ChevronLeft className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Hook to manage tour state
export const useTour = () => {
  const [isTourOpen, setIsTourOpen] = useState(false);

  const startTour = useCallback(() => {
    setIsTourOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setIsTourOpen(false);
  }, []);

  const isTourCompleted = useCallback(() => {
    return localStorage.getItem(TOUR_COMPLETED_KEY) === "true";
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
  }, []);

  return {
    isTourOpen,
    startTour,
    closeTour,
    isTourCompleted,
    resetTour,
  };
};
