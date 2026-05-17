import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

interface HistoricalDataPoint {
  value: number;
  measured_at: string;
  warning_level: number;
}

interface HistoryApiResponse {
  status: string;
  data: HistoricalDataPoint[];
}

export function useHistoricalSensorData(sensorId: string | null) {
  const [history, setHistory] = useState<number[]>([]);
  const [fullData, setFullData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sensorId) {
      setHistory([]);
      setFullData([]);
      return;
    }

    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchApi<HistoryApiResponse>(
          `/api/sensors/${sensorId}/history?hours=3`
        );

        if (response.status !== "success") {
          throw new Error("Failed to fetch sensor history");
        }

        const data = response.data || [];
        const values = data.map((d) => Number(d.value));
        setHistory(values);
        setFullData(data);
      } catch (err: any) {
        console.error("Error fetching historical data:", err);
        setError(err.message);
        setHistory([]);
        setFullData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [sensorId]);

  return { history, fullData, loading, error };
}
