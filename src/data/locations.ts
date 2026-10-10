import { site, toast } from './site';

/** 24h "HH:MM". A close time at or before the open time runs past midnight. */
export type DayHours = { open: string; close: string } | null;
/** Index 0 = Sunday … 6 = Saturday. `null` = hours not published. */
export type WeeklyHours = [DayHours, DayHours, DayHours, DayHours, DayHours, DayHours, DayHours] | null;

export type LocationId = 'fm306' | 'gruene';

export interface Location {
  id: LocationId;
  name: string;
  nickname: string;
  area: string;
  tagline: string;
  bestFor: string;
  address: { street: string; city: string; region: string; zip: string };
  coords: { lat: number; lng: number };
  phone: string;
  phoneHref: string;
  hours: WeeklyHours;
  /** Shown when `hours` is null, or as a footnote under the hours table. */
  hoursNote?: string;
  features: string[];
  serves: string[];
  orderUrl?: string;
  links: { label: string; href: string }[];
  theme: 'sip' | 'yard';
}

const hours = (open: string, close: string): DayHours => ({ open, close });

export const locations: Location[] = [
  {
    id: 'fm306',
    name: 'Sip Society + Daiquiri Depot',
    nickname: 'The Depot',
    area: 'FM 306, just off I-35',
    tagline: 'The original drive-thru. Daiquiris to go plus a full coffee, boba and dirty soda bar.',
    bestFor: 'Grabbing drinks on the way to the river, the lake, or the couch.',
    address: { street: '311 FM 306, Suite 1A', city: 'New Braunfels', region: 'TX', zip: '78130' },
    coords: { lat: 29.73152, lng: -98.08365 },
    phone: site.phone,
    phoneHref: site.phoneHref,
    // From the shop's Instagram bio: Sun–Thu 9a–9p, Fri & Sat 9a–10p.
    hours: [
      hours('09:00', '21:00'),
      hours('09:00', '21:00'),
      hours('09:00', '21:00'),
      hours('09:00', '21:00'),
      hours('09:00', '21:00'),
      hours('09:00', '22:00'),
      hours('09:00', '22:00'),
    ],
    hoursNote: 'Holiday hours may vary. Online ordering follows the schedule set in Toast.',
    features: ['Drive-thru', 'Order ahead', 'Curbside pickup', 'Delivery', 'Coffee lounge'],
    serves: ['Frozen daiquiris', 'Coffee & espresso', 'Matcha', 'Boba', 'Dirty sodas', 'Smoothies', 'Mimosas & sangria'],
    orderUrl: toast.orderUrl,
    links: [
      { label: 'Facebook', href: site.socials.facebook },
      { label: 'Instagram', href: site.socials.instagram },
    ],
    theme: 'sip',
  },
  {
    id: 'gruene',
    name: 'The Backyard in Gruene',
    nickname: 'The Backyard',
    area: 'Gruene Historic District',
    tagline: 'A hidden turf-lawn hangout in Gruene. Grab a drink, catch live music, watch the game.',
    bestFor: 'Kicking back on the lawn after a day of shopping in Gruene.',
    address: { street: '1706 Hunter Rd', city: 'New Braunfels', region: 'TX', zip: '78130' },
    coords: { lat: 29.73987, lng: -98.10255 },
    phone: site.phone,
    phoneHref: site.phoneHref,
    hours: null,
    hoursNote: 'Hours change with live music and events. Check Facebook or give us a call.',
    features: ['Turf lawn', 'Live music', 'Games on big screens', 'Stay & hang out'],
    serves: ['Frozen daiquiris', 'Beer', 'Wine', 'Dirty sodas', 'Small bites & treats'],
    links: [{ label: 'Facebook', href: 'https://www.facebook.com/p/The-Backyard-in-Gruene-61581658604585/' }],
    theme: 'yard',
  },
];

export const byId = (id: LocationId) => locations.find((l) => l.id === id)!;

export const fullAddress = (l: Location) =>
  `${l.address.street}, ${l.address.city}, ${l.address.region} ${l.address.zip}`;

export const directionsUrl = (l: Location) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress(l))}`;

export const mapEmbedUrl = (l: Location) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress(l))}&z=15&output=embed`;
