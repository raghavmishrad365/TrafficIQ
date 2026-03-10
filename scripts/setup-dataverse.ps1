# TrafficIQ Dataverse Setup Script
# Creates Publisher, Solution, and Tables in Dataverse

param(
    [switch]$CreatePublisher,
    [switch]$CreateSolution,
    [switch]$CreateTables,
    [switch]$All
)

$ErrorActionPreference = "Stop"

# Config from .env
$tenantId     = if ($env:AZURE_TENANT_ID)     { $env:AZURE_TENANT_ID }     else { Read-Host "Enter Tenant ID" }
$clientId     = if ($env:AZURE_CLIENT_ID)     { $env:AZURE_CLIENT_ID }     else { Read-Host "Enter Client ID" }
$clientSecret = if ($env:AZURE_CLIENT_SECRET) { $env:AZURE_CLIENT_SECRET } else { Read-Host "Enter Client Secret" -AsSecureString | ConvertFrom-SecureString -AsPlainText }
$dataverseUrl = if ($env:DATAVERSE_URL)        { $env:DATAVERSE_URL }        else { Read-Host "Enter Dataverse URL" }

# Get OAuth Token
Write-Host "Getting OAuth token..." -ForegroundColor Cyan
$tokenUrl = "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token"
$tokenBody = @{
    grant_type    = "client_credentials"
    client_id     = $clientId
    client_secret = $clientSecret
    scope         = "$dataverseUrl/.default"
}
$tokenResponse = Invoke-RestMethod -Uri $tokenUrl -Method Post -Body $tokenBody -ContentType "application/x-www-form-urlencoded"
$token = $tokenResponse.access_token
Write-Host "Token acquired successfully." -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
    "OData-MaxVersion" = "4.0"
    "OData-Version" = "4.0"
    "Prefer" = "return=representation"
}
$apiBase = "$dataverseUrl/api/data/v9.2"

function Invoke-DataverseApi {
    param([string]$Method, [string]$Uri, [object]$Body)
    $params = @{
        Uri     = $Uri
        Method  = $Method
        Headers = $headers
    }
    if ($Body) {
        $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
    }
    try {
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $detail = $_.ErrorDetails.Message
        if ($status -eq 409 -or ($detail -and $detail.Contains("already exists"))) {
            Write-Host "  Already exists, skipping." -ForegroundColor Yellow
            return $null
        }
        Write-Host "  ERROR ($status): $detail" -ForegroundColor Red
        throw
    }
}

# =====================================================================
# Step 1: Create Publisher
# =====================================================================
if ($CreatePublisher -or $All) {
    Write-Host "`n=== Creating Publisher: TrafficIQ ===" -ForegroundColor Magenta

    # Check if publisher already exists
    $existingPub = Invoke-RestMethod -Uri "$apiBase/publishers?`$filter=uniquename eq 'TrafficIQ'" -Headers $headers -Method Get
    if ($existingPub.value.Count -gt 0) {
        Write-Host "  Publisher 'TrafficIQ' already exists (ID: $($existingPub.value[0].publisherid))" -ForegroundColor Yellow
        $publisherId = $existingPub.value[0].publisherid
    } else {
        $pubBody = @{
            uniquename = "TrafficIQ"
            friendlyname = "TrafficIQ"
            description = "TrafficIQ Supply Chain Transport Intelligence platform publisher"
            customizationprefix = "tiq"
            customizationoptionvalueprefix = 10048
        }
        $pub = Invoke-DataverseApi -Method Post -Uri "$apiBase/publishers" -Body $pubBody
        $publisherId = $pub.publisherid
        Write-Host "  Publisher created: $publisherId" -ForegroundColor Green
    }
}

# =====================================================================
# Step 2: Create Solution
# =====================================================================
if ($CreateSolution -or $All) {
    Write-Host "`n=== Creating Solution: TrafficIQ ===" -ForegroundColor Magenta

    # Get publisher ID if not already set
    if (-not $publisherId) {
        $existingPub = Invoke-RestMethod -Uri "$apiBase/publishers?`$filter=uniquename eq 'TrafficIQ'" -Headers $headers -Method Get
        if ($existingPub.value.Count -eq 0) {
            Write-Host "  ERROR: Publisher 'TrafficIQ' not found. Run with -CreatePublisher first." -ForegroundColor Red
            exit 1
        }
        $publisherId = $existingPub.value[0].publisherid
    }

    # Check if solution already exists
    $existingSol = Invoke-RestMethod -Uri "$apiBase/solutions?`$filter=uniquename eq 'TrafficIQ'" -Headers $headers -Method Get
    if ($existingSol.value.Count -gt 0) {
        Write-Host "  Solution 'TrafficIQ' already exists (ID: $($existingSol.value[0].solutionid))" -ForegroundColor Yellow
    } else {
        $solBody = @{
            uniquename = "TrafficIQ"
            friendlyname = "TrafficIQ"
            description = "TrafficIQ Supply Chain Transport Intelligence - AI-powered multi-agent platform for traffic, fleet, and supply chain operations"
            version = "1.0.0.0"
            "publisherid@odata.bind" = "/publishers($publisherId)"
        }
        $sol = Invoke-DataverseApi -Method Post -Uri "$apiBase/solutions" -Body $solBody
        Write-Host "  Solution created: $($sol.solutionid)" -ForegroundColor Green
    }
}

# =====================================================================
# Step 3: Create Tables
# =====================================================================
if ($CreateTables -or $All) {
    Write-Host "`n=== Creating Tables in TrafficIQ Solution ===" -ForegroundColor Magenta

    $solutionName = "TrafficIQ"
    $tableHeaders = $headers.Clone()
    $tableHeaders["MSCRM.SolutionUniqueName"] = $solutionName

    # Table definitions - logicalName, displayName, pluralName, primaryAttribute, description
    $tables = @(
        @{ schema="tiq_trafficincident"; display="Traffic Incident"; plural="Traffic Incidents"; primary="tiq_title"; desc="Traffic incidents from Vejdirektoratet, Azure Maps, and AI agents" },
        @{ schema="tiq_savedjourney"; display="Saved Journey"; plural="Saved Journeys"; primary="tiq_name"; desc="User-saved journey routes with preferences" },
        @{ schema="tiq_routeoption"; display="Route Option"; plural="Route Options"; primary="tiq_summary"; desc="Route alternatives with distance, duration, and traffic data" },
        @{ schema="tiq_routestep"; display="Route Step"; plural="Route Steps"; primary="tiq_instruction"; desc="Turn-by-turn direction steps for routes" },
        @{ schema="tiq_notification"; display="Notification"; plural="Notifications"; primary="tiq_title"; desc="Application notifications for all domains" },
        @{ schema="tiq_userpreference"; display="User Preference"; plural="User Preferences"; primary="tiq_name"; desc="Per-user notification and app preferences" },
        @{ schema="tiq_chatthread"; display="Chat Thread"; plural="Chat Threads"; primary="tiq_name"; desc="AI chat conversation threads for multi-agent orchestrator" },
        @{ schema="tiq_chatmessage"; display="Chat Message"; plural="Chat Messages"; primary="tiq_preview"; desc="Individual chat messages within threads" },
        @{ schema="tiq_trafficsummary"; display="Traffic Summary"; plural="Traffic Summaries"; primary="tiq_name"; desc="Periodic traffic summary snapshots" },
        @{ schema="tiq_shipment"; display="Shipment"; plural="Shipments"; primary="tiq_shipmentid_display"; desc="Shipment data synced from D365 F&O via MCP" },
        @{ schema="tiq_warehouse"; display="Warehouse"; plural="Warehouses"; primary="tiq_name"; desc="Warehouse/facility data from D365 F&O via MCP" },
        @{ schema="tiq_inventoryitem"; display="Inventory Item"; plural="Inventory Items"; primary="tiq_itemname"; desc="Warehouse stock levels from D365 F&O via MCP" },
        @{ schema="tiq_deliveryroute"; display="Delivery Route"; plural="Delivery Routes"; primary="tiq_name"; desc="Optimized multi-stop delivery routes" },
        @{ schema="tiq_returnorder"; display="Return Order"; plural="Return Orders"; primary="tiq_returnid_display"; desc="Return/RMA orders for reverse logistics" },
        @{ schema="tiq_fleetvehicle"; display="Fleet Vehicle"; plural="Fleet Vehicles"; primary="tiq_licenseplate"; desc="Fleet vehicle data with real-time status" },
        @{ schema="tiq_vehiclehealth"; display="Vehicle Health"; plural="Vehicle Health Records"; primary="tiq_name"; desc="Vehicle health scores and predicted maintenance" },
        @{ schema="tiq_maintenancealert"; display="Maintenance Alert"; plural="Maintenance Alerts"; primary="tiq_name"; desc="Predictive maintenance alerts from AI/IoT" },
        @{ schema="tiq_maintenancerecord"; display="Maintenance Record"; plural="Maintenance Records"; primary="tiq_name"; desc="Historical vehicle service records" },
        @{ schema="tiq_workorder"; display="Work Order"; plural="Work Orders"; primary="tiq_workorderid_display"; desc="Field service work orders from D365 F&O" },
        @{ schema="tiq_technician"; display="Technician"; plural="Technicians"; primary="tiq_name"; desc="Field service technician/resource data" },
        @{ schema="tiq_servicerequest"; display="Service Request"; plural="Service Requests"; primary="tiq_title"; desc="Field service requests with SLA tracking" },
        @{ schema="tiq_customerasset"; display="Customer Asset"; plural="Customer Assets"; primary="tiq_assetname"; desc="Customer equipment/asset data" },
        @{ schema="tiq_serviceagreement"; display="Service Agreement"; plural="Service Agreements"; primary="tiq_name"; desc="Service contracts and SLA definitions" },
        @{ schema="tiq_iotdevice"; display="IoT Device"; plural="IoT Devices"; primary="tiq_devicecode"; desc="IoT device registry from Azure IoT Hub" },
        @{ schema="tiq_geofencezone"; display="Geofence Zone"; plural="Geofence Zones"; primary="tiq_name"; desc="Geofence zone definitions for warehouses" },
        @{ schema="tiq_geofenceevent"; display="Geofence Event"; plural="Geofence Events"; primary="tiq_name"; desc="Geofence entry/exit events from IoT Hub" },
        @{ schema="tiq_drivingalert"; display="Driving Alert"; plural="Driving Alerts"; primary="tiq_name"; desc="Driving behavior alerts from IoT telemetry" },
        @{ schema="tiq_connectivityalert"; display="Connectivity Alert"; plural="Connectivity Alerts"; primary="tiq_name"; desc="Device connectivity alerts from IoT Hub" },
        @{ schema="tiq_appsetting"; display="App Setting"; plural="App Settings"; primary="tiq_key"; desc="Runtime app settings (secrets in Key Vault)" },
        @{ schema="tiq_agentconfiguration"; display="Agent Configuration"; plural="Agent Configurations"; primary="tiq_name"; desc="Per-agent config for multi-agent orchestrator" },
        @{ schema="tiq_supplychainkpi"; display="Supply Chain KPI"; plural="Supply Chain KPIs"; primary="tiq_name"; desc="Aggregated supply chain performance metrics" }
    )

    $created = 0
    $skipped = 0
    $failed = 0

    foreach ($table in $tables) {
        Write-Host "  Creating table: $($table.display) ($($table.schema))..." -NoNewline

        $maxLen = 200
        if ($table.primary -eq "tiq_summary" -or $table.primary -eq "tiq_instruction") { $maxLen = 500 }
        if ($table.primary -eq "tiq_title" -or $table.primary -eq "tiq_assetname" -or $table.primary -eq "tiq_itemname") { $maxLen = 300 }

        $entityBody = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.EntityMetadata"
            SchemaName = $table.schema
            DisplayName = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $table.display; LanguageCode = 1033 }) }
            DisplayCollectionName = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $table.plural; LanguageCode = 1033 }) }
            Description = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $table.desc; LanguageCode = 1033 }) }
            HasActivities = $false
            HasNotes = $false
            OwnershipType = "UserOwned"
            Attributes = @(
                @{
                    "@odata.type" = "Microsoft.Dynamics.CRM.StringAttributeMetadata"
                    IsPrimaryName = $true
                    SchemaName = $table.primary
                    AttributeType = "String"
                    AttributeTypeName = @{ Value = "StringType" }
                    FormatName = @{ Value = "Text" }
                    MaxLength = $maxLen
                    RequiredLevel = @{ Value = "ApplicationRequired" }
                    DisplayName = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $table.display; LanguageCode = 1033 }) }
                    Description = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = "Primary name column"; LanguageCode = 1033 }) }
                }
            )
        }

        try {
            $params = @{
                Uri     = "$apiBase/EntityDefinitions"
                Method  = "Post"
                Headers = $tableHeaders
                Body    = ($entityBody | ConvertTo-Json -Depth 15)
            }
            $result = Invoke-RestMethod @params
            Write-Host " CREATED" -ForegroundColor Green
            $created++
        } catch {
            $status = $_.Exception.Response.StatusCode.value__
            $detail = $_.ErrorDetails.Message
            if ($status -eq 409 -or ($detail -and $detail.Contains("already exists"))) {
                Write-Host " EXISTS" -ForegroundColor Yellow
                $skipped++
            } else {
                Write-Host " FAILED ($status)" -ForegroundColor Red
                if ($detail) { Write-Host "    $detail" -ForegroundColor Red }
                $failed++
            }
        }
    }

    Write-Host "`n=== Table Creation Summary ===" -ForegroundColor Magenta
    Write-Host "  Created: $created" -ForegroundColor Green
    Write-Host "  Skipped: $skipped" -ForegroundColor Yellow
    Write-Host "  Failed:  $failed" -ForegroundColor Red
}

Write-Host "`nDone!" -ForegroundColor Green
