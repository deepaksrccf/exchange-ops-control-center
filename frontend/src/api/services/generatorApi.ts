import { apiClient } from "../client";
import type { GeneratorStatus } from "../../types/generator";

export async function getGeneratorStatus(): Promise<GeneratorStatus> {
  const response = await apiClient.get<GeneratorStatus>("/generator/status");

  return response.data;
}

export async function startGenerator(): Promise<GeneratorStatus> {
  const response = await apiClient.post<GeneratorStatus>("/generator/start");

  return response.data;
}

export async function pauseGenerator(): Promise<GeneratorStatus> {
  const response = await apiClient.post<GeneratorStatus>("/generator/pause");

  return response.data;
}

export async function resumeGenerator(): Promise<GeneratorStatus> {
  const response = await apiClient.post<GeneratorStatus>("/generator/resume");

  return response.data;
}

export async function stopGenerator(): Promise<GeneratorStatus> {
  const response = await apiClient.post<GeneratorStatus>("/generator/stop");

  return response.data;
}
