/**
 * Dataverse Table Definitions for TrafficIQ
 *
 * This file defines the schema for all Dataverse (Microsoft Dataverse) tables
 * required by the TrafficIQ Supply Chain Transport Intelligence platform.
 *
 * Publisher Prefix: tiq_
 * Publisher Name: TrafficIQ
 * Solution Name: TrafficIQ
 *
 * Data Sources:
 *   - D365 Finance & Operations (via MCP) — shipments, warehouses, fleet, work orders, field service
 *   - Azure IoT Hub — device telemetry, geofence events, driving alerts, connectivity
 *   - App Runtime — themes, agent config, general settings (secrets in Key Vault)
 *   - Traffic & Journey — incidents, routes, notifications, chat
 *
 * To provision these tables, use the Power Platform CLI or the Power Apps maker portal.
 * See setupTables.ts for automated provisioning via Web API.
 */

// ============================================================================
// Option Sets (Choice Columns)
// ============================================================================

export const OptionSets = {
  // --- Traffic & Journey ---
  IncidentType: {
    name: "tiq_incidenttype",
    options: [
      { value: 100480000, label: "Accident" },
      { value: 100480001, label: "Roadwork" },
      { value: 100480002, label: "Congestion" },
      { value: 100480003, label: "Closure" },
      { value: 100480004, label: "Other" },
    ],
  },
  IncidentSeverity: {
    name: "tiq_incidentseverity",
    options: [
      { value: 100480000, label: "Low" },
      { value: 100480001, label: "Medium" },
      { value: 100480002, label: "High" },
      { value: 100480003, label: "Critical" },
    ],
  },
  IncidentSource: {
    name: "tiq_incidentsource",
    options: [
      { value: 100480000, label: "Vejdirektoratet" },
      { value: 100480001, label: "Azure Maps" },
      { value: 100480002, label: "Agent" },
    ],
  },
  TransportMode: {
    name: "tiq_transportmode",
    options: [
      { value: 100480000, label: "Car" },
      { value: 100480001, label: "Transit" },
      { value: 100480002, label: "Bicycle" },
      { value: 100480003, label: "Walk" },
    ],
  },
  CongestionLevel: {
    name: "tiq_congestionlevel",
    options: [
      { value: 100480000, label: "Free" },
      { value: 100480001, label: "Light" },
      { value: 100480002, label: "Moderate" },
      { value: 100480003, label: "Heavy" },
      { value: 100480004, label: "Severe" },
    ],
  },
  NotificationType: {
    name: "tiq_notificationtype",
    options: [
      { value: 100480000, label: "Traffic" },
      { value: 100480001, label: "Journey" },
      { value: 100480002, label: "System" },
      { value: 100480003, label: "Shipment" },
      { value: 100480004, label: "Fleet" },
      { value: 100480005, label: "IoT" },
      { value: 100480006, label: "Maintenance" },
    ],
  },
  NotificationSeverity: {
    name: "tiq_notificationseverity",
    options: [
      { value: 100480000, label: "Info" },
      { value: 100480001, label: "Warning" },
      { value: 100480002, label: "Error" },
      { value: 100480003, label: "Success" },
    ],
  },
  ChatRole: {
    name: "tiq_chatrole",
    options: [
      { value: 100480000, label: "User" },
      { value: 100480001, label: "Assistant" },
      { value: 100480002, label: "System" },
    ],
  },
  ToolCallStatus: {
    name: "tiq_toolcallstatus",
    options: [
      { value: 100480000, label: "Pending" },
      { value: 100480001, label: "Executing" },
      { value: 100480002, label: "Completed" },
      { value: 100480003, label: "Failed" },
    ],
  },

  // --- Supply Chain (MCP) ---
  ShipmentStatus: {
    name: "tiq_shipmentstatus",
    options: [
      { value: 100480000, label: "Pending" },
      { value: 100480001, label: "Picked" },
      { value: 100480002, label: "Packed" },
      { value: 100480003, label: "In Transit" },
      { value: 100480004, label: "Delivered" },
      { value: 100480005, label: "Delayed" },
      { value: 100480006, label: "Cancelled" },
    ],
  },
  ShipmentPriority: {
    name: "tiq_shipmentpriority",
    options: [
      { value: 100480000, label: "Standard" },
      { value: 100480001, label: "Express" },
      { value: 100480002, label: "Urgent" },
    ],
  },

  // --- Fleet ---
  VehicleStatus: {
    name: "tiq_vehiclestatus",
    options: [
      { value: 100480000, label: "In Transit" },
      { value: 100480001, label: "Idle" },
      { value: 100480002, label: "Maintenance" },
      { value: 100480003, label: "Returning" },
    ],
  },
  MaintenanceComponent: {
    name: "tiq_maintenancecomponent",
    options: [
      { value: 100480000, label: "Brakes" },
      { value: 100480001, label: "Oil" },
      { value: 100480002, label: "Tires" },
      { value: 100480003, label: "Battery" },
      { value: 100480004, label: "Transmission" },
      { value: 100480005, label: "Coolant" },
      { value: 100480006, label: "Filters" },
    ],
  },

  // --- Work Orders & Field Service ---
  WorkOrderStatus: {
    name: "tiq_workorderstatus",
    options: [
      { value: 100480000, label: "Unscheduled" },
      { value: 100480001, label: "Scheduled" },
      { value: 100480002, label: "In Progress" },
      { value: 100480003, label: "Completed" },
      { value: 100480004, label: "Cancelled" },
    ],
  },
  WorkOrderPriority: {
    name: "tiq_workorderpriority",
    options: [
      { value: 100480000, label: "Low" },
      { value: 100480001, label: "Medium" },
      { value: 100480002, label: "High" },
      { value: 100480003, label: "Critical" },
    ],
  },
  TechnicianStatus: {
    name: "tiq_technicianstatus",
    options: [
      { value: 100480000, label: "Available" },
      { value: 100480001, label: "On Job" },
      { value: 100480002, label: "Off Duty" },
    ],
  },
  ServiceRequestStatus: {
    name: "tiq_servicerequeststatus",
    options: [
      { value: 100480000, label: "New" },
      { value: 100480001, label: "Assigned" },
      { value: 100480002, label: "In Progress" },
      { value: 100480003, label: "On Hold" },
      { value: 100480004, label: "Completed" },
      { value: 100480005, label: "Cancelled" },
    ],
  },
  ServiceRequestPriority: {
    name: "tiq_servicerequestpriority",
    options: [
      { value: 100480000, label: "Low" },
      { value: 100480001, label: "Medium" },
      { value: 100480002, label: "High" },
      { value: 100480003, label: "Critical" },
    ],
  },
  SLAStatus: {
    name: "tiq_slastatus",
    options: [
      { value: 100480000, label: "On Track" },
      { value: 100480001, label: "At Risk" },
      { value: 100480002, label: "Breached" },
    ],
  },
  WarrantyStatus: {
    name: "tiq_warrantystatus",
    options: [
      { value: 100480000, label: "Active" },
      { value: 100480001, label: "Expiring Soon" },
      { value: 100480002, label: "Expired" },
    ],
  },
  AssetOperationalStatus: {
    name: "tiq_assetoperationalstatus",
    options: [
      { value: 100480000, label: "Operational" },
      { value: 100480001, label: "Degraded" },
      { value: 100480002, label: "Down" },
    ],
  },
  ContractType: {
    name: "tiq_contracttype",
    options: [
      { value: 100480000, label: "Basic" },
      { value: 100480001, label: "Standard" },
      { value: 100480002, label: "Premium" },
    ],
  },
  AgreementStatus: {
    name: "tiq_agreementstatus",
    options: [
      { value: 100480000, label: "Active" },
      { value: 100480001, label: "Expiring" },
      { value: 100480002, label: "Expired" },
    ],
  },

  // --- Returns ---
  ReturnStatus: {
    name: "tiq_returnstatus",
    options: [
      { value: 100480000, label: "Requested" },
      { value: 100480001, label: "Approved" },
      { value: 100480002, label: "Pickup Scheduled" },
      { value: 100480003, label: "In Transit" },
      { value: 100480004, label: "Received" },
      { value: 100480005, label: "Processed" },
      { value: 100480006, label: "Rejected" },
    ],
  },
  ReturnReason: {
    name: "tiq_returnreason",
    options: [
      { value: 100480000, label: "Damaged" },
      { value: 100480001, label: "Wrong Item" },
      { value: 100480002, label: "Quality Issue" },
      { value: 100480003, label: "Changed Mind" },
      { value: 100480004, label: "Defective" },
      { value: 100480005, label: "Other" },
    ],
  },

  // --- IoT ---
  IoTDeviceStatus: {
    name: "tiq_iotdevicestatus",
    options: [
      { value: 100480000, label: "Online" },
      { value: 100480001, label: "Offline" },
      { value: 100480002, label: "Degraded" },
    ],
  },
  GeofenceEventType: {
    name: "tiq_geofenceeventtype",
    options: [
      { value: 100480000, label: "Entry" },
      { value: 100480001, label: "Exit" },
    ],
  },
  DrivingAlertType: {
    name: "tiq_drivingalerttype",
    options: [
      { value: 100480000, label: "Speeding" },
      { value: 100480001, label: "Harsh Braking" },
      { value: 100480002, label: "Excessive Idling" },
      { value: 100480003, label: "Route Deviation" },
    ],
  },
  ConnectivityAlertType: {
    name: "tiq_connectivityalerttype",
    options: [
      { value: 100480000, label: "Device Offline" },
      { value: 100480001, label: "Signal Degraded" },
      { value: 100480002, label: "Battery Low" },
      { value: 100480003, label: "GPS Signal Lost" },
    ],
  },
  AlertSeverity: {
    name: "tiq_alertseverity",
    options: [
      { value: 100480000, label: "Low" },
      { value: 100480001, label: "Medium" },
      { value: 100480002, label: "High" },
      { value: 100480003, label: "Critical" },
    ],
  },

  // --- Settings ---
  ThemeMode: {
    name: "tiq_thememode",
    options: [
      { value: 100480000, label: "Light" },
      { value: 100480001, label: "Dark" },
      { value: 100480002, label: "System" },
    ],
  },
  SettingCategory: {
    name: "tiq_settingcategory",
    options: [
      { value: 100480000, label: "General" },
      { value: 100480001, label: "Map" },
      { value: 100480002, label: "MCP" },
      { value: 100480003, label: "Dataverse" },
      { value: 100480004, label: "Email" },
      { value: 100480005, label: "IoT Hub" },
      { value: 100480006, label: "Agents" },
    ],
  },
  AgentDomain: {
    name: "tiq_agentdomain",
    options: [
      { value: 100480000, label: "Traffic" },
      { value: 100480001, label: "Supply Chain" },
      { value: 100480002, label: "Fleet" },
      { value: 100480003, label: "Operations" },
      { value: 100480004, label: "Field Service" },
      { value: 100480005, label: "IoT & Logistics" },
    ],
  },

  // --- Analytics ---
  ExceptionAlertType: {
    name: "tiq_exceptionalerttype",
    options: [
      { value: 100480000, label: "Delay" },
      { value: 100480001, label: "Stock" },
      { value: 100480002, label: "SLA" },
      { value: 100480003, label: "Maintenance" },
      { value: 100480004, label: "Weather" },
    ],
  },
} as const;

// ============================================================================
// Table Definition Interfaces
// ============================================================================

export interface DataverseColumnDef {
  logicalName: string;
  displayName: string;
  type:
    | "string"
    | "memo"
    | "integer"
    | "float"
    | "boolean"
    | "datetime"
    | "lookup"
    | "choice"
    | "uniqueidentifier"
    | "money"
    | "decimal";
  maxLength?: number;
  precision?: number;
  required?: boolean;
  lookupTarget?: string;
  optionSetName?: string;
  description?: string;
}

export interface DataverseTableDef {
  logicalName: string;
  displayName: string;
  pluralName: string;
  primaryNameColumn: string;
  description: string;
  category: "traffic" | "supplychain" | "fleet" | "fieldservice" | "iot" | "settings" | "analytics" | "chat";
  columns: DataverseColumnDef[];
}

// ============================================================================
// SECTION A: Traffic & Journey Tables (Tables 1–9) — App-native data
// ============================================================================

/** Table 1: Traffic Incidents */
export const TrafficIncidentTable: DataverseTableDef = {
  logicalName: "tiq_trafficincident",
  displayName: "Traffic Incident",
  pluralName: "Traffic Incidents",
  primaryNameColumn: "tiq_title",
  category: "traffic",
  description: "Stores traffic incidents including accidents, roadwork, congestion, and closures across Denmark",
  columns: [
    { logicalName: "tiq_trafficincidentid", displayName: "Traffic Incident ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_title", displayName: "Title", type: "string", maxLength: 200, required: true, description: "Short title of the incident" },
    { logicalName: "tiq_description", displayName: "Description", type: "memo", maxLength: 4000, description: "Detailed description of the incident" },
    { logicalName: "tiq_incidenttype", displayName: "Incident Type", type: "choice", optionSetName: "tiq_incidenttype", required: true, description: "Type: accident, roadwork, congestion, closure, other" },
    { logicalName: "tiq_severity", displayName: "Severity", type: "choice", optionSetName: "tiq_incidentseverity", required: true, description: "Severity: low, medium, high, critical" },
    { logicalName: "tiq_latitude", displayName: "Latitude", type: "float", precision: 6, required: true, description: "Geographic latitude of the incident" },
    { logicalName: "tiq_longitude", displayName: "Longitude", type: "float", precision: 6, required: true, description: "Geographic longitude of the incident" },
    { logicalName: "tiq_roadname", displayName: "Road Name", type: "string", maxLength: 200, description: "Name of the affected road" },
    { logicalName: "tiq_starttime", displayName: "Start Time", type: "datetime", description: "When the incident started" },
    { logicalName: "tiq_endtime", displayName: "End Time", type: "datetime", description: "When the incident ended or is expected to end" },
    { logicalName: "tiq_delayminutes", displayName: "Delay (Minutes)", type: "integer", description: "Estimated delay caused by the incident in minutes" },
    { logicalName: "tiq_source", displayName: "Source", type: "choice", optionSetName: "tiq_incidentsource", required: true, description: "Data source: vejdirektoratet, azure-maps, agent" },
    { logicalName: "tiq_externalid", displayName: "External ID", type: "string", maxLength: 100, description: "ID from the external source system for deduplication" },
  ],
};

/** Table 2: Saved Journeys */
export const SavedJourneyTable: DataverseTableDef = {
  logicalName: "tiq_savedjourney",
  displayName: "Saved Journey",
  pluralName: "Saved Journeys",
  primaryNameColumn: "tiq_name",
  category: "traffic",
  description: "Stores saved journey routes with origin, destination, and user preferences",
  columns: [
    { logicalName: "tiq_savedjourneyid", displayName: "Saved Journey ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_name", displayName: "Name", type: "string", maxLength: 200, required: true, description: "User-defined name for the journey" },
    { logicalName: "tiq_originlabel", displayName: "Origin Label", type: "string", maxLength: 300, required: true, description: "Display name of the origin location" },
    { logicalName: "tiq_originaddress", displayName: "Origin Address", type: "string", maxLength: 500, description: "Full address of the origin" },
    { logicalName: "tiq_originlatitude", displayName: "Origin Latitude", type: "float", precision: 6, required: true, description: "Origin geographic latitude" },
    { logicalName: "tiq_originlongitude", displayName: "Origin Longitude", type: "float", precision: 6, required: true, description: "Origin geographic longitude" },
    { logicalName: "tiq_destinationlabel", displayName: "Destination Label", type: "string", maxLength: 300, required: true, description: "Display name of the destination location" },
    { logicalName: "tiq_destinationaddress", displayName: "Destination Address", type: "string", maxLength: 500, description: "Full address of the destination" },
    { logicalName: "tiq_destinationlatitude", displayName: "Destination Latitude", type: "float", precision: 6, required: true, description: "Destination geographic latitude" },
    { logicalName: "tiq_destinationlongitude", displayName: "Destination Longitude", type: "float", precision: 6, required: true, description: "Destination geographic longitude" },
    { logicalName: "tiq_transportmode", displayName: "Transport Mode", type: "choice", optionSetName: "tiq_transportmode", required: true, description: "Mode of transport: car, transit, bicycle, walk" },
    { logicalName: "tiq_avoidtolls", displayName: "Avoid Tolls", type: "boolean", description: "Whether to avoid toll roads" },
    { logicalName: "tiq_avoidhighways", displayName: "Avoid Highways", type: "boolean", description: "Whether to avoid highways" },
    { logicalName: "tiq_morningalertenabled", displayName: "Morning Alert Enabled", type: "boolean", description: "Whether morning alerts are enabled for this journey" },
    { logicalName: "tiq_morningalerttime", displayName: "Morning Alert Time", type: "string", maxLength: 10, description: "Time for morning alert in HH:mm format" },
    { logicalName: "tiq_morningalertdays", displayName: "Morning Alert Days", type: "string", maxLength: 50, description: "JSON array of day numbers (0=Sun, 6=Sat) e.g. [1,2,3,4,5]" },
    { logicalName: "tiq_morningalertemail", displayName: "Morning Alert Email", type: "boolean", description: "Whether to send morning alert via email" },
    { logicalName: "tiq_morningalertpush", displayName: "Morning Alert Push", type: "boolean", description: "Whether to send morning alert via push notification" },
    { logicalName: "tiq_lastusedat", displayName: "Last Used At", type: "datetime", description: "When the journey was last used for navigation" },
  ],
};

/** Table 3: Route Options */
export const RouteOptionTable: DataverseTableDef = {
  logicalName: "tiq_routeoption",
  displayName: "Route Option",
  pluralName: "Route Options",
  primaryNameColumn: "tiq_summary",
  category: "traffic",
  description: "Stores route alternatives with distance, duration, and traffic information",
  columns: [
    { logicalName: "tiq_routeoptionid", displayName: "Route Option ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_summary", displayName: "Summary", type: "string", maxLength: 500, required: true, description: "Summary of the route (e.g. via E45, Motorvej)" },
    { logicalName: "tiq_savedjourneyid", displayName: "Saved Journey", type: "lookup", lookupTarget: "tiq_savedjourney", required: true, description: "Reference to the parent saved journey" },
    { logicalName: "tiq_durationminutes", displayName: "Duration (Minutes)", type: "float", precision: 1, required: true, description: "Estimated trip duration without traffic in minutes" },
    { logicalName: "tiq_durationintrafficminutes", displayName: "Duration In Traffic (Minutes)", type: "float", precision: 1, description: "Estimated duration with current traffic conditions" },
    { logicalName: "tiq_distancekm", displayName: "Distance (km)", type: "float", precision: 2, required: true, description: "Total distance in kilometers" },
    { logicalName: "tiq_departuretime", displayName: "Departure Time", type: "datetime", description: "Planned departure time" },
    { logicalName: "tiq_arrivaltime", displayName: "Arrival Time", type: "datetime", description: "Estimated arrival time" },
    { logicalName: "tiq_coordinates", displayName: "Coordinates", type: "memo", maxLength: 100000, description: "JSON array of [lng, lat] coordinate pairs for the route polyline" },
    { logicalName: "tiq_trafficdelayminutes", displayName: "Traffic Delay (Minutes)", type: "float", precision: 1, description: "Additional delay due to traffic in minutes" },
    { logicalName: "tiq_isrecommended", displayName: "Is Recommended", type: "boolean", description: "Whether this is the AI-recommended route" },
  ],
};

/** Table 4: Route Steps */
export const RouteStepTable: DataverseTableDef = {
  logicalName: "tiq_routestep",
  displayName: "Route Step",
  pluralName: "Route Steps",
  primaryNameColumn: "tiq_instruction",
  category: "traffic",
  description: "Stores turn-by-turn direction steps for a route",
  columns: [
    { logicalName: "tiq_routestepid", displayName: "Route Step ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_instruction", displayName: "Instruction", type: "string", maxLength: 500, required: true, description: "Turn-by-turn instruction text" },
    { logicalName: "tiq_routeoptionid", displayName: "Route Option", type: "lookup", lookupTarget: "tiq_routeoption", required: true, description: "Reference to the parent route option" },
    { logicalName: "tiq_distancekm", displayName: "Distance (km)", type: "float", precision: 2, description: "Distance for this step in kilometers" },
    { logicalName: "tiq_durationminutes", displayName: "Duration (Minutes)", type: "float", precision: 1, description: "Duration for this step in minutes" },
    { logicalName: "tiq_maneuver", displayName: "Maneuver", type: "string", maxLength: 100, description: "Type of maneuver (e.g. TURN_LEFT, STRAIGHT)" },
    { logicalName: "tiq_roadname", displayName: "Road Name", type: "string", maxLength: 200, description: "Name of the road for this step" },
    { logicalName: "tiq_latitude", displayName: "Latitude", type: "float", precision: 6, description: "Latitude of this step point" },
    { logicalName: "tiq_longitude", displayName: "Longitude", type: "float", precision: 6, description: "Longitude of this step point" },
    { logicalName: "tiq_steporder", displayName: "Step Order", type: "integer", required: true, description: "Order of this step within the route (1-based)" },
  ],
};

/** Table 5: Notifications */
export const NotificationTable: DataverseTableDef = {
  logicalName: "tiq_notification",
  displayName: "Notification",
  pluralName: "Notifications",
  primaryNameColumn: "tiq_title",
  category: "traffic",
  description: "Stores application notifications for traffic alerts, journey updates, shipment events, and system messages",
  columns: [
    { logicalName: "tiq_notificationid", displayName: "Notification ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_title", displayName: "Title", type: "string", maxLength: 200, required: true, description: "Notification title" },
    { logicalName: "tiq_body", displayName: "Body", type: "memo", maxLength: 4000, description: "Notification body text" },
    { logicalName: "tiq_notificationtype", displayName: "Notification Type", type: "choice", optionSetName: "tiq_notificationtype", required: true, description: "Type: traffic, journey, system, shipment, fleet, iot, maintenance" },
    { logicalName: "tiq_isread", displayName: "Is Read", type: "boolean", description: "Whether the notification has been read" },
    { logicalName: "tiq_severity", displayName: "Severity", type: "choice", optionSetName: "tiq_notificationseverity", description: "Severity: info, warning, error, success" },
    { logicalName: "tiq_journeyid", displayName: "Related Journey", type: "lookup", lookupTarget: "tiq_savedjourney", description: "Reference to related saved journey (optional)" },
    { logicalName: "tiq_incidentid", displayName: "Related Incident", type: "lookup", lookupTarget: "tiq_trafficincident", description: "Reference to related traffic incident (optional)" },
    { logicalName: "tiq_shipmentid", displayName: "Related Shipment", type: "lookup", lookupTarget: "tiq_shipment", description: "Reference to related shipment (optional)" },
  ],
};

/** Table 6: User Preferences */
export const UserPreferenceTable: DataverseTableDef = {
  logicalName: "tiq_userpreference",
  displayName: "User Preference",
  pluralName: "User Preferences",
  primaryNameColumn: "tiq_name",
  category: "settings",
  description: "Stores per-user notification settings and application preferences",
  columns: [
    { logicalName: "tiq_userpreferenceid", displayName: "User Preference ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_name", displayName: "Name", type: "string", maxLength: 200, required: true, description: "Preference set name (e.g. user display name)" },
    { logicalName: "tiq_pushenabled", displayName: "Push Enabled", type: "boolean", description: "Whether push notifications are enabled" },
    { logicalName: "tiq_emailenabled", displayName: "Email Enabled", type: "boolean", description: "Whether email notifications are enabled" },
    { logicalName: "tiq_emailaddress", displayName: "Email Address", type: "string", maxLength: 320, description: "Email address for notifications" },
    { logicalName: "tiq_toastenabled", displayName: "Toast Enabled", type: "boolean", description: "Whether in-app toast notifications are enabled" },
    { logicalName: "tiq_morningalerttime", displayName: "Morning Alert Time", type: "string", maxLength: 10, description: "Default morning alert time in HH:mm format" },
    { logicalName: "tiq_morningalertdays", displayName: "Morning Alert Days", type: "string", maxLength: 50, description: "JSON array of day numbers (0=Sun, 6=Sat) e.g. [1,2,3,4,5]" },
    { logicalName: "tiq_thememode", displayName: "Theme Mode", type: "choice", optionSetName: "tiq_thememode", description: "Preferred theme: light, dark, system" },
    { logicalName: "tiq_maplanguage", displayName: "Map Language", type: "string", maxLength: 10, description: "Preferred map language code (e.g. da-DK, en-US)" },
    { logicalName: "tiq_mapstyle", displayName: "Map Style", type: "string", maxLength: 50, description: "Preferred map style (road, satellite, night)" },
  ],
};

/** Table 7: Chat Threads */
export const ChatThreadTable: DataverseTableDef = {
  logicalName: "tiq_chatthread",
  displayName: "Chat Thread",
  pluralName: "Chat Threads",
  primaryNameColumn: "tiq_name",
  category: "chat",
  description: "Stores AI chat conversation threads for the multi-agent orchestrator",
  columns: [
    { logicalName: "tiq_chatthreadid", displayName: "Chat Thread ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_name", displayName: "Name", type: "string", maxLength: 200, required: true, description: "Thread name or first message preview" },
    { logicalName: "tiq_externalthreadid", displayName: "External Thread ID", type: "string", maxLength: 200, description: "Thread ID from the Azure AI Foundry Agent" },
    { logicalName: "tiq_agentid", displayName: "Agent ID", type: "string", maxLength: 200, description: "Azure AI Foundry Agent ID" },
    { logicalName: "tiq_agentdomain", displayName: "Agent Domain", type: "choice", optionSetName: "tiq_agentdomain", description: "Which specialist agent owns this thread" },
  ],
};

/** Table 8: Chat Messages */
export const ChatMessageTable: DataverseTableDef = {
  logicalName: "tiq_chatmessage",
  displayName: "Chat Message",
  pluralName: "Chat Messages",
  primaryNameColumn: "tiq_preview",
  category: "chat",
  description: "Stores individual chat messages within conversation threads",
  columns: [
    { logicalName: "tiq_chatmessageid", displayName: "Chat Message ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_preview", displayName: "Preview", type: "string", maxLength: 200, required: true, description: "Short preview of the message content" },
    { logicalName: "tiq_chatthreadid", displayName: "Chat Thread", type: "lookup", lookupTarget: "tiq_chatthread", required: true, description: "Reference to the parent chat thread" },
    { logicalName: "tiq_role", displayName: "Role", type: "choice", optionSetName: "tiq_chatrole", required: true, description: "Message role: user, assistant, system" },
    { logicalName: "tiq_content", displayName: "Content", type: "memo", maxLength: 100000, required: true, description: "Full message content text" },
    { logicalName: "tiq_toolcalls", displayName: "Tool Calls", type: "memo", maxLength: 100000, description: "JSON array of tool call information" },
    { logicalName: "tiq_routedtoagent", displayName: "Routed To Agent", type: "choice", optionSetName: "tiq_agentdomain", description: "Which agent handled this message" },
    { logicalName: "tiq_messageorder", displayName: "Message Order", type: "integer", required: true, description: "Order of the message within the thread" },
  ],
};

/** Table 9: Traffic Summary */
export const TrafficSummaryTable: DataverseTableDef = {
  logicalName: "tiq_trafficsummary",
  displayName: "Traffic Summary",
  pluralName: "Traffic Summaries",
  primaryNameColumn: "tiq_name",
  category: "traffic",
  description: "Stores periodic traffic summary snapshots for dashboard display",
  columns: [
    { logicalName: "tiq_trafficsummaryid", displayName: "Traffic Summary ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_name", displayName: "Name", type: "string", maxLength: 200, required: true, description: "Summary label (e.g. date/time)" },
    { logicalName: "tiq_totalincidents", displayName: "Total Incidents", type: "integer", required: true, description: "Total number of active incidents" },
    { logicalName: "tiq_criticalincidents", displayName: "Critical Incidents", type: "integer", description: "Number of critical-severity incidents" },
    { logicalName: "tiq_averagedelay", displayName: "Average Delay", type: "float", precision: 1, description: "Average delay across incidents in minutes" },
    { logicalName: "tiq_congestionlevel", displayName: "Congestion Level", type: "choice", optionSetName: "tiq_congestionlevel", required: true, description: "Overall congestion level: free, light, moderate, heavy, severe" },
    { logicalName: "tiq_snapshottime", displayName: "Snapshot Time", type: "datetime", required: true, description: "When this summary was captured" },
  ],
};

// ============================================================================
// SECTION B: Supply Chain / MCP Tables (Tables 10–16) — D365 F&O via MCP
// ============================================================================

/** Table 10: Shipment — Core shipment entity sourced from D365 F&O MCP */
export const ShipmentTable: DataverseTableDef = {
  logicalName: "tiq_shipment",
  displayName: "Shipment",
  pluralName: "Shipments",
  primaryNameColumn: "tiq_shipmentid_display",
  category: "supplychain",
  description: "Stores shipment data synced from D365 F&O via MCP, including origin, destination, status, and items",
  columns: [
    { logicalName: "tiq_shipmentid", displayName: "Shipment ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_shipmentid_display", displayName: "Shipment Number", type: "string", maxLength: 50, required: true, description: "Business shipment ID (e.g. SHP-001)" },
    { logicalName: "tiq_warehouseid", displayName: "Warehouse", type: "lookup", lookupTarget: "tiq_warehouse", description: "Source warehouse reference" },
    { logicalName: "tiq_warehousename", displayName: "Warehouse Name", type: "string", maxLength: 200, description: "Denormalized warehouse name for display" },
    { logicalName: "tiq_originlabel", displayName: "Origin", type: "string", maxLength: 300, required: true, description: "Origin location label" },
    { logicalName: "tiq_originlatitude", displayName: "Origin Lat", type: "float", precision: 6, description: "Origin latitude" },
    { logicalName: "tiq_originlongitude", displayName: "Origin Lng", type: "float", precision: 6, description: "Origin longitude" },
    { logicalName: "tiq_destinationlabel", displayName: "Destination", type: "string", maxLength: 300, required: true, description: "Destination location label" },
    { logicalName: "tiq_destinationlatitude", displayName: "Destination Lat", type: "float", precision: 6, description: "Destination latitude" },
    { logicalName: "tiq_destinationlongitude", displayName: "Destination Lng", type: "float", precision: 6, description: "Destination longitude" },
    { logicalName: "tiq_customername", displayName: "Customer Name", type: "string", maxLength: 300, description: "Customer receiving the shipment" },
    { logicalName: "tiq_status", displayName: "Status", type: "choice", optionSetName: "tiq_shipmentstatus", required: true, description: "Shipment lifecycle status" },
    { logicalName: "tiq_priority", displayName: "Priority", type: "choice", optionSetName: "tiq_shipmentpriority", required: true, description: "Shipment priority: standard, express, urgent" },
    { logicalName: "tiq_scheduleddate", displayName: "Scheduled Date", type: "datetime", description: "Scheduled dispatch date" },
    { logicalName: "tiq_estimatedarrival", displayName: "Estimated Arrival", type: "datetime", description: "Estimated arrival at destination" },
    { logicalName: "tiq_actualdeparture", displayName: "Actual Departure", type: "datetime", description: "Actual departure time" },
    { logicalName: "tiq_items", displayName: "Items", type: "memo", maxLength: 50000, description: "JSON array of shipment items [{itemId, itemName, quantity, unit, weight}]" },
    { logicalName: "tiq_totalweight", displayName: "Total Weight (kg)", type: "float", precision: 2, description: "Total shipment weight in kilograms" },
    { logicalName: "tiq_currenttrafficdelay", displayName: "Current Traffic Delay (min)", type: "integer", description: "Current traffic delay in minutes" },
    { logicalName: "tiq_routedistancekm", displayName: "Route Distance (km)", type: "float", precision: 2, description: "Route distance in kilometers" },
    { logicalName: "tiq_routedurationminutes", displayName: "Route Duration (min)", type: "float", precision: 1, description: "Route duration in minutes" },
    { logicalName: "tiq_trackingevents", displayName: "Tracking Events", type: "memo", maxLength: 100000, description: "JSON array of tracking events [{status, timestamp, location, description}]" },
    { logicalName: "tiq_d365externalid", displayName: "D365 External ID", type: "string", maxLength: 100, description: "Original record ID from D365 F&O for sync" },
  ],
};

/** Table 11: Warehouse — Facility data from D365 F&O MCP */
export const WarehouseTable: DataverseTableDef = {
  logicalName: "tiq_warehouse",
  displayName: "Warehouse",
  pluralName: "Warehouses",
  primaryNameColumn: "tiq_name",
  category: "supplychain",
  description: "Stores warehouse/facility data synced from D365 F&O via MCP",
  columns: [
    { logicalName: "tiq_warehouseid", displayName: "Warehouse ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_name", displayName: "Name", type: "string", maxLength: 200, required: true, description: "Warehouse name (e.g. DK01 - Copenhagen)" },
    { logicalName: "tiq_warehousecode", displayName: "Warehouse Code", type: "string", maxLength: 20, required: true, description: "Short code (e.g. DK01, DK02)" },
    { logicalName: "tiq_latitude", displayName: "Latitude", type: "float", precision: 6, description: "Warehouse latitude" },
    { logicalName: "tiq_longitude", displayName: "Longitude", type: "float", precision: 6, description: "Warehouse longitude" },
    { logicalName: "tiq_address", displayName: "Address", type: "string", maxLength: 500, description: "Full address" },
    { logicalName: "tiq_activeshipments", displayName: "Active Shipments", type: "integer", description: "Count of active shipments" },
    { logicalName: "tiq_pendingshipments", displayName: "Pending Shipments", type: "integer", description: "Count of pending shipments" },
    { logicalName: "tiq_totalinventoryitems", displayName: "Total Inventory Items", type: "integer", description: "Total distinct inventory items" },
    { logicalName: "tiq_d365externalid", displayName: "D365 External ID", type: "string", maxLength: 100, description: "Original record ID from D365 F&O" },
  ],
};

/** Table 12: Inventory Item — Stock levels from D365 F&O MCP */
export const InventoryItemTable: DataverseTableDef = {
  logicalName: "tiq_inventoryitem",
  displayName: "Inventory Item",
  pluralName: "Inventory Items",
  primaryNameColumn: "tiq_itemname",
  category: "supplychain",
  description: "Stores warehouse stock levels and reorder points from D365 F&O via MCP",
  columns: [
    { logicalName: "tiq_inventoryitemid", displayName: "Inventory Item ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_itemname", displayName: "Item Name", type: "string", maxLength: 300, required: true, description: "Product/item name" },
    { logicalName: "tiq_itemcode", displayName: "Item Code", type: "string", maxLength: 50, required: true, description: "Business item code" },
    { logicalName: "tiq_warehouseid", displayName: "Warehouse", type: "lookup", lookupTarget: "tiq_warehouse", required: true, description: "Warehouse storing this item" },
    { logicalName: "tiq_quantityonhand", displayName: "Quantity On Hand", type: "integer", required: true, description: "Physical quantity in stock" },
    { logicalName: "tiq_quantityreserved", displayName: "Quantity Reserved", type: "integer", description: "Quantity reserved for orders" },
    { logicalName: "tiq_quantityavailable", displayName: "Quantity Available", type: "integer", description: "Available = on hand - reserved" },
    { logicalName: "tiq_unit", displayName: "Unit", type: "string", maxLength: 20, description: "Unit of measure (pcs, kg, etc.)" },
    { logicalName: "tiq_reorderpoint", displayName: "Reorder Point", type: "integer", description: "Minimum stock level before reorder" },
    { logicalName: "tiq_lastupdated", displayName: "Last Updated", type: "datetime", description: "Last sync from D365 F&O" },
    { logicalName: "tiq_d365externalid", displayName: "D365 External ID", type: "string", maxLength: 100, description: "Original record ID from D365 F&O" },
  ],
};

/** Table 13: Delivery Route — Optimized multi-stop routes */
export const DeliveryRouteTable: DataverseTableDef = {
  logicalName: "tiq_deliveryroute",
  displayName: "Delivery Route",
  pluralName: "Delivery Routes",
  primaryNameColumn: "tiq_name",
  category: "supplychain",
  description: "Stores optimized delivery routes with multi-stop waypoints from Azure Maps TSP solver",
  columns: [
    { logicalName: "tiq_deliveryrouteid", displayName: "Delivery Route ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_name", displayName: "Name", type: "string", maxLength: 200, required: true, description: "Route name (e.g. DK01 Morning Run)" },
    { logicalName: "tiq_warehouseid", displayName: "Warehouse", type: "lookup", lookupTarget: "tiq_warehouse", description: "Origin warehouse" },
    { logicalName: "tiq_originlatitude", displayName: "Origin Lat", type: "float", precision: 6, description: "Route origin latitude" },
    { logicalName: "tiq_originlongitude", displayName: "Origin Lng", type: "float", precision: 6, description: "Route origin longitude" },
    { logicalName: "tiq_stops", displayName: "Stops", type: "memo", maxLength: 100000, description: "JSON array of delivery stops [{shipmentId, location, customerName, stopOrder, estimatedArrival}]" },
    { logicalName: "tiq_totaldistancekm", displayName: "Total Distance (km)", type: "float", precision: 2, description: "Total route distance" },
    { logicalName: "tiq_totaldurationminutes", displayName: "Total Duration (min)", type: "float", precision: 1, description: "Total route duration" },
    { logicalName: "tiq_trafficdelayminutes", displayName: "Traffic Delay (min)", type: "float", precision: 1, description: "Current traffic delay" },
    { logicalName: "tiq_optimizedorder", displayName: "Optimized Order", type: "memo", maxLength: 5000, description: "JSON array of optimized stop indices" },
    { logicalName: "tiq_coordinates", displayName: "Coordinates", type: "memo", maxLength: 100000, description: "JSON array of [lng, lat] polyline coordinates" },
  ],
};

/** Table 14: Return Order — Reverse logistics from D365 F&O MCP */
export const ReturnOrderTable: DataverseTableDef = {
  logicalName: "tiq_returnorder",
  displayName: "Return Order",
  pluralName: "Return Orders",
  primaryNameColumn: "tiq_returnid_display",
  category: "supplychain",
  description: "Stores return/RMA orders for reverse logistics processing",
  columns: [
    { logicalName: "tiq_returnorderid", displayName: "Return Order ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_returnid_display", displayName: "Return Number", type: "string", maxLength: 50, required: true, description: "Business return ID (e.g. RET-001)" },
    { logicalName: "tiq_originalshipmentid", displayName: "Original Shipment", type: "lookup", lookupTarget: "tiq_shipment", description: "Reference to the original shipment" },
    { logicalName: "tiq_customername", displayName: "Customer Name", type: "string", maxLength: 300, required: true, description: "Customer requesting the return" },
    { logicalName: "tiq_reason", displayName: "Return Reason", type: "choice", optionSetName: "tiq_returnreason", required: true, description: "Reason for return" },
    { logicalName: "tiq_status", displayName: "Status", type: "choice", optionSetName: "tiq_returnstatus", required: true, description: "Return lifecycle status" },
    { logicalName: "tiq_items", displayName: "Return Items", type: "memo", maxLength: 50000, description: "JSON array of return items [{itemId, itemName, quantity, condition}]" },
    { logicalName: "tiq_requesteddate", displayName: "Requested Date", type: "datetime", description: "When return was requested" },
    { logicalName: "tiq_pickupdate", displayName: "Pickup Date", type: "datetime", description: "Scheduled pickup date" },
    { logicalName: "tiq_receiveddate", displayName: "Received Date", type: "datetime", description: "When items were received back" },
    { logicalName: "tiq_refundamount", displayName: "Refund Amount", type: "money", precision: 2, description: "Total refund amount" },
    { logicalName: "tiq_warehouseid", displayName: "Warehouse", type: "lookup", lookupTarget: "tiq_warehouse", description: "Receiving warehouse" },
    { logicalName: "tiq_notes", displayName: "Notes", type: "memo", maxLength: 4000, description: "Additional notes" },
    { logicalName: "tiq_d365externalid", displayName: "D365 External ID", type: "string", maxLength: 100, description: "Original record ID from D365 F&O" },
  ],
};

// ============================================================================
// SECTION C: Fleet & Maintenance Tables (Tables 15–18) — D365 F&O MCP
// ============================================================================

/** Table 15: Fleet Vehicle — Vehicle fleet data from D365 F&O MCP */
export const FleetVehicleTable: DataverseTableDef = {
  logicalName: "tiq_fleetvehicle",
  displayName: "Fleet Vehicle",
  pluralName: "Fleet Vehicles",
  primaryNameColumn: "tiq_licenseplate",
  category: "fleet",
  description: "Stores fleet vehicle data with real-time status from D365 F&O and IoT telemetry",
  columns: [
    { logicalName: "tiq_fleetvehicleid", displayName: "Fleet Vehicle ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_vehiclecode", displayName: "Vehicle Code", type: "string", maxLength: 50, required: true, description: "Business vehicle ID (e.g. TRK-001)" },
    { logicalName: "tiq_licenseplate", displayName: "License Plate", type: "string", maxLength: 20, required: true, description: "Vehicle license plate number" },
    { logicalName: "tiq_drivername", displayName: "Driver Name", type: "string", maxLength: 200, description: "Currently assigned driver" },
    { logicalName: "tiq_driverid", displayName: "Driver ID", type: "string", maxLength: 50, description: "Driver reference ID" },
    { logicalName: "tiq_status", displayName: "Status", type: "choice", optionSetName: "tiq_vehiclestatus", required: true, description: "Current vehicle status" },
    { logicalName: "tiq_latitude", displayName: "Current Latitude", type: "float", precision: 6, description: "Current GPS latitude" },
    { logicalName: "tiq_longitude", displayName: "Current Longitude", type: "float", precision: 6, description: "Current GPS longitude" },
    { logicalName: "tiq_locationlabel", displayName: "Current Location", type: "string", maxLength: 300, description: "Reverse-geocoded location label" },
    { logicalName: "tiq_assignedroute", displayName: "Assigned Route", type: "string", maxLength: 100, description: "Currently assigned route reference" },
    { logicalName: "tiq_currentshipmentid", displayName: "Current Shipment", type: "lookup", lookupTarget: "tiq_shipment", description: "Currently carrying shipment" },
    { logicalName: "tiq_loadpercent", displayName: "Load %", type: "integer", description: "Current load percentage (0-100)" },
    { logicalName: "tiq_speedkmh", displayName: "Speed (km/h)", type: "float", precision: 1, description: "Current speed from GPS" },
    { logicalName: "tiq_fuellevelpercent", displayName: "Fuel Level %", type: "integer", description: "Current fuel level percentage" },
    { logicalName: "tiq_hoursonduty", displayName: "Hours On Duty", type: "float", precision: 1, description: "Hours on duty today" },
    { logicalName: "tiq_distancetodaykm", displayName: "Distance Today (km)", type: "float", precision: 1, description: "Distance driven today" },
    { logicalName: "tiq_d365externalid", displayName: "D365 External ID", type: "string", maxLength: 100, description: "Original record ID from D365 F&O" },
  ],
};

/** Table 16: Vehicle Health — Predictive maintenance scores */
export const VehicleHealthTable: DataverseTableDef = {
  logicalName: "tiq_vehiclehealth",
  displayName: "Vehicle Health",
  pluralName: "Vehicle Health Records",
  primaryNameColumn: "tiq_name",
  category: "fleet",
  description: "Stores vehicle health scores and predicted maintenance windows from IoT telemetry analysis",
  columns: [
    { logicalName: "tiq_vehiclehealthid", displayName: "Vehicle Health ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_name", displayName: "Name", type: "string", maxLength: 200, required: true, description: "Vehicle + date label" },
    { logicalName: "tiq_fleetvehicleid", displayName: "Fleet Vehicle", type: "lookup", lookupTarget: "tiq_fleetvehicle", required: true, description: "Reference to fleet vehicle" },
    { logicalName: "tiq_healthscore", displayName: "Health Score", type: "integer", required: true, description: "Overall health score (0-100)" },
    { logicalName: "tiq_lastservicedate", displayName: "Last Service Date", type: "datetime", description: "Date of last completed service" },
    { logicalName: "tiq_nextpredictedservice", displayName: "Next Predicted Service", type: "datetime", description: "AI-predicted next service date" },
    { logicalName: "tiq_mileagekm", displayName: "Mileage (km)", type: "float", precision: 1, description: "Current mileage" },
    { logicalName: "tiq_enginehours", displayName: "Engine Hours", type: "float", precision: 1, description: "Total engine hours" },
  ],
};

/** Table 17: Maintenance Alert — Predictive failure alerts */
export const MaintenanceAlertTable: DataverseTableDef = {
  logicalName: "tiq_maintenancealert",
  displayName: "Maintenance Alert",
  pluralName: "Maintenance Alerts",
  primaryNameColumn: "tiq_name",
  category: "fleet",
  description: "Stores predictive maintenance alerts from AI/IoT analysis of vehicle telemetry",
  columns: [
    { logicalName: "tiq_maintenancealertid", displayName: "Maintenance Alert ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_name", displayName: "Name", type: "string", maxLength: 200, required: true, description: "Alert summary (e.g. TRK-001 Brakes Critical)" },
    { logicalName: "tiq_fleetvehicleid", displayName: "Fleet Vehicle", type: "lookup", lookupTarget: "tiq_fleetvehicle", required: true, description: "Vehicle with the alert" },
    { logicalName: "tiq_component", displayName: "Component", type: "choice", optionSetName: "tiq_maintenancecomponent", required: true, description: "Affected component" },
    { logicalName: "tiq_severity", displayName: "Severity", type: "choice", optionSetName: "tiq_alertseverity", required: true, description: "Alert severity" },
    { logicalName: "tiq_predictedfailuredate", displayName: "Predicted Failure Date", type: "datetime", description: "When failure is predicted" },
    { logicalName: "tiq_confidencepercent", displayName: "Confidence %", type: "integer", description: "ML model confidence (0-100)" },
    { logicalName: "tiq_recommendedaction", displayName: "Recommended Action", type: "string", maxLength: 500, description: "Suggested maintenance action" },
    { logicalName: "tiq_estimatedcost", displayName: "Estimated Cost", type: "money", precision: 2, description: "Estimated repair cost" },
  ],
};

/** Table 18: Maintenance Record — Historical service records */
export const MaintenanceRecordTable: DataverseTableDef = {
  logicalName: "tiq_maintenancerecord",
  displayName: "Maintenance Record",
  pluralName: "Maintenance Records",
  primaryNameColumn: "tiq_name",
  category: "fleet",
  description: "Stores historical vehicle maintenance/service records from D365 F&O",
  columns: [
    { logicalName: "tiq_maintenancerecordid", displayName: "Maintenance Record ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_name", displayName: "Name", type: "string", maxLength: 200, required: true, description: "Service description label" },
    { logicalName: "tiq_fleetvehicleid", displayName: "Fleet Vehicle", type: "lookup", lookupTarget: "tiq_fleetvehicle", required: true, description: "Serviced vehicle" },
    { logicalName: "tiq_servicetype", displayName: "Service Type", type: "string", maxLength: 200, required: true, description: "Type of service performed" },
    { logicalName: "tiq_servicedate", displayName: "Service Date", type: "datetime", required: true, description: "Date of service" },
    { logicalName: "tiq_cost", displayName: "Cost", type: "money", precision: 2, description: "Service cost" },
    { logicalName: "tiq_technician", displayName: "Technician", type: "string", maxLength: 200, description: "Service technician name" },
    { logicalName: "tiq_notes", displayName: "Notes", type: "memo", maxLength: 4000, description: "Service notes" },
    { logicalName: "tiq_d365externalid", displayName: "D365 External ID", type: "string", maxLength: 100, description: "Original record ID from D365 F&O" },
  ],
};

// ============================================================================
// SECTION D: Work Orders & Field Service Tables (Tables 19–23)
// ============================================================================

/** Table 19: Work Order — Operations work orders from D365 F&O MCP */
export const WorkOrderTable: DataverseTableDef = {
  logicalName: "tiq_workorder",
  displayName: "Work Order",
  pluralName: "Work Orders",
  primaryNameColumn: "tiq_workorderid_display",
  category: "fieldservice",
  description: "Stores work orders for field service operations from D365 F&O",
  columns: [
    { logicalName: "tiq_workorderid", displayName: "Work Order ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_workorderid_display", displayName: "Work Order Number", type: "string", maxLength: 50, required: true, description: "Business work order ID (e.g. WO-001)" },
    { logicalName: "tiq_customername", displayName: "Customer Name", type: "string", maxLength: 300, required: true, description: "Customer name" },
    { logicalName: "tiq_servicetype", displayName: "Service Type", type: "string", maxLength: 200, required: true, description: "Type of service required" },
    { logicalName: "tiq_priority", displayName: "Priority", type: "choice", optionSetName: "tiq_workorderpriority", required: true, description: "Work order priority" },
    { logicalName: "tiq_requiredskills", displayName: "Required Skills", type: "string", maxLength: 500, description: "JSON array of required skill names" },
    { logicalName: "tiq_status", displayName: "Status", type: "choice", optionSetName: "tiq_workorderstatus", required: true, description: "Work order status" },
    { logicalName: "tiq_latitude", displayName: "Latitude", type: "float", precision: 6, description: "Job site latitude" },
    { logicalName: "tiq_longitude", displayName: "Longitude", type: "float", precision: 6, description: "Job site longitude" },
    { logicalName: "tiq_locationlabel", displayName: "Location", type: "string", maxLength: 300, description: "Job site address/label" },
    { logicalName: "tiq_estimatedduration", displayName: "Estimated Duration (hrs)", type: "float", precision: 1, description: "Estimated hours to complete" },
    { logicalName: "tiq_scheduleddate", displayName: "Scheduled Date", type: "datetime", description: "Scheduled service date" },
    { logicalName: "tiq_assignedtechnicianid", displayName: "Assigned Technician", type: "lookup", lookupTarget: "tiq_technician", description: "Assigned technician" },
    { logicalName: "tiq_description", displayName: "Description", type: "memo", maxLength: 4000, description: "Work order description" },
    { logicalName: "tiq_createddate", displayName: "Created Date", type: "datetime", description: "When the work order was created" },
    { logicalName: "tiq_d365externalid", displayName: "D365 External ID", type: "string", maxLength: 100, description: "Original record ID from D365 F&O" },
  ],
};

/** Table 20: Technician — Field service resources */
export const TechnicianTable: DataverseTableDef = {
  logicalName: "tiq_technician",
  displayName: "Technician",
  pluralName: "Technicians",
  primaryNameColumn: "tiq_name",
  category: "fieldservice",
  description: "Stores technician/resource data for field service scheduling",
  columns: [
    { logicalName: "tiq_technicianid", displayName: "Technician ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_name", displayName: "Name", type: "string", maxLength: 200, required: true, description: "Technician full name" },
    { logicalName: "tiq_skills", displayName: "Skills", type: "string", maxLength: 500, description: "JSON array of skill names" },
    { logicalName: "tiq_status", displayName: "Status", type: "choice", optionSetName: "tiq_technicianstatus", required: true, description: "Current availability status" },
    { logicalName: "tiq_latitude", displayName: "Current Latitude", type: "float", precision: 6, description: "Current location latitude" },
    { logicalName: "tiq_longitude", displayName: "Current Longitude", type: "float", precision: 6, description: "Current location longitude" },
    { logicalName: "tiq_locationlabel", displayName: "Current Location", type: "string", maxLength: 300, description: "Current location label" },
    { logicalName: "tiq_todayworkorders", displayName: "Today Work Orders", type: "integer", description: "Work orders assigned today" },
    { logicalName: "tiq_completedtoday", displayName: "Completed Today", type: "integer", description: "Work orders completed today" },
    { logicalName: "tiq_phone", displayName: "Phone", type: "string", maxLength: 30, description: "Contact phone number" },
    { logicalName: "tiq_d365externalid", displayName: "D365 External ID", type: "string", maxLength: 100, description: "Original record ID from D365 F&O" },
  ],
};

/** Table 21: Service Request — Field service requests */
export const ServiceRequestTable: DataverseTableDef = {
  logicalName: "tiq_servicerequest",
  displayName: "Service Request",
  pluralName: "Service Requests",
  primaryNameColumn: "tiq_title",
  category: "fieldservice",
  description: "Stores field service requests with SLA tracking and technician assignment",
  columns: [
    { logicalName: "tiq_servicerequestid", displayName: "Service Request ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_title", displayName: "Title", type: "string", maxLength: 300, required: true, description: "Service request title" },
    { logicalName: "tiq_customername", displayName: "Customer Name", type: "string", maxLength: 300, required: true, description: "Requesting customer" },
    { logicalName: "tiq_customersiteid", displayName: "Customer Site ID", type: "string", maxLength: 50, description: "Customer site reference" },
    { logicalName: "tiq_customeraddress", displayName: "Customer Address", type: "string", maxLength: 500, description: "Service location address" },
    { logicalName: "tiq_assetid", displayName: "Customer Asset", type: "lookup", lookupTarget: "tiq_customerasset", description: "Related customer asset" },
    { logicalName: "tiq_priority", displayName: "Priority", type: "choice", optionSetName: "tiq_servicerequestpriority", required: true, description: "Request priority" },
    { logicalName: "tiq_status", displayName: "Status", type: "choice", optionSetName: "tiq_servicerequeststatus", required: true, description: "Request lifecycle status" },
    { logicalName: "tiq_servicetype", displayName: "Service Type", type: "string", maxLength: 200, description: "Type of service needed" },
    { logicalName: "tiq_description", displayName: "Description", type: "memo", maxLength: 4000, description: "Detailed description" },
    { logicalName: "tiq_sladeadline", displayName: "SLA Deadline", type: "datetime", description: "SLA resolution deadline" },
    { logicalName: "tiq_slastatus", displayName: "SLA Status", type: "choice", optionSetName: "tiq_slastatus", description: "Current SLA compliance status" },
    { logicalName: "tiq_assignedtechnicianid", displayName: "Assigned Technician", type: "lookup", lookupTarget: "tiq_technician", description: "Assigned technician" },
    { logicalName: "tiq_latitude", displayName: "Latitude", type: "float", precision: 6, description: "Service location latitude" },
    { logicalName: "tiq_longitude", displayName: "Longitude", type: "float", precision: 6, description: "Service location longitude" },
    { logicalName: "tiq_createdat", displayName: "Created At", type: "datetime", description: "When the request was created" },
    { logicalName: "tiq_d365externalid", displayName: "D365 External ID", type: "string", maxLength: 100, description: "Original record ID from D365 F&O" },
  ],
};

/** Table 22: Customer Asset — Customer equipment and assets */
export const CustomerAssetTable: DataverseTableDef = {
  logicalName: "tiq_customerasset",
  displayName: "Customer Asset",
  pluralName: "Customer Assets",
  primaryNameColumn: "tiq_assetname",
  category: "fieldservice",
  description: "Stores customer equipment/asset data for field service management",
  columns: [
    { logicalName: "tiq_customerassetid", displayName: "Customer Asset ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_assetname", displayName: "Asset Name", type: "string", maxLength: 300, required: true, description: "Asset name/description" },
    { logicalName: "tiq_customerid", displayName: "Customer ID", type: "string", maxLength: 50, description: "Customer reference" },
    { logicalName: "tiq_customername", displayName: "Customer Name", type: "string", maxLength: 300, description: "Customer name" },
    { logicalName: "tiq_model", displayName: "Model", type: "string", maxLength: 200, description: "Equipment model" },
    { logicalName: "tiq_serialnumber", displayName: "Serial Number", type: "string", maxLength: 100, description: "Equipment serial number" },
    { logicalName: "tiq_location", displayName: "Location", type: "string", maxLength: 300, description: "Asset location/site" },
    { logicalName: "tiq_warrantyexpiry", displayName: "Warranty Expiry", type: "datetime", description: "Warranty expiration date" },
    { logicalName: "tiq_warrantystatus", displayName: "Warranty Status", type: "choice", optionSetName: "tiq_warrantystatus", description: "Warranty status" },
    { logicalName: "tiq_lastservicedate", displayName: "Last Service Date", type: "datetime", description: "Last serviced date" },
    { logicalName: "tiq_servicecount", displayName: "Service Count", type: "integer", description: "Total number of service visits" },
    { logicalName: "tiq_healthscore", displayName: "Health Score", type: "integer", description: "Asset health score (0-100)" },
    { logicalName: "tiq_operationalstatus", displayName: "Operational Status", type: "choice", optionSetName: "tiq_assetoperationalstatus", description: "Operational/degraded/down" },
    { logicalName: "tiq_d365externalid", displayName: "D365 External ID", type: "string", maxLength: 100, description: "Original record ID from D365 F&O" },
  ],
};

/** Table 23: Service Agreement — SLA contracts */
export const ServiceAgreementTable: DataverseTableDef = {
  logicalName: "tiq_serviceagreement",
  displayName: "Service Agreement",
  pluralName: "Service Agreements",
  primaryNameColumn: "tiq_name",
  category: "fieldservice",
  description: "Stores service contracts and SLA definitions for customer agreements",
  columns: [
    { logicalName: "tiq_serviceagreementid", displayName: "Service Agreement ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_name", displayName: "Name", type: "string", maxLength: 200, required: true, description: "Agreement name" },
    { logicalName: "tiq_customername", displayName: "Customer Name", type: "string", maxLength: 300, required: true, description: "Customer name" },
    { logicalName: "tiq_contracttype", displayName: "Contract Type", type: "choice", optionSetName: "tiq_contracttype", required: true, description: "Contract tier: basic, standard, premium" },
    { logicalName: "tiq_startdate", displayName: "Start Date", type: "datetime", required: true, description: "Agreement start date" },
    { logicalName: "tiq_enddate", displayName: "End Date", type: "datetime", required: true, description: "Agreement end date" },
    { logicalName: "tiq_responsetimeslahours", displayName: "Response Time SLA (hrs)", type: "float", precision: 1, description: "Maximum response time in hours" },
    { logicalName: "tiq_resolutiontimeslahours", displayName: "Resolution Time SLA (hrs)", type: "float", precision: 1, description: "Maximum resolution time in hours" },
    { logicalName: "tiq_coveragehours", displayName: "Coverage Hours", type: "string", maxLength: 50, description: "Coverage schedule (e.g. 24/7, 8-18 M-F)" },
    { logicalName: "tiq_assetscount", displayName: "Assets Count", type: "integer", description: "Number of covered assets" },
    { logicalName: "tiq_monthlyvisitsincluded", displayName: "Monthly Visits Included", type: "integer", description: "Included maintenance visits per month" },
    { logicalName: "tiq_status", displayName: "Status", type: "choice", optionSetName: "tiq_agreementstatus", required: true, description: "Agreement status" },
    { logicalName: "tiq_d365externalid", displayName: "D365 External ID", type: "string", maxLength: 100, description: "Original record ID from D365 F&O" },
  ],
};

// ============================================================================
// SECTION E: IoT Tables (Tables 24–28) — Azure IoT Hub
// ============================================================================

/** Table 24: IoT Device — Device registry from Azure IoT Hub */
export const IoTDeviceTable: DataverseTableDef = {
  logicalName: "tiq_iotdevice",
  displayName: "IoT Device",
  pluralName: "IoT Devices",
  primaryNameColumn: "tiq_devicecode",
  category: "iot",
  description: "Stores IoT device registry and status from Azure IoT Hub for fleet GPS tracking",
  columns: [
    { logicalName: "tiq_iotdeviceid", displayName: "IoT Device ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_devicecode", displayName: "Device Code", type: "string", maxLength: 100, required: true, description: "IoT Hub device ID (e.g. GPS-TRK-001)" },
    { logicalName: "tiq_fleetvehicleid", displayName: "Fleet Vehicle", type: "lookup", lookupTarget: "tiq_fleetvehicle", description: "Installed on vehicle" },
    { logicalName: "tiq_licenseplate", displayName: "License Plate", type: "string", maxLength: 20, description: "Vehicle license plate (denormalized)" },
    { logicalName: "tiq_devicemodel", displayName: "Device Model", type: "string", maxLength: 100, description: "Hardware model" },
    { logicalName: "tiq_firmwareversion", displayName: "Firmware Version", type: "string", maxLength: 50, description: "Current firmware version" },
    { logicalName: "tiq_status", displayName: "Status", type: "choice", optionSetName: "tiq_iotdevicestatus", required: true, description: "Device status: online, offline, degraded" },
    { logicalName: "tiq_signalstrengthpercent", displayName: "Signal Strength %", type: "integer", description: "Current signal strength (0-100)" },
    { logicalName: "tiq_batterylevelpercent", displayName: "Battery Level %", type: "integer", description: "Current battery level (0-100)" },
    { logicalName: "tiq_lastheartbeat", displayName: "Last Heartbeat", type: "datetime", description: "Last telemetry heartbeat timestamp" },
    { logicalName: "tiq_latitude", displayName: "Last Known Latitude", type: "float", precision: 6, description: "Last known GPS latitude" },
    { logicalName: "tiq_longitude", displayName: "Last Known Longitude", type: "float", precision: 6, description: "Last known GPS longitude" },
    { logicalName: "tiq_locationlabel", displayName: "Last Known Location", type: "string", maxLength: 300, description: "Last known location label" },
    { logicalName: "tiq_installeddate", displayName: "Installed Date", type: "datetime", description: "When device was installed on vehicle" },
  ],
};

/** Table 25: Geofence Zone — Geographic boundary definitions */
export const GeofenceZoneTable: DataverseTableDef = {
  logicalName: "tiq_geofencezone",
  displayName: "Geofence Zone",
  pluralName: "Geofence Zones",
  primaryNameColumn: "tiq_name",
  category: "iot",
  description: "Stores geofence zone definitions for warehouse zones and delivery areas",
  columns: [
    { logicalName: "tiq_geofencezoneid", displayName: "Geofence Zone ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_name", displayName: "Name", type: "string", maxLength: 200, required: true, description: "Geofence zone name" },
    { logicalName: "tiq_centerlatitude", displayName: "Center Latitude", type: "float", precision: 6, required: true, description: "Center point latitude" },
    { logicalName: "tiq_centerlongitude", displayName: "Center Longitude", type: "float", precision: 6, required: true, description: "Center point longitude" },
    { logicalName: "tiq_radiusmeters", displayName: "Radius (meters)", type: "integer", required: true, description: "Zone radius in meters" },
    { logicalName: "tiq_warehouseid", displayName: "Warehouse", type: "lookup", lookupTarget: "tiq_warehouse", description: "Associated warehouse (if warehouse zone)" },
  ],
};

/** Table 26: Geofence Event — Entry/exit events from IoT Hub */
export const GeofenceEventTable: DataverseTableDef = {
  logicalName: "tiq_geofenceevent",
  displayName: "Geofence Event",
  pluralName: "Geofence Events",
  primaryNameColumn: "tiq_name",
  category: "iot",
  description: "Stores geofence entry/exit events from Azure IoT Hub for fleet tracking",
  columns: [
    { logicalName: "tiq_geofenceeventid", displayName: "Geofence Event ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_name", displayName: "Name", type: "string", maxLength: 200, required: true, description: "Event summary (e.g. TRK-001 entered DK01 Zone)" },
    { logicalName: "tiq_geofencezoneid", displayName: "Geofence Zone", type: "lookup", lookupTarget: "tiq_geofencezone", required: true, description: "Zone that triggered the event" },
    { logicalName: "tiq_fleetvehicleid", displayName: "Fleet Vehicle", type: "lookup", lookupTarget: "tiq_fleetvehicle", required: true, description: "Vehicle that triggered the event" },
    { logicalName: "tiq_drivername", displayName: "Driver Name", type: "string", maxLength: 200, description: "Driver at time of event" },
    { logicalName: "tiq_eventtype", displayName: "Event Type", type: "choice", optionSetName: "tiq_geofenceeventtype", required: true, description: "Entry or exit" },
    { logicalName: "tiq_timestamp", displayName: "Timestamp", type: "datetime", required: true, description: "When the event occurred" },
    { logicalName: "tiq_dwelltimeminutes", displayName: "Dwell Time (min)", type: "integer", description: "Time spent in zone (for exit events)" },
    { logicalName: "tiq_expectedentry", displayName: "Expected Entry", type: "boolean", description: "Whether this was a scheduled/expected entry" },
  ],
};

/** Table 27: Driving Alert — Driver behavior events from IoT Hub */
export const DrivingAlertTable: DataverseTableDef = {
  logicalName: "tiq_drivingalert",
  displayName: "Driving Alert",
  pluralName: "Driving Alerts",
  primaryNameColumn: "tiq_name",
  category: "iot",
  description: "Stores driving behavior alerts (speeding, harsh braking, idling, route deviation) from IoT telemetry",
  columns: [
    { logicalName: "tiq_drivingalertid", displayName: "Driving Alert ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_name", displayName: "Name", type: "string", maxLength: 200, required: true, description: "Alert summary" },
    { logicalName: "tiq_fleetvehicleid", displayName: "Fleet Vehicle", type: "lookup", lookupTarget: "tiq_fleetvehicle", required: true, description: "Vehicle involved" },
    { logicalName: "tiq_drivername", displayName: "Driver Name", type: "string", maxLength: 200, description: "Driver at time of alert" },
    { logicalName: "tiq_alerttype", displayName: "Alert Type", type: "choice", optionSetName: "tiq_drivingalerttype", required: true, description: "Type of driving behavior alert" },
    { logicalName: "tiq_severity", displayName: "Severity", type: "choice", optionSetName: "tiq_alertseverity", required: true, description: "Alert severity" },
    { logicalName: "tiq_timestamp", displayName: "Timestamp", type: "datetime", required: true, description: "When the alert occurred" },
    { logicalName: "tiq_latitude", displayName: "Latitude", type: "float", precision: 6, description: "Location latitude" },
    { logicalName: "tiq_longitude", displayName: "Longitude", type: "float", precision: 6, description: "Location longitude" },
    { logicalName: "tiq_locationlabel", displayName: "Location", type: "string", maxLength: 300, description: "Location label" },
    { logicalName: "tiq_details", displayName: "Details", type: "memo", maxLength: 2000, description: "Alert details/context" },
    { logicalName: "tiq_speedkmh", displayName: "Speed (km/h)", type: "float", precision: 1, description: "Recorded speed (for speeding alerts)" },
    { logicalName: "tiq_speedlimitkmh", displayName: "Speed Limit (km/h)", type: "float", precision: 1, description: "Road speed limit (for speeding alerts)" },
    { logicalName: "tiq_durationseconds", displayName: "Duration (seconds)", type: "integer", description: "Duration of behavior (for idling alerts)" },
  ],
};

/** Table 28: Connectivity Alert — Device connectivity events from IoT Hub */
export const ConnectivityAlertTable: DataverseTableDef = {
  logicalName: "tiq_connectivityalert",
  displayName: "Connectivity Alert",
  pluralName: "Connectivity Alerts",
  primaryNameColumn: "tiq_name",
  category: "iot",
  description: "Stores device connectivity alerts (offline, signal lost, battery low, GPS issues) from Azure IoT Hub",
  columns: [
    { logicalName: "tiq_connectivityalertid", displayName: "Connectivity Alert ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_name", displayName: "Name", type: "string", maxLength: 200, required: true, description: "Alert summary" },
    { logicalName: "tiq_iotdeviceid", displayName: "IoT Device", type: "lookup", lookupTarget: "tiq_iotdevice", required: true, description: "Affected device" },
    { logicalName: "tiq_fleetvehicleid", displayName: "Fleet Vehicle", type: "lookup", lookupTarget: "tiq_fleetvehicle", description: "Vehicle with affected device" },
    { logicalName: "tiq_alerttype", displayName: "Alert Type", type: "choice", optionSetName: "tiq_connectivityalerttype", required: true, description: "Type of connectivity alert" },
    { logicalName: "tiq_severity", displayName: "Severity", type: "choice", optionSetName: "tiq_alertseverity", required: true, description: "Alert severity" },
    { logicalName: "tiq_timestamp", displayName: "Timestamp", type: "datetime", required: true, description: "When the alert occurred" },
    { logicalName: "tiq_resolvedat", displayName: "Resolved At", type: "datetime", description: "When the issue was resolved (null = unresolved)" },
    { logicalName: "tiq_durationminutes", displayName: "Duration (min)", type: "integer", description: "Duration of the connectivity issue" },
    { logicalName: "tiq_details", displayName: "Details", type: "memo", maxLength: 2000, description: "Alert details" },
  ],
};

// ============================================================================
// SECTION F: Settings Tables (Tables 29–30) — Runtime config (no secrets)
// ============================================================================

/** Table 29: App Setting — Key-value runtime settings (themes, map, integration config) */
export const AppSettingTable: DataverseTableDef = {
  logicalName: "tiq_appsetting",
  displayName: "App Setting",
  pluralName: "App Settings",
  primaryNameColumn: "tiq_key",
  category: "settings",
  description: "Stores runtime application settings (themes, map config, integration URLs). Secrets stored in Azure Key Vault, NOT here.",
  columns: [
    { logicalName: "tiq_appsettingid", displayName: "App Setting ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_key", displayName: "Setting Key", type: "string", maxLength: 200, required: true, description: "Unique setting key (e.g. map.defaultCenter, mcp.d365Url)" },
    { logicalName: "tiq_value", displayName: "Setting Value", type: "memo", maxLength: 10000, description: "Setting value (string, JSON, etc.)" },
    { logicalName: "tiq_category", displayName: "Category", type: "choice", optionSetName: "tiq_settingcategory", required: true, description: "Setting category: general, map, mcp, dataverse, email, iot-hub, agents" },
    { logicalName: "tiq_displayname", displayName: "Display Name", type: "string", maxLength: 200, description: "Human-readable setting name" },
    { logicalName: "tiq_description", displayName: "Description", type: "memo", maxLength: 1000, description: "Setting description/help text" },
    { logicalName: "tiq_issecret", displayName: "Is Secret", type: "boolean", description: "If true, value is a Key Vault reference, not the actual secret" },
    { logicalName: "tiq_isactive", displayName: "Is Active", type: "boolean", description: "Whether this setting is currently active" },
  ],
};

/** Table 30: Agent Configuration — Per-agent settings for multi-agent orchestrator */
export const AgentConfigurationTable: DataverseTableDef = {
  logicalName: "tiq_agentconfiguration",
  displayName: "Agent Configuration",
  pluralName: "Agent Configurations",
  primaryNameColumn: "tiq_name",
  category: "settings",
  description: "Stores per-agent configuration for the 6-agent orchestrator (model, tools, keywords, routing)",
  columns: [
    { logicalName: "tiq_agentconfigurationid", displayName: "Agent Configuration ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_name", displayName: "Name", type: "string", maxLength: 200, required: true, description: "Agent display name" },
    { logicalName: "tiq_domain", displayName: "Domain", type: "choice", optionSetName: "tiq_agentdomain", required: true, description: "Agent domain (traffic, supplychain, fleet, etc.)" },
    { logicalName: "tiq_subtitle", displayName: "Subtitle", type: "string", maxLength: 200, description: "Agent subtitle for UI" },
    { logicalName: "tiq_color", displayName: "Color", type: "string", maxLength: 10, description: "Agent theme color hex (e.g. #0078D4)" },
    { logicalName: "tiq_isenabled", displayName: "Is Enabled", type: "boolean", description: "Whether this agent is active" },
    { logicalName: "tiq_modeldeployment", displayName: "Model Deployment", type: "string", maxLength: 100, description: "Azure AI Foundry model deployment name override" },
    { logicalName: "tiq_foundryagentid", displayName: "Foundry Agent ID", type: "string", maxLength: 200, description: "Azure AI Foundry Agent ID" },
    { logicalName: "tiq_keywords", displayName: "Keywords", type: "memo", maxLength: 5000, description: "JSON array of routing keywords for this agent" },
    { logicalName: "tiq_tools", displayName: "Tools", type: "memo", maxLength: 10000, description: "JSON array of registered tool names for this agent" },
    { logicalName: "tiq_systemprompt", displayName: "System Prompt", type: "memo", maxLength: 50000, description: "Custom system prompt override for this agent" },
    { logicalName: "tiq_sortorder", displayName: "Sort Order", type: "integer", description: "Display order in agent list" },
  ],
};

// ============================================================================
// SECTION G: Analytics Tables (Table 31) — Aggregated KPIs
// ============================================================================

/** Table 31: Supply Chain KPI — Aggregated supply chain performance metrics */
export const SupplyChainKPITable: DataverseTableDef = {
  logicalName: "tiq_supplychainkpi",
  displayName: "Supply Chain KPI",
  pluralName: "Supply Chain KPIs",
  primaryNameColumn: "tiq_name",
  category: "analytics",
  description: "Stores periodic supply chain KPI snapshots for analytics dashboard",
  columns: [
    { logicalName: "tiq_supplychainkpiid", displayName: "Supply Chain KPI ID", type: "uniqueidentifier", description: "Primary key" },
    { logicalName: "tiq_name", displayName: "Name", type: "string", maxLength: 200, required: true, description: "Snapshot label (e.g. 2026-03-02 08:00)" },
    { logicalName: "tiq_ontimedeliveryrate", displayName: "On-Time Delivery Rate %", type: "float", precision: 1, description: "Percentage of on-time deliveries" },
    { logicalName: "tiq_avgdeliverytimeminutes", displayName: "Avg Delivery Time (min)", type: "float", precision: 1, description: "Average delivery time in minutes" },
    { logicalName: "tiq_activeshipments", displayName: "Active Shipments", type: "integer", description: "Currently active shipments" },
    { logicalName: "tiq_delayedshipments", displayName: "Delayed Shipments", type: "integer", description: "Currently delayed shipments" },
    { logicalName: "tiq_costperkm", displayName: "Cost Per km", type: "money", precision: 2, description: "Average cost per kilometer" },
    { logicalName: "tiq_slacompliancerate", displayName: "SLA Compliance Rate %", type: "float", precision: 1, description: "SLA compliance percentage" },
    { logicalName: "tiq_warehouseutilization", displayName: "Warehouse Utilization %", type: "float", precision: 1, description: "Warehouse capacity utilization" },
    { logicalName: "tiq_fleetutilization", displayName: "Fleet Utilization %", type: "float", precision: 1, description: "Fleet utilization rate" },
    { logicalName: "tiq_totaldeliveriestoday", displayName: "Total Deliveries Today", type: "integer", description: "Deliveries completed today" },
    { logicalName: "tiq_pendingworkorders", displayName: "Pending Work Orders", type: "integer", description: "Outstanding work orders" },
    { logicalName: "tiq_snapshottime", displayName: "Snapshot Time", type: "datetime", required: true, description: "When this KPI snapshot was taken" },
  ],
};

// ============================================================================
// All Tables Export
// ============================================================================

export const AllTables: DataverseTableDef[] = [
  // Traffic & Journey (1-9)
  TrafficIncidentTable,
  SavedJourneyTable,
  RouteOptionTable,
  RouteStepTable,
  NotificationTable,
  UserPreferenceTable,
  ChatThreadTable,
  ChatMessageTable,
  TrafficSummaryTable,
  // Supply Chain / MCP (10-14)
  ShipmentTable,
  WarehouseTable,
  InventoryItemTable,
  DeliveryRouteTable,
  ReturnOrderTable,
  // Fleet & Maintenance (15-18)
  FleetVehicleTable,
  VehicleHealthTable,
  MaintenanceAlertTable,
  MaintenanceRecordTable,
  // Work Orders & Field Service (19-23)
  WorkOrderTable,
  TechnicianTable,
  ServiceRequestTable,
  CustomerAssetTable,
  ServiceAgreementTable,
  // IoT (24-28)
  IoTDeviceTable,
  GeofenceZoneTable,
  GeofenceEventTable,
  DrivingAlertTable,
  ConnectivityAlertTable,
  // Settings (29-30)
  AppSettingTable,
  AgentConfigurationTable,
  // Analytics (31)
  SupplyChainKPITable,
];

// ============================================================================
// Table Relationships
// ============================================================================

export const TableRelationships = [
  // --- Traffic & Journey ---
  { name: "tiq_savedjourney_routeoptions", parentTable: "tiq_savedjourney", childTable: "tiq_routeoption", lookupColumn: "tiq_savedjourneyid", type: "OneToMany" as const, description: "A saved journey has many route options" },
  { name: "tiq_routeoption_routesteps", parentTable: "tiq_routeoption", childTable: "tiq_routestep", lookupColumn: "tiq_routeoptionid", type: "OneToMany" as const, description: "A route option has many steps" },
  { name: "tiq_savedjourney_notifications", parentTable: "tiq_savedjourney", childTable: "tiq_notification", lookupColumn: "tiq_journeyid", type: "OneToMany" as const, description: "A saved journey can have many notifications" },
  { name: "tiq_trafficincident_notifications", parentTable: "tiq_trafficincident", childTable: "tiq_notification", lookupColumn: "tiq_incidentid", type: "OneToMany" as const, description: "A traffic incident can have many notifications" },
  { name: "tiq_chatthread_chatmessages", parentTable: "tiq_chatthread", childTable: "tiq_chatmessage", lookupColumn: "tiq_chatthreadid", type: "OneToMany" as const, description: "A chat thread has many messages" },

  // --- Supply Chain ---
  { name: "tiq_warehouse_shipments", parentTable: "tiq_warehouse", childTable: "tiq_shipment", lookupColumn: "tiq_warehouseid", type: "OneToMany" as const, description: "A warehouse has many shipments" },
  { name: "tiq_warehouse_inventoryitems", parentTable: "tiq_warehouse", childTable: "tiq_inventoryitem", lookupColumn: "tiq_warehouseid", type: "OneToMany" as const, description: "A warehouse has many inventory items" },
  { name: "tiq_warehouse_deliveryroutes", parentTable: "tiq_warehouse", childTable: "tiq_deliveryroute", lookupColumn: "tiq_warehouseid", type: "OneToMany" as const, description: "A warehouse has many delivery routes" },
  { name: "tiq_shipment_notifications", parentTable: "tiq_shipment", childTable: "tiq_notification", lookupColumn: "tiq_shipmentid", type: "OneToMany" as const, description: "A shipment can have many notifications" },
  { name: "tiq_shipment_returnorders", parentTable: "tiq_shipment", childTable: "tiq_returnorder", lookupColumn: "tiq_originalshipmentid", type: "OneToMany" as const, description: "A shipment can have return orders" },
  { name: "tiq_warehouse_returnorders", parentTable: "tiq_warehouse", childTable: "tiq_returnorder", lookupColumn: "tiq_warehouseid", type: "OneToMany" as const, description: "A warehouse receives return orders" },

  // --- Fleet & Maintenance ---
  { name: "tiq_fleetvehicle_currentshipment", parentTable: "tiq_shipment", childTable: "tiq_fleetvehicle", lookupColumn: "tiq_currentshipmentid", type: "OneToMany" as const, description: "A shipment can be carried by a fleet vehicle" },
  { name: "tiq_fleetvehicle_vehiclehealth", parentTable: "tiq_fleetvehicle", childTable: "tiq_vehiclehealth", lookupColumn: "tiq_fleetvehicleid", type: "OneToMany" as const, description: "A vehicle has health records" },
  { name: "tiq_fleetvehicle_maintenancealerts", parentTable: "tiq_fleetvehicle", childTable: "tiq_maintenancealert", lookupColumn: "tiq_fleetvehicleid", type: "OneToMany" as const, description: "A vehicle has maintenance alerts" },
  { name: "tiq_fleetvehicle_maintenancerecords", parentTable: "tiq_fleetvehicle", childTable: "tiq_maintenancerecord", lookupColumn: "tiq_fleetvehicleid", type: "OneToMany" as const, description: "A vehicle has maintenance records" },

  // --- Work Orders & Field Service ---
  { name: "tiq_technician_workorders", parentTable: "tiq_technician", childTable: "tiq_workorder", lookupColumn: "tiq_assignedtechnicianid", type: "OneToMany" as const, description: "A technician is assigned to work orders" },
  { name: "tiq_technician_servicerequests", parentTable: "tiq_technician", childTable: "tiq_servicerequest", lookupColumn: "tiq_assignedtechnicianid", type: "OneToMany" as const, description: "A technician is assigned to service requests" },
  { name: "tiq_customerasset_servicerequests", parentTable: "tiq_customerasset", childTable: "tiq_servicerequest", lookupColumn: "tiq_assetid", type: "OneToMany" as const, description: "A customer asset can have many service requests" },

  // --- IoT ---
  { name: "tiq_fleetvehicle_iotdevices", parentTable: "tiq_fleetvehicle", childTable: "tiq_iotdevice", lookupColumn: "tiq_fleetvehicleid", type: "OneToMany" as const, description: "A vehicle has IoT devices installed" },
  { name: "tiq_warehouse_geofencezones", parentTable: "tiq_warehouse", childTable: "tiq_geofencezone", lookupColumn: "tiq_warehouseid", type: "OneToMany" as const, description: "A warehouse has geofence zones" },
  { name: "tiq_geofencezone_events", parentTable: "tiq_geofencezone", childTable: "tiq_geofenceevent", lookupColumn: "tiq_geofencezoneid", type: "OneToMany" as const, description: "A geofence zone has many events" },
  { name: "tiq_fleetvehicle_geofenceevents", parentTable: "tiq_fleetvehicle", childTable: "tiq_geofenceevent", lookupColumn: "tiq_fleetvehicleid", type: "OneToMany" as const, description: "A vehicle triggers geofence events" },
  { name: "tiq_fleetvehicle_drivingalerts", parentTable: "tiq_fleetvehicle", childTable: "tiq_drivingalert", lookupColumn: "tiq_fleetvehicleid", type: "OneToMany" as const, description: "A vehicle has driving behavior alerts" },
  { name: "tiq_iotdevice_connectivityalerts", parentTable: "tiq_iotdevice", childTable: "tiq_connectivityalert", lookupColumn: "tiq_iotdeviceid", type: "OneToMany" as const, description: "An IoT device has connectivity alerts" },
  { name: "tiq_fleetvehicle_connectivityalerts", parentTable: "tiq_fleetvehicle", childTable: "tiq_connectivityalert", lookupColumn: "tiq_fleetvehicleid", type: "OneToMany" as const, description: "A vehicle has connectivity alerts via its devices" },
];
