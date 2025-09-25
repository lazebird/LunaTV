/* eslint-disable @typescript-eslint/no-explicit-any */
// Lightweight typed fetch wrapper used across the app to centralize JSON fetch handling.
export async function fetchJson<T = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const resp = await fetch(input, init);
  if (!resp.ok) {
    // Try to parse error body, but ignore parse errors.
    try {
      const err: any = await resp.json();
      const message =
        err?.error || err?.message || resp.statusText || `HTTP ${resp.status}`;
      throw new Error(message);
    } catch (_e: any) {
      throw new Error(resp.statusText || `HTTP ${resp.status}`);
    }
  }
  return (await resp.json()) as T;
}
