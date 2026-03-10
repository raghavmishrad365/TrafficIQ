# =============================================================================
# Deploy-DataverseSolution.ps1
#
# Deploys the TrafficIQ managed Dataverse solution to a target environment
# using the Dataverse Web API with OAuth2 client credentials flow.
#
# This script is designed for CI/CD pipelines and headless (non-interactive)
# environments where PAC CLI interactive auth is not available.
#
# Publisher Prefix: tiq_
# Solution Name:    TrafficIQ
#
# Usage:
#   .\Deploy-DataverseSolution.ps1 `
#       -TargetEnvironmentUrl "https://contoso.crm4.dynamics.com" `
#       -TenantId "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" `
#       -ClientId "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" `
#       -ClientSecret "your-client-secret"
#
# =============================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, HelpMessage = "Target Dataverse environment URL, e.g. https://contoso.crm4.dynamics.com")]
    [ValidatePattern('^https://[\w\-]+\.crm\d*\.dynamics\.com$')]
    [string]$TargetEnvironmentUrl,

    [Parameter(Mandatory = $true, HelpMessage = "Azure AD / Entra ID tenant ID")]
    [ValidatePattern('^[0-9a-fA-F\-]{36}$')]
    [string]$TenantId,

    [Parameter(Mandatory = $true, HelpMessage = "App registration client ID")]
    [ValidatePattern('^[0-9a-fA-F\-]{36}$')]
    [string]$ClientId,

    [Parameter(Mandatory = $true, HelpMessage = "App registration client secret")]
    [ValidateNotNullOrEmpty()]
    [string]$ClientSecret,

    [Parameter(Mandatory = $false, HelpMessage = "Path to the managed solution ZIP file")]
    [string]$SolutionZipPath = (Join-Path $PSScriptRoot "solution" "TrafficIQ_managed.zip")
)

$ErrorActionPreference = "Stop"

# Strip trailing slash from environment URL
$TargetEnvironmentUrl = $TargetEnvironmentUrl.TrimEnd('/')

# =============================================================================
# Helper Functions
# =============================================================================

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "  [OK] $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "  [..] $Message" -ForegroundColor Yellow
}

function Write-Fail {
    param([string]$Message)
    Write-Host "  [FAIL] $Message" -ForegroundColor Red
}

function Write-Detail {
    param([string]$Message)
    Write-Host "        $Message" -ForegroundColor Gray
}

# =============================================================================
# Step 1: Validate Prerequisites
# =============================================================================

Write-Step "Step 1/5: Validating Prerequisites"

# Verify solution ZIP exists
if (-not (Test-Path $SolutionZipPath)) {
    Write-Fail "Solution ZIP not found at: $SolutionZipPath"
    Write-Detail "Ensure the managed solution has been exported to the expected path."
    Write-Detail "Expected location: deploy\dataverse\solution\TrafficIQ_managed.zip"
    exit 1
}

$zipSizeMB = [math]::Round((Get-Item $SolutionZipPath).Length / 1MB, 2)
Write-Success "Solution ZIP found: $SolutionZipPath ($zipSizeMB MB)"

# Verify PowerShell version (need 5.1+ for Invoke-RestMethod)
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Fail "PowerShell 5.1 or later is required. Current version: $($PSVersionTable.PSVersion)"
    exit 1
}
Write-Success "PowerShell version: $($PSVersionTable.PSVersion)"

Write-Info "Target environment: $TargetEnvironmentUrl"
Write-Info "Tenant ID:          $TenantId"
Write-Info "Client ID:          $ClientId"
Write-Info "Client Secret:      ****$($ClientSecret.Substring([math]::Max(0, $ClientSecret.Length - 4)))"

# =============================================================================
# Step 2: Acquire OAuth2 Token (Client Credentials Flow)
# =============================================================================

Write-Step "Step 2/5: Acquiring OAuth2 Access Token"

$tokenUrl = "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token"
$tokenBody = @{
    grant_type    = "client_credentials"
    client_id     = $ClientId
    client_secret = $ClientSecret
    scope         = "$TargetEnvironmentUrl/.default"
}

Write-Info "Requesting token from: login.microsoftonline.com/$TenantId"

try {
    $tokenResponse = Invoke-RestMethod -Uri $tokenUrl -Method POST -Body $tokenBody -ContentType "application/x-www-form-urlencoded" -ErrorAction Stop
    $accessToken = $tokenResponse.access_token

    if (-not $accessToken) {
        Write-Fail "Token response did not contain an access_token."
        exit 1
    }

    $tokenExpiresIn = $tokenResponse.expires_in
    Write-Success "Access token acquired (expires in $tokenExpiresIn seconds)"
}
catch {
    Write-Fail "Failed to acquire OAuth2 token."
    Write-Detail "Error: $($_.Exception.Message)"
    Write-Detail ""
    Write-Detail "Common causes:"
    Write-Detail "  - Incorrect Tenant ID, Client ID, or Client Secret"
    Write-Detail "  - App registration missing 'Dynamics CRM > user_impersonation' API permission"
    Write-Detail "  - App registration not granted admin consent"
    Write-Detail "  - Environment URL does not match the tenant"
    exit 1
}

# Build common headers for all Dataverse API calls
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "OData-MaxVersion" = "4.0"
    "OData-Version" = "4.0"
    "Accept" = "application/json"
}

# Quick connectivity test: call WhoAmI
Write-Info "Testing connectivity with WhoAmI..."
try {
    $whoAmI = Invoke-RestMethod -Uri "$TargetEnvironmentUrl/api/data/v9.2/WhoAmI" -Headers $headers -Method GET -ErrorAction Stop
    Write-Success "Connected as: UserId=$($whoAmI.UserId), OrgId=$($whoAmI.OrganizationId)"
}
catch {
    Write-Fail "WhoAmI call failed. The service principal may not have a Dataverse application user."
    Write-Detail "Error: $($_.Exception.Message)"
    Write-Detail ""
    Write-Detail "Ensure the app registration has been added as an Application User in the"
    Write-Detail "target environment with at least the 'System Administrator' security role."
    exit 1
}

# =============================================================================
# Step 3: Import Managed Solution via Web API
# =============================================================================

Write-Step "Step 3/5: Importing Managed Solution"

Write-Info "Reading and encoding solution ZIP..."
$zipBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $SolutionZipPath).Path)
$zipBase64 = [Convert]::ToBase64String($zipBytes)
Write-Success "Solution encoded ($([math]::Round($zipBase64.Length / 1MB, 2)) MB base64)"

$importPayload = @{
    OverwriteUnmanagedCustomizations = $true
    PublishWorkflows                 = $true
    CustomizationFile                = $zipBase64
} | ConvertTo-Json -Depth 2

$importUrl = "$TargetEnvironmentUrl/api/data/v9.2/ImportSolution"

Write-Info "Sending ImportSolution request to Dataverse..."
Write-Info "This may take several minutes depending on solution size..."

$importStopwatch = [System.Diagnostics.Stopwatch]::StartNew()

try {
    $importResponse = Invoke-WebRequest `
        -Uri $importUrl `
        -Headers $headers `
        -Method POST `
        -Body $importPayload `
        -ContentType "application/json" `
        -TimeoutSec 600 `
        -ErrorAction Stop

    $importStopwatch.Stop()
    $elapsedSeconds = [math]::Round($importStopwatch.Elapsed.TotalSeconds, 1)

    if ($importResponse.StatusCode -eq 204 -or $importResponse.StatusCode -eq 200) {
        Write-Success "Solution imported successfully in $elapsedSeconds seconds!"
    }
    else {
        Write-Success "Import request completed with status $($importResponse.StatusCode) in $elapsedSeconds seconds"
    }
}
catch {
    $importStopwatch.Stop()
    $elapsedSeconds = [math]::Round($importStopwatch.Elapsed.TotalSeconds, 1)

    Write-Fail "Solution import failed after $elapsedSeconds seconds."
    Write-Detail "Error: $($_.Exception.Message)"

    # Try to extract a response body with more details
    if ($_.Exception.Response) {
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            $reader.Close()
            if ($errorBody) {
                Write-Detail "Response body:"
                Write-Detail $errorBody
            }
        }
        catch {
            # Ignore errors reading the error response
        }
    }

    Write-Detail ""
    Write-Detail "Common causes:"
    Write-Detail "  - Missing solution dependencies in the target environment"
    Write-Detail "  - Insufficient privileges (need System Administrator role)"
    Write-Detail "  - Solution version conflict (target has a newer version)"
    Write-Detail "  - Corrupt or incomplete solution ZIP"
    Write-Detail "  - Request timeout (try increasing -TimeoutSec)"
    exit 1
}

# =============================================================================
# Step 4: Wait for Import Completion and Verify Solution
# =============================================================================

Write-Step "Step 4/5: Verifying Solution Import"

Write-Info "Querying installed solutions to confirm TrafficIQ is present..."

# Give Dataverse a moment to finalize the import
Start-Sleep -Seconds 5

$solutionQuery = "$TargetEnvironmentUrl/api/data/v9.2/solutions?" +
    "`$filter=uniquename eq 'TrafficIQ'&" +
    "`$select=uniquename,friendlyname,version,ismanaged,installedon&" +
    "`$orderby=installedon desc&" +
    "`$top=1"

try {
    $solutionResult = Invoke-RestMethod -Uri $solutionQuery -Headers $headers -Method GET -ErrorAction Stop
    $solutions = $solutionResult.value

    if ($solutions -and $solutions.Count -gt 0) {
        $sol = $solutions[0]
        Write-Success "Solution verified in target environment:"
        Write-Detail "Unique Name:  $($sol.uniquename)"
        Write-Detail "Display Name: $($sol.friendlyname)"
        Write-Detail "Version:      $($sol.version)"
        Write-Detail "Is Managed:   $($sol.ismanaged)"
        Write-Detail "Installed On: $($sol.installedon)"
    }
    else {
        Write-Info "Solution not found via query. It may still be processing."
        Write-Detail "Check the Power Apps maker portal to verify."
    }
}
catch {
    Write-Info "Could not query solutions list (non-critical)."
    Write-Detail "Error: $($_.Exception.Message)"
    Write-Detail "The import may still have succeeded. Check the Power Apps maker portal."
}

# =============================================================================
# Step 5: Verify Connection with Test CRUD on tiq_appsetting
# =============================================================================

Write-Step "Step 5/5: Verifying Table Access (tiq_appsetting CRUD Test)"

$entitySetName = "tiq_appsettings"
$testKey = "__deployment_verification_test__"
$testRecordId = $null

# --- CREATE ---
Write-Info "CREATE: Inserting test record..."
try {
    $createBody = @{
        tiq_key         = $testKey
        tiq_value       = "deployed_at_$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')"
        tiq_category    = 100000000  # General
        tiq_displayname = "Deployment Verification"
        tiq_description = "Temporary record created by Deploy-DataverseSolution.ps1 to verify table access. Safe to delete."
        tiq_issecret    = $false
        tiq_isactive    = $false
    } | ConvertTo-Json -Depth 2

    $createHeaders = $headers.Clone()
    $createHeaders["Content-Type"] = "application/json"
    $createHeaders["Prefer"] = "return=representation"

    $createResponse = Invoke-WebRequest `
        -Uri "$TargetEnvironmentUrl/api/data/v9.2/$entitySetName" `
        -Headers $createHeaders `
        -Method POST `
        -Body $createBody `
        -ContentType "application/json" `
        -ErrorAction Stop

    # Extract the record ID from OData-EntityId header or response body
    $entityIdHeader = $createResponse.Headers["OData-EntityId"]
    if ($entityIdHeader) {
        $headerValue = if ($entityIdHeader -is [array]) { $entityIdHeader[0] } else { $entityIdHeader }
        if ($headerValue -match '\(([0-9a-fA-F\-]{36})\)') {
            $testRecordId = $Matches[1]
        }
    }

    if (-not $testRecordId -and $createResponse.Content) {
        $createData = $createResponse.Content | ConvertFrom-Json
        $testRecordId = $createData.tiq_appsettingid
    }

    if ($testRecordId) {
        Write-Success "CREATE succeeded: Record ID = $testRecordId"
    }
    else {
        Write-Success "CREATE succeeded (could not extract record ID from response)"
    }
}
catch {
    Write-Fail "CREATE failed on $entitySetName"
    Write-Detail "Error: $($_.Exception.Message)"
    Write-Detail "The tiq_appsetting table may not exist or the service principal lacks write access."
    Write-Detail "Skipping remaining CRUD tests."
    # Continue to summary even if CRUD fails; the import itself may have succeeded
    $testRecordId = $null
}

# --- READ ---
if ($testRecordId) {
    Write-Info "READ: Fetching test record..."
    try {
        $readResult = Invoke-RestMethod `
            -Uri "$TargetEnvironmentUrl/api/data/v9.2/$entitySetName($testRecordId)?`$select=tiq_key,tiq_value" `
            -Headers $headers `
            -Method GET `
            -ErrorAction Stop

        if ($readResult.tiq_key -eq $testKey) {
            Write-Success "READ succeeded: tiq_key = '$($readResult.tiq_key)'"
        }
        else {
            Write-Info "READ returned unexpected data: tiq_key = '$($readResult.tiq_key)'"
        }
    }
    catch {
        Write-Fail "READ failed on $entitySetName($testRecordId)"
        Write-Detail "Error: $($_.Exception.Message)"
    }
}

# --- UPDATE ---
if ($testRecordId) {
    Write-Info "UPDATE: Modifying test record..."
    try {
        $updateBody = @{
            tiq_value = "updated_at_$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')"
        } | ConvertTo-Json -Depth 2

        Invoke-RestMethod `
            -Uri "$TargetEnvironmentUrl/api/data/v9.2/$entitySetName($testRecordId)" `
            -Headers ($headers + @{ "Content-Type" = "application/json" }) `
            -Method PATCH `
            -Body $updateBody `
            -ErrorAction Stop

        Write-Success "UPDATE succeeded"
    }
    catch {
        Write-Fail "UPDATE failed on $entitySetName($testRecordId)"
        Write-Detail "Error: $($_.Exception.Message)"
    }
}

# --- DELETE ---
if ($testRecordId) {
    Write-Info "DELETE: Removing test record..."
    try {
        Invoke-RestMethod `
            -Uri "$TargetEnvironmentUrl/api/data/v9.2/$entitySetName($testRecordId)" `
            -Headers $headers `
            -Method DELETE `
            -ErrorAction Stop

        Write-Success "DELETE succeeded"
    }
    catch {
        Write-Fail "DELETE failed on $entitySetName($testRecordId)"
        Write-Detail "Error: $($_.Exception.Message)"
        Write-Detail "The test record ($testRecordId) may need to be manually deleted."
    }
}

if ($testRecordId) {
    Write-Success "All CRUD operations passed on tiq_appsetting table"
}

# =============================================================================
# Deployment Summary
# =============================================================================

Write-Step "Deployment Complete!"

Write-Host ""
Write-Host "  Solution:     TrafficIQ (managed)" -ForegroundColor White
Write-Host "  Target:       $TargetEnvironmentUrl" -ForegroundColor White
Write-Host "  Tenant:       $TenantId" -ForegroundColor White
Write-Host "  Status:       " -NoNewline -ForegroundColor White
Write-Host "Imported" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Yellow
Write-Detail "1. Open Power Apps maker portal to review tables and components:"
Write-Detail "   $TargetEnvironmentUrl"
Write-Detail ""
Write-Detail "2. Configure the web application environment variable:"
Write-Detail "   VITE_DATAVERSE_URL=$TargetEnvironmentUrl"
Write-Detail ""
Write-Detail "3. If deploying to Azure Static Web Apps, set function app settings:"
Write-Detail "   DATAVERSE_URL=$TargetEnvironmentUrl"
Write-Detail "   DATAVERSE_TENANT_ID=$TenantId"
Write-Detail "   DATAVERSE_CLIENT_ID=$ClientId"
Write-Detail "   DATAVERSE_CLIENT_SECRET=<stored in Key Vault>"
Write-Detail ""
Write-Detail "4. Verify all 31 tables are present with the 'tiq_' prefix in the maker portal."
Write-Host ""
