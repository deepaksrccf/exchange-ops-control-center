import { useQuery } from '@tanstack/react-query'

import {
  checkApiHealth,
  getMetricsSummary,
  getRecentAlerts,
  getRecentIncidents,
  getVenues,
} from '../api/services/operationsApi'

export function useApiHealth() {
  return useQuery({
    queryKey: ['api-health'],
    queryFn: checkApiHealth,
    refetchInterval: 30_000,
    retry: false,
  })
}

export function useMetricsSummary() {
  return useQuery({
    queryKey: ['metrics-summary'],
    queryFn: getMetricsSummary,
  })
}

export function useVenues() {
  return useQuery({
    queryKey: ['venues'],
    queryFn: getVenues,
  })
}

export function useRecentAlerts() {
  return useQuery({
    queryKey: ['alerts', 'recent'],
    queryFn: getRecentAlerts,
  })
}

export function useRecentIncidents() {
  return useQuery({
    queryKey: ['incidents', 'recent'],
    queryFn: getRecentIncidents,
  })
}
