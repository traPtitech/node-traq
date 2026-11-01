import { mergeConfig } from "axios";
import type { AxiosInstance, AxiosRequestConfig, HeadersDefaults } from "axios";

type RequestHeaders = AxiosRequestConfig["headers"];

const defaultHeaderNames = new Set<string>([
  "common", "delete", "get", "head", "post", "put", "patch", "options",
  "purge", "link", "unlink", "query",
] satisfies (keyof HeadersDefaults)[]);

function isClassHeaderDefaults(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;

  try {
    const prototype = Object.getPrototypeOf(value);
    // Leave plain maps, AxiosHeaders and literal Date/Buffer/array values to Axios.
    return prototype !== null && prototype !== Object.prototype &&
      Object.prototype.toString.call(value) === "[object Object]";
  } catch {
    return false;
  }
}

function normalizeHeaderDefaults(headers: RequestHeaders, defaults: RequestHeaders): RequestHeaders {
  if (!headers) return headers;

  let normalized: Record<string, unknown> | undefined;
  for (const [name, value] of Object.entries(headers)) {
    if (defaultHeaderNames.has(name.toLowerCase()) && isClassHeaderDefaults(value)) {
      normalized ??= { ...headers };
      const previous = Object.entries(defaults ?? {}).find(([key]) =>
        key.toLowerCase() === name.toLowerCase()
      )?.[1];
      // Axios merges defaults once more in request(). Clear fields replaced by a class bucket.
      const cleared = previous && typeof previous === "object"
        ? Object.fromEntries(Object.keys(previous).map(key => [key, undefined]))
        : {};
      normalized[name] = { ...cleared, ...value };
    }
  }
  return normalized ? normalized as RequestHeaders : headers;
}

function hasClassHeaderDefaults(headers: RequestHeaders): boolean {
  return !!headers && Object.entries(headers).some(([name, value]) =>
    defaultHeaderNames.has(name.toLowerCase()) && isClassHeaderDefaults(value)
  );
}

export function normalizeAxiosRequestHeaders(
  axios: AxiosInstance,
  headers: RequestHeaders,
): RequestHeaders {
  // Axios accepts its defaults here, although request types narrow method maps to AxiosHeaders.
  const defaults = axios.defaults.headers as RequestHeaders;
  if (!hasClassHeaderDefaults(defaults) && !hasClassHeaderDefaults(headers)) return headers;

  // Merge first: a request class bucket replaces its instance bucket in Axios 1.20.
  // Converting both before merging would retain overridden headers, including credentials.
  const merged = mergeConfig({ headers: defaults }, { headers }).headers;
  return normalizeHeaderDefaults(merged, defaults);
}
