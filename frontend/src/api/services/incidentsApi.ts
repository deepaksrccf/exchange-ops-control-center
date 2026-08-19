import { apiClient } from "../client";
import type {
  CreateIncidentNoteRequest,
  IncidentNote,
  IncidentPage,
  IncidentQueryParameters,
  IncidentEvent,
  Incident,
  UpdateIncidentRequest,
} from "../../types/incidents";

/**
 * Fetch paginated list of incidents with optional filtering
 */
export async function getIncidents(
  parameters: IncidentQueryParameters,
): Promise<IncidentPage> {
  const response = await apiClient.get<IncidentPage>("/incidents", {
    params: parameters,
  });
  return response.data;
}

/**
 * Fetch a single incident by ID
 */
export async function getIncident(id: string): Promise<Incident> {
  const response = await apiClient.get<Incident>(`/incidents/${id}`);
  return response.data;
}

/**
 * Update incident properties (status, owner, resolution summary, etc.)
 * Only provided fields are updated; others remain unchanged
 */
export async function updateIncident(
  id: string,
  request: UpdateIncidentRequest,
): Promise<Incident> {
  const response = await apiClient.patch<Incident>(`/incidents/${id}`, request);
  return response.data;
}

/**
 * Fetch immutable timeline of state changes for an incident
 */
export async function getIncidentTimeline(
  id: string,
): Promise<IncidentEvent[]> {
  const response = await apiClient.get<IncidentEvent[]>(
    `/incidents/${id}/timeline`,
  );
  return response.data;
}

/**
 * Append an immutable note to an incident
 */
export async function createIncidentNote(
  incidentId: string,
  request: CreateIncidentNoteRequest,
): Promise<IncidentNote> {
  const response = await apiClient.post<IncidentNote>(
    `/incidents/${incidentId}/notes`,
    request,
  );
  return response.data;
}
