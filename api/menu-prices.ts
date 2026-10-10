/**
 * GET /api/menu-prices: live item prices from the shop's Toast menu.
 *
 * Runs as a Vercel function. It needs Toast Standard API access (read-only) credentials
 * in the project's environment variables:
 *   TOAST_CLIENT_ID, TOAST_CLIENT_SECRET, TOAST_RESTAURANT_GUID
 *   TOAST_API_HOST (optional, defaults to https://ws-api.toasttab.com)
 * The secrets never reach the browser: the response only carries item names and prices,
 * keyed by Toast item GUID (the same GUIDs used in the site's Toast order links).
 * Responses are cached at Vercel's edge for 15 minutes, so Toast is called rarely.
 */

export interface PriceInfo {
  name: string;
  /** Base price, or null when the item is priced by size. */
  price: number | null;
  /** Size options and their prices, for size-priced items such as daiquiris. */
  sizes: { name: string; price: number }[];
}

export interface PricesResponse {
  updatedAt: string | null;
  items: Record<string, PriceInfo>;
}

interface ToastOption { guid?: string; name?: string; price?: number | null }
interface ToastModifierGroup { guid?: string; name?: string; modifierOptionReferences?: number[] }
interface ToastItem {
  guid?: string;
  name?: string;
  price?: number | null;
  pricingStrategy?: string;
  pricingRules?: { sizeSpecificPricingGuid?: string | null } | null;
  modifierGroupReferences?: number[];
}
interface ToastMenuGroup { menuItems?: ToastItem[]; menuGroups?: ToastMenuGroup[] }
interface ToastMenusResponse {
  lastUpdated?: string;
  menus?: { name?: string; menuGroups?: ToastMenuGroup[] }[];
  modifierGroupReferences?: Record<string, ToastModifierGroup>;
  modifierOptionReferences?: Record<string, ToastOption>;
}

/** Flattens a Toast menus v2 response into { itemGuid: price info }. */
export function extractPrices(data: ToastMenusResponse): PricesResponse {
  const groups = data.modifierGroupReferences ?? {};
  const options = data.modifierOptionReferences ?? {};
  const items: Record<string, PriceInfo> = {};
  const visit = (group: ToastMenuGroup) => {
    for (const item of group.menuItems ?? []) {
      if (!item.guid || items[item.guid]) continue;
      const refs = (item.modifierGroupReferences ?? [])
        .map((id) => groups[String(id)])
        .filter((g): g is ToastModifierGroup => Boolean(g));
      // Size-priced items keep their prices on the options of the size modifier group.
      const sizeGuid = item.pricingRules?.sizeSpecificPricingGuid;
      const sizeGroup = item.pricingStrategy === 'SIZE_PRICE'
        ? refs.find((g) => sizeGuid && g.guid === sizeGuid) ?? refs.find((g) => /size/i.test(g.name ?? ''))
        : undefined;
      const sizes = (sizeGroup?.modifierOptionReferences ?? [])
        .map((id) => options[String(id)])
        .filter((o): o is ToastOption & { price: number } => typeof o?.price === 'number')
        .map((o) => ({ name: o.name ?? '', price: o.price }));
      items[item.guid] = { name: item.name ?? '', price: typeof item.price === 'number' ? item.price : null, sizes };
    }
    (group.menuGroups ?? []).forEach(visit);
  };
  for (const menu of data.menus ?? []) (menu.menuGroups ?? []).forEach(visit);
  return { updatedAt: data.lastUpdated ?? null, items };
}

let session: { token: string; expires: number } | null = null;

async function accessToken(host: string, clientId: string, clientSecret: string) {
  if (session && session.expires > Date.now() + 60_000) return session.token;
  const res = await fetch(`${host}/authentication/v1/authentication/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret, userAccessType: 'TOAST_MACHINE_CLIENT' }),
  });
  if (!res.ok) throw new Error(`Toast login failed with HTTP ${res.status}`);
  const body = (await res.json()) as { token?: { accessToken?: string; expiresIn?: number } };
  const token = body.token?.accessToken;
  if (!token) throw new Error('Toast login returned no access token');
  session = { token, expires: Date.now() + (body.token?.expiresIn ?? 3600) * 1000 };
  return token;
}

const json = (body: unknown, status: number, cache: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache },
  });

export async function GET(): Promise<Response> {
  const clientId = process.env.TOAST_CLIENT_ID;
  const clientSecret = process.env.TOAST_CLIENT_SECRET;
  const restaurant = process.env.TOAST_RESTAURANT_GUID;
  const host = (process.env.TOAST_API_HOST || 'https://ws-api.toasttab.com').replace(/\/+$/, '');
  if (!clientId || !clientSecret || !restaurant) return json({ error: 'not-configured' }, 503, 'no-store');

  const menus = async () => fetch(`${host}/menus/v2/menus`, {
    headers: { Authorization: `Bearer ${await accessToken(host, clientId, clientSecret)}`, 'Toast-Restaurant-External-ID': restaurant },
  });
  try {
    let res = await menus();
    if (res.status === 401) {
      session = null; // token revoked or expired early: log in again once
      res = await menus();
    }
    if (!res.ok) throw new Error(`Toast menus request failed with HTTP ${res.status}`);
    const prices = extractPrices((await res.json()) as ToastMenusResponse);
    return json(prices, 200, 'public, max-age=300, s-maxage=900, stale-while-revalidate=86400');
  } catch (error) {
    console.error('menu-prices:', error);
    return json({ error: 'unavailable' }, 502, 'public, s-maxage=60');
  }
}
