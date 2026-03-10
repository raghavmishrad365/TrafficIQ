export const ROUTES = {
  ANALYTICS: "/analytics",
  DASHBOARD: "/",
  SHIPMENTS: "/shipments",
  TRACKING: "/tracking",
  DELIVERY_PLANNER: "/delivery-planner",
  FLEET: "/fleet",
  IOT_DEVICES: "/iot-devices",
  MAINTENANCE: "/maintenance",
  SCHEDULING: "/scheduling",
  WORK_ORDERS: "/work-orders",
  INVENTORY: "/inventory",
  RETURNS: "/returns",
  JOURNEY_PLANNER: "/journey",
  JOURNEY_DETAILS: "/journey/:id",
  SAVED_JOURNEYS: "/saved",
  NOTIFICATIONS: "/notifications",
  SETTINGS: "/settings",
} as const;

export function journeyDetailsPath(id: string): string {
  return `/journey/${id}`;
}
