import { apiClient } from "../client";
import type {
  AlertSummary,
  IncidentSummary,
  MetricsSummary,
  PageResponse,
  Venue,
} from "../../types/api";

export async function getMetricsSummary(): Promise<MetricsSummary> {
  const response = await apiClient.get<MetricsSummary>("/metrics/summary");
  return response.data;
}

export async function getVenues(): Promise<Venue[]> {
  const response = await apiClient.get<Venue[]>("/venues");
  return response.data;
}

export async function getRecentAlerts(): Promise<AlertSummary[]> {
  const response = await apiClient.get<
    PageResponse<AlertSummary> | AlertSummary[]
  >("/alerts", {
    params: {
      page: 0,
      size: 5,
      sort: "detectedAt,desc",
    },
  });

  return Array.isArray(response.data) ? response.data : response.data.content;
}

export async function getRecentIncidents(): Promise<IncidentSummary[]> {
  const response = await apiClient.get<
    PageResponse<IncidentSummary> | IncidentSummary[]
  >("/incidents", {
    params: {
      page: 0,
      size: 5,
      sort: "createdAt,desc",
    },
  });

  return Array.isArray(response.data) ? response.data : response.data.content;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    await apiClient.get("/health");
    return true;
  } catch {
    return false;
  }
}
