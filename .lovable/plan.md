
The user wants tests for the entire Insights system. Let me identify what to test:

**Insights system components:**
1. `Insights.tsx` page — fetches weekly tasks, computes streaks/days, renders chart
2. `learningSystem.ts` lib — `logBehavior`, `getLearningProfile`, `getBehaviorInsights`, `generateAdaptiveContext`, `calculateDailyBehavior`
3. `useLearningSystem.ts` hook — `useBehaviorTracking`, `useLearningProfile`, etc.
4. `LearningInsights.tsx` component — displays AI patterns
5. `analyze-behavior` edge function — backend logic for signals/adaptations
6. `PerformanceChart.tsx` — used in Insights page

**Test strategy:** Add Vitest setup (not yet in project) + Deno tests for edge function.

## Plan

### 1. Frontend testing setup
- Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` to devDependencies
- Create `vitest.config.ts`, `src/test/setup.ts` with mocks for `matchMedia`, `IntersectionObserver`, `ResizeObserver` (recharts needs it)

### 2. Pure logic tests (no mocks needed)
**`src/lib/__tests__/learningSystem.test.ts`** — test `generateAdaptiveContext`:
- Returns task volume + complexity lines
- Adds encouraging tone line when `recommended_tone === "encouraging"`
- Adds challenging tone line when `recommended_tone === "challenging"`
- Adds conservative/flexible structure lines
- Includes warnings for `overplanning_detected`, `task_complexity_too_high`, `consistent_time_failure`
- Lists peak productivity hours when present
- Includes interaction-based historical context when total_interactions > 10

### 3. Async lib tests with Supabase mock
**`src/lib/__tests__/learningSystem.async.test.ts`** — mock `@/integrations/supabase/client`:
- `logBehavior`: success path returns `{success, signals, adaptations}`; error returns `{success: false}`
- `getLearningProfile`: returns profile on success, null on error
- `getBehaviorInsights`: returns data on success, null on error
- `calculateDailyBehavior`: aggregates tasks (planned/completed counts), pulls mood at planning/completion, returns null when tasks query errors

### 4. Insights page component test
**`src/pages/__tests__/Insights.test.tsx`** — mock auth, language, supabase, PerformanceChart:
- Renders header "Your week" 
- Computes 7-day grid with correct completion counts per day
- Shows streak badge when current streak > 0, hides when 0
- Shows correct encouragement message for: 0 tasks, 6+ active days, 4-5 active days, 2-3 active days, 1 active day
- Marks today's row with the today label

### 5. Edge function test
**`supabase/functions/analyze-behavior/index.test.ts`** — Deno test using deployed function:
- Unauthenticated request → 401
- Invalid action → 400
- (Auth-gated tests skipped without test JWT — add `get_learning_profile` smoke call documentation)

### 6. Run all tests
- `vitest run` for frontend
- `deno test` via `supabase--test_edge_functions` for edge function

### Files to create
```
vitest.config.ts
src/test/setup.ts
src/lib/__tests__/learningSystem.test.ts
src/lib/__tests__/learningSystem.async.test.ts
src/pages/__tests__/Insights.test.tsx
supabase/functions/analyze-behavior/index.test.ts
```

### Files to update
```
package.json (add test deps + script)
tsconfig.app.json (add "vitest/globals" types)
```

### Coverage target
~25 test cases covering: pure helpers, Supabase-backed lib calls, React rendering of the Insights page, and edge function auth/validation. After implementation, run the suite and report pass/fail.
