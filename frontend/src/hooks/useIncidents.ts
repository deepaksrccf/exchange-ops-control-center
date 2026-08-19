import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

import {
  createIncidentNote,
  getIncident,
  getIncidentTimeline,
  getIncidents,
  updateIncident,
} from "../api/services/incidentsApi";
import type {
  CreateIncidentNoteRequest,
  IncidentQueryParameters,
  UpdateIncidentRequest,
} from "../types/incidents";

/**
 * Fetch paginated list of incidents with optional filters
 * Uses keepPreviousData for smooth pagination transitions
 */
export function useIncidentsQuery(parameters: IncidentQueryParameters) {
  return useQuery({
    queryKey: ["incidents", parameters],
    queryFn: () => getIncidents(parameters),
    placeholderData: keepPreviousData,
    retry: 1,
  });
}

/**
 * Fetch a single incident by ID
 * Query is disabled if id is undefined; enables when id is provided
 */
export function useIncidentQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["incident", id],
    queryFn: () => getIncident(id ?? ""),
    enabled: Boolean(id),
    retry: 1,
  });
}

/**
 * Fetch immutable timeline of state changes for an incident
 * Query is disabled if id is undefined; enables when id is provided
 */
export function useIncidentTimelineQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["incident-timeline", id],
    queryFn: () => getIncidentTimeline(id ?? ""),
    enabled: Boolean(id),
    retry: 1,
  });
}

/**
 * Update incident properties (status, owner, resolution summary, etc.)
 * Invalidates incident-related queries on success to force refresh
 */
export function useUpdateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: string;
      request: UpdateIncidentRequest;
    }) => updateIncident(id, request),

    onSuccess: async (_, variables) => {
      // Invalidate queries to refresh the UI
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["incidents"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["incident", variables.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["incident-timeline", variables.id],
        }),
      ]);
    },
  });
}

/**
 * Append an immutable note to an incident
 * Invalidates incident and timeline queries on success
 */
export function useCreateIncidentNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      incidentId,
      request,
    }: {
      incidentId: string;
      request: CreateIncidentNoteRequest;
    }) => createIncidentNote(incidentId, request),

    onSuccess: async (_, variables) => {
      // Invalidate queries to refresh the UI
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["incident", variables.incidentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["incident-timeline", variables.incidentId],
        }),
      ]);
    },
  });
}
