import { postMemberTokenRefresh } from "@/lib/authApi";
import { useAuthStore } from "@/stores/authStore";

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Calls POST v1/auth/token/refresh/ using stored refresh token
 * (or HTTP-only cookie fallback when token is absent).
 * On 401 from that endpoint, clears the session (both tokens invalid).
 * Single-flights concurrent refresh attempts.
 */
export async function refreshMemberSessionOrLogout(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const refresh = useAuthStore.getState().refreshToken?.trim() ?? null;
        const result = await postMemberTokenRefresh(refresh);
        if (!result.ok) {
          if (result.status === 401) {
            useAuthStore.getState().logout();
          }
          return false;
        }
        useAuthStore
          .getState()
          .setTokensFromRefresh(result.access_token, result.refresh_token);
        return true;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

/**
 * Authenticated `fetch` with one retry after a successful token refresh.
 * If the response is still 401, logs out (session cannot be recovered).
 * For `FormData` bodies, does not set `Content-Type` (browser sets multipart boundary).
 */
export async function memberFetchWithAuthRetry(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  const buildHeaders = (): Headers => {
    const h = new Headers(init.headers ?? undefined);
    if (isFormData) {
      h.delete("Content-Type");
    } else if (!h.has("Content-Type")) {
      h.set("Content-Type", "application/json");
    }
    const token = useAuthStore.getState().accessToken;
    if (token) h.set("Authorization", `Bearer ${token}`);
    return h;
  };

  const run = () =>
    fetch(url, {
      ...init,
      headers: buildHeaders(),
    });

  let res = await run();
  if (res.status === 401) {
    const refreshed = await refreshMemberSessionOrLogout();
    if (refreshed) {
      res = await run();
    }
  }
  if (res.status === 401) {
    useAuthStore.getState().logout();
  }
  return res;
}
