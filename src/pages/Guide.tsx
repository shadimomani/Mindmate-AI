import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  BookOpen, 
  Home, 
  CheckSquare, 
  Heart, 
  MessageCircle, 
  BarChart3, 
  Image, 
  User, 
  Brain,
  Sparkles,
  Target,
  Lightbulb
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Guide = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Home,
      title: t('guideDashboardTitle'),
      description: t('guideDashboardDesc'),
      tips: [t('guideDashboardTip1'), t('guideDashboardTip2'), t('guideDashboardTip3')],
    },
    {
      icon: CheckSquare,
      title: t('guidePlannerTitle'),
      description: t('guidePlannerDesc'),
      tips: [t('guidePlannerTip1'), t('guidePlannerTip2'), t('guidePlannerTip3')],
    },
    {
      icon: Heart,
      title: t('guideHabitsTitle'),
      description: t('guideHabitsDesc'),
      tips: [t('guideHabitsTip1'), t('guideHabitsTip2'), t('guideHabitsTip3')],
    },
    {
      icon: MessageCircle,
      title: t('guideReflectionsTitle'),
      description: t('guideReflectionsDesc'),
      tips: [t('guideReflectionsTip1'), t('guideReflectionsTip2'), t('guideReflectionsTip3')],
    },
    {
      icon: BarChart3,
      title: t('guideInsightsTitle'),
      description: t('guideInsightsDesc'),
      tips: [t('guideInsightsTip1'), t('guideInsightsTip2'), t('guideInsightsTip3')],
    },
    {
      icon: Image,
      title: t('guidePhotosTitle'),
      description: t('guidePhotosDesc'),
      tips: [t('guidePhotosTip1'), t('guidePhotosTip2')],
    },
    {
      icon: Brain,
      title: t('guideAITitle'),
      description: t('guideAIDesc'),
      tips: [t('guideAITip1'), t('guideAITip2'), t('guideAITip3')],
    },
    {
      icon: User,
      title: t('guideProfileTitle'),
      description: t('guideProfileDesc'),
      tips: [t('guideProfileTip1'), t('guideProfileTip2'), t('guideProfileTip3')],
    },
  ];

  const gettingStartedSteps = [
    { icon: Target, text: t('guideStep1') },
    { icon: CheckSquare, text: t('guideStep2') },
    { icon: Heart, text: t('guideStep3') },
    { icon: Brain, text: t('guideStep4') },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-foreground mb-1 sm:mb-2">
              {t('guideTitle')}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t('guideSubtitle')}
            </p>
          </div>
          <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-accent shrink-0" />
        </div>

        {/* Getting Started */}
        <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Sparkles className="w-5 h-5 text-accent" />
              {t('guideGettingStarted')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {gettingStartedSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-card/60 rounded-lg border border-border/50"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent font-bold text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <step.icon className="w-5 h-5 text-primary mb-2" />
                    <p className="text-sm text-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-serif font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-accent" />
            {t('guideFeaturesTitle')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card border-border hover:shadow-soft transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base sm:text-lg">
                    <div className="p-2 bg-accent/20 rounded-lg">
                      <feature.icon className="w-5 h-5 text-accent" />
                    </div>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-accent mt-1">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pro Tips */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Target className="w-5 h-5 text-accent" />
              {t('guideProTipsTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[1, 2, 3, 4, 5].map((num) => (
                <li key={num} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold shrink-0">
                    {num}
                  </span>
                  <span className="text-sm text-foreground">{t(`guideProTip${num}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Guide;
