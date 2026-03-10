export const POLLING_INTERVALS = {
  DASHBOARD_TRAFFIC: 60_000,
  ACTIVE_JOURNEY: 30_000,
  JOURNEY_MONITOR: 120_000,
} as const;

export const STORAGE_KEYS = {
  SAVED_JOURNEYS: "trafficinfo_saved_journeys",
  NOTIFICATION_PREFS: "trafficinfo_notification_prefs",
  NOTIFICATION_LOG: "trafficinfo_notifications",
  ROUTE_HISTORY: "trafficinfo_route_history",
  SHIPMENTS: "trafficinfo_shipments",
  WAREHOUSES: "trafficinfo_warehouses",
  INVENTORY_ITEMS: "trafficinfo_inventory_items",
  FLEET_VEHICLES: "trafficinfo_fleet_vehicles",
  WORK_ORDERS: "trafficinfo_work_orders",
  TECHNICIANS: "trafficinfo_technicians",
  VEHICLE_HEALTH: "trafficinfo_vehicle_health",
  MAINTENANCE_ALERTS: "trafficinfo_maintenance_alerts",
  MAINTENANCE_RECORDS: "trafficinfo_maintenance_records",
  RETURN_ORDERS: "trafficinfo_return_orders",
  SUPPLY_CHAIN_KPIS: "trafficinfo_supply_chain_kpis",
  TRAFFIC_INCIDENTS: "trafficinfo_traffic_incidents",

  // Settings (dual-write to Dataverse tiq_appsettings)
  DEMO_MODE: "trafficiq_demo_mode",
  THEME: "trafficiq_theme",
  MAP_SETTINGS: "trafficiq_map_settings",
  D365_SETTINGS: "trafficiq_d365_settings",
  DATAVERSE_SETTINGS: "trafficiq_dataverse_settings",
  DATAVERSE_MCP_SETTINGS: "trafficiq_dataverse_mcp_settings",
  EMAIL_SETTINGS: "trafficiq_email_settings",
  IOTHUB_SETTINGS: "trafficiq_iothub_settings",

  // Agent settings (dual-write to Dataverse tiq_agentconfigurations)
  AGENT_SETTINGS: "trafficiq_agent_settings",
} as const;

export const SEVERITY_COLORS: Record<string, string> = {
  low: "var(--traffic-clear)",
  medium: "var(--traffic-moderate)",
  high: "var(--traffic-heavy)",
  critical: "var(--traffic-severe)",
};

export const INCIDENT_ICONS: Record<string, string> = {
  accident: "CarAccident",
  roadwork: "Construction",
  congestion: "Warning",
  closure: "Block",
  other: "Info",
};

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
