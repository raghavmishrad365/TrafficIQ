import { useEffect, useRef } from "react";
import {
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
} from "@fluentui/react-components";
import { createElement } from "react";
import type { TrafficIncident } from "../types/traffic";
import type { Severity } from "../types/traffic";

function severityToIntent(severity: Severity): "error" | "warning" | "info" {
  switch (severity) {
    case "critical":
      return "error";
    case "high":
      return "warning";
    default:
      return "info";
  }
}

export function useTrafficAlerts(
  incidents: TrafficIncident[] | undefined,
  toasterId: string
): void {
  const { dispatchToast } = useToastController(toasterId);
  const previousIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!incidents || incidents.length === 0) {
      return;
    }

    const currentIds = new Set(incidents.map((i) => i.id));
    const previousIds = previousIdsRef.current;

    // Only dispatch toasts when the previous set was non-empty
    // (i.e., skip the initial load)
    if (previousIds.size > 0) {
      const newIncidents = incidents.filter((i) => !previousIds.has(i.id));

      for (const incident of newIncidents) {
        const intent = severityToIntent(incident.severity);

        dispatchToast(
          createElement(
            Toast,
            null,
            createElement(ToastTitle, null, incident.title),
            createElement(ToastBody, null, incident.description)
          ),
          { intent }
        );
      }
    }

    previousIdsRef.current = currentIds;
  }, [incidents, dispatchToast]);
}
