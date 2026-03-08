import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PHRASES = [
  { en: "Small steps today make a big difference tomorrow.", ar: "خطوة صغيرة اليوم تصنع فرقًا كبيرًا غدًا." },
  { en: "Progress matters more than speed — keep going.", ar: "تقدمك أهم من السرعة — استمر." },
  { en: "Every moment is an investment in yourself.", ar: "كل لحظة هي استثمار في نفسك." },
  { en: "You are stronger than any challenge you face today.", ar: "أنت أقوى من أي تحدٍّ تواجهه اليوم." },
  { en: "Consistency is the bridge between goals and results.", ar: "الاستمرارية هي الجسر بين الأهداف والنتائج." },
  { en: "You don't have to be perfect, just keep showing up.", ar: "لا تحتاج أن تكون مثاليًا، فقط استمر بالحضور." },
  { en: "Your future self will thank you for today's effort.", ar: "نسختك المستقبلية ستشكرك على جهد اليوم." },
  { en: "One task at a time — you've got this.", ar: "مهمة واحدة في كل مرة — أنت قادر." },
  { en: "Believe in the power of small daily actions.", ar: "آمن بقوة الأفعال الصغيرة اليومية." },
  { en: "Rest if you must, but don't quit.", ar: "استرح إن أردت، لكن لا تستسلم." },
  { en: "Today's discipline is tomorrow's freedom.", ar: "انضباط اليوم هو حرية الغد." },
  { en: "Focus on what you can control right now.", ar: "ركّز على ما يمكنك التحكم فيه الآن." },
  { en: "Great things are built one day at a time.", ar: "الأشياء العظيمة تُبنى يومًا بعد يوم." },
  { en: "Be proud of how far you've come.", ar: "كن فخورًا بما حققته حتى الآن." },
  { en: "A little progress each day adds up to big results.", ar: "تقدم بسيط كل يوم يتراكم ليصبح نتائج كبيرة." },
  { en: "You're doing better than you think.", ar: "أنت أفضل مما تظن." },
  { en: "Stay patient — growth takes time.", ar: "تحلَّ بالصبر — النمو يحتاج وقتًا." },
  { en: "Each new hour is a fresh start.", ar: "كل ساعة جديدة هي بداية جديدة." },
  { en: "Your effort today shapes your tomorrow.", ar: "جهدك اليوم يشكّل غدك." },
  { en: "Keep your goals close and your doubts far.", ar: "أبقِ أهدافك قريبة وشكوكك بعيدة." },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, language, last_reminder_phrase");

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No users to notify" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let sentCount = 0;

    for (const profile of profiles) {
      // Get user email from auth
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);
      if (authError || !authUser?.user?.email) continue;

      const email = authUser.user.email;
      const lang = profile.language || "en";
      const phraseIndex = (profile.last_reminder_phrase ?? 0) % PHRASES.length;
      const nextIndex = (phraseIndex + 1) % PHRASES.length;
      const phrase = PHRASES[phraseIndex];

      // Fetch today's incomplete tasks
      const today = new Date().toISOString().split("T")[0];
      const { data: tasks } = await supabase
        .from("tasks")
        .select("title, priority")
        .eq("user_id", profile.id)
        .eq("completed", false)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)
        .order("sort_order", { ascending: true })
        .limit(10);

      const taskList = tasks && tasks.length > 0
        ? tasks.map((t, i) => `<li style="margin-bottom:6px;color:#374151;">${i + 1}. ${t.title}${t.priority ? ` <span style="color:#9ca3af;font-size:12px;">(${t.priority})</span>` : ""}</li>`).join("")
        : null;

      const isAr = lang === "ar";
      const subject = isAr ? "تذكيرك من MindMate 💪" : "Your MindMate Reminder 💪";
      const tasksHeader = isAr ? "مهامك المعلّقة:" : "Your pending tasks:";
      const noTasksMsg = isAr ? "لا توجد مهام معلّقة — يوم رائع! 🎉" : "No pending tasks — great day! 🎉";
      const ctaText = isAr ? "افتح MindMate" : "Open MindMate";
      const dir = isAr ? "rtl" : "ltr";

      const html = `
<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <h2 style="color:#6366f1;margin:0;font-size:22px;">MindMate</h2>
    </div>
    <div style="background:#f0f0ff;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <p style="font-size:18px;font-weight:600;color:#312e81;margin:0;line-height:1.6;">
        "${isAr ? phrase.ar : phrase.en}"
      </p>
    </div>
    ${taskList ? `
    <div style="margin-bottom:24px;">
      <h3 style="color:#1f2937;font-size:16px;margin-bottom:12px;">${tasksHeader}</h3>
      <ul style="list-style:none;padding:0;margin:0;">${taskList}</ul>
    </div>` : `<p style="text-align:center;color:#6b7280;margin-bottom:24px;">${noTasksMsg}</p>`}
    <div style="text-align:center;">
      <a href="https://sage-mind-assistant.lovable.app/dashboard" style="display:inline-block;background:#6366f1;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        ${ctaText}
      </a>
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">MindMate — ${isAr ? "رفيقك الذكي" : "Your Smart Companion"}</p>
  </div>
</body>
</html>`;

      // Send via Resend (rate limit: 2/sec, so wait 600ms between sends)
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "MindMate <noreply@mindmate.ai>",
          to: [email],
          subject,
          html,
        }),
      });

      if (res.ok) {
        sentCount++;
        await supabase
          .from("profiles")
          .update({ last_reminder_phrase: nextIndex })
          .eq("id", profile.id);
      } else {
        const errBody = await res.text();
        console.error(`Failed to send to ${email}:`, errBody);
      }

      // Respect Resend rate limit
      await sleep(600);
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, total: profiles.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-reminders error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
