import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { AppNotification, NotificationPreferences } from "../types/notification";
import { storageService } from "../services/storageService";

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: AppNotification) => void;
  markRead: (id: string) => void;
  clearAll: () => void;
  preferences: NotificationPreferences;
  updatePreferences: (prefs: NotificationPreferences) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    storageService.getNotifications()
  );
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    storageService.getNotificationPreferences()
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const addNotification = useCallback((notification: AppNotification) => {
    storageService.addNotification(notification);
    setNotifications(storageService.getNotifications());
  }, []);

  const markRead = useCallback((id: string) => {
    storageService.markNotificationRead(id);
    setNotifications(storageService.getNotifications());
  }, []);

  const clearAll = useCallback(() => {
    // Mark all as read rather than deleting
    notifications.forEach((n) => {
      if (!n.read) {
        storageService.markNotificationRead(n.id);
      }
    });
    setNotifications(storageService.getNotifications());
  }, [notifications]);

  const updatePreferences = useCallback((prefs: NotificationPreferences) => {
    storageService.saveNotificationPreferences(prefs);
    setPreferences(prefs);
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markRead,
      clearAll,
      preferences,
      updatePreferences,
    }),
    [notifications, unreadCount, addNotification, markRead, clearAll, preferences, updatePreferences]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider"
    );
  }
  return context;
}
