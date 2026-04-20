import { describe, it, expect, vi, beforeEach } from "vitest";

const invokeMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: (...args: any[]) => invokeMock(...args) },
    from: (...args: any[]) => fromMock(...args),
  },
}));

import {
  logBehavior,
  getLearningProfile,
  getBehaviorInsights,
  calculateDailyBehavior,
} from "@/lib/learningSystem";

beforeEach(() => {
  invokeMock.mockReset();
  fromMock.mockReset();
});

describe("logBehavior", () => {
  it("returns success payload from edge function", async () => {
    invokeMock.mockResolvedValueOnce({
      data: { success: true, signals: ["overplanning_detected"], adaptations: { recommended_daily_tasks: 2 } },
      error: null,
    });
    const result = await logBehavior({ planned_tasks: 5, completed_tasks: 1, planned_date: "2026-04-20" });
    expect(result.success).toBe(true);
    expect(result.signals).toEqual(["overplanning_detected"]);
  });

  it("returns success:false when edge function errors", async () => {
    invokeMock.mockResolvedValueOnce({ data: null, error: new Error("boom") });
    const result = await logBehavior({ planned_tasks: 1, completed_tasks: 0, planned_date: "2026-04-20" });
    expect(result.success).toBe(false);
  });

  it("catches thrown errors", async () => {
    invokeMock.mockRejectedValueOnce(new Error("network"));
    const result = await logBehavior({ planned_tasks: 1, completed_tasks: 0, planned_date: "2026-04-20" });
    expect(result.success).toBe(false);
  });
});

describe("getLearningProfile", () => {
  it("returns profile from response", async () => {
    invokeMock.mockResolvedValueOnce({ data: { profile: { recommended_daily_tasks: 4 } }, error: null });
    const profile = await getLearningProfile();
    expect(profile).toEqual({ recommended_daily_tasks: 4 });
  });

  it("returns null on error", async () => {
    invokeMock.mockResolvedValueOnce({ data: null, error: new Error("x") });
    expect(await getLearningProfile()).toBeNull();
  });
});

describe("getBehaviorInsights", () => {
  it("returns insights data", async () => {
    invokeMock.mockResolvedValueOnce({ data: { logs: [], profile: null }, error: null });
    const result = await getBehaviorInsights();
    expect(result).toEqual({ logs: [], profile: null });
  });

  it("returns null on error", async () => {
    invokeMock.mockResolvedValueOnce({ data: null, error: new Error("nope") });
    expect(await getBehaviorInsights()).toBeNull();
  });
});

describe("calculateDailyBehavior", () => {
  function buildFromMock(tasksResp: any, moodsResp: any) {
    fromMock.mockImplementation((table: string) => {
      if (table === "tasks") {
        return {
          select: () => ({
            eq: () => ({
              gte: () => ({
                lte: () => Promise.resolve(tasksResp),
              }),
            }),
          }),
        };
      }
      if (table === "mood_entries") {
        return {
          select: () => ({
            eq: () => ({
              gte: () => ({
                order: () => ({
                  limit: () => Promise.resolve(moodsResp),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });
  }

  it("aggregates planned and completed counts", async () => {
    buildFromMock(
      {
        data: [
          { completed: true, updated_at: "2026-04-20T09:00:00Z", created_at: "2026-04-20T08:00:00Z" },
          { completed: false, created_at: "2026-04-20T08:30:00Z" },
          { completed: true, updated_at: "2026-04-20T10:00:00Z", created_at: "2026-04-20T08:45:00Z" },
        ],
        error: null,
      },
      { data: [{ mood_label: "calm" }, { mood_label: "tired" }], error: null }
    );

    const result = await calculateDailyBehavior("user-1");
    expect(result).not.toBeNull();
    expect(result!.planned_tasks).toBe(3);
    expect(result!.completed_tasks).toBe(2);
    expect(result!.mood_at_planning).toBe("calm");
    expect(result!.mood_at_completion).toBe("tired");
    expect(result!.tasks_completed_times).toHaveLength(2);
    expect(result!.tasks_skipped_times).toHaveLength(1);
  });

  it("returns null when tasks query errors", async () => {
    buildFromMock({ data: null, error: new Error("db") }, { data: [], error: null });
    const result = await calculateDailyBehavior("user-1");
    expect(result).toBeNull();
  });

  it("handles empty data gracefully", async () => {
    buildFromMock({ data: [], error: null }, { data: [], error: null });
    const result = await calculateDailyBehavior("user-1");
    expect(result).not.toBeNull();
    expect(result!.planned_tasks).toBe(0);
    expect(result!.completed_tasks).toBe(0);
  });
});
