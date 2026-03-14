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
  restartOnboarding: { en: "Redo Onboarding", ar: "إعادة الإعداد" },
  restartOnboardingDesc: { en: "Re-answer your goals and regenerate your plan", ar: "أعد الإجابة على أهدافك وأعد إنشاء خطتك" },
  restart: { en: "Restart", ar: "إعادة" },

  // Dashboard
  herePlanForToday: { en: "Here's your plan for today.", ar: "إليك خطتك لليوم." },
  commitmentScore: { en: "Commitment Score", ar: "درجة الالتزام" },
  greatConsistency: { en: "Great consistency — keep it up!", ar: "اتساق رائع — استمر!" },
  buildingMomentum: { en: "You're building momentum.", ar: "أنت تبني زخماً." },
  startSmall: { en: "Start small, stay consistent.", ar: "ابدأ صغيراً، وابقَ مستمراً." },
  ofCompleted: { en: "of", ar: "من" },
  noPlanYet: { en: "No plan for today yet.", ar: "لا توجد خطة لليوم بعد." },
  tasksAppearHere: { en: "Your tasks will appear here once generated.", ar: "ستظهر مهامك هنا بمجرد إنشائها." },
  work: { en: "Work", ar: "العمل" },
  life: { en: "Life", ar: "الحياة" },
  balance: { en: "Balance", ar: "التوازن" },

  // Weekly Planner
  planMyWeek: { en: "Plan My Week", ar: "خطط أسبوعك" },
  planMyWeekDesc: { en: "Create a structured weekly plan with AI", ar: "أنشئ خطة أسبوعية منظمة بالذكاء الاصطناعي" },
  weeklyPlanningTime: { en: "Time to Plan Your Week", ar: "حان وقت تخطيط أسبوعك" },
  weeklyPlanningDesc: { en: "Let's create a balanced, achievable plan for the week ahead.", ar: "لننشئ خطة متوازنة وقابلة للتحقيق للأسبوع القادم." },
  startPlanning: { en: "Start Planning", ar: "ابدأ التخطيط" },
  weeklyBrainDump: { en: "What do you want to get done this week?", ar: "ماذا تريد إنجازه هذا الأسبوع؟" },
  weeklyBrainDumpDesc: { en: "List everything on your mind — we'll organize it for you.", ar: "اكتب كل ما يدور في ذهنك — سننظمه لك." },
  weeklyBrainDumpPlaceholder: { en: "e.g. Study for math exam, exercise 3 times, finish project report, read a book chapter...", ar: "مثلاً: ادرس لامتحان الرياضيات، تمرين 3 مرات، أنهِ تقرير المشروع، اقرأ فصل كتاب..." },
  weeklyReflection: { en: "Quick Reflection", ar: "تأمل سريع" },
  weeklyReflectionDesc: { en: "Help us calibrate your plan based on last week.", ar: "ساعدنا في ضبط خطتك بناءً على الأسبوع الماضي." },
  didYouCompleteTasks: { en: "Did you complete most of your tasks last week?", ar: "هل أكملت معظم مهامك الأسبوع الماضي؟" },
  reflectionYes: { en: "Yes", ar: "نعم" },
  reflectionSome: { en: "Some", ar: "بعضها" },
  reflectionNotReally: { en: "Not really", ar: "ليس حقاً" },
  whatMadeDifficult: { en: "What made this week difficult?", ar: "ما الذي جعل هذا الأسبوع صعباً؟" },
  reflectionDifficultyPlaceholder: { en: "e.g. Too many deadlines, felt stressed, couldn't focus...", ar: "مثلاً: مواعيد نهائية كثيرة، شعرت بالتوتر، لم أستطع التركيز..." },
  generatePlan: { en: "Generate My Plan", ar: "أنشئ خطتي" },
  generatingWeeklyPlan: { en: "Building your weekly plan...", ar: "جاري بناء خطتك الأسبوعية..." },
  generatingWeeklyPlanDesc: { en: "Analyzing your goals and creating a balanced schedule", ar: "تحليل أهدافك وإنشاء جدول متوازن" },
  weeklyPlan: { en: "Weekly Plan", ar: "الخطة الأسبوعية" },
  tasksPlanned: { en: "tasks", ar: "مهمة" },
  commitmentLabel: { en: "Commitment", ar: "الالتزام" },
  replan: { en: "Replan", ar: "أعد التخطيط" },
  restDay: { en: "Rest & reflect", ar: "راحة وتأمل" },
  weeklyTopPriorities: { en: "Top Priorities", ar: "الأولويات القصوى" },
  weeklyPlanGenerated: { en: "Weekly plan ready!", ar: "الخطة الأسبوعية جاهزة!" },
  back: { en: "Back", ar: "رجوع" },
  next: { en: "Next", ar: "التالي" },

  // Insights
  yourWeek: { en: "Your week", ar: "أسبوعك" },
  consistencyOverPerfection: { en: "Consistency over perfection.", ar: "الاستمرارية أهم من الكمال." },
  dayStreak: { en: "day streak", ar: "يوم متتالي" },
  thisWeek: { en: "This week", ar: "هذا الأسبوع" },
  smallActionsChange: { en: "Small consistent actions create long-term change.", ar: "الإجراءات الصغيرة المستمرة تُحدث تغييراً طويل الأمد." },
  newWeekStart: { en: "A new week. Start whenever you're ready.", ar: "أسبوع جديد. ابدأ عندما تكون مستعداً." },
  incredibleConsistency: { en: "Incredible consistency. You showed up almost every day.", ar: "اتساق رائع. لقد حضرت تقريباً كل يوم." },
  strongWeek: { en: "Strong week. Your rhythm is building.", ar: "أسبوع قوي. إيقاعك يتشكل." },
  youShowedUp: { en: "You showed up. That matters more than you think.", ar: "لقد حضرت. هذا يعني أكثر مما تتخيل." },
  evenOneDayCounts: { en: "Even one day counts. Keep going.", ar: "حتى يوم واحد مهم. استمر." },
  todayLabel: { en: "Today", ar: "اليوم" },

  // Onboarding
  onboardingWelcomeTitle: { en: "Welcome to MindMate", ar: "مرحباً بك في مايند ميت" },
  onboardingWelcomeDesc: { en: "Mindmate helps you organize your day with small, realistic steps.\nAnswer two quick questions so we can create your first plan.", ar: "مايند ميت يساعدك على تنظيم يومك بخطوات صغيرة وواقعية.\nأجب على سؤالين سريعين لنتمكن من إنشاء خطتك الأولى." },
  onboardingStart: { en: "Start", ar: "ابدأ" },
  onboardingStepOf: { en: "of", ar: "من" },
  biggestProblem: { en: "What is your biggest problem right now?", ar: "ما هي أكبر مشكلة تواجهك الآن؟" },
  biggestProblemPlaceholder: { en: "e.g. I keep procrastinating studying...", ar: "مثلاً: أستمر في تأجيل الدراسة..." },
  mainGoalQuestion: { en: "What is your main goal right now?", ar: "ما هو هدفك الرئيسي الآن؟" },
  mainGoalPlaceholder: { en: "e.g. I want to focus on studying...", ar: "مثلاً: أريد التركيز على الدراسة..." },
  onboardingNext: { en: "Next", ar: "التالي" },
  buildMyPlan: { en: "Build my plan", ar: "ابنِ خطتي" },
  buildingYourPlan: { en: "Building your plan...", ar: "جاري بناء خطتك..." },
  analyzingGoals: { en: "Analyzing your goals and creating a realistic daily schedule", ar: "تحليل أهدافك وإنشاء جدول يومي واقعي" },
  planReady: { en: "Your first plan is ready", ar: "خطتك الأولى جاهزة" },
  startMyDay: { en: "Start my day", ar: "ابدأ يومي" },
  somethingWentWrong: { en: "Something went wrong", ar: "حدث خطأ ما" },
  pleaseTryAgain: { en: "Please try again.", ar: "يرجى المحاولة مرة أخرى." },

  // Auth
  joinMindMate: { en: "Join MindMate", ar: "انضم لمايند ميت" },
  welcomeBackAuth: { en: "Welcome Back", ar: "مرحباً بعودتك" },
  createAccountToStart: { en: "Create your account to get started", ar: "أنشئ حسابك للبدء" },
  signInToContinueJourney: { en: "Sign in to continue your journey", ar: "سجل دخولك لمتابعة رحلتك" },
  
  orContinueWithEmail: { en: "Or continue with email", ar: "أو المتابعة بالبريد الإلكتروني" },
  name: { en: "Name", ar: "الاسم" },
  yourNamePlaceholder: { en: "Your name", ar: "اسمك" },
  passwordRequirements: { en: "Must be 8+ characters with lowercase, number, and special character", ar: "يجب أن تكون 8+ أحرف مع حرف صغير ورقم ورمز خاص" },
  creatingAccountBtn: { en: "Creating account...", ar: "جاري إنشاء الحساب..." },
  createAccountBtn: { en: "Create Account", ar: "إنشاء حساب" },
  alreadyHaveAccountSignIn: { en: "Already have an account? Sign in", ar: "لديك حساب بالفعل؟ سجل دخولك" },
  dontHaveAccountSignUp: { en: "Don't have an account? Sign up", ar: "ليس لديك حساب؟ أنشئ حساباً" },
  accountCreated: { en: "Account Created!", ar: "تم إنشاء الحساب!" },
  accountCreatedDesc: { en: "Successfully created your account. You can now sign in.", ar: "تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول." },
  signInError: { en: "Sign In Error", ar: "خطأ في تسجيل الدخول" },
  signUpError: { en: "Sign Up Error", ar: "خطأ في إنشاء الحساب" },
  unexpectedError: { en: "An unexpected error occurred", ar: "حدث خطأ غير متوقع" },
  failedToSignOut: { en: "Failed to sign out", ar: "فشل في تسجيل الخروج" },

  // Guide Page
  guide: { en: "Guide", ar: "الدليل" },
  guideTitle: { en: "User Guide", ar: "دليل المستخدم" },
  guideSubtitle: { en: "Learn how to use MindMate to boost your productivity", ar: "تعلم كيفية استخدام مايند ميت لتعزيز إنتاجيتك" },
  guideGettingStarted: { en: "Getting Started", ar: "البداية" },
  guideStep1: { en: "Set your daily goals and priorities", ar: "حدد أهدافك وأولوياتك اليومية" },
  guideStep2: { en: "Add tasks to your daily planner", ar: "أضف المهام إلى مخططك اليومي" },
  guideStep3: { en: "Track your habits consistently", ar: "تتبع عاداتك باستمرار" },
  guideStep4: { en: "Chat with AI for motivation and support", ar: "تحدث مع الذكاء الاصطناعي للتحفيز والدعم" },
  guideFeaturesTitle: { en: "Features Overview", ar: "نظرة عامة على الميزات" },
  
  // Dashboard Guide
  guideDashboardTitle: { en: "Dashboard", ar: "لوحة التحكم" },
  guideDashboardDesc: { en: "Your central hub for daily productivity overview", ar: "مركزك الرئيسي لنظرة عامة على الإنتاجية اليومية" },
  guideDashboardTip1: { en: "View your daily tasks and progress at a glance", ar: "عرض مهامك اليومية وتقدمك بنظرة سريعة" },
  guideDashboardTip2: { en: "Check your current streak and motivation", ar: "تحقق من سلسلتك الحالية وتحفيزك" },
  guideDashboardTip3: { en: "Track your mood throughout the day", ar: "تتبع مزاجك طوال اليوم" },
  
  // Planner Guide
  guidePlannerTitle: { en: "Daily Planner", ar: "المخطط اليومي" },
  guidePlannerDesc: { en: "Plan and organize your daily tasks", ar: "خطط ونظم مهامك اليومية" },
  guidePlannerTip1: { en: "Add tasks with priorities (high, medium, low)", ar: "أضف مهام مع الأولويات (عالية، متوسطة، منخفضة)" },
  guidePlannerTip2: { en: "Check off tasks as you complete them", ar: "ضع علامة على المهام عند إكمالها" },
  guidePlannerTip3: { en: "Use AI to analyze your planner photos", ar: "استخدم الذكاء الاصطناعي لتحليل صور مخططك" },
  
  // Habits Guide
  guideHabitsTitle: { en: "Habits", ar: "العادات" },
  guideHabitsDesc: { en: "Build positive habits and track your streaks", ar: "ابنِ عادات إيجابية وتتبع سلسلاتك" },
  guideHabitsTip1: { en: "Create habits you want to build", ar: "أنشئ عادات تريد بناءها" },
  guideHabitsTip2: { en: "Mark habits complete daily to build streaks", ar: "ضع علامة على العادات يومياً لبناء السلاسل" },
  guideHabitsTip3: { en: "View your habit statistics and progress", ar: "عرض إحصائيات وتقدم عاداتك" },
  
  // Reflections Guide
  guideReflectionsTitle: { en: "Reflections", ar: "التأملات" },
  guideReflectionsDesc: { en: "Daily journaling for self-improvement", ar: "التدوين اليومي لتحسين الذات" },
  guideReflectionsTip1: { en: "Answer daily reflection questions", ar: "أجب على أسئلة التأمل اليومية" },
  guideReflectionsTip2: { en: "Review past reflections for insights", ar: "راجع التأملات السابقة للحصول على رؤى" },
  guideReflectionsTip3: { en: "Build a habit of gratitude and mindfulness", ar: "ابنِ عادة الامتنان واليقظة الذهنية" },
  
  // Insights Guide
  guideInsightsTitle: { en: "Insights", ar: "الرؤى" },
  guideInsightsDesc: { en: "View your productivity analytics", ar: "عرض تحليلات إنتاجيتك" },
  guideInsightsTip1: { en: "See weekly task completion statistics", ar: "عرض إحصائيات إكمال المهام الأسبوعية" },
  guideInsightsTip2: { en: "Track your most productive days", ar: "تتبع أيامك الأكثر إنتاجية" },
  guideInsightsTip3: { en: "Monitor your overall progress trends", ar: "راقب اتجاهات تقدمك العام" },
  
  // Photos Guide
  guidePhotosTitle: { en: "Photos", ar: "الصور" },
  guidePhotosDesc: { en: "Store and organize your memories", ar: "خزّن ونظم ذكرياتك" },
  guidePhotosTip1: { en: "Upload photos to your personal gallery", ar: "ارفع صوراً إلى معرضك الشخصي" },
  guidePhotosTip2: { en: "Keep visual records of your journey", ar: "احتفظ بسجلات مرئية لرحلتك" },
  
  // AI Guide
  guideAITitle: { en: "AI Assistant", ar: "المساعد الذكي" },
  guideAIDesc: { en: "Get personalized support and motivation", ar: "احصل على دعم وتحفيز مخصص" },
  guideAITip1: { en: "Ask questions about productivity", ar: "اطرح أسئلة عن الإنتاجية" },
  guideAITip2: { en: "Get motivational support and advice", ar: "احصل على دعم ونصائح تحفيزية" },
  guideAITip3: { en: "Upload images for AI analysis", ar: "ارفع صوراً لتحليل الذكاء الاصطناعي" },
  
  // Profile Guide
  guideProfileTitle: { en: "Profile", ar: "الملف الشخصي" },
  guideProfileDesc: { en: "Manage your account settings", ar: "إدارة إعدادات حسابك" },
  guideProfileTip1: { en: "Update your display name and bio", ar: "حدّث اسم العرض والنبذة عنك" },
  guideProfileTip2: { en: "Upload a profile picture", ar: "ارفع صورة شخصية" },
  guideProfileTip3: { en: "Toggle dark mode and language settings", ar: "بدّل الوضع الداكن وإعدادات اللغة" },
  
  // Pro Tips
  guideProTipsTitle: { en: "Pro Tips", ar: "نصائح احترافية" },
  guideProTip1: { en: "Start each day by setting your top 3 priorities", ar: "ابدأ كل يوم بتحديد أهم 3 أولويات" },
  guideProTip2: { en: "Complete habits at the same time daily for consistency", ar: "أكمل العادات في نفس الوقت يومياً للاستمرارية" },
  guideProTip3: { en: "Use reflections to track your emotional well-being", ar: "استخدم التأملات لتتبع صحتك النفسية" },
  guideProTip4: { en: "Review your insights weekly to spot patterns", ar: "راجع رؤاك أسبوعياً لاكتشاف الأنماط" },
  guideProTip5: { en: "Chat with AI when you need motivation or guidance", ar: "تحدث مع الذكاء الاصطناعي عندما تحتاج تحفيزاً أو توجيهاً" },
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
