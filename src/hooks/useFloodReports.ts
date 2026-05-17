import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

export interface FloodReport {
  id: string;
  community_id: string;
  location_text: string;
  severity: "low" | "medium" | "high" | "critical";
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

export function useFloodReports(communityId?: string) {
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        const endpoint = communityId
          ? `/api/flood-reports?community_id=${communityId}`
          : "/api/flood-reports";
        
        const response = await fetchApi<FloodReportsApiResponse>(endpoint);

        if (response.status !== "success") {
          throw new Error("Failed to fetch flood reports");
        }

        setReports(response.data || []);
      } catch (err: any) {
        console.error("Error fetching flood reports:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchReports, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [communityId]);

  return { reports, loading, error };
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
