import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createIncidentNote,
  getIncident,
  getIncidents,
  getIncidentNotes,
  getIncidentTimeline,
  updateIncident,
} from "../api/services/incidentsApi";
import type {
  CreateIncidentNoteRequest,
  IncidentQueryParameters,
  UpdateIncidentRequest,
} from "../types/incidents";

export function useIncidentsQuery(parameters: IncidentQueryParameters) {
  return useQuery({
    queryKey: ["incidents", parameters],
    queryFn: () => getIncidents(parameters),
    placeholderData: keepPreviousData,
  });
}

export function useIncidentQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["incident", id],
    queryFn: () => getIncident(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useIncidentNotesQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["incident-notes", id],
    queryFn: () => getIncidentNotes(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useIncidentTimelineQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["incident-timeline", id],
    queryFn: () => getIncidentTimeline(id ?? ""),
    enabled: Boolean(id),
  });
}

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
        queryClient.invalidateQueries({
          queryKey: ["alerts"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["metrics-summary"],
        }),
      ]);
    },
  });
}

export function useCreateIncidentNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: string;
      request: CreateIncidentNoteRequest;
    }) => createIncidentNote(id, request),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["incident", variables.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["incident-notes", variables.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["incident-timeline", variables.id],
        }),
      ]);
    },
  });
}
