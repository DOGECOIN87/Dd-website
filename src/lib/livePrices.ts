import { useEffect, useState } from 'react';
import { daiquiriSizes, type MenuItem } from '../data/menu';

/** Same shape as `PriceInfo` from api/menu-prices.ts. */
export interface LivePrice {
  name: string;
  price: number | null;
  sizes: { name: string; price: number }[];
}

let request: Promise<Record<string, LivePrice> | null> | undefined;

/** Fetches live Toast prices once per page load. Resolves to null when the API isn't configured or reachable. */
function loadLivePrices() {
  request ??= fetch('/api/menu-prices')
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { items?: Record<string, LivePrice> } | null) => data?.items ?? null)
    .catch(() => null);
  return request;
}

export function useLivePrices() {
  const [prices, setPrices] = useState<Record<string, LivePrice> | null>(null);
  useEffect(() => {
    let alive = true;
    loadLivePrices().then((result) => { if (alive) setPrices(result); });
    return () => { alive = false; };
  }, []);
  return prices;
}

/** The Toast item GUID at the end of an item's order-link path. */
export const toastGuid = (itemPath: string) => itemPath.slice(itemPath.lastIndexOf('_') + 1);

const money = (n: number) => `$${n.toFixed(2)}`;

/**
 * The price to show on a menu card: live Toast data when available, otherwise the
 * published prices in src/data/menu.ts. `detail` lists every size for a tooltip.
 */
export function priceFor(item: MenuItem, live: Record<string, LivePrice> | null): { label: string; detail?: string } {
  const entry = live?.[toastGuid(item.itemPath)];
  if (entry) {
    if (entry.price !== null) return { label: money(entry.price) };
    if (entry.sizes.length) {
      const min = Math.min(...entry.sizes.map((s) => s.price));
      return {
        label: entry.sizes.length > 1 ? `From ${money(min)}` : money(min),
        detail: entry.sizes.map((s) => `${s.name} ${money(s.price)}`).join(' · '),
      };
    }
  }
  if (item.price === 'Daiquiri sizes') {
    return {
      label: `From ${daiquiriSizes[0][1]}`,
      detail: daiquiriSizes.map(([size, price]) => `${size} ${price}`).join(' · '),
    };
  }
  return { label: item.price };
}
