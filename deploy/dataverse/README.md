# TrafficIQ Dataverse Solution Deployment

This directory contains the managed Dataverse solution for TrafficIQ and a deployment script
that imports it into a target environment using the Dataverse Web API with OAuth2 client
credentials flow.

## Directory Structure

```
deploy/dataverse/
  Deploy-DataverseSolution.ps1   # Automated deployment script (this guide)
  solution/
    TrafficIQ_managed.zip        # Managed solution (production deployments)
    TrafficIQ_unmanaged.zip      # Unmanaged solution (development environments)
```

## Prerequisites

### 1. Entra ID App Registration

An Azure Entra ID (formerly Azure AD) app registration is required to authenticate against
Dataverse without interactive login. This is the same service principal used by the
Azure Functions API proxy at runtime.

**Create the app registration:**

1. Go to **Azure Portal > Entra ID > App registrations > New registration**.
2. Name: `TrafficIQ-Dataverse` (or any descriptive name).
3. Supported account types: **Single tenant**.
4. No redirect URI is needed for client credentials flow.
5. After creation, note the **Application (client) ID** and **Directory (tenant) ID**.

**Create a client secret:**

1. Go to **Certificates & secrets > New client secret**.
2. Set a description and expiry period.
3. Copy the secret **Value** immediately (it is only shown once).

**Grant API permissions:**

1. Go to **API permissions > Add a permission > APIs my organization uses**.
2. Search for **Dataverse** (or **Common Data Service**).
3. Select **Delegated permissions** or **Application permissions** and add `user_impersonation`.
4. Click **Grant admin consent** for the tenant.

**Create an Application User in Dataverse:**

1. Go to the **Power Platform Admin Center** (https://admin.powerplatform.microsoft.com).
2. Select the target environment > **Settings > Users + permissions > Application users**.
3. Click **New app user** and select the app registration created above.
4. Assign the **System Administrator** security role (or a custom role with sufficient table
   privileges for all `tiq_*` tables).

### 2. PowerShell 5.1+

The deployment script uses `Invoke-RestMethod` and `Invoke-WebRequest`, which require
PowerShell 5.1 or later. PowerShell 7+ (cross-platform) is also supported.

### 3. Target Dataverse Environment

You need the URL of the target environment in the format:

```
https://<orgname>.crm<N>.dynamics.com
```

For example: `https://contoso.crm4.dynamics.com` (Northern Europe region uses `crm4`).

You can find this URL in the Power Platform Admin Center under **Environments > Details**.

## How to Deploy

### Basic Usage

```powershell
.\deploy\dataverse\Deploy-DataverseSolution.ps1 `
    -TargetEnvironmentUrl "https://contoso.crm4.dynamics.com" `
    -TenantId "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" `
    -ClientId "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" `
    -ClientSecret "your-client-secret-value"
```

### Custom Solution Path

If the solution ZIP is in a different location:

```powershell
.\deploy\dataverse\Deploy-DataverseSolution.ps1 `
    -TargetEnvironmentUrl "https://contoso.crm4.dynamics.com" `
    -TenantId "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" `
    -ClientId "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" `
    -ClientSecret "your-client-secret-value" `
    -SolutionZipPath "C:\path\to\TrafficIQ_managed.zip"
```

### Using Environment Variables (CI/CD)

For automated pipelines, pass credentials via environment variables:

```powershell
.\deploy\dataverse\Deploy-DataverseSolution.ps1 `
    -TargetEnvironmentUrl $env:DATAVERSE_URL `
    -TenantId $env:DATAVERSE_TENANT_ID `
    -ClientId $env:DATAVERSE_CLIENT_ID `
    -ClientSecret $env:DATAVERSE_CLIENT_SECRET
```

## What the Script Does

The deployment script executes five steps:

1. **Validates prerequisites** -- Checks that the solution ZIP exists and parameters are valid.
2. **Acquires an OAuth2 token** -- Uses the client credentials grant flow against
   `https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token` with the scope
   `{environmentUrl}/.default`. Also calls the `WhoAmI` endpoint to verify connectivity.
3. **Imports the managed solution** -- Sends a `POST` to the Dataverse Web API
   `ImportSolution` action with the base64-encoded ZIP, setting
   `OverwriteUnmanagedCustomizations: true` and `PublishWorkflows: true`.
4. **Verifies the import** -- Queries the `solutions` entity to confirm the TrafficIQ solution
   is installed with the correct version.
5. **Runs a test CRUD cycle** -- Creates, reads, updates, and deletes a test record on the
   `tiq_appsettings` entity set (mapped to the `tiq_appsetting` table) to confirm the
   service principal has full data access to the solution tables.

## How the App Connects to Dataverse

The TrafficIQ web application connects to Dataverse through a server-side proxy. The browser
never has direct access to Dataverse credentials.

### Architecture

```
  Browser (SPA)                 Azure Functions API             Dataverse
  +-----------------+          +---------------------+         +------------------+
  | React app       |  fetch   | /api/dataverse/*    |  OAuth  | Web API v9.2     |
  | (Vite + React)  | -------> | (proxy function)    | ------> | tiq_* tables     |
  |                 |          |                     |         |                  |
  | Uses:           |          | Adds:               |         |                  |
  | VITE_DATAVERSE_ |          | - Bearer token      |         |                  |
  | URL (env var)   |          | - OData headers     |         |                  |
  +-----------------+          +---------------------+         +------------------+
```

### Environment Variables

**Frontend (Vite build):**

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_DATAVERSE_URL` | Tells the app that Dataverse is configured. The actual API calls go through the proxy at `/api/dataverse/*`. | `https://contoso.crm4.dynamics.com` |

**Backend (Azure Functions app settings):**

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATAVERSE_URL` | Target Dataverse environment URL. | `https://contoso.crm4.dynamics.com` |
| `DATAVERSE_TENANT_ID` | Entra ID tenant for token acquisition. | `xxxxxxxx-xxxx-...` |
| `DATAVERSE_CLIENT_ID` | App registration client ID. | `xxxxxxxx-xxxx-...` |
| `DATAVERSE_CLIENT_SECRET` | App registration client secret. Store in Azure Key Vault and reference via Key Vault App Setting reference. | *(secret)* |

### Connection Modes

The `DataverseClient` (in `src/services/dataverseClient.ts`) supports three modes:

1. **Power Platform hosted** -- When the app runs inside a Power Apps custom page, it uses
   the platform SDK with relative URLs. No extra credentials needed.
2. **Direct API via proxy** -- When `VITE_DATAVERSE_URL` is set and the proxy is available,
   API calls go through `/api/dataverse/*`. The Azure Function acquires a token using client
   credentials and forwards requests to Dataverse.
3. **Local storage fallback** -- When no Dataverse connection is available, data is stored
   in `localStorage` for offline development.

### Local Development (Vite Dev Server)

During local development with `npm run dev`, the Vite dev server plugin
(`vite-keyvault-plugin.ts`) can pull secrets from Azure Key Vault and inject them as
`VITE_*` environment variables. The Vite Dataverse proxy middleware then handles the
`/api/dataverse/*` route locally, just like the Azure Function does in production.

## Solution Contents

The TrafficIQ solution contains 31 custom tables organized into these categories:

| Category | Tables | Prefix |
|----------|--------|--------|
| Traffic & Journey | Traffic Incidents, Saved Journeys, Route Options, Route Steps, Notifications, User Preferences, Chat Threads, Chat Messages, Traffic Summaries | `tiq_` |
| Supply Chain | Shipments, Warehouses, Inventory Items, Delivery Routes, Return Orders | `tiq_` |
| Fleet & Maintenance | Fleet Vehicles, Vehicle Health, Maintenance Alerts, Maintenance Records | `tiq_` |
| Work Orders & Field Service | Work Orders, Technicians, Service Requests, Customer Assets, Service Agreements | `tiq_` |
| IoT | IoT Devices, Geofence Zones, Geofence Events, Driving Alerts, Connectivity Alerts | `tiq_` |
| Settings | App Settings, Agent Configurations | `tiq_` |
| Analytics | Supply Chain KPIs | `tiq_` |

Full table definitions are in `src/dataverse/tableDefinitions.ts`.

## Troubleshooting

### Token acquisition fails

- Verify the Tenant ID, Client ID, and Client Secret are correct.
- Ensure the app registration has **Dataverse** API permissions with admin consent.
- Check that the environment URL matches the tenant (e.g., a `.crm4` environment belongs
  to the correct Entra ID tenant).

### WhoAmI succeeds but ImportSolution fails

- The service principal needs the **System Administrator** security role in the target
  environment.
- Check for missing dependencies (e.g., if the solution depends on another solution that
  is not installed in the target).

### CRUD test fails after successful import

- The Application User may have a less privileged security role that does not include
  table-level Create/Read/Write/Delete on `tiq_appsetting`.
- Assign the **System Administrator** role or a custom role with full privileges on all
  `tiq_*` tables.

### Solution import times out

- Large solutions may take 5-10 minutes to import. The script uses a 600-second timeout.
- For very large environments, consider importing via the Power Platform Admin Center UI
  or increasing the `-TimeoutSec` parameter in the script.

## Alternative: PAC CLI Deployment

For interactive (non-headless) deployments, a PAC CLI-based script is also available:

```powershell
.\deploy\scripts\deploy-dataverse-solution.ps1
```

This script uses `pac auth create` with browser-based authentication and `pac solution import`
for the import. It is better suited for manual, one-off deployments from a developer machine.
