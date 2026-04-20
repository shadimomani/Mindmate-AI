import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { format, subDays } from "date-fns";

// ── Mocks ───────────────────────────────────────────────────────────────
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@/components/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/dashboard/PerformanceChart", () => ({
  PerformanceChart: () => <div data-testid="performance-chart" />,
}));

const tasksFixture: { completed: boolean; created_at: string }[] = [];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          gte: () => Promise.resolve({ data: tasksFixture, error: null }),
        }),
      }),
    }),
  },
}));

// Translations passthrough — return the key so we can assert deterministically
vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: "en",
    isRTL: false,
    setLanguage: () => {},
  }),
}));

import Insights from "@/pages/Insights";

function setTasks(tasks: { completed: boolean; created_at: string }[]) {
  tasksFixture.length = 0;
  tasksFixture.push(...tasks);
}

beforeEach(() => {
  setTasks([]);
});

describe("Insights page", () => {
  it("renders the header and description", async () => {
    render(<Insights />);
    await waitFor(() => {
      expect(screen.getByText("yourWeek")).toBeInTheDocument();
      expect(screen.getByText("consistencyOverPerfection")).toBeInTheDocument();
    });
  });

  it("renders the embedded performance chart", async () => {
    render(<Insights />);
    expect(await screen.findByTestId("performance-chart")).toBeInTheDocument();
  });

  it("shows newWeekStart encouragement when no tasks completed", async () => {
    setTasks([]);
    render(<Insights />);
    await waitFor(() => {
      expect(screen.getByText("newWeekStart")).toBeInTheDocument();
    });
  });

  it("shows youShowedUp encouragement for 2-3 active days", async () => {
    const today = new Date();
    setTasks([
      { completed: true, created_at: subDays(today, 1).toISOString() },
      { completed: true, created_at: subDays(today, 3).toISOString() },
    ]);
    render(<Insights />);
    await waitFor(() => {
      expect(screen.getByText("youShowedUp")).toBeInTheDocument();
    });
  });

  it("shows strongWeek encouragement for 4-5 active days", async () => {
    const today = new Date();
    const tasks = [0, 1, 2, 3].map((i) => ({
      completed: true,
      created_at: subDays(today, i).toISOString(),
    }));
    setTasks(tasks);
    render(<Insights />);
    await waitFor(() => {
      expect(screen.getByText("strongWeek")).toBeInTheDocument();
    });
  });

  it("shows incredibleConsistency for 6+ active days", async () => {
    const today = new Date();
    const tasks = [0, 1, 2, 3, 4, 5].map((i) => ({
      completed: true,
      created_at: subDays(today, i).toISOString(),
    }));
    setTasks(tasks);
    render(<Insights />);
    await waitFor(() => {
      expect(screen.getByText("incredibleConsistency")).toBeInTheDocument();
    });
  });

  it("renders streak badge when current streak > 0", async () => {
    setTasks([{ completed: true, created_at: new Date().toISOString() }]);
    render(<Insights />);
    await waitFor(() => {
      expect(screen.getByText(/day Streak|dayStreak/i)).toBeInTheDocument();
    });
  });

  it("hides streak badge when nothing completed today", async () => {
    setTasks([
      { completed: true, created_at: subDays(new Date(), 3).toISOString() },
    ]);
    render(<Insights />);
    await waitFor(() => {
      expect(screen.getByText("yourWeek")).toBeInTheDocument();
    });
    expect(screen.queryByText(/dayStreak/)).toBeNull();
  });

  it("marks today's row with the today label", async () => {
    setTasks([{ completed: true, created_at: new Date().toISOString() }]);
    render(<Insights />);
    await waitFor(() => {
      expect(screen.getByText("todayLabel")).toBeInTheDocument();
    });
  });

  it("renders 7 day labels (one per weekday)", async () => {
    render(<Insights />);
    await waitFor(() => {
      const labels = Array.from({ length: 7 }, (_, i) =>
        format(subDays(new Date(), 6 - i), "EEE")
      );
      labels.forEach((label) => {
        expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
