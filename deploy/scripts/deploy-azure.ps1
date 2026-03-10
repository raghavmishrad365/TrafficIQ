# =============================================================================
# TrafficIQ — Full Azure Deployment Script
#
# Fully automated deployment that provisions ALL Azure resources, configures
# secrets, deploys the Dataverse solution, builds the app, and deploys to
# Azure Static Web Apps.
#
# Resources deployed:
#   1. Resource Group
#   2. Azure Key Vault (secret store)
#   3. Azure AI Services (Foundry Agent + OpenAI)
#   4. AI Foundry Hub + Project
#   5. GPT-4.1 + GPT-4.1-mini Model Deployments
#   6. Azure Maps Account
#   7. Entra ID App Registration (Dataverse auth)
#   8. Azure Static Web App (SPA + Functions API)
#   9. Dataverse Solution Import (OAuth2 client credentials)
#
# Prerequisites: Azure CLI (az), Node.js 20+
# Usage: .\deploy\scripts\deploy-azure.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

# --- Default Configuration ---
$defaultLocation = "northeurope"
$defaultPrefix = "trafficiq"
$projectRoot = Join-Path $PSScriptRoot ".." ".."

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

# =============================================================================
# PHASE 1: Prerequisites & Authentication
# =============================================================================

Write-Step "Phase 1: Checking Prerequisites"

# Check Azure CLI
try {
    $azVersion = az version --output json 2>$null | ConvertFrom-Json
    Write-Success "Azure CLI found (v$($azVersion.'azure-cli'))"
} catch {
    Write-Fail "Azure CLI not found. Install from https://aka.ms/installazurecli"
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Success "Node.js found ($nodeVersion)"
} catch {
    Write-Fail "Node.js not found. Install from https://nodejs.org"
    exit 1
}

# Check/install SWA CLI
$swaAvailable = $false
try {
    $swaVersion = swa --version 2>$null
    if ($swaVersion) {
        Write-Success "SWA CLI found ($swaVersion)"
        $swaAvailable = $true
    }
} catch {}

if (-not $swaAvailable) {
    Write-Info "Installing Azure Static Web Apps CLI..."
    npm install -g @azure/static-web-apps-cli 2>$null
    $swaAvailable = $true
    Write-Success "SWA CLI installed"
}

# Install az ml extension (for AI Foundry)
Write-Info "Ensuring Azure ML extension is installed..."
az extension add --name ml --yes 2>$null
Write-Success "Azure ML extension ready"

# --- Azure Login ---
Write-Step "Azure Authentication"

Write-Info "Logging in to Azure..."
az login --output none 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Fail "Azure login failed"
    exit 1
}

$account = az account show --output json 2>$null | ConvertFrom-Json
Write-Success "Logged in as: $($account.user.name)"
Write-Success "Tenant: $($account.tenantId)"

# --- Select Subscription ---
Write-Step "Select Azure Subscription"

$subscriptions = az account list --output json 2>$null | ConvertFrom-Json

if ($subscriptions.Count -eq 0) {
    Write-Fail "No Azure subscriptions found"
    exit 1
}

Write-Host ""
Write-Host "  Available subscriptions:" -ForegroundColor White
for ($i = 0; $i -lt $subscriptions.Count; $i++) {
    $sub = $subscriptions[$i]
    $current = if ($sub.isDefault) { " (current)" } else { "" }
    Write-Host "    [$($i + 1)] $($sub.name) ($($sub.id))$current" -ForegroundColor Gray
}

Write-Host ""
$selection = Read-Host "  Select subscription number [1-$($subscriptions.Count)]"
$selectedIndex = [int]$selection - 1

if ($selectedIndex -lt 0 -or $selectedIndex -ge $subscriptions.Count) {
    Write-Fail "Invalid selection"
    exit 1
}

$selectedSub = $subscriptions[$selectedIndex]
az account set --subscription $selectedSub.id
Write-Success "Using subscription: $($selectedSub.name)"

$tenantId = $selectedSub.tenantId

# --- Resource Group ---
Write-Step "Resource Group Setup"

$rgChoice = Read-Host "  Create [N]ew resource group or use [E]xisting? (N/E)"

if ($rgChoice -eq "E" -or $rgChoice -eq "e") {
    $groups = az group list --output json 2>$null | ConvertFrom-Json
    Write-Host ""
    for ($i = 0; $i -lt $groups.Count; $i++) {
        Write-Host "    [$($i + 1)] $($groups[$i].name) ($($groups[$i].location))" -ForegroundColor Gray
    }
    Write-Host ""
    $rgSel = Read-Host "  Select resource group number"
    $rgIndex = [int]$rgSel - 1
    $resourceGroup = $groups[$rgIndex].name
    $location = $groups[$rgIndex].location
    Write-Success "Using existing resource group: $resourceGroup ($location)"
} else {
    $resourceGroup = Read-Host "  Resource group name (default: ${defaultPrefix}-rg)"
    if (-not $resourceGroup) { $resourceGroup = "${defaultPrefix}-rg" }

    $location = Read-Host "  Location (default: $defaultLocation)"
    if (-not $location) { $location = $defaultLocation }

    Write-Info "Creating resource group '$resourceGroup' in '$location'..."
    az group create --name $resourceGroup --location $location --output none
    Write-Success "Resource group created: $resourceGroup"
}

# Naming prefix
$prefix = Read-Host "  Resource naming prefix (default: $defaultPrefix)"
if (-not $prefix) { $prefix = $defaultPrefix }

$kvName         = "$prefix-kv"
$aiServicesName = "$prefix-ai"
$aiHubName      = "$prefix-hub"
$aiProjectName  = "$prefix-project"
$mapsName       = "$prefix-maps"
$appRegName     = "$prefix-app"
$swaName        = "$prefix-web"

# =============================================================================
# PHASE 2: Provision Azure Resources
# =============================================================================

# --- 2a: Azure Key Vault ---
Write-Step "Phase 2a: Azure Key Vault"

Write-Info "Creating Key Vault '$kvName'..."
az keyvault create `
    --name $kvName `
    --resource-group $resourceGroup `
    --location $location `
    --enable-rbac-authorization false `
    --output none 2>$null

$kvUri = (az keyvault show --name $kvName --resource-group $resourceGroup --query "properties.vaultUri" -o tsv 2>$null)
Write-Success "Key Vault created: $kvUri"

# --- 2b: Azure AI Services ---
Write-Step "Phase 2b: Azure AI Services"

Write-Info "Creating AI Services account '$aiServicesName' (kind: AIServices)..."
az cognitiveservices account create `
    --name $aiServicesName `
    --resource-group $resourceGroup `
    --location $location `
    --kind "AIServices" `
    --sku "S0" `
    --output none 2>$null

$aiEndpoint = (az cognitiveservices account show --name $aiServicesName --resource-group $resourceGroup --query "properties.endpoint" -o tsv 2>$null)
$aiKeys = az cognitiveservices account keys list --name $aiServicesName --resource-group $resourceGroup --output json 2>$null | ConvertFrom-Json
$aiKey = $aiKeys.key1

Write-Success "AI Services endpoint: $aiEndpoint"

# --- 2c: AI Foundry Hub + Project ---
Write-Step "Phase 2c: AI Foundry Hub + Project"

Write-Info "Creating AI Foundry Hub '$aiHubName'..."
az ml workspace create `
    --name $aiHubName `
    --resource-group $resourceGroup `
    --location $location `
    --kind hub `
    --output none 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Success "AI Foundry Hub created: $aiHubName"

    Write-Info "Creating AI Foundry Project '$aiProjectName'..."
    $hubId = (az ml workspace show --name $aiHubName --resource-group $resourceGroup --query "id" -o tsv 2>$null)

    az ml workspace create `
        --name $aiProjectName `
        --resource-group $resourceGroup `
        --location $location `
        --kind project `
        --hub-id $hubId `
        --output none 2>$null

    if ($LASTEXITCODE -eq 0) {
        Write-Success "AI Foundry Project created: $aiProjectName"
    } else {
        Write-Info "AI Foundry Project requires manual setup in AI Foundry portal"
    }
} else {
    Write-Info "AI Foundry Hub requires 'az ml' extension or manual setup at https://ai.azure.com"
}

$foundryEndpoint = "$($aiEndpoint -replace '/+$','')/api/projects/$aiProjectName"

# --- 2d: GPT-4.1 Model Deployments ---
Write-Step "Phase 2d: GPT-4.1 Model Deployments"

Write-Info "Creating GPT-4.1 deployment..."
az cognitiveservices account deployment create `
    --name $aiServicesName `
    --resource-group $resourceGroup `
    --deployment-name "gpt-4.1" `
    --model-name "gpt-4.1" `
    --model-version "2025-04-14" `
    --model-format "OpenAI" `
    --sku-capacity 10 `
    --sku-name "GlobalStandard" `
    --output none 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Success "GPT-4.1 deployment created"
} else {
    Write-Info "GPT-4.1 deployment may need manual creation (model availability varies by region)"
}

Write-Info "Creating GPT-4.1-mini deployment..."
az cognitiveservices account deployment create `
    --name $aiServicesName `
    --resource-group $resourceGroup `
    --deployment-name "gpt-4.1-mini" `
    --model-name "gpt-4.1-mini" `
    --model-version "2025-04-14" `
    --model-format "OpenAI" `
    --sku-capacity 10 `
    --sku-name "GlobalStandard" `
    --output none 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Success "GPT-4.1-mini deployment created"
} else {
    Write-Info "GPT-4.1-mini deployment may need manual creation"
}

# --- 2e: Azure Maps ---
Write-Step "Phase 2e: Azure Maps Account"

Write-Info "Creating Maps account '$mapsName'..."
az maps account create `
    --name $mapsName `
    --resource-group $resourceGroup `
    --sku "G2" `
    --kind "Gen2" `
    --output none 2>$null

$mapsKeys = az maps account keys list --name $mapsName --resource-group $resourceGroup --output json 2>$null | ConvertFrom-Json
$mapsKey = $mapsKeys.primaryKey

Write-Success "Azure Maps account created"

# --- 2f: Entra ID App Registration ---
Write-Step "Phase 2f: Entra ID App Registration"

Write-Info "Creating app registration '$appRegName'..."
$app = az ad app create `
    --display-name $appRegName `
    --sign-in-audience "AzureADMyOrg" `
    --output json 2>$null | ConvertFrom-Json

$appClientId = $app.appId

Write-Info "Creating client secret..."
$secret = az ad app credential reset `
    --id $app.id `
    --display-name "TrafficIQ-Deploy" `
    --years 2 `
    --output json 2>$null | ConvertFrom-Json

$clientSecret = $secret.password

az ad sp create --id $appClientId --output none 2>$null

Write-Success "App Registration created: $appClientId"

# --- 2g: Azure Static Web App ---
Write-Step "Phase 2g: Azure Static Web App"

Write-Info "Creating Static Web App '$swaName'..."
az staticwebapp create `
    --name $swaName `
    --resource-group $resourceGroup `
    --location $location `
    --sku "Standard" `
    --output none 2>$null

if ($LASTEXITCODE -eq 0) {
    $swaHostname = (az staticwebapp show --name $swaName --resource-group $resourceGroup --query "defaultHostname" -o tsv 2>$null)
    Write-Success "Static Web App created: https://$swaHostname"
} else {
    Write-Fail "Static Web App creation failed"
    exit 1
}

# Get deployment token for later
$swaSecrets = az staticwebapp secrets list --name $swaName --resource-group $resourceGroup --output json 2>$null | ConvertFrom-Json
$swaDeployToken = $swaSecrets.properties.apiKey

# =============================================================================
# PHASE 3: Configure Secrets
# =============================================================================

Write-Step "Phase 3: Configure Secrets"

# Prompt for additional values
Write-Host ""
Write-Host "  The following values are optional. Press Enter to skip." -ForegroundColor Gray
Write-Host ""

$dataverseUrl = Read-Host "  Dataverse Environment URL (e.g. https://yourorg.crm4.dynamics.com)"
$vapidPublicKey = Read-Host "  VAPID Public Key (generate with: npx web-push generate-vapid-keys)"
$emailFlowUrl = Read-Host "  Power Automate Email Flow URL"

# --- Seed Key Vault ---
Write-Info "Seeding secrets into Key Vault..."

$secrets = @{
    "agent-endpoint"          = $foundryEndpoint
    "agent-api-key"           = $aiKey
    "agent-model-deployment"  = "gpt-4.1-mini"
    "azure-openai-endpoint"   = $aiEndpoint
    "azure-openai-key"        = $aiKey
    "azure-openai-deployment" = "gpt-4.1"
    "azure-maps-key"          = $mapsKey
    "dataverse-tenant-id"     = $tenantId
    "dataverse-client-id"     = $appClientId
    "dataverse-client-secret" = $clientSecret
    "dataverse-url"           = $dataverseUrl
    "dataverse-browser-url"   = $dataverseUrl
    "vapid-public-key"        = $vapidPublicKey
    "email-flow-url"          = $emailFlowUrl
}

$seeded = 0
foreach ($kv in $secrets.GetEnumerator()) {
    if ($kv.Value) {
        az keyvault secret set `
            --vault-name $kvName `
            --name $kv.Key `
            --value $kv.Value `
            --output none 2>$null
        $seeded++
    }
}

Write-Success "Seeded $seeded secrets into Key Vault"

# --- Set SWA App Settings ---
Write-Info "Configuring Static Web App settings..."

$appSettings = @{
    "AZURE_KEY_VAULT_URL"           = $kvUri
    "VITE_AGENT_ENDPOINT"           = $foundryEndpoint
    "VITE_AGENT_API_KEY"            = $aiKey
    "VITE_AGENT_MODEL_DEPLOYMENT"   = "gpt-4.1-mini"
    "VITE_AZURE_OPENAI_ENDPOINT"    = $aiEndpoint
    "VITE_AZURE_OPENAI_KEY"         = $aiKey
    "VITE_AZURE_OPENAI_DEPLOYMENT"  = "gpt-4.1"
    "VITE_AZURE_TENANT_ID"          = $tenantId
    "VITE_AZURE_CLIENT_ID"          = $appClientId
    "VITE_AZURE_MAPS_KEY"           = $mapsKey
    "VITE_API_BASE_URL"             = ""
    "DATAVERSE_URL"                 = $dataverseUrl
    "DATAVERSE_TENANT_ID"           = $tenantId
    "DATAVERSE_CLIENT_ID"           = $appClientId
    "DATAVERSE_CLIENT_SECRET"       = $clientSecret
}

if ($dataverseUrl) {
    $appSettings["VITE_DATAVERSE_URL"] = $dataverseUrl
}
if ($vapidPublicKey) {
    $appSettings["VITE_VAPID_PUBLIC_KEY"] = $vapidPublicKey
}
if ($emailFlowUrl) {
    $appSettings["VITE_EMAIL_FLOW_URL"] = $emailFlowUrl
}

# Build the settings string for az CLI
$settingsArgs = ($appSettings.GetEnumerator() | Where-Object { $_.Value } | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join " "

if ($settingsArgs) {
    az staticwebapp appsettings set `
        --name $swaName `
        --resource-group $resourceGroup `
        --setting-names $settingsArgs `
        --output none 2>$null

    Write-Success "SWA app settings configured ($($appSettings.Count) settings)"
}

# --- Generate local .env file ---
Write-Info "Generating local .env file..."

$envContent = @"
# =============================================================================
# TrafficIQ — Generated by deploy-azure.ps1
# =============================================================================

# Azure Key Vault
AZURE_KEY_VAULT_URL=$kvUri

# Microsoft Foundry Agent
VITE_AGENT_ENDPOINT=$foundryEndpoint
VITE_AGENT_API_KEY=$aiKey
VITE_AGENT_MODEL_DEPLOYMENT=gpt-4.1-mini

# Azure OpenAI
VITE_AZURE_OPENAI_ENDPOINT=$aiEndpoint
VITE_AZURE_OPENAI_KEY=$aiKey
VITE_AZURE_OPENAI_DEPLOYMENT=gpt-4.1

# Entra ID Auth
VITE_AZURE_TENANT_ID=$tenantId
VITE_AZURE_CLIENT_ID=$appClientId

# Azure Maps
VITE_AZURE_MAPS_KEY=$mapsKey

# Push Notifications (VAPID)
VITE_VAPID_PUBLIC_KEY=$vapidPublicKey

# Email / Power Automate
VITE_EMAIL_FLOW_URL=$emailFlowUrl

# API Base URL (empty = relative /api path for SWA)
VITE_API_BASE_URL=

# Dataverse
VITE_DATAVERSE_URL=$dataverseUrl
DATAVERSE_URL=$dataverseUrl
DATAVERSE_TENANT_ID=$tenantId
DATAVERSE_CLIENT_ID=$appClientId
DATAVERSE_CLIENT_SECRET=$clientSecret
"@

$envPath = Join-Path $projectRoot ".env"
$envContent | Out-File -FilePath $envPath -Encoding utf8NoBOM
Write-Success "Generated .env file at: $envPath"

# =============================================================================
# PHASE 4: Deploy Dataverse Solution
# =============================================================================

Write-Step "Phase 4: Dataverse Solution"

if ($dataverseUrl) {
    $deployScript = Join-Path $projectRoot "deploy" "dataverse" "Deploy-DataverseSolution.ps1"

    if (-not (Test-Path $deployScript)) {
        Write-Fail "Deploy script not found at: $deployScript"
    } else {
        Write-Info "Calling Deploy-DataverseSolution.ps1..."
        try {
            & $deployScript `
                -TargetEnvironmentUrl $dataverseUrl `
                -TenantId $tenantId `
                -ClientId $appClientId `
                -ClientSecret $clientSecret

            Write-Success "Dataverse solution deployment completed"
        } catch {
            Write-Info "Dataverse solution deployment failed: $($_.Exception.Message)"
            Write-Info "You can retry manually:"
            Write-Info "  .\deploy\dataverse\Deploy-DataverseSolution.ps1 -TargetEnvironmentUrl $dataverseUrl -TenantId $tenantId -ClientId $appClientId -ClientSecret <secret>"
        }
    }
} else {
    Write-Info "No Dataverse URL provided — skipping solution deployment"
    Write-Info "To deploy later, run: .\deploy\dataverse\Deploy-DataverseSolution.ps1"
}

# =============================================================================
# PHASE 5: Build & Deploy Website
# =============================================================================

Write-Step "Phase 5: Build & Deploy Website"

# Install dependencies
Write-Info "Installing root npm dependencies..."
Push-Location $projectRoot
npm install 2>$null
Write-Success "Root dependencies installed"

# Build SPA
Write-Info "Building SPA (npm run build)..."
npm run build 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Success "SPA built successfully (dist/)"
} else {
    Write-Fail "SPA build failed"
    Pop-Location
    exit 1
}

# Build Azure Functions API
Write-Info "Installing API dependencies..."
Push-Location (Join-Path $projectRoot "deploy" "api")
npm install 2>$null
Write-Success "API dependencies installed"

Write-Info "Building Azure Functions API..."
npm run build 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Success "API built successfully (deploy/api/dist/)"
} else {
    Write-Fail "API build failed"
    Pop-Location
    Pop-Location
    exit 1
}
Pop-Location

# Deploy to Azure Static Web Apps
Write-Info "Deploying to Azure Static Web Apps..."

swa deploy `
    --app-location "." `
    --output-location "dist" `
    --api-location "deploy/api" `
    --deployment-token $swaDeployToken `
    --env "production" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Success "Deployed to Azure Static Web Apps!"
} else {
    Write-Info "SWA deploy may have encountered issues — check output above"
    Write-Info "You can manually deploy with: swa deploy --deployment-token <token>"
}

Pop-Location

# =============================================================================
# PHASE 6: Summary
# =============================================================================

Write-Step "Deployment Complete!"

Write-Host ""
Write-Host "  ===== Azure Resources =====" -ForegroundColor White
Write-Host "  Resource Group:       $resourceGroup ($location)" -ForegroundColor White
Write-Host "  Key Vault:            $kvUri" -ForegroundColor White
Write-Host "  AI Services:          $aiEndpoint" -ForegroundColor White
Write-Host "  AI Hub:               $aiHubName" -ForegroundColor White
Write-Host "  AI Project:           $aiProjectName" -ForegroundColor White
Write-Host "  Foundry Endpoint:     $foundryEndpoint" -ForegroundColor White
Write-Host "  Azure Maps:           $mapsName" -ForegroundColor White
Write-Host "  App Registration:     $appClientId" -ForegroundColor White
Write-Host "  Secrets in Vault:     $seeded" -ForegroundColor White
Write-Host ""
Write-Host "  ===== Website =====" -ForegroundColor White
Write-Host "  Static Web App:       $swaName" -ForegroundColor White
Write-Host "  Live URL:             https://$swaHostname" -ForegroundColor Green
Write-Host "  API Endpoint:         https://$swaHostname/api/dataverse/" -ForegroundColor White
Write-Host ""
Write-Host "  ===== Local Development =====" -ForegroundColor White
Write-Host "  .env file:            $envPath" -ForegroundColor White
Write-Host "  Dev server:           npm run dev" -ForegroundColor White
Write-Host "  SWA emulator:         swa start dist --api-location deploy/api" -ForegroundColor White
Write-Host ""
Write-Host "  ===== Next Steps =====" -ForegroundColor Yellow
Write-Host "    1. Open https://$swaHostname to verify the deployment" -ForegroundColor Gray
Write-Host "    2. Configure Dataverse URL in SWA app settings if not done" -ForegroundColor Gray
Write-Host "    3. Add Entra ID redirect URI: https://$swaHostname" -ForegroundColor Gray
Write-Host "    4. Grant Dataverse API permissions to app registration" -ForegroundColor Gray
Write-Host ""
