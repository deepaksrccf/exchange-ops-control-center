import { apiClient } from "../client";
import type { EventPage, EventQueryParameters } from "../../types/events";

export async function getEvents(
  parameters: EventQueryParameters,
): Promise<EventPage> {
  const response = await apiClient.get<EventPage>("/events", {
    params: parameters,
  });

  return response.data;
}
