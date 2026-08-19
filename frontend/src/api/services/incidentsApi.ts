import { apiClient } from "../client";
import type {
  CreateIncidentNoteRequest,
  Incident,
  IncidentPage,
  IncidentQueryParameters,
  IncidentTimelineEvent,
  UpdateIncidentRequest,
} from "../../types/incidents";

export async function getIncidents(
  parameters: IncidentQueryParameters,
): Promise<IncidentPage> {
  const response = await apiClient.get<IncidentPage>("/incidents", {
    params: parameters,
  });

  return response.data;
}

export async function getIncident(id: string): Promise<Incident> {
  const response = await apiClient.get<Incident>(`/incidents/${id}`);

  return response.data;
}

export async function getIncidentTimeline(
  id: string,
): Promise<IncidentTimelineEvent[]> {
  const response = await apiClient.get<IncidentTimelineEvent[]>(
    `/incidents/${id}/timeline`,
  );

  return response.data;
}

export async function updateIncident(
  id: string,
  request: UpdateIncidentRequest,
): Promise<Incident> {
  const response = await apiClient.patch<Incident>(`/incidents/${id}`, request);

  return response.data;
}

export async function addIncidentNote(
  id: string,
  request: CreateIncidentNoteRequest,
): Promise<unknown> {
  const response = await apiClient.post(`/incidents/${id}/notes`, request);

  return response.data;
}
