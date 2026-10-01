/** Only allow same-site relative redirects, so `?redirect=` cannot send users elsewhere. */
export function safeRedirect(raw: string | null | undefined, fallback = "/account"): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}
