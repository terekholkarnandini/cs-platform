const BASE_URL = "http://localhost:8000";

// ─── Response shapes ────────────────────────────────────────────────────────

export interface AnalyticsKPI {
  total_conversations: number;
  ai_resolution_rate: number | null;
  avg_response_time_s: number | null;
  knowledge_base_documents: number;
}

export interface TrendPoint {
  d: string;
  Conversations: number;
}

export interface CategoryPoint {
  name: string;
  value: number;
}

export interface ResponseTimePoint {
  d: string;
  AI?: number;
  Human?: number;
}

export interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
}

export interface TopComplaint {
  c: string;
  n: number;
}

export interface AnalyticsData {
  kpi: AnalyticsKPI;
  trend: TrendPoint[];
  categories: CategoryPoint[];
  csat: null;
  response_time: ResponseTimePoint[];
  heatmap: HeatmapCell[];
  top_complaints: TopComplaint[];
  /** Set by backend when conversation_history table doesn't exist yet */
  _notice?: string | null;
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

export async function fetchAnalytics(token: string): Promise<AnalyticsData> {
  const res = await fetch(`${BASE_URL}/api/analytics`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch analytics: ${res.statusText}`);
  }
  return res.json();
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

export function exportReportCSV(data: AnalyticsData): void {
  const rows: string[] = [];

  // Header
  rows.push("SupportAI Analytics Report");
  rows.push(`Generated: ${new Date().toLocaleString()}`);
  rows.push("");

  // KPI section
  rows.push("KPI Summary");
  rows.push("Metric,Value");
  rows.push(`Total Conversations,${data.kpi.total_conversations}`);
  rows.push(
    `AI Resolution Rate,${data.kpi.ai_resolution_rate != null ? data.kpi.ai_resolution_rate + "%" : "N/A"}`
  );
  rows.push(
    `Avg Response Time,${data.kpi.avg_response_time_s != null ? data.kpi.avg_response_time_s + "s" : "N/A"}`
  );
  rows.push(`Knowledge Base Documents,${data.kpi.knowledge_base_documents}`);
  rows.push("");

  // Conversation trend
  rows.push("Conversation Trend (Last 30 Days)");
  rows.push("Date,Conversations");
  for (const t of data.trend) {
    rows.push(`${t.d},${t.Conversations}`);
  }
  rows.push("");

  // Complaint categories
  rows.push("Complaint Categories");
  rows.push("Category,Count");
  for (const c of data.categories) {
    rows.push(`${c.name},${c.value}`);
  }
  rows.push("");

  // Top complaints
  rows.push("Top Complaints");
  rows.push("Complaint,Count");
  for (const c of data.top_complaints) {
    rows.push(`"${c.c}",${c.n}`);
  }
  rows.push("");

  // AI response time by day
  if (data.response_time.length > 0) {
    rows.push("Avg AI Response Time by Day");
    rows.push("Day,AI (s),Human (s)");
    for (const r of data.response_time) {
      const ai = r.AI != null ? r.AI : "N/A";
      const human = r.Human != null ? r.Human : "N/A";
      rows.push(`${r.d},${ai},${human}`);
    }
    rows.push("");
  }

  const csv = rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `supportai-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
