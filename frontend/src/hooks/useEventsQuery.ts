import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getEvents } from "../api/services/eventsApi";
import type { EventQueryParameters } from "../types/events";

export function useEventsQuery(parameters: EventQueryParameters) {
  return useQuery({
    queryKey: ["events", parameters.page, parameters.size, parameters.sort],
    queryFn: () => getEvents(parameters),
    placeholderData: keepPreviousData,
    retry: 1,
  });
}
