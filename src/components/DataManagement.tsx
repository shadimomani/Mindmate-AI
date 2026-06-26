import { useState } from "react";
import { Download, Upload, Shield, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function DataManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchAllData = async () => {
    if (!user) return null;

    const [tasks, goals, habits, moods, reflections, analyses] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id),
      supabase.from("user_goals").select("*").eq("user_id", user.id),
      supabase.from("habits").select("*").eq("user_id", user.id),
      supabase.from("mood_entries").select("*").eq("user_id", user.id),
      supabase.from("reflections").select("*").eq("user_id", user.id),
      supabase.from("planner_analyses").select("*").eq("user_id", user.id),
    ]);

    return {
      exported_at: new Date().toISOString(),
      version: "1.0",
      tasks: tasks.data || [],
      goals: goals.data || [],
      habits: habits.data || [],
      mood_entries: moods.data || [],
      reflections: reflections.data || [],
      planner_analyses: analyses.data || [],
    };
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportJSON = async () => {
    setExporting(true);
    try {
      const data = await fetchAllData();
      if (!data) throw new Error("No data");
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, `mindmate-backup-${new Date().toISOString().split("T")[0]}.json`, "application/json");
      toast({ title: "Export complete", description: "Your data has been downloaded as JSON." });
    } catch {
      toast({ title: "Export failed", description: "Could not export your data.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const data = await fetchAllData();
      if (!data) throw new Error("No data");

      // Convert tasks to CSV
      const taskHeaders = ["id", "title", "completed", "category", "priority", "estimated_time", "created_at"];
      const taskRows = data.tasks.map((t: any) => taskHeaders.map(h => `"${String(t[h] ?? "").replace(/"/g, '""')}"`).join(","));
      const tasksCSV = [taskHeaders.join(","), ...taskRows].join("\n");

      // Convert habits to CSV
      const habitHeaders = ["id", "name", "description", "frequency", "streak", "completed_today", "created_at"];
      const habitRows = data.habits.map((h: any) => habitHeaders.map(k => `"${String(h[k] ?? "").replace(/"/g, '""')}"`).join(","));
      const habitsCSV = [habitHeaders.join(","), ...habitRows].join("\n");

      const combined = `=== TASKS ===\n${tasksCSV}\n\n=== HABITS ===\n${habitsCSV}`;
      downloadFile(combined, `mindmate-backup-${new Date().toISOString().split("T")[0]}.csv`, "text/csv");
      toast({ title: "Export complete", description: "Your data has been downloaded as CSV." });
    } catch {
      toast({ title: "Export failed", description: "Could not export your data.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.name.endsWith(".json")) {
      toast({ title: "Invalid file", description: "Please upload a JSON backup file.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" });
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate structure
      if (!data.version || !data.exported_at) {
        throw new Error("Invalid backup file format");
      }

      let imported = 0;

      // Import tasks
      if (data.tasks?.length > 0) {
        const tasks = data.tasks.map((t: any) => ({
          user_id: user.id,
          title: String(t.title || "").slice(0, 200),
          completed: !!t.completed,
          category: ["work", "personal", "leisure"].includes(t.category) ? t.category : "work",
          priority: ["high", "medium", "low"].includes(t.priority) ? t.priority : null,
          estimated_time: Math.min(Math.max(Number(t.estimated_time) || 15, 5), 120),
        }));
        const { error } = await supabase.from("tasks").insert(tasks);
        if (!error) imported += tasks.length;
      }

      // Import habits
      if (data.habits?.length > 0) {
        const habits = data.habits.map((h: any) => ({
          user_id: user.id,
          name: String(h.name || "").slice(0, 100),
          description: h.description ? String(h.description).slice(0, 500) : null,
          frequency: h.frequency || null,
        }));
        const { error } = await supabase.from("habits").insert(habits);
        if (!error) imported += habits.length;
      }

      toast({ title: "Import complete", description: `${imported} items restored successfully.` });
    } catch {
      toast({ title: "Import failed", description: "The file could not be read or is corrupted.", variant: "destructive" });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg sm:text-xl font-serif font-semibold text-foreground">Data Management</h3>
      <p className="text-sm text-muted-foreground">Export, import, or back up your data.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Export JSON */}
        <button
          onClick={exportJSON}
          disabled={exporting}
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all text-left group",
            exporting && "opacity-50 pointer-events-none"
          )}
        >
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <FileJson className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Export as JSON</p>
            <p className="text-xs text-muted-foreground">Full data backup</p>
          </div>
          {exporting ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Download className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />}
        </button>

        {/* Export CSV */}
        <button
          onClick={exportCSV}
          disabled={exporting}
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all text-left group",
            exporting && "opacity-50 pointer-events-none"
          )}
        >
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Export as CSV</p>
            <p className="text-xs text-muted-foreground">Tasks & habits spreadsheet</p>
          </div>
          {exporting ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Download className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />}
        </button>

        {/* Import */}
        <label
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all text-left group cursor-pointer",
            importing && "opacity-50 pointer-events-none"
          )}
        >
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Upload className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Import Backup</p>
            <p className="text-xs text-muted-foreground">Restore from JSON file</p>
          </div>
          {importing && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <input type="file" accept=".json" onChange={handleImport} className="hidden" disabled={importing} />
        </label>

        {/* Create Backup */}
        <button
          onClick={exportJSON}
          disabled={exporting}
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all text-left group",
            exporting && "opacity-50 pointer-events-none"
          )}
        >
          <div className="p-2 rounded-lg bg-muted">
            <Shield className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Create Backup</p>
            <p className="text-xs text-muted-foreground">Download a full snapshot</p>
          </div>
          {exporting ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Download className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />}
        </button>
      </div>
    </div>
  );
}
