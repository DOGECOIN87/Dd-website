/**
 * Business-wide settings. Edit here and every section of the site updates.
 */

export const TOAST_SLUG = 'daiquiri-depot-new-braunfels-311-farm-to-market-road-306-suite-1a';

export const toast = {
  /** Main Toast online-ordering page (pickup + delivery). */
  orderUrl: `https://order.toasttab.com/online/${TOAST_SLUG}`,
  giftCardUrl: `https://www.toasttab.com/${TOAST_SLUG}/giftcards`,
  /** Deep link that opens Toast straight to one item's size/add-on picker. */
  itemUrl: (itemPath: string) => `https://order.toasttab.com/online/${TOAST_SLUG}/${itemPath}`,
  /** Perks shown on the Toast ordering page (Toast Loyalty). */
  rewards: [
    { big: '1 pt', small: 'for every $1 spent' },
    { big: '2×', small: 'points on online pickup orders & every Tuesday' },
    { big: '$5 off', small: 'every 100 points' },
    { big: '25 pts', small: 'just for signing up, plus $5 off on your birthday' },
  ],
};

export const site = {
  name: 'Sip Society + Daiquiri Depot',
  shortName: 'Daiquiri Depot',
  city: 'New Braunfels, TX',
  phone: '(830) 632-5888',
  phoneHref: 'tel:+18306325888',
  email: 'daiquiridepotnb@yahoo.com',
  owner: 'Jordan Matt',
  socials: {
    facebook: 'https://www.facebook.com/thedaiquiridepot/',
    instagram: 'https://www.instagram.com/daiquiridepotnb/',
    yelp: 'https://www.yelp.com/biz/sip-society-daiquiri-depot-new-braunfels',
  },
  /** Public ratings — update occasionally (last checked Oct 2026). */
  ratings: {
    yelp: { score: 4.6, count: 22 },
    facebook: { recommend: '100%', count: 49 },
  },
  /** Yelp's "Popular Drinks" for this business. */
  fanFavorites: ['Cactus Juice', 'Southern Classic', 'Perfect Storm'],
};
