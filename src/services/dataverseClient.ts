// =============================================================================
// Dataverse Client
// Abstraction layer over the Power Apps SDK for Dataverse CRUD operations.
// Supports three connection modes:
//   1. Power Platform hosted (SDK) - relative URLs via managed connector
//   2. Direct Dataverse REST API  - server-side proxy with client credentials
//   3. localStorage fallback      - offline / no credentials
// =============================================================================

import { env } from "../config/env";

interface IGetAllOptions {
  maxPageSize?: number;
  select?: string[];
  filter?: string;
  orderBy?: string[];
  top?: number;
  skip?: number;
  skipToken?: string;
}

interface IOperationResult<T> {
  data: T;
  error?: string;
}

type ConnectionMode = "power-platform" | "direct-api" | "local";

export class DataverseClient {
  private static isInitialized = false;
  private static mode: ConnectionMode = "local";

  /**
   * Initialize the client. Determines the best available connection mode.
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Mode 1: Try Power Platform SDK (only works when hosted inside Power Apps)
    try {
      const sdk = await import("@microsoft/power-apps/app");
      if (sdk && this.isRunningInPowerPlatform()) {
        this.mode = "power-platform";
        this.isInitialized = true;
        console.log("[DataverseClient] Connected via Power Platform SDK");
        return;
      }
    } catch {
      // SDK not available
    }

    // Mode 2: Direct Dataverse REST API via server-side proxy
    // The Vite plugin (vite-dataverse-proxy) handles auth using client credentials.
    // We just need VITE_DATAVERSE_URL set to know Dataverse is configured.
    if (env.dataverseUrl) {
      try {
        // Verify the proxy is working with a simple metadata request
        const res = await fetch("/api/dataverse/$metadata", { method: "HEAD" });
        if (res.ok || res.status === 405) {
          this.mode = "direct-api";
          this.isInitialized = true;
          console.log("[DataverseClient] Connected via Dataverse proxy (client credentials)");
          return;
        }
      } catch (err) {
        console.warn("[DataverseClient] Proxy check failed, falling back to local:", err);
      }
    }

    // Mode 3: localStorage fallback
    this.mode = "local";
    this.isInitialized = true;
    console.log("[DataverseClient] Running in local mode (localStorage only)");
  }

  /**
   * Detect if we're actually running inside the Power Platform host.
   */
  private static isRunningInPowerPlatform(): boolean {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      return !!(
        win.Xrm ||
        win.PowerAppsHost ||
        win.__POWER_APPS_CONTEXT__ ||
        (window.parent !== window && document.referrer.includes(".dynamics.com"))
      );
    } catch {
      return false;
    }
  }

  /**
   * Make a fetch through the Dataverse proxy.
   * Requests go to /api/dataverse/{path} and the Vite plugin
   * adds auth and forwards to the real Dataverse endpoint.
   */
  private static async apiFetch(
    path: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `/api/dataverse/${path}`;

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    return fetch(url, { ...options, headers });
  }

  static get isConnected(): boolean {
    return this.mode !== "local";
  }

  static get connectionMode(): ConnectionMode {
    return this.mode;
  }

  // ---------------------------------------------------------------------------
  // CRUD Operations
  // ---------------------------------------------------------------------------

  static async create<T>(
    entitySetName: string,
    record: Partial<T>
  ): Promise<IOperationResult<T>> {
    await this.initialize();

    if (this.mode === "local") {
      return this.localCreate<T>(entitySetName, record);
    }

    if (this.mode === "power-platform") {
      const response = await fetch(`/api/data/v9.2/${entitySetName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      const data = await response.json();
      return { data: data as T };
    }

    // direct-api mode (via proxy)
    const response = await this.apiFetch(entitySetName, {
      method: "POST",
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      throw new Error(`Dataverse create failed: ${response.status} - ${errText}`);
    }

    // Dataverse returns 204 No Content on create with the entity ID in OData-EntityId header
    const entityIdHeader = response.headers.get("OData-EntityId");
    if (entityIdHeader) {
      const idMatch = entityIdHeader.match(/\(([^)]+)\)/);
      const pk = this.getPrimaryKey(entitySetName);
      return { data: { ...record, [pk]: idMatch?.[1] } as T };
    }

    try {
      const data = await response.json();
      return { data: data as T };
    } catch {
      return { data: record as T };
    }
  }

  static async get<T>(
    entitySetName: string,
    id: string
  ): Promise<IOperationResult<T>> {
    await this.initialize();

    if (this.mode === "local") {
      return this.localGet<T>(entitySetName, id);
    }

    if (this.mode === "power-platform") {
      const response = await fetch(`/api/data/v9.2/${entitySetName}(${id})`);
      const data = await response.json();
      return { data: data as T };
    }

    const response = await this.apiFetch(`${entitySetName}(${id})`);
    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      throw new Error(`Dataverse get failed: ${response.status} - ${errText}`);
    }
    const data = await response.json();
    return { data: data as T };
  }

  static async getAll<T>(
    entitySetName: string,
    options?: IGetAllOptions
  ): Promise<IOperationResult<T[]>> {
    await this.initialize();

    if (this.mode === "local") {
      return this.localGetAll<T>(entitySetName, options);
    }

    const queryParams = this.buildQueryString(options);

    if (this.mode === "power-platform") {
      const url = `/api/data/v9.2/${entitySetName}${queryParams}`;
      const response = await fetch(url);
      const data = await response.json();
      return { data: (data.value ?? []) as T[] };
    }

    const response = await this.apiFetch(`${entitySetName}${queryParams}`);
    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      throw new Error(`Dataverse getAll failed: ${response.status} - ${errText}`);
    }
    const data = await response.json();
    return { data: (data.value ?? []) as T[] };
  }

  static async update<T>(
    entitySetName: string,
    id: string,
    changes: Partial<T>
  ): Promise<void> {
    await this.initialize();

    if (this.mode === "local") {
      this.localUpdate<T>(entitySetName, id, changes);
      return;
    }

    if (this.mode === "power-platform") {
      await fetch(`/api/data/v9.2/${entitySetName}(${id})`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      return;
    }

    const response = await this.apiFetch(`${entitySetName}(${id})`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      throw new Error(`Dataverse update failed: ${response.status} - ${errText}`);
    }
  }

  static async delete(entitySetName: string, id: string): Promise<void> {
    await this.initialize();

    if (this.mode === "local") {
      this.localDelete(entitySetName, id);
      return;
    }

    if (this.mode === "power-platform") {
      await fetch(`/api/data/v9.2/${entitySetName}(${id})`, {
        method: "DELETE",
      });
      return;
    }

    const response = await this.apiFetch(`${entitySetName}(${id})`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      throw new Error(`Dataverse delete failed: ${response.status} - ${errText}`);
    }
  }

  /**
   * Upsert by external ID (F&O business key).
   * Queries Dataverse for a record matching the given external ID field/value.
   * If found → updates the existing record.
   * If not found → creates a new record.
   * This prevents duplicate rows when syncing from D365 F&O MCP.
   */
  static async upsertByExternalId<T>(
    entitySetName: string,
    externalIdField: string,
    externalIdValue: string,
    record: Partial<T>
  ): Promise<IOperationResult<T>> {
    await this.initialize();

    if (this.mode === "local") {
      return this.localUpsertByExternalId<T>(entitySetName, externalIdField, externalIdValue, record);
    }

    // Query for existing record by external ID
    const existing = await this.getAll<Record<string, unknown>>(entitySetName, {
      filter: `${externalIdField} eq '${externalIdValue}'`,
      top: 1,
    });

    if (existing.data?.length) {
      // Update existing record
      const pk = this.getPrimaryKey(entitySetName);
      const existingId = existing.data[0][pk] as string;
      await this.update<T>(entitySetName, existingId, record);
      return { data: { ...record, [pk]: existingId } as T };
    }

    // Create new record
    return this.create<T>(entitySetName, record);
  }

  /**
   * Find a Dataverse record ID by external ID field.
   * Returns the primary key value if found, null otherwise.
   */
  static async findByExternalId(
    entitySetName: string,
    externalIdField: string,
    externalIdValue: string
  ): Promise<string | null> {
    await this.initialize();

    const result = await this.getAll<Record<string, unknown>>(entitySetName, {
      filter: `${externalIdField} eq '${externalIdValue}'`,
      top: 1,
    });

    if (result.data?.length) {
      const pk = this.getPrimaryKey(entitySetName);
      return (result.data[0][pk] as string) ?? null;
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Local Storage Fallback (for offline / local dev)
  // ---------------------------------------------------------------------------

  private static getLocalStore<T>(entitySetName: string): T[] {
    try {
      const raw = localStorage.getItem(`dv_${entitySetName}`);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  }

  private static setLocalStore<T>(entitySetName: string, data: T[]): void {
    localStorage.setItem(`dv_${entitySetName}`, JSON.stringify(data));
  }

  private static getPrimaryKey(entitySetName: string): string {
    const keyMap: Record<string, string> = {
      // Traffic & Journey
      tiq_trafficincidents: "tiq_trafficincidentid",
      tiq_savedjourneies: "tiq_savedjourneyid",
      tiq_routeoptions: "tiq_routeoptionid",
      tiq_routesteps: "tiq_routestepid",
      tiq_notifications: "tiq_notificationid",
      tiq_userpreferences: "tiq_userpreferenceid",
      tiq_chatthreads: "tiq_chatthreadid",
      tiq_chatmessages: "tiq_chatmessageid",
      tiq_trafficsummaries: "tiq_trafficsummaryid",
      // Supply Chain / MCP
      tiq_shipments: "tiq_shipmentid",
      tiq_warehouses: "tiq_warehouseid",
      tiq_inventoryitems: "tiq_inventoryitemid",
      tiq_deliveryroutes: "tiq_deliveryrouteid",
      tiq_returnorders: "tiq_returnorderid",
      // Fleet & Maintenance
      tiq_fleetvehicles: "tiq_fleetvehicleid",
      tiq_vehiclehealths: "tiq_vehiclehealthid",
      tiq_maintenancealerts: "tiq_maintenancealertid",
      tiq_maintenancerecords: "tiq_maintenancerecordid",
      // Work Orders & Field Service
      tiq_workorders: "tiq_workorderid",
      tiq_technicians: "tiq_technicianid",
      tiq_servicerequests: "tiq_servicerequestid",
      tiq_customerassets: "tiq_customerassetid",
      tiq_serviceagreements: "tiq_serviceagreementid",
      // IoT
      tiq_iotdevices: "tiq_iotdeviceid",
      tiq_geofencezones: "tiq_geofencezoneid",
      tiq_geofenceevents: "tiq_geofenceeventid",
      tiq_drivingalerts: "tiq_drivingalertid",
      tiq_connectivityalerts: "tiq_connectivityalertid",
      // Settings
      tiq_appsettings: "tiq_appsettingid",
      tiq_agentconfigurations: "tiq_agentconfigurationid",
      // Analytics
      tiq_supplychainkpis: "tiq_supplychainkpiid",
    };
    return keyMap[entitySetName] ?? "id";
  }

  private static localCreate<T>(
    entitySetName: string,
    record: Partial<T>
  ): IOperationResult<T> {
    const store = this.getLocalStore<Record<string, unknown>>(entitySetName);
    const pk = this.getPrimaryKey(entitySetName);
    const id = crypto.randomUUID();
    const newRecord = {
      ...record,
      [pk]: id,
      createdon: new Date().toISOString(),
      modifiedon: new Date().toISOString(),
      statecode: 0,
      statuscode: 1,
    } as Record<string, unknown>;
    store.push(newRecord);
    this.setLocalStore(entitySetName, store);
    return { data: newRecord as T };
  }

  private static localGet<T>(
    entitySetName: string,
    id: string
  ): IOperationResult<T> {
    const store = this.getLocalStore<Record<string, unknown>>(entitySetName);
    const pk = this.getPrimaryKey(entitySetName);
    const record = store.find((r) => r[pk] === id);
    if (!record) {
      return { data: null as T, error: "Record not found" };
    }
    return { data: record as T };
  }

  private static localGetAll<T>(
    entitySetName: string,
    options?: IGetAllOptions
  ): IOperationResult<T[]> {
    let store = this.getLocalStore<Record<string, unknown>>(entitySetName);

    if (options?.filter) {
      store = this.applyLocalFilter(store, options.filter);
    }

    if (options?.orderBy?.length) {
      store = this.applyLocalSort(store, options.orderBy);
    }

    if (options?.skip) {
      store = store.slice(options.skip);
    }

    if (options?.top) {
      store = store.slice(0, options.top);
    }

    if (options?.select?.length) {
      store = store.map((record) => {
        const filtered: Record<string, unknown> = {};
        const pk = this.getPrimaryKey(entitySetName);
        filtered[pk] = record[pk];
        for (const col of options.select!) {
          filtered[col] = record[col];
        }
        return filtered;
      });
    }

    return { data: store as T[] };
  }

  private static localUpdate<T>(
    entitySetName: string,
    id: string,
    changes: Partial<T>
  ): void {
    const store = this.getLocalStore<Record<string, unknown>>(entitySetName);
    const pk = this.getPrimaryKey(entitySetName);
    const index = store.findIndex((r) => r[pk] === id);
    if (index >= 0) {
      store[index] = {
        ...store[index],
        ...(changes as Record<string, unknown>),
        modifiedon: new Date().toISOString(),
      };
      this.setLocalStore(entitySetName, store);
    }
  }

  private static localDelete(entitySetName: string, id: string): void {
    const store = this.getLocalStore<Record<string, unknown>>(entitySetName);
    const pk = this.getPrimaryKey(entitySetName);
    const filtered = store.filter((r) => r[pk] !== id);
    this.setLocalStore(entitySetName, filtered);
  }

  private static localUpsertByExternalId<T>(
    entitySetName: string,
    externalIdField: string,
    externalIdValue: string,
    record: Partial<T>
  ): IOperationResult<T> {
    const store = this.getLocalStore<Record<string, unknown>>(entitySetName);
    const index = store.findIndex((r) => String(r[externalIdField]) === externalIdValue);

    if (index >= 0) {
      // Update existing
      store[index] = {
        ...store[index],
        ...(record as Record<string, unknown>),
        modifiedon: new Date().toISOString(),
      };
      this.setLocalStore(entitySetName, store);
      return { data: store[index] as T };
    }

    // Create new
    return this.localCreate<T>(entitySetName, record);
  }

  // ---------------------------------------------------------------------------
  // Query Helpers
  // ---------------------------------------------------------------------------

  private static buildQueryString(options?: IGetAllOptions): string {
    if (!options) return "";

    const params: string[] = [];

    if (options.select?.length) {
      params.push(`$select=${options.select.join(",")}`);
    }
    if (options.filter) {
      params.push(`$filter=${encodeURIComponent(options.filter)}`);
    }
    if (options.orderBy?.length) {
      params.push(`$orderby=${options.orderBy.join(",")}`);
    }
    if (options.top !== undefined) {
      params.push(`$top=${options.top}`);
    }
    if (options.skip !== undefined) {
      params.push(`$skip=${options.skip}`);
    }
    if (options.skipToken) {
      params.push(`$skiptoken=${options.skipToken}`);
    }

    return params.length ? `?${params.join("&")}` : "";
  }

  private static applyLocalFilter(
    store: Record<string, unknown>[],
    filter: string
  ): Record<string, unknown>[] {
    // Parse simple OData filters: "field eq 'value'" and "field eq number"
    const eqMatch = filter.match(/(\w+)\s+eq\s+'?([^']*)'?/);
    if (eqMatch) {
      const [, field, value] = eqMatch;
      return store.filter((r) => String(r[field]) === value);
    }

    // Parse "field ne value"
    const neMatch = filter.match(/(\w+)\s+ne\s+'?([^']*)'?/);
    if (neMatch) {
      const [, field, value] = neMatch;
      return store.filter((r) => String(r[field]) !== value);
    }

    return store;
  }

  private static applyLocalSort(
    store: Record<string, unknown>[],
    orderBy: string[]
  ): Record<string, unknown>[] {
    const sorted = [...store];
    const parsed = orderBy.map((o) => {
      const parts = o.trim().split(/\s+/);
      return { field: parts[0], desc: parts[1]?.toLowerCase() === "desc" };
    });

    sorted.sort((a, b) => {
      for (const { field, desc } of parsed) {
        const aVal = a[field];
        const bVal = b[field];
        if (aVal === bVal) continue;
        if (aVal == null) return desc ? -1 : 1;
        if (bVal == null) return desc ? 1 : -1;
        const cmp = String(aVal).localeCompare(String(bVal));
        return desc ? -cmp : cmp;
      }
      return 0;
    });

    return sorted;
  }
}
