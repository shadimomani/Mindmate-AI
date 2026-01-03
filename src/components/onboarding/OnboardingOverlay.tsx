import React from 'react';
import { OnboardingTooltip } from './OnboardingTooltip';
import { OnboardingComplete } from './OnboardingComplete';
import { ONBOARDING_STEPS } from '@/contexts/OnboardingContext';
import { useLanguage } from '@/contexts/LanguageContext';

export const OnboardingOverlay: React.FC = () => {
  const { language } = useLanguage();

  const translations = {
    en: {
      step1Title: "This is where everything starts.",
      step1Subtitle: "Upload a photo of your planner page.",
      step2Title: "Just take a clear photo.",
      step2Subtitle: "No typing required.",
      step3Title: "Each planner page has a unique code.",
      step3Subtitle: "This tells the AI exactly where you are.",
      step4Title: "This feedback is generated automatically",
      step4Subtitle: "from your planner page.",
      step5Title: "This is how MindMate tracks your growth over time.",
    },
    ar: {
      step1Title: "هنا يبدأ كل شيء.",
      step1Subtitle: "ارفع صورة من صفحة مخططك.",
      step2Title: "التقط صورة واضحة فقط.",
      step2Subtitle: "لا حاجة للكتابة.",
      step3Title: "لكل صفحة مخطط رمز فريد.",
      step3Subtitle: "هذا يخبر الذكاء الاصطناعي بموقعك بالضبط.",
      step4Title: "هذه التغذية الراجعة تُنشأ تلقائياً",
      step4Subtitle: "من صفحة مخططك.",
      step5Title: "هكذا يتتبع مايند ميت نموك بمرور الوقت.",
    },
  };

  const t = translations[language];

  return (
    <>
      {/* Step 1: Upload Button */}
      <OnboardingTooltip
        step={ONBOARDING_STEPS.UPLOAD_BUTTON}
        targetSelector="[data-onboarding='upload-button']"
        position="bottom"
        title={t.step1Title}
        subtitle={t.step1Subtitle}
      />

      {/* Step 2: Image Upload Area */}
      <OnboardingTooltip
        step={ONBOARDING_STEPS.IMAGE_UPLOAD_AREA}
        targetSelector="[data-onboarding='upload-area']"
        position="bottom"
        title={t.step2Title}
        subtitle={t.step2Subtitle}
      />

      {/* Step 3: Page Code Sample */}
      <OnboardingTooltip
        step={ONBOARDING_STEPS.PAGE_CODE_SAMPLE}
        targetSelector="[data-onboarding='page-code']"
        position="top"
        title={t.step3Title}
        subtitle={t.step3Subtitle}
      />

      {/* Step 4: AI Results (triggered after first upload) */}
      <OnboardingTooltip
        step={ONBOARDING_STEPS.AI_RESULTS}
        targetSelector="[data-onboarding='ai-results']"
        position="top"
        title={t.step4Title}
        subtitle={t.step4Subtitle}
      />

      {/* Step 5: Dashboard Progress */}
      <OnboardingTooltip
        step={ONBOARDING_STEPS.DASHBOARD_PROGRESS}
        targetSelector="[data-onboarding='dashboard-stats']"
        position="bottom"
        title={t.step5Title}
        isLast
      />

      {/* Final Modal */}
      <OnboardingComplete />
    </>
  );
};
