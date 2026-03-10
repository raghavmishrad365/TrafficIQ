# ============================================================================
# TrafficIQ Dataverse Column, Option Set & Relationship Provisioning Script
# ============================================================================
# Provisions ALL columns, local option sets (picklists), and relationships
# for the 31 TrafficIQ Dataverse tables.
#
# Tables already exist with primary key + primary name column only.
# This script adds every other column defined in tableDefinitions.ts.
#
# Publisher prefix: tiq_
# Option value prefix: 10048 (customizationoptionvalueprefix)
# All option values use 100480000-based numbering.
#
# Usage:
#   .\provision-columns.ps1 -All              # Run everything
#   .\provision-columns.ps1 -Columns          # Only regular columns
#   .\provision-columns.ps1 -OptionSets       # Only picklist columns
#   .\provision-columns.ps1 -Relationships    # Only relationships (lookups)
#   .\provision-columns.ps1 -Export           # Only export solutions
#   .\provision-columns.ps1 -Columns -OptionSets -Relationships -Export
# ============================================================================

param(
    [switch]$OptionSets,
    [switch]$Columns,
    [switch]$Relationships,
    [switch]$Export,
    [switch]$All
)

$ErrorActionPreference = "Stop"

# ============================================================================
# Section 1: Authentication
# ============================================================================

$tenantId     = if ($env:AZURE_TENANT_ID)     { $env:AZURE_TENANT_ID }     else { Read-Host "Enter Tenant ID" }
$clientId     = if ($env:AZURE_CLIENT_ID)     { $env:AZURE_CLIENT_ID }     else { Read-Host "Enter Client ID" }
$clientSecret = if ($env:AZURE_CLIENT_SECRET) { $env:AZURE_CLIENT_SECRET } else { Read-Host "Enter Client Secret" -AsSecureString | ConvertFrom-SecureString -AsPlainText }
$dataverseUrl = if ($env:DATAVERSE_URL)        { $env:DATAVERSE_URL }        else { Read-Host "Enter Dataverse URL" }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TrafficIQ Column Provisioning Script"   -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nGetting OAuth token..." -ForegroundColor Cyan
$tokenUrl  = "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token"
$tokenBody = @{
    grant_type    = "client_credentials"
    client_id     = $clientId
    client_secret = $clientSecret
    scope         = "$dataverseUrl/.default"
}
$tokenResponse = Invoke-RestMethod -Uri $tokenUrl -Method Post -Body $tokenBody -ContentType "application/x-www-form-urlencoded"
$token = $tokenResponse.access_token
Write-Host "Token acquired successfully." -ForegroundColor Green

$apiBase = "$dataverseUrl/api/data/v9.2"

$baseHeaders = @{
    "Authorization"    = "Bearer $token"
    "Content-Type"     = "application/json; charset=utf-8"
    "OData-MaxVersion" = "4.0"
    "OData-Version"    = "4.0"
    "Prefer"           = "return=representation"
    "MSCRM.SolutionUniqueName" = "TrafficIQ"
}

# ============================================================================
# Section 2: Helper Functions
# ============================================================================

function New-Label([string]$text) {
    @{
        "@odata.type"   = "Microsoft.Dynamics.CRM.Label"
        LocalizedLabels = @(
            @{
                "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"
                Label         = $text
                LanguageCode  = 1033
            }
        )
    }
}

function Add-Column {
    param(
        [string]$Table,
        [hashtable]$Body
    )
    $uri  = "$apiBase/EntityDefinitions(LogicalName='$Table')/Attributes"
    $json = $Body | ConvertTo-Json -Depth 15 -Compress
    $utf8 = [System.Text.Encoding]::UTF8.GetBytes($json)
    try {
        $null = Invoke-RestMethod -Uri $uri -Method Post -Headers $baseHeaders -Body $utf8
        return "created"
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $detail = $_.ErrorDetails.Message
        if ($status -eq 409 -or ($detail -and $detail.Contains("already exists"))) {
            return "exists"
        }
        Write-Host "    ERROR ($status): $detail" -ForegroundColor Red
        return "failed"
    }
}

function New-StringColumn {
    param([string]$Name, [string]$Display, [string]$Desc, [int]$MaxLen=200, [bool]$Required=$false)
    @{
        "@odata.type"     = "Microsoft.Dynamics.CRM.StringAttributeMetadata"
        SchemaName        = $Name
        AttributeType     = "String"
        AttributeTypeName = @{ Value = "StringType" }
        FormatName        = @{ Value = "Text" }
        MaxLength         = $MaxLen
        DisplayName       = (New-Label $Display)
        Description       = (New-Label $Desc)
        RequiredLevel     = @{ Value = if ($Required) { "ApplicationRequired" } else { "None" } }
    }
}

function New-MemoColumn {
    param([string]$Name, [string]$Display, [string]$Desc, [int]$MaxLen=4000, [bool]$Required=$false)
    @{
        "@odata.type"     = "Microsoft.Dynamics.CRM.MemoAttributeMetadata"
        SchemaName        = $Name
        AttributeType     = "Memo"
        AttributeTypeName = @{ Value = "MemoType" }
        Format            = "TextArea"
        MaxLength         = $MaxLen
        DisplayName       = (New-Label $Display)
        Description       = (New-Label $Desc)
        RequiredLevel     = @{ Value = if ($Required) { "ApplicationRequired" } else { "None" } }
    }
}

function New-IntegerColumn {
    param([string]$Name, [string]$Display, [string]$Desc, [bool]$Required=$false)
    @{
        "@odata.type"     = "Microsoft.Dynamics.CRM.IntegerAttributeMetadata"
        SchemaName        = $Name
        AttributeType     = "Integer"
        AttributeTypeName = @{ Value = "IntegerType" }
        Format            = "None"
        MinValue          = -2147483648
        MaxValue          = 2147483647
        DisplayName       = (New-Label $Display)
        Description       = (New-Label $Desc)
        RequiredLevel     = @{ Value = if ($Required) { "ApplicationRequired" } else { "None" } }
    }
}

function New-DoubleColumn {
    param([string]$Name, [string]$Display, [string]$Desc, [int]$Precision=2, [bool]$Required=$false)
    @{
        "@odata.type"     = "Microsoft.Dynamics.CRM.DoubleAttributeMetadata"
        SchemaName        = $Name
        AttributeType     = "Double"
        AttributeTypeName = @{ Value = "DoubleType" }
        Precision         = $Precision
        MinValue          = -100000000000.0
        MaxValue          = 100000000000.0
        DisplayName       = (New-Label $Display)
        Description       = (New-Label $Desc)
        RequiredLevel     = @{ Value = if ($Required) { "ApplicationRequired" } else { "None" } }
    }
}

function New-BooleanColumn {
    param([string]$Name, [string]$Display, [string]$Desc, [bool]$Required=$false)
    @{
        "@odata.type"     = "Microsoft.Dynamics.CRM.BooleanAttributeMetadata"
        SchemaName        = $Name
        AttributeType     = "Boolean"
        AttributeTypeName = @{ Value = "BooleanType" }
        DisplayName       = (New-Label $Display)
        Description       = (New-Label $Desc)
        RequiredLevel     = @{ Value = if ($Required) { "ApplicationRequired" } else { "None" } }
        OptionSet         = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.BooleanOptionSetMetadata"
            TrueOption    = @{ Value = 1; Label = (New-Label "Yes") }
            FalseOption   = @{ Value = 0; Label = (New-Label "No") }
        }
    }
}

function New-DateTimeColumn {
    param([string]$Name, [string]$Display, [string]$Desc, [bool]$Required=$false)
    @{
        "@odata.type"     = "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata"
        SchemaName        = $Name
        AttributeType     = "DateTime"
        AttributeTypeName = @{ Value = "DateTimeType" }
        Format            = "DateAndTime"
        DisplayName       = (New-Label $Display)
        Description       = (New-Label $Desc)
        RequiredLevel     = @{ Value = if ($Required) { "ApplicationRequired" } else { "None" } }
    }
}

function New-MoneyColumn {
    param([string]$Name, [string]$Display, [string]$Desc, [int]$Precision=2, [bool]$Required=$false)
    @{
        "@odata.type"     = "Microsoft.Dynamics.CRM.MoneyAttributeMetadata"
        SchemaName        = $Name
        AttributeType     = "Money"
        AttributeTypeName = @{ Value = "MoneyType" }
        Precision         = $Precision
        MinValue          = 0.0
        MaxValue          = 922337203685477.0
        DisplayName       = (New-Label $Display)
        Description       = (New-Label $Desc)
        RequiredLevel     = @{ Value = if ($Required) { "ApplicationRequired" } else { "None" } }
    }
}

function New-PicklistColumn {
    param([string]$Name, [string]$Display, [string]$Desc, [string]$OptionSetName, [string]$OptionSetDisplay, [array]$Options, [bool]$Required=$false)
    $optArray = @()
    foreach ($opt in $Options) {
        $optArray += @{
            Value = $opt.v
            Label = (New-Label $opt.l)
        }
    }
    @{
        "@odata.type"     = "Microsoft.Dynamics.CRM.PicklistAttributeMetadata"
        SchemaName        = $Name
        AttributeType     = "Picklist"
        AttributeTypeName = @{ Value = "PicklistType" }
        DisplayName       = (New-Label $Display)
        Description       = (New-Label $Desc)
        RequiredLevel     = @{ Value = if ($Required) { "ApplicationRequired" } else { "None" } }
        OptionSet         = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.OptionSetMetadata"
            IsGlobal      = $false
            OptionSetType = "Picklist"
            Name          = $OptionSetName
            DisplayName   = (New-Label $OptionSetDisplay)
            Options       = $optArray
        }
    }
}

function Add-Relationship {
    param([hashtable]$Rel)
    $uri  = "$apiBase/RelationshipDefinitions"
    $body = @{
        "@odata.type"        = "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata"
        SchemaName           = $Rel.name
        ReferencedEntity     = $Rel.parent
        ReferencingEntity    = $Rel.child
        CascadeConfiguration = @{
            Assign   = "NoCascade"
            Delete   = "RemoveLink"
            Merge    = "NoCascade"
            Reparent = "NoCascade"
            Share    = "NoCascade"
            Unshare  = "NoCascade"
        }
        Lookup = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.LookupAttributeMetadata"
            SchemaName    = $Rel.lookup
            DisplayName   = (New-Label $Rel.lookupDisplay)
            Description   = (New-Label $Rel.lookupDesc)
            RequiredLevel = @{ Value = if ($Rel.required) { "ApplicationRequired" } else { "None" } }
        }
    }
    $json = $body | ConvertTo-Json -Depth 15 -Compress
    $utf8 = [System.Text.Encoding]::UTF8.GetBytes($json)
    try {
        $null = Invoke-RestMethod -Uri $uri -Method Post -Headers $baseHeaders -Body $utf8
        return "created"
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $detail = $_.ErrorDetails.Message
        if ($status -eq 409 -or ($detail -and $detail.Contains("already exists"))) {
            return "exists"
        }
        Write-Host "    ERROR ($status): $detail" -ForegroundColor Red
        return "failed"
    }
}

# ============================================================================
# Section 3: Column Definitions (Regular Columns)
# ============================================================================
# Legend: n=name, d=display, t=type, ml=maxLength, p=precision, r=required, desc=description
# Types: string, memo, integer, double, boolean, datetime, money
# SKIPPED: uniqueidentifier (PK), primary name column, lookup columns (via relationships)

$columnDefs = @{}

# ---- Table 1: Traffic Incident ----
$columnDefs["tiq_trafficincident"] = @(
    @{ n="tiq_description"; d="Description"; t="memo"; ml=4000; desc="Detailed description of the incident" }
    @{ n="tiq_latitude"; d="Latitude"; t="double"; p=5; r=1; desc="Geographic latitude of the incident" }
    @{ n="tiq_longitude"; d="Longitude"; t="double"; p=5; r=1; desc="Geographic longitude of the incident" }
    @{ n="tiq_roadname"; d="Road Name"; t="string"; ml=200; desc="Name of the affected road" }
    @{ n="tiq_starttime"; d="Start Time"; t="datetime"; desc="When the incident started" }
    @{ n="tiq_endtime"; d="End Time"; t="datetime"; desc="When the incident ended or is expected to end" }
    @{ n="tiq_delayminutes"; d="Delay (Minutes)"; t="integer"; desc="Estimated delay caused by the incident in minutes" }
    @{ n="tiq_externalid"; d="External ID"; t="string"; ml=100; desc="ID from the external source system for deduplication" }
)

# ---- Table 2: Saved Journey ----
$columnDefs["tiq_savedjourney"] = @(
    @{ n="tiq_originlabel"; d="Origin Label"; t="string"; ml=300; r=1; desc="Display name of the origin location" }
    @{ n="tiq_originaddress"; d="Origin Address"; t="string"; ml=500; desc="Full address of the origin" }
    @{ n="tiq_originlatitude"; d="Origin Latitude"; t="double"; p=5; r=1; desc="Origin geographic latitude" }
    @{ n="tiq_originlongitude"; d="Origin Longitude"; t="double"; p=5; r=1; desc="Origin geographic longitude" }
    @{ n="tiq_destinationlabel"; d="Destination Label"; t="string"; ml=300; r=1; desc="Display name of the destination location" }
    @{ n="tiq_destinationaddress"; d="Destination Address"; t="string"; ml=500; desc="Full address of the destination" }
    @{ n="tiq_destinationlatitude"; d="Destination Latitude"; t="double"; p=5; r=1; desc="Destination geographic latitude" }
    @{ n="tiq_destinationlongitude"; d="Destination Longitude"; t="double"; p=5; r=1; desc="Destination geographic longitude" }
    @{ n="tiq_avoidtolls"; d="Avoid Tolls"; t="boolean"; desc="Whether to avoid toll roads" }
    @{ n="tiq_avoidhighways"; d="Avoid Highways"; t="boolean"; desc="Whether to avoid highways" }
    @{ n="tiq_morningalertenabled"; d="Morning Alert Enabled"; t="boolean"; desc="Whether morning alerts are enabled for this journey" }
    @{ n="tiq_morningalerttime"; d="Morning Alert Time"; t="string"; ml=10; desc="Time for morning alert in HH:mm format" }
    @{ n="tiq_morningalertdays"; d="Morning Alert Days"; t="string"; ml=50; desc="JSON array of day numbers (0=Sun, 6=Sat) e.g. [1,2,3,4,5]" }
    @{ n="tiq_morningalertemail"; d="Morning Alert Email"; t="boolean"; desc="Whether to send morning alert via email" }
    @{ n="tiq_morningalertpush"; d="Morning Alert Push"; t="boolean"; desc="Whether to send morning alert via push notification" }
    @{ n="tiq_lastusedat"; d="Last Used At"; t="datetime"; desc="When the journey was last used for navigation" }
)

# ---- Table 3: Route Option ----
# Skip: tiq_routeoptionid (PK), tiq_summary (primary name), tiq_savedjourneyid (lookup)
$columnDefs["tiq_routeoption"] = @(
    @{ n="tiq_durationminutes"; d="Duration (Minutes)"; t="double"; p=1; r=1; desc="Estimated trip duration without traffic in minutes" }
    @{ n="tiq_durationintrafficminutes"; d="Duration In Traffic (Minutes)"; t="double"; p=1; desc="Estimated duration with current traffic conditions" }
    @{ n="tiq_distancekm"; d="Distance (km)"; t="double"; p=2; r=1; desc="Total distance in kilometers" }
    @{ n="tiq_departuretime"; d="Departure Time"; t="datetime"; desc="Planned departure time" }
    @{ n="tiq_arrivaltime"; d="Arrival Time"; t="datetime"; desc="Estimated arrival time" }
    @{ n="tiq_coordinates"; d="Coordinates"; t="memo"; ml=100000; desc="JSON array of [lng, lat] coordinate pairs for the route polyline" }
    @{ n="tiq_trafficdelayminutes"; d="Traffic Delay (Minutes)"; t="double"; p=1; desc="Additional delay due to traffic in minutes" }
    @{ n="tiq_isrecommended"; d="Is Recommended"; t="boolean"; desc="Whether this is the AI-recommended route" }
)

# ---- Table 4: Route Step ----
# Skip: tiq_routestepid (PK), tiq_instruction (primary name), tiq_routeoptionid (lookup)
$columnDefs["tiq_routestep"] = @(
    @{ n="tiq_distancekm"; d="Distance (km)"; t="double"; p=2; desc="Distance for this step in kilometers" }
    @{ n="tiq_durationminutes"; d="Duration (Minutes)"; t="double"; p=1; desc="Duration for this step in minutes" }
    @{ n="tiq_maneuver"; d="Maneuver"; t="string"; ml=100; desc="Type of maneuver (e.g. TURN_LEFT, STRAIGHT)" }
    @{ n="tiq_roadname"; d="Road Name"; t="string"; ml=200; desc="Name of the road for this step" }
    @{ n="tiq_latitude"; d="Latitude"; t="double"; p=5; desc="Latitude of this step point" }
    @{ n="tiq_longitude"; d="Longitude"; t="double"; p=5; desc="Longitude of this step point" }
    @{ n="tiq_steporder"; d="Step Order"; t="integer"; r=1; desc="Order of this step within the route (1-based)" }
)

# ---- Table 5: Notification ----
# Skip: tiq_notificationid (PK), tiq_title (primary name), lookups (journeyid, incidentid, shipmentid)
$columnDefs["tiq_notification"] = @(
    @{ n="tiq_body"; d="Body"; t="memo"; ml=4000; desc="Notification body text" }
    @{ n="tiq_isread"; d="Is Read"; t="boolean"; desc="Whether the notification has been read" }
)

# ---- Table 6: User Preference ----
# Skip: tiq_userpreferenceid (PK), tiq_name (primary name)
$columnDefs["tiq_userpreference"] = @(
    @{ n="tiq_pushenabled"; d="Push Enabled"; t="boolean"; desc="Whether push notifications are enabled" }
    @{ n="tiq_emailenabled"; d="Email Enabled"; t="boolean"; desc="Whether email notifications are enabled" }
    @{ n="tiq_emailaddress"; d="Email Address"; t="string"; ml=320; desc="Email address for notifications" }
    @{ n="tiq_toastenabled"; d="Toast Enabled"; t="boolean"; desc="Whether in-app toast notifications are enabled" }
    @{ n="tiq_morningalerttime"; d="Morning Alert Time"; t="string"; ml=10; desc="Default morning alert time in HH:mm format" }
    @{ n="tiq_morningalertdays"; d="Morning Alert Days"; t="string"; ml=50; desc="JSON array of day numbers (0=Sun, 6=Sat) e.g. [1,2,3,4,5]" }
    @{ n="tiq_maplanguage"; d="Map Language"; t="string"; ml=10; desc="Preferred map language code (e.g. da-DK, en-US)" }
    @{ n="tiq_mapstyle"; d="Map Style"; t="string"; ml=50; desc="Preferred map style (road, satellite, night)" }
)

# ---- Table 7: Chat Thread ----
# Skip: tiq_chatthreadid (PK), tiq_name (primary name)
$columnDefs["tiq_chatthread"] = @(
    @{ n="tiq_externalthreadid"; d="External Thread ID"; t="string"; ml=200; desc="Thread ID from the Azure AI Foundry Agent" }
    @{ n="tiq_agentid"; d="Agent ID"; t="string"; ml=200; desc="Azure AI Foundry Agent ID" }
)

# ---- Table 8: Chat Message ----
# Skip: tiq_chatmessageid (PK), tiq_preview (primary name), tiq_chatthreadid (lookup)
$columnDefs["tiq_chatmessage"] = @(
    @{ n="tiq_content"; d="Content"; t="memo"; ml=100000; r=1; desc="Full message content text" }
    @{ n="tiq_toolcalls"; d="Tool Calls"; t="memo"; ml=100000; desc="JSON array of tool call information" }
    @{ n="tiq_messageorder"; d="Message Order"; t="integer"; r=1; desc="Order of the message within the thread" }
)

# ---- Table 9: Traffic Summary ----
# Skip: tiq_trafficsummaryid (PK), tiq_name (primary name)
$columnDefs["tiq_trafficsummary"] = @(
    @{ n="tiq_totalincidents"; d="Total Incidents"; t="integer"; r=1; desc="Total number of active incidents" }
    @{ n="tiq_criticalincidents"; d="Critical Incidents"; t="integer"; desc="Number of critical-severity incidents" }
    @{ n="tiq_averagedelay"; d="Average Delay"; t="double"; p=1; desc="Average delay across incidents in minutes" }
    @{ n="tiq_snapshottime"; d="Snapshot Time"; t="datetime"; r=1; desc="When this summary was captured" }
)

# ---- Table 10: Shipment ----
# Skip: tiq_shipmentid (PK), tiq_shipmentid_display (primary name), tiq_warehouseid (lookup)
$columnDefs["tiq_shipment"] = @(
    @{ n="tiq_warehousename"; d="Warehouse Name"; t="string"; ml=200; desc="Denormalized warehouse name for display" }
    @{ n="tiq_originlabel"; d="Origin"; t="string"; ml=300; r=1; desc="Origin location label" }
    @{ n="tiq_originlatitude"; d="Origin Lat"; t="double"; p=5; desc="Origin latitude" }
    @{ n="tiq_originlongitude"; d="Origin Lng"; t="double"; p=5; desc="Origin longitude" }
    @{ n="tiq_destinationlabel"; d="Destination"; t="string"; ml=300; r=1; desc="Destination location label" }
    @{ n="tiq_destinationlatitude"; d="Destination Lat"; t="double"; p=5; desc="Destination latitude" }
    @{ n="tiq_destinationlongitude"; d="Destination Lng"; t="double"; p=5; desc="Destination longitude" }
    @{ n="tiq_customername"; d="Customer Name"; t="string"; ml=300; desc="Customer receiving the shipment" }
    @{ n="tiq_scheduleddate"; d="Scheduled Date"; t="datetime"; desc="Scheduled dispatch date" }
    @{ n="tiq_estimatedarrival"; d="Estimated Arrival"; t="datetime"; desc="Estimated arrival at destination" }
    @{ n="tiq_actualdeparture"; d="Actual Departure"; t="datetime"; desc="Actual departure time" }
    @{ n="tiq_items"; d="Items"; t="memo"; ml=50000; desc="JSON array of shipment items [{itemId, itemName, quantity, unit, weight}]" }
    @{ n="tiq_totalweight"; d="Total Weight (kg)"; t="double"; p=2; desc="Total shipment weight in kilograms" }
    @{ n="tiq_currenttrafficdelay"; d="Current Traffic Delay (min)"; t="integer"; desc="Current traffic delay in minutes" }
    @{ n="tiq_routedistancekm"; d="Route Distance (km)"; t="double"; p=2; desc="Route distance in kilometers" }
    @{ n="tiq_routedurationminutes"; d="Route Duration (min)"; t="double"; p=1; desc="Route duration in minutes" }
    @{ n="tiq_trackingevents"; d="Tracking Events"; t="memo"; ml=100000; desc="JSON array of tracking events [{status, timestamp, location, description}]" }
    @{ n="tiq_d365externalid"; d="D365 External ID"; t="string"; ml=100; desc="Original record ID from D365 F&O for sync" }
)

# ---- Table 11: Warehouse ----
# Skip: tiq_warehouseid (PK), tiq_name (primary name)
$columnDefs["tiq_warehouse"] = @(
    @{ n="tiq_warehousecode"; d="Warehouse Code"; t="string"; ml=20; r=1; desc="Short code (e.g. DK01, DK02)" }
    @{ n="tiq_latitude"; d="Latitude"; t="double"; p=5; desc="Warehouse latitude" }
    @{ n="tiq_longitude"; d="Longitude"; t="double"; p=5; desc="Warehouse longitude" }
    @{ n="tiq_address"; d="Address"; t="string"; ml=500; desc="Full address" }
    @{ n="tiq_activeshipments"; d="Active Shipments"; t="integer"; desc="Count of active shipments" }
    @{ n="tiq_pendingshipments"; d="Pending Shipments"; t="integer"; desc="Count of pending shipments" }
    @{ n="tiq_totalinventoryitems"; d="Total Inventory Items"; t="integer"; desc="Total distinct inventory items" }
    @{ n="tiq_d365externalid"; d="D365 External ID"; t="string"; ml=100; desc="Original record ID from D365 F&O" }
)

# ---- Table 12: Inventory Item ----
# Skip: tiq_inventoryitemid (PK), tiq_itemname (primary name), tiq_warehouseid (lookup)
$columnDefs["tiq_inventoryitem"] = @(
    @{ n="tiq_itemcode"; d="Item Code"; t="string"; ml=50; r=1; desc="Business item code" }
    @{ n="tiq_quantityonhand"; d="Quantity On Hand"; t="integer"; r=1; desc="Physical quantity in stock" }
    @{ n="tiq_quantityreserved"; d="Quantity Reserved"; t="integer"; desc="Quantity reserved for orders" }
    @{ n="tiq_quantityavailable"; d="Quantity Available"; t="integer"; desc="Available = on hand - reserved" }
    @{ n="tiq_unit"; d="Unit"; t="string"; ml=20; desc="Unit of measure (pcs, kg, etc.)" }
    @{ n="tiq_reorderpoint"; d="Reorder Point"; t="integer"; desc="Minimum stock level before reorder" }
    @{ n="tiq_lastupdated"; d="Last Updated"; t="datetime"; desc="Last sync from D365 F&O" }
    @{ n="tiq_d365externalid"; d="D365 External ID"; t="string"; ml=100; desc="Original record ID from D365 F&O" }
)

# ---- Table 13: Delivery Route ----
# Skip: tiq_deliveryrouteid (PK), tiq_name (primary name), tiq_warehouseid (lookup)
$columnDefs["tiq_deliveryroute"] = @(
    @{ n="tiq_originlatitude"; d="Origin Lat"; t="double"; p=5; desc="Route origin latitude" }
    @{ n="tiq_originlongitude"; d="Origin Lng"; t="double"; p=5; desc="Route origin longitude" }
    @{ n="tiq_stops"; d="Stops"; t="memo"; ml=100000; desc="JSON array of delivery stops [{shipmentId, location, customerName, stopOrder, estimatedArrival}]" }
    @{ n="tiq_totaldistancekm"; d="Total Distance (km)"; t="double"; p=2; desc="Total route distance" }
    @{ n="tiq_totaldurationminutes"; d="Total Duration (min)"; t="double"; p=1; desc="Total route duration" }
    @{ n="tiq_trafficdelayminutes"; d="Traffic Delay (min)"; t="double"; p=1; desc="Current traffic delay" }
    @{ n="tiq_optimizedorder"; d="Optimized Order"; t="memo"; ml=5000; desc="JSON array of optimized stop indices" }
    @{ n="tiq_coordinates"; d="Coordinates"; t="memo"; ml=100000; desc="JSON array of [lng, lat] polyline coordinates" }
)

# ---- Table 14: Return Order ----
# Skip: tiq_returnorderid (PK), tiq_returnid_display (primary name), lookups (originalshipmentid, warehouseid)
$columnDefs["tiq_returnorder"] = @(
    @{ n="tiq_customername"; d="Customer Name"; t="string"; ml=300; r=1; desc="Customer requesting the return" }
    @{ n="tiq_items"; d="Return Items"; t="memo"; ml=50000; desc="JSON array of return items [{itemId, itemName, quantity, condition}]" }
    @{ n="tiq_requesteddate"; d="Requested Date"; t="datetime"; desc="When return was requested" }
    @{ n="tiq_pickupdate"; d="Pickup Date"; t="datetime"; desc="Scheduled pickup date" }
    @{ n="tiq_receiveddate"; d="Received Date"; t="datetime"; desc="When items were received back" }
    @{ n="tiq_refundamount"; d="Refund Amount"; t="money"; p=2; desc="Total refund amount" }
    @{ n="tiq_notes"; d="Notes"; t="memo"; ml=4000; desc="Additional notes" }
    @{ n="tiq_d365externalid"; d="D365 External ID"; t="string"; ml=100; desc="Original record ID from D365 F&O" }
)

# ---- Table 15: Fleet Vehicle ----
# Skip: tiq_fleetvehicleid (PK), tiq_licenseplate (primary name), tiq_currentshipmentid (lookup)
$columnDefs["tiq_fleetvehicle"] = @(
    @{ n="tiq_vehiclecode"; d="Vehicle Code"; t="string"; ml=50; r=1; desc="Business vehicle ID (e.g. TRK-001)" }
    @{ n="tiq_drivername"; d="Driver Name"; t="string"; ml=200; desc="Currently assigned driver" }
    @{ n="tiq_driverid"; d="Driver ID"; t="string"; ml=50; desc="Driver reference ID" }
    @{ n="tiq_latitude"; d="Current Latitude"; t="double"; p=5; desc="Current GPS latitude" }
    @{ n="tiq_longitude"; d="Current Longitude"; t="double"; p=5; desc="Current GPS longitude" }
    @{ n="tiq_locationlabel"; d="Current Location"; t="string"; ml=300; desc="Reverse-geocoded location label" }
    @{ n="tiq_assignedroute"; d="Assigned Route"; t="string"; ml=100; desc="Currently assigned route reference" }
    @{ n="tiq_loadpercent"; d="Load %"; t="integer"; desc="Current load percentage (0-100)" }
    @{ n="tiq_speedkmh"; d="Speed (km/h)"; t="double"; p=1; desc="Current speed from GPS" }
    @{ n="tiq_fuellevelpercent"; d="Fuel Level %"; t="integer"; desc="Current fuel level percentage" }
    @{ n="tiq_hoursonduty"; d="Hours On Duty"; t="double"; p=1; desc="Hours on duty today" }
    @{ n="tiq_distancetodaykm"; d="Distance Today (km)"; t="double"; p=1; desc="Distance driven today" }
    @{ n="tiq_d365externalid"; d="D365 External ID"; t="string"; ml=100; desc="Original record ID from D365 F&O" }
)

# ---- Table 16: Vehicle Health ----
# Skip: tiq_vehiclehealthid (PK), tiq_name (primary name), tiq_fleetvehicleid (lookup)
$columnDefs["tiq_vehiclehealth"] = @(
    @{ n="tiq_healthscore"; d="Health Score"; t="integer"; r=1; desc="Overall health score (0-100)" }
    @{ n="tiq_lastservicedate"; d="Last Service Date"; t="datetime"; desc="Date of last completed service" }
    @{ n="tiq_nextpredictedservice"; d="Next Predicted Service"; t="datetime"; desc="AI-predicted next service date" }
    @{ n="tiq_mileagekm"; d="Mileage (km)"; t="double"; p=1; desc="Current mileage" }
    @{ n="tiq_enginehours"; d="Engine Hours"; t="double"; p=1; desc="Total engine hours" }
    @{ n="tiq_d365externalid"; d="D365 External ID"; t="string"; ml=100; desc="Original record ID from D365 F&O for sync" }
)

# ---- Table 17: Maintenance Alert ----
# Skip: tiq_maintenancealertid (PK), tiq_name (primary name), tiq_fleetvehicleid (lookup)
$columnDefs["tiq_maintenancealert"] = @(
    @{ n="tiq_predictedfailuredate"; d="Predicted Failure Date"; t="datetime"; desc="When failure is predicted" }
    @{ n="tiq_confidencepercent"; d="Confidence %"; t="integer"; desc="ML model confidence (0-100)" }
    @{ n="tiq_recommendedaction"; d="Recommended Action"; t="string"; ml=500; desc="Suggested maintenance action" }
    @{ n="tiq_estimatedcost"; d="Estimated Cost"; t="money"; p=2; desc="Estimated repair cost" }
    @{ n="tiq_d365externalid"; d="D365 External ID"; t="string"; ml=100; desc="Original record ID from D365 F&O for sync" }
)

# ---- Table 18: Maintenance Record ----
# Skip: tiq_maintenancerecordid (PK), tiq_name (primary name), tiq_fleetvehicleid (lookup)
$columnDefs["tiq_maintenancerecord"] = @(
    @{ n="tiq_servicetype"; d="Service Type"; t="string"; ml=200; r=1; desc="Type of service performed" }
    @{ n="tiq_servicedate"; d="Service Date"; t="datetime"; r=1; desc="Date of service" }
    @{ n="tiq_cost"; d="Cost"; t="money"; p=2; desc="Service cost" }
    @{ n="tiq_technician"; d="Technician"; t="string"; ml=200; desc="Service technician name" }
    @{ n="tiq_notes"; d="Notes"; t="memo"; ml=4000; desc="Service notes" }
    @{ n="tiq_d365externalid"; d="D365 External ID"; t="string"; ml=100; desc="Original record ID from D365 F&O" }
)

# ---- Table 19: Work Order ----
# Skip: tiq_workorderid (PK), tiq_workorderid_display (primary name), tiq_assignedtechnicianid (lookup)
$columnDefs["tiq_workorder"] = @(
    @{ n="tiq_customername"; d="Customer Name"; t="string"; ml=300; r=1; desc="Customer name" }
    @{ n="tiq_servicetype"; d="Service Type"; t="string"; ml=200; r=1; desc="Type of service required" }
    @{ n="tiq_requiredskills"; d="Required Skills"; t="string"; ml=500; desc="JSON array of required skill names" }
    @{ n="tiq_latitude"; d="Latitude"; t="double"; p=5; desc="Job site latitude" }
    @{ n="tiq_longitude"; d="Longitude"; t="double"; p=5; desc="Job site longitude" }
    @{ n="tiq_locationlabel"; d="Location"; t="string"; ml=300; desc="Job site address/label" }
    @{ n="tiq_estimatedduration"; d="Estimated Duration (hrs)"; t="double"; p=1; desc="Estimated hours to complete" }
    @{ n="tiq_scheduleddate"; d="Scheduled Date"; t="datetime"; desc="Scheduled service date" }
    @{ n="tiq_description"; d="Description"; t="memo"; ml=4000; desc="Work order description" }
    @{ n="tiq_createddate"; d="Created Date"; t="datetime"; desc="When the work order was created" }
    @{ n="tiq_d365externalid"; d="D365 External ID"; t="string"; ml=100; desc="Original record ID from D365 F&O" }
)

# ---- Table 20: Technician ----
# Skip: tiq_technicianid (PK), tiq_name (primary name)
$columnDefs["tiq_technician"] = @(
    @{ n="tiq_skills"; d="Skills"; t="string"; ml=500; desc="JSON array of skill names" }
    @{ n="tiq_latitude"; d="Current Latitude"; t="double"; p=5; desc="Current location latitude" }
    @{ n="tiq_longitude"; d="Current Longitude"; t="double"; p=5; desc="Current location longitude" }
    @{ n="tiq_locationlabel"; d="Current Location"; t="string"; ml=300; desc="Current location label" }
    @{ n="tiq_todayworkorders"; d="Today Work Orders"; t="integer"; desc="Work orders assigned today" }
    @{ n="tiq_completedtoday"; d="Completed Today"; t="integer"; desc="Work orders completed today" }
    @{ n="tiq_phone"; d="Phone"; t="string"; ml=30; desc="Contact phone number" }
    @{ n="tiq_d365externalid"; d="D365 External ID"; t="string"; ml=100; desc="Original record ID from D365 F&O" }
)

# ---- Table 21: Service Request ----
# Skip: tiq_servicerequestid (PK), tiq_title (primary name), lookups (assetid, assignedtechnicianid)
$columnDefs["tiq_servicerequest"] = @(
    @{ n="tiq_customername"; d="Customer Name"; t="string"; ml=300; r=1; desc="Requesting customer" }
    @{ n="tiq_customersiteid"; d="Customer Site ID"; t="string"; ml=50; desc="Customer site reference" }
    @{ n="tiq_customeraddress"; d="Customer Address"; t="string"; ml=500; desc="Service location address" }
    @{ n="tiq_servicetype"; d="Service Type"; t="string"; ml=200; desc="Type of service needed" }
    @{ n="tiq_description"; d="Description"; t="memo"; ml=4000; desc="Detailed description" }
    @{ n="tiq_sladeadline"; d="SLA Deadline"; t="datetime"; desc="SLA resolution deadline" }
    @{ n="tiq_latitude"; d="Latitude"; t="double"; p=5; desc="Service location latitude" }
    @{ n="tiq_longitude"; d="Longitude"; t="double"; p=5; desc="Service location longitude" }
    @{ n="tiq_createdat"; d="Created At"; t="datetime"; desc="When the request was created" }
    @{ n="tiq_d365externalid"; d="D365 External ID"; t="string"; ml=100; desc="Original record ID from D365 F&O" }
)

# ---- Table 22: Customer Asset ----
# Skip: tiq_customerassetid (PK), tiq_assetname (primary name)
$columnDefs["tiq_customerasset"] = @(
    @{ n="tiq_customerid"; d="Customer ID"; t="string"; ml=50; desc="Customer reference" }
    @{ n="tiq_customername"; d="Customer Name"; t="string"; ml=300; desc="Customer name" }
    @{ n="tiq_model"; d="Model"; t="string"; ml=200; desc="Equipment model" }
    @{ n="tiq_serialnumber"; d="Serial Number"; t="string"; ml=100; desc="Equipment serial number" }
    @{ n="tiq_location"; d="Location"; t="string"; ml=300; desc="Asset location/site" }
    @{ n="tiq_warrantyexpiry"; d="Warranty Expiry"; t="datetime"; desc="Warranty expiration date" }
    @{ n="tiq_lastservicedate"; d="Last Service Date"; t="datetime"; desc="Last serviced date" }
    @{ n="tiq_servicecount"; d="Service Count"; t="integer"; desc="Total number of service visits" }
    @{ n="tiq_healthscore"; d="Health Score"; t="integer"; desc="Asset health score (0-100)" }
    @{ n="tiq_d365externalid"; d="D365 External ID"; t="string"; ml=100; desc="Original record ID from D365 F&O" }
)

# ---- Table 23: Service Agreement ----
# Skip: tiq_serviceagreementid (PK), tiq_name (primary name)
$columnDefs["tiq_serviceagreement"] = @(
    @{ n="tiq_customername"; d="Customer Name"; t="string"; ml=300; r=1; desc="Customer name" }
    @{ n="tiq_startdate"; d="Start Date"; t="datetime"; r=1; desc="Agreement start date" }
    @{ n="tiq_enddate"; d="End Date"; t="datetime"; r=1; desc="Agreement end date" }
    @{ n="tiq_responsetimeslahours"; d="Response Time SLA (hrs)"; t="double"; p=1; desc="Maximum response time in hours" }
    @{ n="tiq_resolutiontimeslahours"; d="Resolution Time SLA (hrs)"; t="double"; p=1; desc="Maximum resolution time in hours" }
    @{ n="tiq_coveragehours"; d="Coverage Hours"; t="string"; ml=50; desc="Coverage schedule (e.g. 24/7, 8-18 M-F)" }
    @{ n="tiq_assetscount"; d="Assets Count"; t="integer"; desc="Number of covered assets" }
    @{ n="tiq_monthlyvisitsincluded"; d="Monthly Visits Included"; t="integer"; desc="Included maintenance visits per month" }
    @{ n="tiq_d365externalid"; d="D365 External ID"; t="string"; ml=100; desc="Original record ID from D365 F&O" }
)

# ---- Table 24: IoT Device ----
# Skip: tiq_iotdeviceid (PK), tiq_devicecode (primary name), tiq_fleetvehicleid (lookup)
$columnDefs["tiq_iotdevice"] = @(
    @{ n="tiq_licenseplate"; d="License Plate"; t="string"; ml=20; desc="Vehicle license plate (denormalized)" }
    @{ n="tiq_devicemodel"; d="Device Model"; t="string"; ml=100; desc="Hardware model" }
    @{ n="tiq_firmwareversion"; d="Firmware Version"; t="string"; ml=50; desc="Current firmware version" }
    @{ n="tiq_signalstrengthpercent"; d="Signal Strength %"; t="integer"; desc="Current signal strength (0-100)" }
    @{ n="tiq_batterylevelpercent"; d="Battery Level %"; t="integer"; desc="Current battery level (0-100)" }
    @{ n="tiq_lastheartbeat"; d="Last Heartbeat"; t="datetime"; desc="Last telemetry heartbeat timestamp" }
    @{ n="tiq_latitude"; d="Last Known Latitude"; t="double"; p=5; desc="Last known GPS latitude" }
    @{ n="tiq_longitude"; d="Last Known Longitude"; t="double"; p=5; desc="Last known GPS longitude" }
    @{ n="tiq_locationlabel"; d="Last Known Location"; t="string"; ml=300; desc="Last known location label" }
    @{ n="tiq_installeddate"; d="Installed Date"; t="datetime"; desc="When device was installed on vehicle" }
)

# ---- Table 25: Geofence Zone ----
# Skip: tiq_geofencezoneid (PK), tiq_name (primary name), tiq_warehouseid (lookup)
$columnDefs["tiq_geofencezone"] = @(
    @{ n="tiq_centerlatitude"; d="Center Latitude"; t="double"; p=5; r=1; desc="Center point latitude" }
    @{ n="tiq_centerlongitude"; d="Center Longitude"; t="double"; p=5; r=1; desc="Center point longitude" }
    @{ n="tiq_radiusmeters"; d="Radius (meters)"; t="integer"; r=1; desc="Zone radius in meters" }
)

# ---- Table 26: Geofence Event ----
# Skip: tiq_geofenceeventid (PK), tiq_name (primary name), lookups (geofencezoneid, fleetvehicleid)
$columnDefs["tiq_geofenceevent"] = @(
    @{ n="tiq_drivername"; d="Driver Name"; t="string"; ml=200; desc="Driver at time of event" }
    @{ n="tiq_timestamp"; d="Timestamp"; t="datetime"; r=1; desc="When the event occurred" }
    @{ n="tiq_dwelltimeminutes"; d="Dwell Time (min)"; t="integer"; desc="Time spent in zone (for exit events)" }
    @{ n="tiq_expectedentry"; d="Expected Entry"; t="boolean"; desc="Whether this was a scheduled/expected entry" }
)

# ---- Table 27: Driving Alert ----
# Skip: tiq_drivingalertid (PK), tiq_name (primary name), tiq_fleetvehicleid (lookup)
$columnDefs["tiq_drivingalert"] = @(
    @{ n="tiq_drivername"; d="Driver Name"; t="string"; ml=200; desc="Driver at time of alert" }
    @{ n="tiq_timestamp"; d="Timestamp"; t="datetime"; r=1; desc="When the alert occurred" }
    @{ n="tiq_latitude"; d="Latitude"; t="double"; p=5; desc="Location latitude" }
    @{ n="tiq_longitude"; d="Longitude"; t="double"; p=5; desc="Location longitude" }
    @{ n="tiq_locationlabel"; d="Location"; t="string"; ml=300; desc="Location label" }
    @{ n="tiq_details"; d="Details"; t="memo"; ml=2000; desc="Alert details/context" }
    @{ n="tiq_speedkmh"; d="Speed (km/h)"; t="double"; p=1; desc="Recorded speed (for speeding alerts)" }
    @{ n="tiq_speedlimitkmh"; d="Speed Limit (km/h)"; t="double"; p=1; desc="Road speed limit (for speeding alerts)" }
    @{ n="tiq_durationseconds"; d="Duration (seconds)"; t="integer"; desc="Duration of behavior (for idling alerts)" }
)

# ---- Table 28: Connectivity Alert ----
# Skip: tiq_connectivityalertid (PK), tiq_name (primary name), lookups (iotdeviceid, fleetvehicleid)
$columnDefs["tiq_connectivityalert"] = @(
    @{ n="tiq_timestamp"; d="Timestamp"; t="datetime"; r=1; desc="When the alert occurred" }
    @{ n="tiq_resolvedat"; d="Resolved At"; t="datetime"; desc="When the issue was resolved (null = unresolved)" }
    @{ n="tiq_durationminutes"; d="Duration (min)"; t="integer"; desc="Duration of the connectivity issue" }
    @{ n="tiq_details"; d="Details"; t="memo"; ml=2000; desc="Alert details" }
)

# ---- Table 29: App Setting ----
# Skip: tiq_appsettingid (PK), tiq_key (primary name)
$columnDefs["tiq_appsetting"] = @(
    @{ n="tiq_value"; d="Setting Value"; t="memo"; ml=10000; desc="Setting value (string, JSON, etc.)" }
    @{ n="tiq_displayname"; d="Display Name"; t="string"; ml=200; desc="Human-readable setting name" }
    @{ n="tiq_description"; d="Description"; t="memo"; ml=1000; desc="Setting description/help text" }
    @{ n="tiq_issecret"; d="Is Secret"; t="boolean"; desc="If true, value is a Key Vault reference, not the actual secret" }
    @{ n="tiq_isactive"; d="Is Active"; t="boolean"; desc="Whether this setting is currently active" }
)

# ---- Table 30: Agent Configuration ----
# Skip: tiq_agentconfigurationid (PK), tiq_name (primary name)
$columnDefs["tiq_agentconfiguration"] = @(
    @{ n="tiq_subtitle"; d="Subtitle"; t="string"; ml=200; desc="Agent subtitle for UI" }
    @{ n="tiq_color"; d="Color"; t="string"; ml=10; desc="Agent theme color hex (e.g. #0078D4)" }
    @{ n="tiq_isenabled"; d="Is Enabled"; t="boolean"; desc="Whether this agent is active" }
    @{ n="tiq_modeldeployment"; d="Model Deployment"; t="string"; ml=100; desc="Azure AI Foundry model deployment name override" }
    @{ n="tiq_foundryagentid"; d="Foundry Agent ID"; t="string"; ml=200; desc="Azure AI Foundry Agent ID" }
    @{ n="tiq_keywords"; d="Keywords"; t="memo"; ml=5000; desc="JSON array of routing keywords for this agent" }
    @{ n="tiq_tools"; d="Tools"; t="memo"; ml=10000; desc="JSON array of registered tool names for this agent" }
    @{ n="tiq_systemprompt"; d="System Prompt"; t="memo"; ml=50000; desc="Custom system prompt override for this agent" }
    @{ n="tiq_sortorder"; d="Sort Order"; t="integer"; desc="Display order in agent list" }
)

# ---- Table 31: Supply Chain KPI ----
# Skip: tiq_supplychainkpiid (PK), tiq_name (primary name)
$columnDefs["tiq_supplychainkpi"] = @(
    @{ n="tiq_ontimedeliveryrate"; d="On-Time Delivery Rate %"; t="double"; p=1; desc="Percentage of on-time deliveries" }
    @{ n="tiq_avgdeliverytimeminutes"; d="Avg Delivery Time (min)"; t="double"; p=1; desc="Average delivery time in minutes" }
    @{ n="tiq_activeshipments"; d="Active Shipments"; t="integer"; desc="Currently active shipments" }
    @{ n="tiq_delayedshipments"; d="Delayed Shipments"; t="integer"; desc="Currently delayed shipments" }
    @{ n="tiq_costperkm"; d="Cost Per km"; t="money"; p=2; desc="Average cost per kilometer" }
    @{ n="tiq_slacompliancerate"; d="SLA Compliance Rate %"; t="double"; p=1; desc="SLA compliance percentage" }
    @{ n="tiq_warehouseutilization"; d="Warehouse Utilization %"; t="double"; p=1; desc="Warehouse capacity utilization" }
    @{ n="tiq_fleetutilization"; d="Fleet Utilization %"; t="double"; p=1; desc="Fleet utilization rate" }
    @{ n="tiq_totaldeliveriestoday"; d="Total Deliveries Today"; t="integer"; desc="Deliveries completed today" }
    @{ n="tiq_pendingworkorders"; d="Pending Work Orders"; t="integer"; desc="Outstanding work orders" }
    @{ n="tiq_snapshottime"; d="Snapshot Time"; t="datetime"; r=1; desc="When this KPI snapshot was taken" }
    @{ n="tiq_d365externalid"; d="D365 External ID"; t="string"; ml=100; desc="Original record ID from D365 F&O for sync" }
)

# ============================================================================
# Section 3b: Picklist (Choice) Column Definitions
# ============================================================================
# All option values use publisher prefix 10048 -> 100480000-based numbering.

$picklistColumns = @{}

# ---- Table 1: Traffic Incident ----
$picklistColumns["tiq_trafficincident"] = @(
    @{ n="tiq_incidenttype"; d="Incident Type"; r=1; os="tiq_incidenttype"; osd="Incident Type"; desc="Type: accident, roadwork, congestion, closure, other"; opts=@(
        @{v=100480000;l="Accident"}, @{v=100480001;l="Roadwork"}, @{v=100480002;l="Congestion"}, @{v=100480003;l="Closure"}, @{v=100480004;l="Other"}
    )}
    @{ n="tiq_severity"; d="Severity"; r=1; os="tiq_incidentseverity"; osd="Incident Severity"; desc="Severity: low, medium, high, critical"; opts=@(
        @{v=100480000;l="Low"}, @{v=100480001;l="Medium"}, @{v=100480002;l="High"}, @{v=100480003;l="Critical"}
    )}
    @{ n="tiq_source"; d="Source"; r=1; os="tiq_incidentsource"; osd="Incident Source"; desc="Data source: vejdirektoratet, azure-maps, agent"; opts=@(
        @{v=100480000;l="Vejdirektoratet"}, @{v=100480001;l="Azure Maps"}, @{v=100480002;l="Agent"}
    )}
)

# ---- Table 2: Saved Journey ----
$picklistColumns["tiq_savedjourney"] = @(
    @{ n="tiq_transportmode"; d="Transport Mode"; r=1; os="tiq_transportmode"; osd="Transport Mode"; desc="Mode of transport: car, transit, bicycle, walk"; opts=@(
        @{v=100480000;l="Car"}, @{v=100480001;l="Transit"}, @{v=100480002;l="Bicycle"}, @{v=100480003;l="Walk"}
    )}
)

# ---- Table 5: Notification ----
$picklistColumns["tiq_notification"] = @(
    @{ n="tiq_notificationtype"; d="Notification Type"; r=1; os="tiq_notificationtype"; osd="Notification Type"; desc="Type: traffic, journey, system, shipment, fleet, iot, maintenance"; opts=@(
        @{v=100480000;l="Traffic"}, @{v=100480001;l="Journey"}, @{v=100480002;l="System"}, @{v=100480003;l="Shipment"}, @{v=100480004;l="Fleet"}, @{v=100480005;l="IoT"}, @{v=100480006;l="Maintenance"}
    )}
    @{ n="tiq_severity"; d="Severity"; r=0; os="tiq_notificationseverity"; osd="Notification Severity"; desc="Severity: info, warning, error, success"; opts=@(
        @{v=100480000;l="Info"}, @{v=100480001;l="Warning"}, @{v=100480002;l="Error"}, @{v=100480003;l="Success"}
    )}
)

# ---- Table 6: User Preference ----
$picklistColumns["tiq_userpreference"] = @(
    @{ n="tiq_thememode"; d="Theme Mode"; r=0; os="tiq_thememode"; osd="Theme Mode"; desc="Preferred theme: light, dark, system"; opts=@(
        @{v=100480000;l="Light"}, @{v=100480001;l="Dark"}, @{v=100480002;l="System"}
    )}
)

# ---- Table 7: Chat Thread ----
$picklistColumns["tiq_chatthread"] = @(
    @{ n="tiq_agentdomain"; d="Agent Domain"; r=0; os="tiq_agentdomain"; osd="Agent Domain"; desc="Which specialist agent owns this thread"; opts=@(
        @{v=100480000;l="Traffic"}, @{v=100480001;l="Supply Chain"}, @{v=100480002;l="Fleet"}, @{v=100480003;l="Operations"}, @{v=100480004;l="Field Service"}, @{v=100480005;l="IoT & Logistics"}
    )}
)

# ---- Table 8: Chat Message ----
$picklistColumns["tiq_chatmessage"] = @(
    @{ n="tiq_role"; d="Role"; r=1; os="tiq_chatrole"; osd="Chat Role"; desc="Message role: user, assistant, system"; opts=@(
        @{v=100480000;l="User"}, @{v=100480001;l="Assistant"}, @{v=100480002;l="System"}
    )}
    @{ n="tiq_routedtoagent"; d="Routed To Agent"; r=0; os="tiq_routedtoagent"; osd="Routed To Agent"; desc="Which agent handled this message"; opts=@(
        @{v=100480000;l="Traffic"}, @{v=100480001;l="Supply Chain"}, @{v=100480002;l="Fleet"}, @{v=100480003;l="Operations"}, @{v=100480004;l="Field Service"}, @{v=100480005;l="IoT & Logistics"}
    )}
)

# ---- Table 9: Traffic Summary ----
$picklistColumns["tiq_trafficsummary"] = @(
    @{ n="tiq_congestionlevel"; d="Congestion Level"; r=1; os="tiq_congestionlevel"; osd="Congestion Level"; desc="Overall congestion level: free, light, moderate, heavy, severe"; opts=@(
        @{v=100480000;l="Free"}, @{v=100480001;l="Light"}, @{v=100480002;l="Moderate"}, @{v=100480003;l="Heavy"}, @{v=100480004;l="Severe"}
    )}
)

# ---- Table 10: Shipment ----
$picklistColumns["tiq_shipment"] = @(
    @{ n="tiq_status"; d="Status"; r=1; os="tiq_shipmentstatus"; osd="Shipment Status"; desc="Shipment lifecycle status"; opts=@(
        @{v=100480000;l="Pending"}, @{v=100480001;l="Picked"}, @{v=100480002;l="Packed"}, @{v=100480003;l="In Transit"}, @{v=100480004;l="Delivered"}, @{v=100480005;l="Delayed"}, @{v=100480006;l="Cancelled"}
    )}
    @{ n="tiq_priority"; d="Priority"; r=1; os="tiq_shipmentpriority"; osd="Shipment Priority"; desc="Shipment priority: standard, express, urgent"; opts=@(
        @{v=100480000;l="Standard"}, @{v=100480001;l="Express"}, @{v=100480002;l="Urgent"}
    )}
)

# ---- Table 14: Return Order ----
$picklistColumns["tiq_returnorder"] = @(
    @{ n="tiq_reason"; d="Return Reason"; r=1; os="tiq_returnreason"; osd="Return Reason"; desc="Reason for return"; opts=@(
        @{v=100480000;l="Damaged"}, @{v=100480001;l="Wrong Item"}, @{v=100480002;l="Quality Issue"}, @{v=100480003;l="Changed Mind"}, @{v=100480004;l="Defective"}, @{v=100480005;l="Other"}
    )}
    @{ n="tiq_status"; d="Status"; r=1; os="tiq_returnstatus"; osd="Return Status"; desc="Return lifecycle status"; opts=@(
        @{v=100480000;l="Requested"}, @{v=100480001;l="Approved"}, @{v=100480002;l="Pickup Scheduled"}, @{v=100480003;l="In Transit"}, @{v=100480004;l="Received"}, @{v=100480005;l="Processed"}, @{v=100480006;l="Rejected"}
    )}
)

# ---- Table 15: Fleet Vehicle ----
$picklistColumns["tiq_fleetvehicle"] = @(
    @{ n="tiq_status"; d="Status"; r=1; os="tiq_vehiclestatus"; osd="Vehicle Status"; desc="Current vehicle status"; opts=@(
        @{v=100480000;l="In Transit"}, @{v=100480001;l="Idle"}, @{v=100480002;l="Maintenance"}, @{v=100480003;l="Returning"}
    )}
)

# ---- Table 17: Maintenance Alert ----
$picklistColumns["tiq_maintenancealert"] = @(
    @{ n="tiq_component"; d="Component"; r=1; os="tiq_maintenancecomponent"; osd="Maintenance Component"; desc="Affected component"; opts=@(
        @{v=100480000;l="Brakes"}, @{v=100480001;l="Oil"}, @{v=100480002;l="Tires"}, @{v=100480003;l="Battery"}, @{v=100480004;l="Transmission"}, @{v=100480005;l="Coolant"}, @{v=100480006;l="Filters"}
    )}
    @{ n="tiq_severity"; d="Severity"; r=1; os="tiq_alertseverity"; osd="Alert Severity"; desc="Alert severity"; opts=@(
        @{v=100480000;l="Low"}, @{v=100480001;l="Medium"}, @{v=100480002;l="High"}, @{v=100480003;l="Critical"}
    )}
)

# ---- Table 19: Work Order ----
$picklistColumns["tiq_workorder"] = @(
    @{ n="tiq_priority"; d="Priority"; r=1; os="tiq_workorderpriority"; osd="Work Order Priority"; desc="Work order priority"; opts=@(
        @{v=100480000;l="Low"}, @{v=100480001;l="Medium"}, @{v=100480002;l="High"}, @{v=100480003;l="Critical"}
    )}
    @{ n="tiq_status"; d="Status"; r=1; os="tiq_workorderstatus"; osd="Work Order Status"; desc="Work order status"; opts=@(
        @{v=100480000;l="Unscheduled"}, @{v=100480001;l="Scheduled"}, @{v=100480002;l="In Progress"}, @{v=100480003;l="Completed"}, @{v=100480004;l="Cancelled"}
    )}
)

# ---- Table 20: Technician ----
$picklistColumns["tiq_technician"] = @(
    @{ n="tiq_status"; d="Status"; r=1; os="tiq_technicianstatus"; osd="Technician Status"; desc="Current availability status"; opts=@(
        @{v=100480000;l="Available"}, @{v=100480001;l="On Job"}, @{v=100480002;l="Off Duty"}
    )}
)

# ---- Table 21: Service Request ----
$picklistColumns["tiq_servicerequest"] = @(
    @{ n="tiq_priority"; d="Priority"; r=1; os="tiq_servicerequestpriority"; osd="Service Request Priority"; desc="Request priority"; opts=@(
        @{v=100480000;l="Low"}, @{v=100480001;l="Medium"}, @{v=100480002;l="High"}, @{v=100480003;l="Critical"}
    )}
    @{ n="tiq_status"; d="Status"; r=1; os="tiq_servicerequeststatus"; osd="Service Request Status"; desc="Request lifecycle status"; opts=@(
        @{v=100480000;l="New"}, @{v=100480001;l="Assigned"}, @{v=100480002;l="In Progress"}, @{v=100480003;l="On Hold"}, @{v=100480004;l="Completed"}, @{v=100480005;l="Cancelled"}
    )}
    @{ n="tiq_slastatus"; d="SLA Status"; r=0; os="tiq_slastatus"; osd="SLA Status"; desc="Current SLA compliance status"; opts=@(
        @{v=100480000;l="On Track"}, @{v=100480001;l="At Risk"}, @{v=100480002;l="Breached"}
    )}
)

# ---- Table 22: Customer Asset ----
$picklistColumns["tiq_customerasset"] = @(
    @{ n="tiq_warrantystatus"; d="Warranty Status"; r=0; os="tiq_warrantystatus"; osd="Warranty Status"; desc="Warranty status"; opts=@(
        @{v=100480000;l="Active"}, @{v=100480001;l="Expiring Soon"}, @{v=100480002;l="Expired"}
    )}
    @{ n="tiq_operationalstatus"; d="Operational Status"; r=0; os="tiq_assetoperationalstatus"; osd="Asset Operational Status"; desc="Operational/degraded/down"; opts=@(
        @{v=100480000;l="Operational"}, @{v=100480001;l="Degraded"}, @{v=100480002;l="Down"}
    )}
)

# ---- Table 23: Service Agreement ----
$picklistColumns["tiq_serviceagreement"] = @(
    @{ n="tiq_contracttype"; d="Contract Type"; r=1; os="tiq_contracttype"; osd="Contract Type"; desc="Contract tier: basic, standard, premium"; opts=@(
        @{v=100480000;l="Basic"}, @{v=100480001;l="Standard"}, @{v=100480002;l="Premium"}
    )}
    @{ n="tiq_status"; d="Status"; r=1; os="tiq_agreementstatus"; osd="Agreement Status"; desc="Agreement status"; opts=@(
        @{v=100480000;l="Active"}, @{v=100480001;l="Expiring"}, @{v=100480002;l="Expired"}
    )}
)

# ---- Table 24: IoT Device ----
$picklistColumns["tiq_iotdevice"] = @(
    @{ n="tiq_status"; d="Status"; r=1; os="tiq_iotdevicestatus"; osd="IoT Device Status"; desc="Device status: online, offline, degraded"; opts=@(
        @{v=100480000;l="Online"}, @{v=100480001;l="Offline"}, @{v=100480002;l="Degraded"}
    )}
)

# ---- Table 26: Geofence Event ----
$picklistColumns["tiq_geofenceevent"] = @(
    @{ n="tiq_eventtype"; d="Event Type"; r=1; os="tiq_geofenceeventtype"; osd="Geofence Event Type"; desc="Entry or exit"; opts=@(
        @{v=100480000;l="Entry"}, @{v=100480001;l="Exit"}
    )}
)

# ---- Table 27: Driving Alert ----
$picklistColumns["tiq_drivingalert"] = @(
    @{ n="tiq_alerttype"; d="Alert Type"; r=1; os="tiq_drivingalerttype"; osd="Driving Alert Type"; desc="Type of driving behavior alert"; opts=@(
        @{v=100480000;l="Speeding"}, @{v=100480001;l="Harsh Braking"}, @{v=100480002;l="Excessive Idling"}, @{v=100480003;l="Route Deviation"}
    )}
    @{ n="tiq_severity"; d="Severity"; r=1; os="tiq_alertseverity_driving"; osd="Alert Severity"; desc="Alert severity"; opts=@(
        @{v=100480000;l="Low"}, @{v=100480001;l="Medium"}, @{v=100480002;l="High"}, @{v=100480003;l="Critical"}
    )}
)

# ---- Table 28: Connectivity Alert ----
$picklistColumns["tiq_connectivityalert"] = @(
    @{ n="tiq_alerttype"; d="Alert Type"; r=1; os="tiq_connectivityalerttype"; osd="Connectivity Alert Type"; desc="Type of connectivity alert"; opts=@(
        @{v=100480000;l="Device Offline"}, @{v=100480001;l="Signal Degraded"}, @{v=100480002;l="Battery Low"}, @{v=100480003;l="GPS Signal Lost"}
    )}
    @{ n="tiq_severity"; d="Severity"; r=1; os="tiq_alertseverity_connectivity"; osd="Alert Severity"; desc="Alert severity"; opts=@(
        @{v=100480000;l="Low"}, @{v=100480001;l="Medium"}, @{v=100480002;l="High"}, @{v=100480003;l="Critical"}
    )}
)

# ---- Table 29: App Setting ----
$picklistColumns["tiq_appsetting"] = @(
    @{ n="tiq_category"; d="Category"; r=1; os="tiq_settingcategory"; osd="Setting Category"; desc="Setting category: general, map, mcp, dataverse, email, iot-hub, agents"; opts=@(
        @{v=100480000;l="General"}, @{v=100480001;l="Map"}, @{v=100480002;l="MCP"}, @{v=100480003;l="Dataverse"}, @{v=100480004;l="Email"}, @{v=100480005;l="IoT Hub"}, @{v=100480006;l="Agents"}
    )}
)

# ---- Table 30: Agent Configuration ----
$picklistColumns["tiq_agentconfiguration"] = @(
    @{ n="tiq_domain"; d="Domain"; r=1; os="tiq_agentdomain_config"; osd="Agent Domain"; desc="Agent domain (traffic, supplychain, fleet, etc.)"; opts=@(
        @{v=100480000;l="Traffic"}, @{v=100480001;l="Supply Chain"}, @{v=100480002;l="Fleet"}, @{v=100480003;l="Operations"}, @{v=100480004;l="Field Service"}, @{v=100480005;l="IoT & Logistics"}
    )}
)

# ============================================================================
# Section 4: Create Columns
# ============================================================================

if ($Columns -or $All) {
    Write-Host "`n============================================" -ForegroundColor Magenta
    Write-Host " Creating Regular Columns (31 tables)"       -ForegroundColor Magenta
    Write-Host "============================================" -ForegroundColor Magenta

    $colCreated = 0; $colSkipped = 0; $colFailed = 0

    foreach ($tableName in $columnDefs.Keys | Sort-Object) {
        $tableCols = $columnDefs[$tableName]
        Write-Host "`n  Table: $tableName ($($tableCols.Count) columns)" -ForegroundColor Cyan

        foreach ($col in $tableCols) {
            $name = $col.n
            $display = $col.d
            $type = $col.t
            $desc = if ($col.desc) { $col.desc } else { $display }
            $required = if ($col.r) { $true } else { $false }

            Write-Host "    $name ($type)..." -NoNewline

            $body = $null
            switch ($type) {
                "string"   { $body = New-StringColumn  -Name $name -Display $display -Desc $desc -MaxLen $(if ($col.ml) { $col.ml } else { 200 }) -Required $required }
                "memo"     { $body = New-MemoColumn     -Name $name -Display $display -Desc $desc -MaxLen $(if ($col.ml) { $col.ml } else { 4000 }) -Required $required }
                "integer"  { $body = New-IntegerColumn  -Name $name -Display $display -Desc $desc -Required $required }
                "double"   { $body = New-DoubleColumn   -Name $name -Display $display -Desc $desc -Precision $(if ($col.p) { $col.p } else { 2 }) -Required $required }
                "boolean"  { $body = New-BooleanColumn  -Name $name -Display $display -Desc $desc -Required $required }
                "datetime" { $body = New-DateTimeColumn  -Name $name -Display $display -Desc $desc -Required $required }
                "money"    { $body = New-MoneyColumn     -Name $name -Display $display -Desc $desc -Precision $(if ($col.p) { $col.p } else { 2 }) -Required $required }
                default    { Write-Host " UNKNOWN TYPE" -ForegroundColor Red; $colFailed++; continue }
            }

            $result = Add-Column -Table $tableName -Body $body
            switch ($result) {
                "created" { Write-Host " CREATED" -ForegroundColor Green; $colCreated++ }
                "exists"  { Write-Host " EXISTS" -ForegroundColor Yellow; $colSkipped++ }
                "failed"  { Write-Host " FAILED" -ForegroundColor Red; $colFailed++ }
            }
            Start-Sleep -Milliseconds 200
        }
    }

    Write-Host "`n--- Regular Column Summary ---" -ForegroundColor Magenta
    Write-Host "  Created: $colCreated" -ForegroundColor Green
    Write-Host "  Skipped: $colSkipped" -ForegroundColor Yellow
    Write-Host "  Failed:  $colFailed" -ForegroundColor Red
}

# ============================================================================
# Section 4b: Create Picklist (Choice) Columns
# ============================================================================

if ($OptionSets -or $All) {
    Write-Host "`n============================================" -ForegroundColor Magenta
    Write-Host " Creating Picklist/Choice Columns"            -ForegroundColor Magenta
    Write-Host "============================================" -ForegroundColor Magenta

    $plCreated = 0; $plSkipped = 0; $plFailed = 0

    foreach ($tableName in $picklistColumns.Keys | Sort-Object) {
        $tablePLs = $picklistColumns[$tableName]
        Write-Host "`n  Table: $tableName ($($tablePLs.Count) picklists)" -ForegroundColor Cyan

        foreach ($pl in $tablePLs) {
            $name = $pl.n
            $display = $pl.d
            $desc = if ($pl.desc) { $pl.desc } else { $display }
            $required = if ($pl.r) { $true } else { $false }

            Write-Host "    $name (picklist, $($pl.opts.Count) options)..." -NoNewline

            $body = New-PicklistColumn `
                -Name $name `
                -Display $display `
                -Desc $desc `
                -OptionSetName $pl.os `
                -OptionSetDisplay $pl.osd `
                -Options $pl.opts `
                -Required $required

            $result = Add-Column -Table $tableName -Body $body
            switch ($result) {
                "created" { Write-Host " CREATED" -ForegroundColor Green; $plCreated++ }
                "exists"  { Write-Host " EXISTS" -ForegroundColor Yellow; $plSkipped++ }
                "failed"  { Write-Host " FAILED" -ForegroundColor Red; $plFailed++ }
            }
            Start-Sleep -Milliseconds 200
        }
    }

    Write-Host "`n--- Picklist Column Summary ---" -ForegroundColor Magenta
    Write-Host "  Created: $plCreated" -ForegroundColor Green
    Write-Host "  Skipped: $plSkipped" -ForegroundColor Yellow
    Write-Host "  Failed:  $plFailed" -ForegroundColor Red
}

# ============================================================================
# Section 5: Relationship Definitions and Creation
# ============================================================================

if ($Relationships -or $All) {
    Write-Host "`n============================================" -ForegroundColor Magenta
    Write-Host " Creating Relationships (25 lookups)"         -ForegroundColor Magenta
    Write-Host "============================================" -ForegroundColor Magenta

    $relationshipDefs = @(
        # 1. Saved Journey -> Route Options
        @{
            name="tiq_savedjourney_routeoptions"; parent="tiq_savedjourney"; child="tiq_routeoption"
            lookup="tiq_savedjourneyid"; lookupDisplay="Saved Journey"; lookupDesc="Reference to the parent saved journey"
            required=1
        }
        # 2. Route Option -> Route Steps
        @{
            name="tiq_routeoption_routesteps"; parent="tiq_routeoption"; child="tiq_routestep"
            lookup="tiq_routeoptionid"; lookupDisplay="Route Option"; lookupDesc="Reference to the parent route option"
            required=1
        }
        # 3. Saved Journey -> Notifications
        @{
            name="tiq_savedjourney_notifications"; parent="tiq_savedjourney"; child="tiq_notification"
            lookup="tiq_journeyid"; lookupDisplay="Related Journey"; lookupDesc="Reference to related saved journey (optional)"
            required=0
        }
        # 4. Traffic Incident -> Notifications
        @{
            name="tiq_trafficincident_notifications"; parent="tiq_trafficincident"; child="tiq_notification"
            lookup="tiq_incidentid"; lookupDisplay="Related Incident"; lookupDesc="Reference to related traffic incident (optional)"
            required=0
        }
        # 5. Chat Thread -> Chat Messages
        @{
            name="tiq_chatthread_chatmessages"; parent="tiq_chatthread"; child="tiq_chatmessage"
            lookup="tiq_chatthreadid"; lookupDisplay="Chat Thread"; lookupDesc="Reference to the parent chat thread"
            required=1
        }
        # 6. Warehouse -> Shipments
        @{
            name="tiq_warehouse_shipments"; parent="tiq_warehouse"; child="tiq_shipment"
            lookup="tiq_warehouseid"; lookupDisplay="Warehouse"; lookupDesc="Source warehouse reference"
            required=0
        }
        # 7. Warehouse -> Inventory Items
        @{
            name="tiq_warehouse_inventoryitems"; parent="tiq_warehouse"; child="tiq_inventoryitem"
            lookup="tiq_warehouseid"; lookupDisplay="Warehouse"; lookupDesc="Warehouse storing this item"
            required=1
        }
        # 8. Warehouse -> Delivery Routes
        @{
            name="tiq_warehouse_deliveryroutes"; parent="tiq_warehouse"; child="tiq_deliveryroute"
            lookup="tiq_warehouseid"; lookupDisplay="Warehouse"; lookupDesc="Origin warehouse"
            required=0
        }
        # 9. Shipment -> Notifications
        @{
            name="tiq_shipment_notifications"; parent="tiq_shipment"; child="tiq_notification"
            lookup="tiq_shipmentid"; lookupDisplay="Related Shipment"; lookupDesc="Reference to related shipment (optional)"
            required=0
        }
        # 10. Shipment -> Return Orders
        @{
            name="tiq_shipment_returnorders"; parent="tiq_shipment"; child="tiq_returnorder"
            lookup="tiq_originalshipmentid"; lookupDisplay="Original Shipment"; lookupDesc="Reference to the original shipment"
            required=0
        }
        # 11. Warehouse -> Return Orders
        @{
            name="tiq_warehouse_returnorders"; parent="tiq_warehouse"; child="tiq_returnorder"
            lookup="tiq_warehouseid"; lookupDisplay="Warehouse"; lookupDesc="Receiving warehouse"
            required=0
        }
        # 12. Shipment -> Fleet Vehicle (current shipment)
        @{
            name="tiq_fleetvehicle_currentshipment"; parent="tiq_shipment"; child="tiq_fleetvehicle"
            lookup="tiq_currentshipmentid"; lookupDisplay="Current Shipment"; lookupDesc="Currently carrying shipment"
            required=0
        }
        # 13. Fleet Vehicle -> Vehicle Health
        @{
            name="tiq_fleetvehicle_vehiclehealth"; parent="tiq_fleetvehicle"; child="tiq_vehiclehealth"
            lookup="tiq_fleetvehicleid"; lookupDisplay="Fleet Vehicle"; lookupDesc="Reference to fleet vehicle"
            required=1
        }
        # 14. Fleet Vehicle -> Maintenance Alerts
        @{
            name="tiq_fleetvehicle_maintenancealerts"; parent="tiq_fleetvehicle"; child="tiq_maintenancealert"
            lookup="tiq_fleetvehicleid"; lookupDisplay="Fleet Vehicle"; lookupDesc="Vehicle with the alert"
            required=1
        }
        # 15. Fleet Vehicle -> Maintenance Records
        @{
            name="tiq_fleetvehicle_maintenancerecords"; parent="tiq_fleetvehicle"; child="tiq_maintenancerecord"
            lookup="tiq_fleetvehicleid"; lookupDisplay="Fleet Vehicle"; lookupDesc="Serviced vehicle"
            required=1
        }
        # 16. Technician -> Work Orders
        @{
            name="tiq_technician_workorders"; parent="tiq_technician"; child="tiq_workorder"
            lookup="tiq_assignedtechnicianid"; lookupDisplay="Assigned Technician"; lookupDesc="Assigned technician"
            required=0
        }
        # 17. Technician -> Service Requests
        @{
            name="tiq_technician_servicerequests"; parent="tiq_technician"; child="tiq_servicerequest"
            lookup="tiq_assignedtechnicianid"; lookupDisplay="Assigned Technician"; lookupDesc="Assigned technician"
            required=0
        }
        # 18. Customer Asset -> Service Requests
        @{
            name="tiq_customerasset_servicerequests"; parent="tiq_customerasset"; child="tiq_servicerequest"
            lookup="tiq_assetid"; lookupDisplay="Customer Asset"; lookupDesc="Related customer asset"
            required=0
        }
        # 19. Fleet Vehicle -> IoT Devices
        @{
            name="tiq_fleetvehicle_iotdevices"; parent="tiq_fleetvehicle"; child="tiq_iotdevice"
            lookup="tiq_fleetvehicleid"; lookupDisplay="Fleet Vehicle"; lookupDesc="Installed on vehicle"
            required=0
        }
        # 20. Warehouse -> Geofence Zones
        @{
            name="tiq_warehouse_geofencezones"; parent="tiq_warehouse"; child="tiq_geofencezone"
            lookup="tiq_warehouseid"; lookupDisplay="Warehouse"; lookupDesc="Associated warehouse (if warehouse zone)"
            required=0
        }
        # 21. Geofence Zone -> Geofence Events
        @{
            name="tiq_geofencezone_events"; parent="tiq_geofencezone"; child="tiq_geofenceevent"
            lookup="tiq_geofencezoneid"; lookupDisplay="Geofence Zone"; lookupDesc="Zone that triggered the event"
            required=1
        }
        # 22. Fleet Vehicle -> Geofence Events
        @{
            name="tiq_fleetvehicle_geofenceevents"; parent="tiq_fleetvehicle"; child="tiq_geofenceevent"
            lookup="tiq_fleetvehicleid"; lookupDisplay="Fleet Vehicle"; lookupDesc="Vehicle that triggered the event"
            required=1
        }
        # 23. Fleet Vehicle -> Driving Alerts
        @{
            name="tiq_fleetvehicle_drivingalerts"; parent="tiq_fleetvehicle"; child="tiq_drivingalert"
            lookup="tiq_fleetvehicleid"; lookupDisplay="Fleet Vehicle"; lookupDesc="Vehicle involved"
            required=1
        }
        # 24. IoT Device -> Connectivity Alerts
        @{
            name="tiq_iotdevice_connectivityalerts"; parent="tiq_iotdevice"; child="tiq_connectivityalert"
            lookup="tiq_iotdeviceid"; lookupDisplay="IoT Device"; lookupDesc="Affected device"
            required=1
        }
        # 25. Fleet Vehicle -> Connectivity Alerts
        @{
            name="tiq_fleetvehicle_connectivityalerts"; parent="tiq_fleetvehicle"; child="tiq_connectivityalert"
            lookup="tiq_fleetvehicleid"; lookupDisplay="Fleet Vehicle"; lookupDesc="Vehicle with affected device"
            required=0
        }
    )

    $relCreated = 0; $relSkipped = 0; $relFailed = 0

    foreach ($rel in $relationshipDefs) {
        Write-Host "  $($rel.name): $($rel.parent) -> $($rel.child) [lookup=$($rel.lookup)]..." -NoNewline

        $result = Add-Relationship -Rel $rel
        switch ($result) {
            "created" { Write-Host " CREATED" -ForegroundColor Green; $relCreated++ }
            "exists"  { Write-Host " EXISTS" -ForegroundColor Yellow; $relSkipped++ }
            "failed"  { Write-Host " FAILED" -ForegroundColor Red; $relFailed++ }
        }
        Start-Sleep -Milliseconds 200
    }

    Write-Host "`n--- Relationship Summary ---" -ForegroundColor Magenta
    Write-Host "  Created: $relCreated" -ForegroundColor Green
    Write-Host "  Skipped: $relSkipped" -ForegroundColor Yellow
    Write-Host "  Failed:  $relFailed" -ForegroundColor Red
}

# ============================================================================
# Section 6: Export Solutions
# ============================================================================

if ($Export -or $All) {
    Write-Host "`n============================================" -ForegroundColor Magenta
    Write-Host " Exporting Solutions"                          -ForegroundColor Magenta
    Write-Host "============================================" -ForegroundColor Magenta

    $exportHeaders = @{
        "Authorization"    = "Bearer $token"
        "Content-Type"     = "application/json; charset=utf-8"
        "OData-MaxVersion" = "4.0"
        "OData-Version"    = "4.0"
    }

    $solutionDir = "c:\Source\TrafficInfo\deploy\dataverse\solution"
    if (-not (Test-Path $solutionDir)) {
        New-Item -ItemType Directory -Path $solutionDir -Force | Out-Null
        Write-Host "  Created directory: $solutionDir" -ForegroundColor Gray
    }

    # Export unmanaged
    Write-Host "  Exporting unmanaged solution..." -NoNewline
    try {
        $exportBody = @{ SolutionName = "TrafficIQ"; Managed = $false }
        $response = Invoke-RestMethod -Uri "$apiBase/ExportSolution" -Method Post -Headers $exportHeaders -Body ($exportBody | ConvertTo-Json -Depth 5)
        $bytes = [Convert]::FromBase64String($response.ExportSolutionFile)
        [IO.File]::WriteAllBytes("$solutionDir\TrafficIQ_unmanaged.zip", $bytes)
        Write-Host " OK ($([math]::Round($bytes.Length / 1KB)) KB)" -ForegroundColor Green
    } catch {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "    $($_.Exception.Message)" -ForegroundColor Red
    }

    # Export managed
    Write-Host "  Exporting managed solution..." -NoNewline
    try {
        $exportBody = @{ SolutionName = "TrafficIQ"; Managed = $true }
        $response = Invoke-RestMethod -Uri "$apiBase/ExportSolution" -Method Post -Headers $exportHeaders -Body ($exportBody | ConvertTo-Json -Depth 5)
        $bytes = [Convert]::FromBase64String($response.ExportSolutionFile)
        [IO.File]::WriteAllBytes("$solutionDir\TrafficIQ_managed.zip", $bytes)
        Write-Host " OK ($([math]::Round($bytes.Length / 1KB)) KB)" -ForegroundColor Green
    } catch {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "    $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ============================================================================
# Final Summary
# ============================================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Provisioning Complete"                     -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($Columns -or $All) {
    Write-Host "  Regular Columns  - Created: $colCreated | Skipped: $colSkipped | Failed: $colFailed"
}
if ($OptionSets -or $All) {
    Write-Host "  Picklist Columns - Created: $plCreated | Skipped: $plSkipped | Failed: $plFailed"
}
if ($Relationships -or $All) {
    Write-Host "  Relationships    - Created: $relCreated | Skipped: $relSkipped | Failed: $relFailed"
}
if ($Export -or $All) {
    Write-Host "  Solutions exported to: c:\Source\TrafficInfo\deploy\dataverse\solution\"
}

Write-Host "`nDone!" -ForegroundColor Green
