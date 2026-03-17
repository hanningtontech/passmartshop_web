export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  // Prefer backend callback when VITE_API_URL is set (production). Fallback to current origin for local dev.
  const backendBase = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.length > 0 ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : window.location.origin;
  const redirectUri = `${backendBase}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
