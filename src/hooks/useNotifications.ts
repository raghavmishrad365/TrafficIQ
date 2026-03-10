import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { storageService } from "../services/storageService";
import type { NotificationPreferences } from "../types/notification";

const NOTIFICATION_PREFS_KEY = ["notificationPreferences"] as const;
const NOTIFICATION_LOG_KEY = ["notificationLog"] as const;

export function useNotificationPreferences() {
  return useQuery<NotificationPreferences, Error>({
    queryKey: [...NOTIFICATION_PREFS_KEY],
    queryFn: () => storageService.getNotificationPreferences(),
  });
}

export function useSaveNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, NotificationPreferences>({
    mutationFn: (prefs) => {
      storageService.saveNotificationPreferences(prefs);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...NOTIFICATION_PREFS_KEY] });
    },
  });
}

export function useNotificationLog() {
  return useQuery({
    queryKey: [...NOTIFICATION_LOG_KEY],
    queryFn: () => storageService.getNotifications(),
  });
}
