const CLIENT_TOKEN_KEY = "chamadas.clientToken";

/**
 * A random ID generated once per browser install and persisted in
 * localStorage. This is the primary device signal: unlike
 * fingerprinting, it doesn't change when the browser auto-updates, but it
 * IS reset if the user clears site data or switches browsers — that's an
 * accepted tradeoff (see project plan).
 */
export function getOrCreateClientToken(): string {
  let token = localStorage.getItem(CLIENT_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(CLIENT_TOKEN_KEY, token);
  }
  return token;
}

/**
 * A coarse fingerprint built only from signals that stay stable across
 * browser point-version updates (deliberately excludes things like
 * navigator.userAgent's version substring, timezone, or language, which
 * change on their own and would cause false positives). Used only as a
 * soft, secondary corroborating signal server-side — never for hard
 * matching, since many students share an identical device model.
 */
export async function computeFingerprintHash(): Promise<string> {
  const parts = [
    navigator.platform ?? "",
    String(navigator.hardwareConcurrency ?? ""),
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    getWebglRenderer(),
  ];
  const input = parts.join("|");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getWebglRenderer(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl")) as
      | WebGLRenderingContext
      | null;
    if (!gl) return "";
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    if (!info) return "";
    return String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
  } catch {
    return "";
  }
}
