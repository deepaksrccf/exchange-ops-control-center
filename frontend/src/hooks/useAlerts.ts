import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  acknowledgeAlert,
  getAlert,
  getAlerts,
} from "../api/services/alertsApi";
import type {
  AcknowledgeAlertRequest,
  AlertQueryParameters,
} from "../types/alerts";

export function useAlertsQuery(parameters: AlertQueryParameters) {
  return useQuery({
    queryKey: ["alerts", parameters],
    queryFn: () => getAlerts(parameters),
    placeholderData: keepPreviousData,
    retry: 1,
  });
}

export function useAlertQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["alert", id],
    queryFn: () => getAlert(id ?? ""),
    enabled: Boolean(id),
    retry: 1,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: string;
      request: AcknowledgeAlertRequest;
    }) => acknowledgeAlert(id, request),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["alerts"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["alert", variables.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["metrics-summary"],
        }),
      ]);
    },
  });
}
