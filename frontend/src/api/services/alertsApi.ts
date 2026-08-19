import { apiClient } from "../client";
import type {
  AcknowledgeAlertRequest,
  Alert,
  AlertPage,
  AlertQueryParameters,
  CreatedIncident,
  CreateIncidentRequest,
} from "../../types/alerts";

export async function getAlerts(
  parameters: AlertQueryParameters,
): Promise<AlertPage> {
  const response = await apiClient.get<AlertPage>("/alerts", {
    params: parameters,
  });

  return response.data;
}

export async function getAlert(id: string): Promise<Alert> {
  const response = await apiClient.get<Alert>(`/alerts/${id}`);

  return response.data;
}

export async function acknowledgeAlert(
  id: string,
  request: AcknowledgeAlertRequest,
): Promise<Alert> {
  const response = await apiClient.post<Alert>(
    `/alerts/${id}/acknowledge`,
    request,
  );

  return response.data;
}

export async function createIncidentFromAlert(
  alertId: string,
  request: CreateIncidentRequest,
): Promise<CreatedIncident> {
  const response = await apiClient.post<CreatedIncident>(
    `/alerts/${alertId}/create-incident`,
    request,
  );

  return response.data;
}
