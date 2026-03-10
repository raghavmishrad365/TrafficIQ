import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

// =============================================================================
// Dataverse Proxy Azure Function
//
// Proxies /api/dataverse/{*path} → Dataverse Web API v9.2
// Uses OAuth2 client credentials flow (app registration + client secret)
// so the browser never sees secrets.
//
// Required app settings (set by deploy-azure.ps1):
//   DATAVERSE_URL, DATAVERSE_TENANT_ID, DATAVERSE_CLIENT_ID, DATAVERSE_CLIENT_SECRET
// =============================================================================

let cachedToken: { value: string; expiresAt: number } | null = null;

function getEnv() {
  return {
    dataverseUrl: (process.env.DATAVERSE_URL || "").replace(/\/$/, ""),
    tenantId: process.env.DATAVERSE_TENANT_ID || "",
    clientId: process.env.DATAVERSE_CLIENT_ID || "",
    clientSecret: process.env.DATAVERSE_CLIENT_SECRET || "",
  };
}

async function acquireToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const { dataverseUrl, tenantId, clientId, clientSecret } = getEnv();
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing DATAVERSE_TENANT_ID, DATAVERSE_CLIENT_ID, or DATAVERSE_CLIENT_SECRET"
    );
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: `${dataverseUrl}/.default`,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Token acquisition failed (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.value;
}

async function dataverseHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const dvPath = req.params.path;
  if (!dvPath) {
    return { status: 400, jsonBody: { error: "Missing path parameter" } };
  }

  const { dataverseUrl } = getEnv();
  if (!dataverseUrl) {
    return { status: 503, jsonBody: { error: "Dataverse not configured" } };
  }

  // Preserve query string
  const queryString = req.url.includes("?")
    ? req.url.substring(req.url.indexOf("?"))
    : "";
  const targetUrl = `${dataverseUrl}/api/data/v9.2/${dvPath}${queryString}`;

  try {
    const token = await acquireToken();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      Accept: "application/json",
    };

    // Forward request body for POST/PATCH
    let bodyData: string | undefined;
    if (req.method === "POST" || req.method === "PATCH") {
      bodyData = await req.text();
      if (bodyData) {
        headers["Content-Type"] = "application/json";
      }
    }

    // Forward Prefer header (for return=representation)
    const prefer = req.headers.get("prefer");
    if (prefer) {
      headers["Prefer"] = prefer;
    }

    context.log(`[dataverse-proxy] ${req.method} ${dvPath}`);

    const dvRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: bodyData || undefined,
    });

    // Build response headers
    const resHeaders: Record<string, string> = {};
    const contentType = dvRes.headers.get("content-type");
    if (contentType) resHeaders["Content-Type"] = contentType;

    const entityId = dvRes.headers.get("OData-EntityId");
    if (entityId) resHeaders["OData-EntityId"] = entityId;

    if (dvRes.status === 204) {
      return { status: 204, headers: resHeaders };
    }

    const responseText = await dvRes.text();
    return {
      status: dvRes.status,
      headers: resHeaders,
      body: responseText,
    };
  } catch (err) {
    context.error("[dataverse-proxy] Error:", err);
    return {
      status: 502,
      jsonBody: {
        error: err instanceof Error ? err.message : "Proxy error",
      },
    };
  }
}

app.http("dataverse", {
  methods: ["GET", "POST", "PATCH", "DELETE"],
  authLevel: "anonymous",
  route: "dataverse/{*path}",
  handler: dataverseHandler,
});
