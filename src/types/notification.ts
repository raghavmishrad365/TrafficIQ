export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  emailAddress?: string;
  toastEnabled: boolean;
  morningAlertTime: string;
  morningAlertDays: number[];
}

export interface AppNotification {
  id: string;
  type: "traffic" | "journey" | "system" | "shipment" | "fleet" | "iot" | "maintenance";
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  severity?: "info" | "warning" | "error" | "success";
  journeyId?: string;
  incidentId?: string;
  shipmentId?: string;
}
