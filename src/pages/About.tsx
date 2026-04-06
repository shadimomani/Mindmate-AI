import { motion } from "framer-motion";
import { 
  Brain, 
  Target, 
  CheckCircle2, 
  TrendingDown, 
  Sparkles, 
  ArrowRight,
  BarChart3,
  Heart,
  MessageCircle,
  Zap,
  ShieldCheck,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  const problems = [
    {
      icon: TrendingDown,
      title: isRTL ? "الإفراط بالتخطيط" : "Over-planning",
      desc: isRTL
        ? "كثير ناس يحطوا ١٠+ مهام باليوم وما ينجزوا نص. هالشي يسبب إحباط وإحساس بالفشل."
        : "Many people plan 10+ tasks daily and finish half. This causes frustration and feelings of failure.",
    },
    {
      icon: Brain,
      title: isRTL ? "إرهاق القرارات" : "Decision Fatigue",
      desc: isRTL
        ? "كل يوم تقعد تفكر شو أسوي أول؟ شو الأهم؟ هالتفكير ياخذ من طاقتك قبل ما تبدأ."
        : "Every day you wonder: what should I do first? What's most important? This thinking drains your energy before you even start.",
    },
    {
      icon: Target,
      title: isRTL ? "غياب التوازن" : "Lack of Balance",
      desc: isRTL
        ? "نركز على الشغل وننسى حياتنا الشخصية وصحتنا. بعدين نحس بالاحتراق الوظيفي."
        : "We focus on work and forget our personal life and health. Then burnout hits.",
    },
  ];

  const solutions = [
    {
      icon: Zap,
      title: isRTL ? "٣ مهام فقط باليوم" : "Only 3 Tasks Per Day",
      desc: isRTL
        ? "النظام يحدد لك ٣ مهام بس. هالعدد مدروس علمياً — يخليك تنجز فعلياً وتحس بالإنجاز."
        : "The system limits you to just 3 tasks. This number is research-backed — it helps you actually finish and feel accomplished.",
    },
    {
      icon: ShieldCheck,
      title: isRTL ? "النظام يدير خطتك" : "The System Manages Your Plan",
      desc: isRTL
        ? "ما تحتاج تفكر شو تسوي. النظام يختار ويرتب مهامك تلقائياً عشان تقلل إرهاق القرارات."
        : "No need to think about what to do. The system picks and orders your tasks automatically to reduce decision fatigue.",
    },
    {
      icon: Heart,
      title: isRTL ? "٣ مجالات حياتية" : "3 Life Domains",
      desc: isRTL
        ? "كل خطة تغطي ثلاث مجالات: العمل، الحياة الشخصية، والتوازن. عشان ما تهمل أي جانب."
        : "Every plan covers three domains: Work, Personal Life, and Balance. So you never neglect any aspect.",
    },
  ];

  const howItWorks = [
    {
      step: 1,
      icon: MessageCircle,
      title: isRTL ? "أخبرنا عن أهدافك" : "Tell Us Your Goals",
      desc: isRTL
        ? "سجل دخولك وأجب على أسئلة بسيطة عن أهدافك وتحدياتك. النظام يفهم وضعك."
        : "Sign in and answer simple questions about your goals and challenges. The system understands your situation.",
    },
    {
      step: 2,
      icon: Sparkles,
      title: isRTL ? "نولّد خطتك بالذكاء الاصطناعي" : "We Generate Your AI Plan",
      desc: isRTL
        ? "الذكاء الاصطناعي يحلل إجاباتك ويبني لك خطة يومية/أسبوعية مخصصة وواقعية."
        : "AI analyzes your answers and builds a personalized, realistic daily/weekly plan for you.",
    },
    {
      step: 3,
      icon: CheckCircle2,
      title: isRTL ? "نفّذ وتابع تقدمك" : "Execute & Track Progress",
      desc: isRTL
        ? "كل يوم تشوف مهامك الثلاث. أنجزها وسجل مزاجك. النظام يتعلم منك ويتحسن."
        : "Each day you see your 3 tasks. Complete them and log your mood. The system learns from you and improves.",
    },
    {
      step: 4,
      icon: BarChart3,
      title: isRTL ? "شوف تحليلاتك" : "See Your Insights",
      desc: isRTL
        ? "تحليلات سلوكية تبين لك أنماطك، أوقات ذروتك، ومعدل التزامك. تتطور بدون ضغط."
        : "Behavioral analytics show your patterns, peak hours, and commitment rate. Grow without pressure.",
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-secondary/20" />
        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-accent/15 text-accent-foreground px-4 py-1.5 rounded-full text-sm font-medium border border-accent/20"
          >
            <Brain className="w-4 h-4" />
            {isRTL ? "مساعدك الذكي للإنتاجية" : "Your Smart Productivity Assistant"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-tight"
          >
            {isRTL ? (
              <>أقل مهام. <span className="text-accent">أكثر إنجاز.</span></>
            ) : (
              <>Fewer Tasks. <span className="text-accent">More Done.</span></>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-xl mx-auto"
          >
            {isRTL
              ? "MindMate يساعدك تنجز بذكاء مش بكثرة. نظام مبني على علم النفس والذكاء الاصطناعي يخطط يومك بثلاث مهام فقط."
              : "MindMate helps you achieve smarter, not harder. A system built on psychology and AI that plans your day with just three tasks."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
            >
              {isRTL ? "ابدأ الآن" : "Get Started"}
              {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="px-4 py-16 bg-card/50">
        <div className="max-w-4xl mx-auto space-y-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center space-y-2"
          >
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              {isRTL ? "المشكلة يلي بنحلها" : "The Problem We Solve"}
            </h2>
            <p className="text-muted-foreground">
              {isRTL ? "ليش أغلب أنظمة الإنتاجية ما بتنفع؟" : "Why do most productivity systems fail?"}
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-3">
            {problems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl bg-destructive/5 border border-destructive/15 space-y-3"
              >
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center space-y-2"
          >
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              {isRTL ? "كيف MindMate بيحل هالمشاكل؟" : "How MindMate Solves This"}
            </h2>
            <p className="text-muted-foreground">
              {isRTL ? "فلسفتنا بسيطة: أقل = أكثر" : "Our philosophy is simple: less = more"}
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-3">
            {solutions.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl bg-accent/5 border border-accent/20 space-y-3"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Sequential Steps */}
      <section className="px-4 py-16 bg-card/50">
        <div className="max-w-3xl mx-auto space-y-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center space-y-2"
          >
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              {isRTL ? "كيف تستخدم MindMate؟" : "How to Use MindMate"}
            </h2>
            <p className="text-muted-foreground">
              {isRTL ? "٤ خطوات بسيطة وتبدأ رحلتك" : "4 simple steps to start your journey"}
            </p>
          </motion.div>

          <div className="relative space-y-0">
            {/* Connecting line */}
            <div className={`absolute top-0 bottom-0 ${isRTL ? 'right-6' : 'left-6'} w-0.5 bg-border sm:${isRTL ? 'right-8' : 'left-8'}`} />

            {howItWorks.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative flex gap-4 sm:gap-6 py-6"
              >
                {/* Step number circle */}
                <div className="relative z-10 shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                  <span className="text-lg sm:text-xl font-bold">{item.step}</span>
                </div>

                {/* Content */}
                <div className="flex-1 pt-1 sm:pt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-5 h-5 text-accent" />
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center space-y-6 p-8 rounded-2xl bg-gradient-to-br from-primary/5 via-accent/10 to-secondary/10 border border-accent/20"
        >
          <Sparkles className="w-10 h-10 text-accent mx-auto" />
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            {isRTL ? "جاهز تبدأ؟" : "Ready to Start?"}
          </h2>
          <p className="text-muted-foreground">
            {isRTL
              ? "سجل الآن وخلي MindMate يساعدك تنجز أكثر بضغط أقل."
              : "Sign up now and let MindMate help you achieve more with less stress."}
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg"
          >
            {isRTL ? "سجل مجاناً" : "Sign Up Free"}
            {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        </motion.div>
      </section>
    </div>
  );
};

export default About;
