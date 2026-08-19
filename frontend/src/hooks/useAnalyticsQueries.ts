import { useQuery } from "@tanstack/react-query";

import { getAlerts } from "../api/services/alertsApi";
import { getEvents } from "../api/services/eventsApi";
import { getIncidents } from "../api/services/incidentsApi";

export function useAnalyticsQueries() {
  const events = useQuery({
    queryKey: ["analytics", "events"],
    queryFn: () =>
      getEvents({
        page: 0,
        size: 100,
        sort: "eventTimestamp,desc",
      }),
    retry: 1,
  });

  const alerts = useQuery({
    queryKey: ["analytics", "alerts"],
    queryFn: () =>
      getAlerts({
        page: 0,
        size: 100,
        sort: "detectedAt,desc",
      }),
    retry: 1,
  });

  const incidents = useQuery({
    queryKey: ["analytics", "incidents"],
    queryFn: () =>
      getIncidents({
        page: 0,
        size: 100,
        sort: "createdAt,desc",
      }),
    retry: 1,
  });

  return {
    events,
    alerts,
    incidents,
  };
}
