import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
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
  Lightbulb,
  Rocket
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureShowcase } from "@/components/guide/FeatureShowcase";

const Guide = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Home,
      title: t('guideDashboardTitle'),
      description: t('guideDashboardDesc'),
      tips: [t('guideDashboardTip1'), t('guideDashboardTip2'), t('guideDashboardTip3')],
      demoType: "mood" as const,
    },
    {
      icon: CheckSquare,
      title: t('guidePlannerTitle'),
      description: t('guidePlannerDesc'),
      tips: [t('guidePlannerTip1'), t('guidePlannerTip2'), t('guidePlannerTip3')],
      demoType: "tasks" as const,
    },
    {
      icon: Heart,
      title: t('guideHabitsTitle'),
      description: t('guideHabitsDesc'),
      tips: [t('guideHabitsTip1'), t('guideHabitsTip2'), t('guideHabitsTip3')],
      demoType: "habits" as const,
    },
    {
      icon: Brain,
      title: t('guideAITitle'),
      description: t('guideAIDesc'),
      tips: [t('guideAITip1'), t('guideAITip2'), t('guideAITip3')],
      demoType: "chat" as const,
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
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3"
        >
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-foreground mb-1 sm:mb-2">
              {t('guideTitle')}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t('guideSubtitle')}
            </p>
          </div>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-accent shrink-0" />
          </motion.div>
        </motion.div>

        {/* Getting Started - Animated Steps */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-border overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Rocket className="w-5 h-5 text-accent" />
                </motion.div>
                {t('guideGettingStarted')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {gettingStartedSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.15 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="flex items-start gap-3 p-4 bg-card/60 rounded-lg border border-border/50 cursor-default"
                  >
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.1, 1],
                        boxShadow: ["0 0 0 0 hsl(var(--accent)/0)", "0 0 0 8px hsl(var(--accent)/0.2)", "0 0 0 0 hsl(var(--accent)/0)"]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 text-accent font-bold text-sm shrink-0"
                    >
                      {index + 1}
                    </motion.div>
                    <div className="flex-1">
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity, delay: index * 0.3 }}
                      >
                        <step.icon className="w-5 h-5 text-primary mb-2" />
                      </motion.div>
                      <p className="text-sm text-foreground">{step.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Interactive Features Grid */}
        <div className="space-y-4">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl sm:text-2xl font-serif font-semibold text-foreground flex items-center gap-2"
          >
            <motion.div
              animate={{ rotate: [0, 20, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Lightbulb className="w-5 h-5 text-accent" />
            </motion.div>
            {t('guideFeaturesTitle')}
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full ml-2"
            >
              Interactive
            </motion.span>
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <FeatureShowcase
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                tips={feature.tips}
                demoType={feature.demoType}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* Pro Tips with Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Target className="w-5 h-5 text-accent" />
                </motion.div>
                {t('guideProTipsTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[1, 2, 3, 4, 5].map((num) => (
                  <motion.li 
                    key={num} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + num * 0.1 }}
                    whileHover={{ x: 4, backgroundColor: "hsl(var(--accent)/0.1)" }}
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg transition-colors cursor-default"
                  >
                    <motion.span 
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold shrink-0"
                    >
                      {num}
                    </motion.span>
                    <span className="text-sm text-foreground">{t(`guideProTip${num}`)}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Guide;
