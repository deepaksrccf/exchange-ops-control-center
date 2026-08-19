import { apiClient } from "../client";
import type {
  CreateIncidentNoteRequest,
  Incident,
  IncidentEvent,
  IncidentNote,
  IncidentPage,
  IncidentQueryParameters,
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

export async function getIncidentNotes(id: string): Promise<IncidentNote[]> {
  const response = await apiClient.get<IncidentNote[]>(
    `/incidents/${id}/notes`,
  );

  return response.data;
}

export async function getIncidentTimeline(
  id: string,
): Promise<IncidentEvent[]> {
  const response = await apiClient.get<IncidentEvent[]>(
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

export async function createIncidentNote(
  id: string,
  request: CreateIncidentNoteRequest,
): Promise<IncidentNote> {
  const response = await apiClient.post<IncidentNote>(
    `/incidents/${id}/notes`,
    request,
  );

  return response.data;
}
