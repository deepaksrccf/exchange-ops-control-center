import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getGeneratorStatus,
  pauseGenerator,
  resumeGenerator,
  startGenerator,
  stopGenerator,
} from "../api/services/generatorApi";
import type { GeneratorStatus } from "../types/generator";

const generatorKey = ["generator-status"];

export function useGeneratorStatus() {
  return useQuery({
    queryKey: generatorKey,
    queryFn: getGeneratorStatus,
    refetchInterval: (query) => {
      const state = query.state.data?.state;
      return state === "RUNNING" || state === "PAUSED" ? 2_000 : false;
    },
    retry: 1,
  });
}

export function useGeneratorAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: "start" | "pause" | "resume" | "stop") => {
      switch (action) {
        case "start":
          return startGenerator();
        case "pause":
          return pauseGenerator();
        case "resume":
          return resumeGenerator();
        case "stop":
          return stopGenerator();
      }
    },

    onSuccess: async (status: GeneratorStatus) => {
      queryClient.setQueryData(generatorKey, status);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["events"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["metrics-summary"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["analytics"],
        }),
      ]);
    },
  });
}
