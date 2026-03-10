import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storageService } from "../services/storageService";
import type { RouteHistoryEntry } from "../types/history";
import { v4 as uuidv4 } from "uuid";

export function useRouteHistory(journeyId?: string) {
  return useQuery<RouteHistoryEntry[]>({
    queryKey: ["routeHistory", journeyId],
    queryFn: () => storageService.getRouteHistory(journeyId),
    staleTime: Infinity,
  });
}

export function useSaveRouteHistory() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, Omit<RouteHistoryEntry, "id" | "timestamp">>({
    mutationFn: (entry) => {
      const fullEntry: RouteHistoryEntry = {
        ...entry,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
      };
      storageService.addRouteHistoryEntry(fullEntry);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routeHistory"] });
    },
  });
}
