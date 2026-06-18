import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import type { FloodSeverity } from "@/lib/floodSeverity";

export interface FloodReport {
  id: string;
  community_id: string;
  location_text: string;
  severity: FloodSeverity;
  description: string | null;
  image_url: string | null;
  reported_at: string;
}

interface FloodReportsApiResponse {
  status: string;
  data: FloodReport[];
}

interface FloodReportApiResponse {
  status: string;
  data: FloodReport;
}

export function useFloodReports(communityId?: string, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? (communityId !== undefined);
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      const endpoint = communityId
        ? `/api/flood-reports?community_id=${communityId}`
        : "/api/flood-reports";

      const response = await fetchApi<FloodReportsApiResponse>(endpoint);

      if (response.status !== "success") {
        throw new Error("Failed to fetch flood reports");
      }

      setReports(response.data || []);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch flood reports";
      console.error("Error fetching flood reports:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [communityId, enabled]);

  useEffect(() => {
    if (enabled) {
      refetch();
      const interval = setInterval(refetch, 30000);
      return () => clearInterval(interval);
    }
  }, [refetch, enabled]);

  return { reports, loading: enabled ? loading : true, error, refetch };
}

export async function addFloodReport(report: Omit<FloodReport, "id" | "reported_at">) {
  const response = await fetchApi<FloodReportApiResponse>("/api/flood-reports", {
    method: "POST",
    body: JSON.stringify(report),
  });

  if (response.status !== "success") {
    throw new Error("Failed to create flood report");
  }
  return response.data;
}

export async function deleteFloodReport(id: string) {
  const response = await fetchApi<{ status: string }>(`/api/flood-reports/${id}`, {
    method: "DELETE",
  });

  if (response.status !== "success") {
    throw new Error("Failed to delete flood report");
  }
}
