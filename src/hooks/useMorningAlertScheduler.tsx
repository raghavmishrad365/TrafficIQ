import { useEffect, useRef } from "react";
import {
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
} from "@fluentui/react-components";
import { useNotificationContext } from "../context/NotificationContext";
import { computeCorridorBounds, fetchCorridorIncidents, classifyStatus } from "./useJourneyMonitor";
import { azureOpenAIService } from "../services/azureOpenAIService";
import { emailService } from "../services/emailService";
import { env } from "../config/env";
import type { SavedJourney } from "../types/journey";
import type { TrafficIncident } from "../types/traffic";
import { v4 as uuidv4 } from "uuid";

const CHECK_INTERVAL_MS = 60_000; // Check every minute

/**
 * Hook that runs a morning alert scheduler. Checks every minute whether any
 * saved journey has a morning alert configured for the current time and day.
 * When triggered, fetches corridor incidents, generates an AI briefing,
 * and delivers notifications via toast, push, and email.
 */
export function useMorningAlertScheduler(
  savedJourneys: SavedJourney[],
  toasterId?: string
) {
  const { addNotification, preferences } = useNotificationContext();
  const { dispatchToast } = useToastController(toasterId);
  const firedAlertsRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Store mutable values in refs to keep the interval effect stable
  const journeysRef = useRef(savedJourneys);
  const addNotificationRef = useRef(addNotification);
  const dispatchToastRef = useRef(dispatchToast);
  const preferencesRef = useRef(preferences);

  useEffect(() => {
    journeysRef.current = savedJourneys;
    addNotificationRef.current = addNotification;
    dispatchToastRef.current = dispatchToast;
    preferencesRef.current = preferences;
  });

  useEffect(() => {
    const checkAlerts = async () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0=Sun, 1=Mon, ...
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      // Build a key to prevent duplicate alerts within the same minute
      const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${currentTime}`;

      const journeysToAlert = journeysRef.current.filter((j) => {
        if (!j.morningAlert?.enabled) return false;
        if (!j.morningAlert.daysOfWeek.includes(currentDay)) return false;
        if (j.morningAlert.time !== currentTime) return false;

        const alertKey = `${j.id}-${dateKey}`;
        if (firedAlertsRef.current.has(alertKey)) return false;

        return true;
      });

      if (journeysToAlert.length === 0) return;

      // Fetch incidents for each journey that needs alerting
      const incidentsByJourney = new Map<string, TrafficIncident[]>();

      for (const journey of journeysToAlert) {
        const bounds = computeCorridorBounds(
          journey.origin.coordinates.lat,
          journey.origin.coordinates.lng,
          journey.destination.coordinates.lat,
          journey.destination.coordinates.lng
        );
        const incidents = await fetchCorridorIncidents(bounds);
        incidentsByJourney.set(journey.id, incidents);

        // Mark this alert as fired for this minute
        const alertKey = `${journey.id}-${dateKey}`;
        firedAlertsRef.current.add(alertKey);
      }

      // Generate AI-powered morning briefing
      let briefingText: string;
      try {
        briefingText = await azureOpenAIService.getMorningBriefing(
          journeysToAlert,
          incidentsByJourney
        );
      } catch {
        // Fallback: generate a simple text briefing
        briefingText = journeysToAlert.map((j) => {
          const incidents = incidentsByJourney.get(j.id) || [];
          const status = classifyStatus(incidents);
          return `${j.name}: ${status === "clear" ? "Clear roads" : `${incidents.length} incident(s) - ${status.replace("_", " ")}`}`;
        }).join(". ");
      }

      // Deliver notifications for each journey
      for (const journey of journeysToAlert) {
        const incidents = incidentsByJourney.get(journey.id) || [];
        const status = classifyStatus(incidents);

        const severity =
          status === "blocked" || status === "major_delays"
            ? "warning" as const
            : status === "minor_delays"
              ? "info" as const
              : "success" as const;

        // Add app notification
        addNotificationRef.current({
          id: uuidv4(),
          type: "journey",
          title: `Morning Alert: ${journey.name}`,
          body: briefingText,
          timestamp: new Date().toISOString(),
          read: false,
          severity,
          journeyId: journey.id,
        });

        // Toast notification
        if (toasterId) {
          dispatchToastRef.current(
            <Toast>
              <ToastTitle>Morning Alert: {journey.name}</ToastTitle>
              <ToastBody>
                {status === "clear"
                  ? "Roads are clear for your commute!"
                  : `${incidents.length} incident(s) detected — ${status.replace("_", " ")}`}
              </ToastBody>
            </Toast>,
            { intent: severity === "success" ? "success" : severity === "warning" ? "warning" : "info" }
          );
        }

        // Native push notification (if enabled and permitted)
        if (
          journey.morningAlert?.pushEnabled &&
          Notification.permission === "granted"
        ) {
          new Notification(`TrafficIQ Morning Alert: ${journey.name}`, {
            body: status === "clear"
              ? "Roads are clear for your commute!"
              : `${incidents.length} incident(s) — ${status.replace("_", " ")}`,
            tag: `morning-${journey.id}-${dateKey}`,
          });
        }

        // Email notification (if enabled and configured)
        const prefs = preferencesRef.current;
        if (
          journey.morningAlert?.emailEnabled &&
          prefs.emailEnabled &&
          prefs.emailAddress &&
          env.emailFlowUrl &&
          env.emailFlowUrl !== "your-power-automate-http-trigger-url"
        ) {
          emailService
            .sendEmailNotification(
              prefs.emailAddress,
              `TrafficIQ Morning Alert: ${journey.name}`,
              briefingText
            )
            .catch((err) => console.error("[MorningAlert] Email failed:", err));
        }
      }

      // Clean up old fired-alert keys
      if (firedAlertsRef.current.size > 1000) {
        firedAlertsRef.current.clear();
      }
    };

    checkAlerts();
    intervalRef.current = setInterval(checkAlerts, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [toasterId]); // stable deps only — mutable values read from refs
}
