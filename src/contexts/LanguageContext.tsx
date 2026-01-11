import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const translations: Translations = {
  // Navigation
  dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
  dailyPlanner: { en: 'Daily Planner', ar: 'المخطط اليومي' },
  habits: { en: 'Habits', ar: 'العادات' },
  reflections: { en: 'Reflections', ar: 'التأملات' },
  insights: { en: 'Insights', ar: 'الرؤى' },
  photos: { en: 'Photos', ar: 'الصور' },
  profile: { en: 'Profile', ar: 'الملف الشخصي' },
  signOut: { en: 'Sign Out', ar: 'تسجيل الخروج' },
  
  // App name
  appName: { en: 'MindMate', ar: 'مايند ميت' },
  appTagline: { en: 'Your AI Productivity Companion', ar: 'رفيقك الذكي للإنتاجية' },
  aiAssistant: { en: 'AI Assistant', ar: 'المساعد الذكي' },
  alwaysHereToHelp: { en: 'Always here to help', ar: 'دائماً هنا للمساعدة' },
  
  // Greetings
  goodMorning: { en: 'Good morning', ar: 'صباح الخير' },
  goodAfternoon: { en: 'Good afternoon', ar: 'مساء الخير' },
  goodEvening: { en: 'Good evening', ar: 'مساء الخير' },
  makeProductiveDay: { en: "Let's make today productive and meaningful", ar: 'لنجعل هذا اليوم منتجاً وهادفاً' },
  
  // Dashboard
  tasksCompleted: { en: 'Tasks Completed', ar: 'المهام المكتملة' },
  currentStreak: { en: 'Current Streak', ar: 'السلسلة الحالية' },
  goalsThisWeek: { en: 'Goals This Week', ar: 'أهداف هذا الأسبوع' },
  productivity: { en: 'Productivity', ar: 'الإنتاجية' },
  days: { en: 'days', ar: 'يوم' },
  today: { en: 'today', ar: 'اليوم' },
  activeGoals: { en: 'active goals', ar: 'أهداف نشطة' },
  weeklyAverage: { en: 'weekly average', ar: 'المعدل الأسبوعي' },
  
  // Profile
  manageAccountSettings: { en: 'Manage your account settings', ar: 'إدارة إعدادات حسابك' },
  profilePicture: { en: 'Profile Picture', ar: 'صورة الملف الشخصي' },
  clickCameraToUpload: { en: 'Click the camera icon to upload a new photo', ar: 'اضغط على أيقونة الكاميرا لرفع صورة جديدة' },
  uploading: { en: 'Uploading...', ar: 'جاري الرفع...' },
  photoSpecs: { en: 'JPG, PNG, WEBP or GIF. Max 5MB.', ar: 'JPG, PNG, WEBP أو GIF. بحد أقصى 5 ميجابايت.' },
  personalInformation: { en: 'Personal Information', ar: 'المعلومات الشخصية' },
  displayName: { en: 'Display Name', ar: 'اسم العرض' },
  yourName: { en: 'Your name', ar: 'اسمك' },
  email: { en: 'Email', ar: 'البريد الإلكتروني' },
  emailCannotBeChanged: { en: 'Email cannot be changed', ar: 'لا يمكن تغيير البريد الإلكتروني' },
  bio: { en: 'Bio', ar: 'نبذة عنك' },
  tellUsAboutYourself: { en: 'Tell us about yourself...', ar: 'أخبرنا عن نفسك...' },
  characters: { en: 'characters', ar: 'حرف' },
  preferences: { en: 'Preferences', ar: 'التفضيلات' },
  emailNotifications: { en: 'Email Notifications', ar: 'إشعارات البريد الإلكتروني' },
  receiveUpdatesViaEmail: { en: 'Receive updates via email', ar: 'تلقي التحديثات عبر البريد' },
  darkMode: { en: 'Dark Mode', ar: 'الوضع الداكن' },
  toggleDarkMode: { en: 'Toggle dark mode theme', ar: 'تبديل السمة الداكنة' },
  language: { en: 'Language', ar: 'اللغة' },
  switchToArabic: { en: 'Switch to Arabic', ar: 'التبديل للعربية' },
  saveChanges: { en: 'Save Changes', ar: 'حفظ التغييرات' },
  saving: { en: 'Saving...', ar: 'جاري الحفظ...' },
  
  // Tasks
  todaysTasks: { en: "Today's Tasks", ar: 'مهام اليوم' },
  noTasksYet: { en: 'No tasks yet. Add your first task!', ar: 'لا توجد مهام بعد. أضف مهمتك الأولى!' },
  addTask: { en: 'Add task', ar: 'إضافة مهمة' },
  addNewTask: { en: 'Add New Task', ar: 'إضافة مهمة جديدة' },
  add: { en: 'Add', ar: 'إضافة' },
  todaysFocus: { en: "Today's Focus", ar: 'تركيز اليوم' },
  topPriorities: { en: 'Your top 3 priorities for today', ar: 'أهم 3 أولويات لليوم' },
  priority: { en: 'Priority', ar: 'الأولوية' },
  
  // Habits
  habitTracker: { en: 'Habit Tracker', ar: 'متتبع العادات' },
  addNewHabit: { en: 'Add New Habit', ar: 'إضافة عادة جديدة' },
  enterHabitName: { en: 'Enter habit name...', ar: 'أدخل اسم العادة...' },
  noHabitsYet: { en: 'No habits yet. Add your first habit!', ar: 'لا توجد عادات بعد. أضف عادتك الأولى!' },
  maxStreak: { en: 'Max Streak', ar: 'أطول سلسلة' },
  completionRate: { en: 'Completion Rate', ar: 'معدل الإنجاز' },
  activeHabits: { en: 'Active Habits', ar: 'العادات النشطة' },
  
  // Reflections
  dailyReflection: { en: 'Daily Reflection', ar: 'التأمل اليومي' },
  pastReflections: { en: 'Past Reflections', ar: 'التأملات السابقة' },
  noPastReflections: { en: 'No past reflections yet. Start journaling today!', ar: 'لا توجد تأملات سابقة. ابدأ التدوين اليوم!' },
  reflectOnYourDay: { en: 'Reflect on your day...', ar: 'تأمل في يومك...' },
  saveReflection: { en: 'Save Reflection', ar: 'حفظ التأمل' },
  
  // Insights
  yourProgress: { en: 'Your progress and analytics', ar: 'تقدمك وتحليلاتك' },
  weeklySummary: { en: 'Weekly Summary', ar: 'الملخص الأسبوعي' },
  mostProductiveDay: { en: 'Most Productive Day', ar: 'اليوم الأكثر إنتاجية' },
  averageMood: { en: 'Average Mood', ar: 'معدل المزاج' },
  tasksThisWeek: { en: 'Tasks This Week', ar: 'مهام هذا الأسبوع' },
  habitsThisWeek: { en: 'Habits This Week', ar: 'عادات هذا الأسبوع' },
  completed: { en: 'completed', ar: 'مكتملة' },
  
  // Mood
  moodTracker: { en: 'Mood Tracker', ar: 'متتبع المزاج' },
  howAreYouFeeling: { en: 'How are you feeling today?', ar: 'كيف تشعر اليوم؟' },
  
  // Photos
  photoGallery: { en: 'Photo Gallery', ar: 'معرض الصور' },
  uploadPhoto: { en: 'Upload Photo', ar: 'رفع صورة' },
  noPhotosYet: { en: 'No photos yet. Upload your first photo!', ar: 'لا توجد صور بعد. ارفع صورتك الأولى!' },
  
  // Auth
  welcomeBack: { en: 'Welcome back', ar: 'مرحباً بعودتك' },
  signInToContinue: { en: 'Sign in to continue your journey', ar: 'سجل دخولك لمتابعة رحلتك' },
  createAccount: { en: 'Create your account', ar: 'إنشاء حسابك' },
  startYourJourney: { en: 'Start your productivity journey today', ar: 'ابدأ رحلة إنتاجيتك اليوم' },
  continueWithGoogle: { en: 'Continue with Google', ar: 'المتابعة مع جوجل' },
  orContinueWith: { en: 'or continue with email', ar: 'أو المتابعة بالبريد الإلكتروني' },
  password: { en: 'Password', ar: 'كلمة المرور' },
  enterPassword: { en: 'Enter your password', ar: 'أدخل كلمة المرور' },
  signIn: { en: 'Sign In', ar: 'تسجيل الدخول' },
  signUp: { en: 'Sign Up', ar: 'إنشاء حساب' },
  signingIn: { en: 'Signing in...', ar: 'جاري تسجيل الدخول...' },
  creatingAccount: { en: 'Creating account...', ar: 'جاري إنشاء الحساب...' },
  dontHaveAccount: { en: "Don't have an account?", ar: 'ليس لديك حساب؟' },
  alreadyHaveAccount: { en: 'Already have an account?', ar: 'لديك حساب بالفعل؟' },
  
  // Common
  success: { en: 'Success', ar: 'نجاح' },
  error: { en: 'Error', ar: 'خطأ' },
  validationError: { en: 'Validation Error', ar: 'خطأ في التحقق' },
  loading: { en: 'Loading...', ar: 'جاري التحميل...' },
  
  // Quotes (Arabic translations)
  quote1: { 
    en: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    ar: "النجاح ليس نهائياً، والفشل ليس قاتلاً: الشجاعة للاستمرار هي ما يهم."
  },
  quote2: { 
    en: "The only way to do great work is to love what you do.",
    ar: "الطريقة الوحيدة لعمل شيء عظيم هي أن تحب ما تفعله."
  },
  quote3: { 
    en: "Success usually comes to those who are too busy to be looking for it.",
    ar: "النجاح عادة يأتي لمن هم مشغولون جداً للبحث عنه."
  },
  quote4: { 
    en: "Discipline is the bridge between goals and accomplishment.",
    ar: "الانضباط هو الجسر بين الأهداف والإنجاز."
  },
  quote5: { 
    en: "With self-discipline, most anything is possible.",
    ar: "بالانضباط الذاتي، كل شيء تقريباً ممكن."
  },
  quote6: { 
    en: "The pain of discipline is nothing like the pain of disappointment.",
    ar: "ألم الانضباط لا يُقارن بألم خيبة الأمل."
  },
  quote7: { 
    en: "A goal without a plan is just a wish.",
    ar: "الهدف بدون خطة هو مجرد أمنية."
  },
  quote8: { 
    en: "Set your goals high, and don't stop till you get there.",
    ar: "ضع أهدافك عالية، ولا تتوقف حتى تصل إليها."
  },
  quote9: { 
    en: "The future belongs to those who believe in the beauty of their dreams.",
    ar: "المستقبل يخص من يؤمنون بجمال أحلامهم."
  },
  quote10: { 
    en: "Trust in the Lord with all your heart and lean not on your own understanding.",
    ar: "توكل على الرب بكل قلبك ولا تعتمد على فهمك."
  },
  quote11: { 
    en: "I can do all things through Christ who strengthens me.",
    ar: "أستطيع كل شيء في المسيح الذي يقويني."
  },
  quote12: { 
    en: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you.",
    ar: "لأني عرفت الأفكار التي أنا مفتكر بها عنكم، يقول الرب، أفكار سلام لا شر."
  },
  quote13: { 
    en: "Commit your work to the Lord, and your plans will be established.",
    ar: "ألقِ على الرب أعمالك فتثبت أفكارك."
  },

  // Welcome Banner
  welcomeTitle: { en: "Welcome to MindMate!", ar: "مرحباً بك في مايند ميت!" },
  welcomeSubtitle: { en: "Here are a few tips to get started:", ar: "إليك بعض النصائح للبدء:" },
  tipTasks: { en: "Add tasks to stay organized", ar: "أضف مهام لتبقى منظماً" },
  tipHabits: { en: "Track habits to build routines", ar: "تتبع العادات لبناء روتين" },
  tipAI: { en: "Chat with AI for support", ar: "تحدث مع الذكاء الاصطناعي للدعم" },
  showWelcomeBanner: { en: "Welcome Banner", ar: "شريط الترحيب" },
  resetWelcomeBannerDescription: { en: "Show the welcome tips again on dashboard", ar: "إظهار نصائح الترحيب مرة أخرى في لوحة التحكم" },
  welcomeBannerReset: { en: "Welcome banner will appear on next dashboard visit", ar: "سيظهر شريط الترحيب في الزيارة القادمة للوحة التحكم" },
  reset: { en: "Reset", ar: "إعادة تعيين" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
