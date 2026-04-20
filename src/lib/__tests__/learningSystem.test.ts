import { describe, it, expect } from "vitest";
import { generateAdaptiveContext, type LearningProfile } from "@/lib/learningSystem";

const baseProfile: LearningProfile = {
  recommended_daily_tasks: 3,
  recommended_tone: "balanced",
  recommended_structure: "standard",
  optimal_task_complexity: "medium",
  overplanning_detected: false,
  undercommitment_detected: false,
  motivation_drop_pattern: false,
  consistent_time_failure: false,
  task_complexity_too_high: false,
  optimistic_bias: false,
  avg_completion_rate: 0,
  avg_commitment_accuracy: 0,
  peak_productivity_hours: [],
  low_productivity_hours: [],
  total_interactions: 0,
};

describe("generateAdaptiveContext", () => {
  it("includes recommended task volume and complexity", () => {
    const out = generateAdaptiveContext(baseProfile);
    expect(out).toContain("optimal daily task count: 3");
    expect(out).toContain("Recommended task complexity: medium");
  });

  it("adds encouraging tone messaging", () => {
    const out = generateAdaptiveContext({ ...baseProfile, recommended_tone: "encouraging" });
    expect(out.toLowerCase()).toContain("encouraging");
  });

  it("adds challenging tone messaging when undercommitting", () => {
    const out = generateAdaptiveContext({ ...baseProfile, recommended_tone: "challenging" });
    expect(out.toLowerCase()).toContain("ambitious");
  });

  it("adds conservative structure note", () => {
    const out = generateAdaptiveContext({ ...baseProfile, recommended_structure: "conservative" });
    expect(out.toLowerCase()).toContain("conservative");
  });

  it("adds flexible structure note", () => {
    const out = generateAdaptiveContext({ ...baseProfile, recommended_structure: "flexible" });
    expect(out.toLowerCase()).toContain("flexible");
  });

  it("warns when overplanning detected", () => {
    const out = generateAdaptiveContext({ ...baseProfile, overplanning_detected: true });
    expect(out).toContain("overplans");
  });

  it("warns when task complexity too high", () => {
    const out = generateAdaptiveContext({ ...baseProfile, task_complexity_too_high: true });
    expect(out.toLowerCase()).toContain("too complex");
  });

  it("lists low productivity hours when consistent time failure", () => {
    const out = generateAdaptiveContext({
      ...baseProfile,
      consistent_time_failure: true,
      low_productivity_hours: [14, 15],
    });
    expect(out).toContain("14");
    expect(out).toContain("15");
  });

  it("lists peak productivity hours when present", () => {
    const out = generateAdaptiveContext({
      ...baseProfile,
      peak_productivity_hours: [9, 10],
    });
    expect(out).toContain("9");
    expect(out).toContain("10");
  });

  it("includes historical context after enough interactions", () => {
    const out = generateAdaptiveContext({
      ...baseProfile,
      total_interactions: 25,
      avg_completion_rate: 72.5,
    });
    expect(out).toContain("25 interactions");
    expect(out).toContain("72.5");
  });

  it("omits historical context when interactions <= 10", () => {
    const out = generateAdaptiveContext({ ...baseProfile, total_interactions: 5 });
    expect(out).not.toContain("interactions, average");
  });
});
