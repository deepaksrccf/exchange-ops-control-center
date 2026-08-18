import { apiClient } from '../client'
import type {
  AlertSummary,
  IncidentSummary,
  MetricsSummary,
  Venue,
} from '../../types/api'

export async function getMetricsSummary(): Promise<MetricsSummary> {
  const response = await apiClient.get<MetricsSummary>(
    '/metrics/summary',
  )

  return response.data
}

export async function getVenues(): Promise<Venue[]> {
  const response = await apiClient.get<Venue[]>('/venues')
  return response.data
}

export async function getRecentAlerts(): Promise<AlertSummary[]> {
  const response = await apiClient.get('/alerts', {
    params: {
      page: 0,
      size: 5,
      sort: 'detectedAt,desc',
    },
  })

  return response.data.content ?? response.data
}

export async function getRecentIncidents(): Promise<
  IncidentSummary[]
> {
  const response = await apiClient.get('/incidents', {
    params: {
      page: 0,
      size: 5,
      sort: 'createdAt,desc',
    },
  })

  return response.data.content ?? response.data
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    await apiClient.get('/health')
    return true
  } catch {
    return false
  }
}
