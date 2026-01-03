import React from 'react';
import { Button } from '@/components/ui/button';
import { useOnboarding, ONBOARDING_STEPS } from '@/contexts/OnboardingContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles } from 'lucide-react';

export const OnboardingComplete: React.FC = () => {
  const { isOnboarding, currentStep, completeOnboarding } = useOnboarding();
  const { language } = useLanguage();

  const isActive = isOnboarding && currentStep === ONBOARDING_STEPS.COMPLETE;

  if (!isActive) return null;

  const translations = {
    en: {
      title: "You're all set.",
      subtitle: "Write → Upload → Grow.",
      button: "Start Using MindMate",
    },
    ar: {
      title: "أنت جاهز.",
      subtitle: "اكتب ← ارفع ← تطوّر.",
      button: "ابدأ استخدام مايند ميت",
    },
  };

  const t = translations[language];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 z-[9998]" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 fade-in duration-300">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-accent" />
          </div>

          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
            {t.title}
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8">
            {t.subtitle}
          </p>

          <Button
            onClick={completeOnboarding}
            size="lg"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium"
          >
            {t.button}
          </Button>
        </div>
      </div>
    </>
  );
};
