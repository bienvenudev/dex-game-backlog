// Steam's public CDN serves art per app id. Promotional artwork: fine for a training project,
// not for a shipped product. The backend only stores the resulting URLs, never the app id.
const CDN = "https://cdn.cloudflare.steamstatic.com/steam/apps";

export const steamCoverUrl = (appId: string) => `${CDN}/${appId}/library_600x900.jpg`;
export const steamHeroUrl = (appId: string) => `${CDN}/${appId}/library_hero.jpg`;

// Recovers the app id from a stored URL so the Edit form can show it again. null for non-Steam URLs.
export function parseSteamAppId(url: string | null): string {
  return url?.match(/\/steam\/apps\/(\d+)\//)?.[1] ?? "";
}
