

## Smart Reminder System — Email Every 5 Hours

### What It Does
Sends an email reminder to each user every 5 hours (08:00, 13:00, 18:00, 23:00 UTC) containing:
- A varied motivational phrase (in user's preferred language)
- Their pending/incomplete tasks for the day
- Clean, quick-to-read formatting

### Architecture

```text
pg_cron (every 5 hours)
  → calls DB function
    → invokes Edge Function "send-reminders"
      → fetches users + their incomplete tasks
      → picks a motivational phrase (rotating, no repeats)
      → sends email via Resend (mindmate.ai domain already configured)
```

### Implementation Steps

**1. Database: Add `language` and `last_reminder_phrase` columns to `profiles`**
- `language TEXT DEFAULT 'en'` — so the edge function knows which language to use
- `last_reminder_phrase INT DEFAULT 0` — tracks last used phrase index to avoid repeats

**2. Update Profile page** — save language preference to DB when toggled (currently only saved to localStorage)

**3. Create Edge Function `send-reminders`**
- Fetches all users from `profiles` with their email from `auth.users`
- For each user: queries incomplete `tasks` for today
- Selects next motivational phrase (rotating index, stored in `last_reminder_phrase`)
- Sends a formatted HTML email via Resend using the existing `mindmate.ai` domain
- Updates `last_reminder_phrase` in profile
- 20+ motivational phrases in both English and Arabic

**4. Set up pg_cron schedule**
- Database migration to enable `pg_cron` and create a job that calls `net.http_post` to the edge function every 5 hours

**5. Edge Function config**
- Add `[functions.send-reminders]` with `verify_jwt = false` (called by cron, not user)

### No Additional Secrets Needed
The project already has the `mindmate.ai` email domain configured. The edge function will use the existing `SUPABASE_SERVICE_ROLE_KEY` to query users and Resend integration for email delivery.

### Email Format
```
Subject: "Your MindMate Reminder 💪" / "تذكيرك من MindMate 💪"

Body:
- Motivational phrase (bold, centered)
- "Your pending tasks:" section with task list
- Link to open the app
- Clean, minimal design matching app branding
```

