import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { X } from 'lucide-react';

interface OnboardingTooltipProps {
  step: number;
  targetSelector?: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  title: string;
  subtitle?: string;
  isLast?: boolean;
}

export const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({
  step,
  targetSelector,
  children,
  position = 'bottom',
  title,
  subtitle,
  isLast = false,
}) => {
  const { isOnboarding, currentStep, nextStep, completeOnboarding, skipOnboarding } = useOnboarding();
  const { language } = useLanguage();
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const isActive = isOnboarding && currentStep === step;

  useEffect(() => {
    if (!isActive || !targetSelector) return;

    const updatePosition = () => {
      const target = document.querySelector(targetSelector);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      setTargetRect(rect);

      const tooltipWidth = 320;
      const tooltipHeight = 140;
      const padding = 16;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - tooltipHeight - padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - padding;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + padding;
          break;
      }

      // Keep tooltip in viewport
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

      setTooltipPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, targetSelector, position]);

  if (!isActive) return null;

  const translations = {
    en: {
      next: 'Next',
      finish: 'Finish',
      skip: 'Skip',
    },
    ar: {
      next: 'التالي',
      finish: 'إنهاء',
      skip: 'تخطي',
    },
  };

  const t = translations[language];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[9998]" onClick={skipOnboarding} />

      {/* Highlight cutout */}
      {targetRect && (
        <div
          className="fixed z-[9999] rounded-lg ring-4 ring-accent ring-offset-2 ring-offset-background pointer-events-none animate-pulse"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[10000] w-80 bg-card border border-border rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <button
          onClick={skipOnboarding}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="space-y-3">
          <div className="pr-6">
            <p className="text-foreground font-medium leading-relaxed">{title}</p>
            {subtitle && (
              <p className="text-foreground/80 text-sm mt-1">{subtitle}</p>
            )}
          </div>

          {children}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={skipOnboarding}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.skip}
            </button>
            
            <Button
              onClick={isLast ? completeOnboarding : nextStep}
              size="sm"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isLast ? t.finish : t.next}
            </Button>
          </div>

          {/* Step indicator */}
          <div className="flex justify-center gap-1.5 pt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${
                  s === step ? 'bg-accent' : s < step ? 'bg-accent/50' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
