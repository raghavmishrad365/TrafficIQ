import type { Plugin } from "vite";

/**
 * Vite plugin that proxies Dataverse Web API requests through the dev server.
 * Uses OAuth2 client credentials flow (app registration + client secret)
 * so the browser never sees the secret and no popup is needed.
 *
 * Intercepts:  /api/dataverse/{entitySetName}...
 * Proxies to:  {DATAVERSE_URL}/api/data/v9.2/{entitySetName}...
 */
export function dataverseProxy(): Plugin {
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
    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
      return cachedToken.value;
    }

    const { dataverseUrl, tenantId, clientId, clientSecret } = getEnv();
    if (!tenantId || !clientId || !clientSecret) {
      throw new Error(
        "Missing DATAVERSE_TENANT_ID, DATAVERSE_CLIENT_ID, or DATAVERSE_CLIENT_SECRET in .env"
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

  return {
    name: "vite-dataverse-proxy",
    configureServer(server) {
      // Handle all /api/dataverse/* requests
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith("/api/dataverse/")) {
          return next();
        }

        const { dataverseUrl } = getEnv();
        if (!dataverseUrl) {
          res.statusCode = 503;
          res.end(JSON.stringify({ error: "Dataverse not configured" }));
          return;
        }

        // Map /api/dataverse/{path} → {DATAVERSE_URL}/api/data/v9.2/{path}
        const dvPath = req.url.replace("/api/dataverse/", "");
        const targetUrl = `${dataverseUrl}/api/data/v9.2/${dvPath}`;

        try {
          const token = await acquireToken();

          // Read request body (for POST/PATCH)
          let bodyData: string | undefined;
          if (req.method === "POST" || req.method === "PATCH") {
            bodyData = await new Promise<string>((resolve, reject) => {
              const chunks: Buffer[] = [];
              req.on("data", (chunk: Buffer) => chunks.push(chunk));
              req.on("end", () => resolve(Buffer.concat(chunks).toString()));
              req.on("error", reject);
            });
          }

          const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`,
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            Accept: "application/json",
          };

          if (bodyData) {
            headers["Content-Type"] = "application/json";
          }

          // Forward Prefer header if present (for return=representation)
          if (req.headers.prefer) {
            headers["Prefer"] = Array.isArray(req.headers.prefer)
              ? req.headers.prefer.join(", ")
              : req.headers.prefer;
          }

          const dvRes = await fetch(targetUrl, {
            method: req.method || "GET",
            headers,
            body: bodyData || undefined,
          });

          // Forward status and relevant headers
          res.statusCode = dvRes.status;

          const contentType = dvRes.headers.get("content-type");
          if (contentType) res.setHeader("Content-Type", contentType);

          const entityId = dvRes.headers.get("OData-EntityId");
          if (entityId) res.setHeader("OData-EntityId", entityId);

          if (dvRes.status === 204) {
            res.end();
          } else {
            const responseText = await dvRes.text();
            res.end(responseText);
          }
        } catch (err) {
          console.error("[dataverse-proxy] Error:", err);
          res.statusCode = 502;
          res.end(
            JSON.stringify({
              error: err instanceof Error ? err.message : "Proxy error",
            })
          );
        }
      });
    },
  };
}
