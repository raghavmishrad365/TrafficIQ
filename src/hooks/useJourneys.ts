import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v4 as uuid } from "uuid";
import { storageService } from "../services/storageService";
import type { SavedJourney } from "../types/journey";
import { JOURNEYS_CHANGED_EVENT } from "../services/agents/tools/trafficTools";

const SAVED_JOURNEYS_KEY = ["savedJourneys"] as const;

export function useSavedJourneys() {
  const queryClient = useQueryClient();

  // Listen for agent tool changes (save_journey / delete_saved_journey)
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: [...SAVED_JOURNEYS_KEY] });
    };
    window.addEventListener(JOURNEYS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(JOURNEYS_CHANGED_EVENT, handler);
  }, [queryClient]);

  return useQuery<SavedJourney[], Error>({
    queryKey: [...SAVED_JOURNEYS_KEY],
    queryFn: () => storageService.getSavedJourneys(),
    staleTime: Infinity,
  });
}

export function useSaveJourney() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, Omit<SavedJourney, "id" | "createdAt">>({
    mutationFn: (journey) => {
      const newJourney: SavedJourney = {
        ...journey,
        id: uuid(),
        createdAt: new Date().toISOString(),
      };
      storageService.saveJourney(newJourney);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SAVED_JOURNEYS_KEY] });
    },
  });
}

export function useUpdateJourney() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, SavedJourney>({
    mutationFn: (journey) => {
      storageService.saveJourney(journey);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SAVED_JOURNEYS_KEY] });
    },
  });
}

export function useDeleteJourney() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => {
      storageService.deleteJourney(id);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SAVED_JOURNEYS_KEY] });
    },
  });
}
