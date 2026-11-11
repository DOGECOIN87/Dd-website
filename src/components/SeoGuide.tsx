const guideLinks = [
  {
    href: '/frozen-daiquiris-new-braunfels/',
    title: 'Frozen Daiquiris To Go',
    detail: 'Sizes, prices and fan favorites — Cactus Juice, Southern Classic, Perfect Storm.',
  },
  {
    href: '/river-jug-daiquiris/',
    title: 'River Jug Daiquiris',
    detail: 'The reusable jug made for float days on the Guadalupe and the Comal. $18 filled, $12 refills.',
  },
  {
    href: '/boba-tea-new-braunfels/',
    title: 'Boba Tea',
    detail: 'Milk teas with chewy tapioca pearls — or add boba to any daiquiri for $2.',
  },
  {
    href: '/dirty-sodas-new-braunfels/',
    title: 'Dirty Sodas',
    detail: 'Your soda plus cream, syrups and a squeeze of something good. No alcohol.',
  },
  {
    href: '/coffee-new-braunfels/',
    title: 'Coffee Drive-Thru',
    detail: 'Texas Artisan Roasters espresso and iced lattes from 9 AM daily.',
  },
  {
    href: '/locations/backyard-in-gruene/',
    title: 'The Backyard in Gruene',
    detail: 'Turf lawn, live music and daiquiris at 1706 Hunter Rd.',
  },
  {
    href: '/locations/hwy-46/',
    title: 'Now Open on Highway 46',
    detail: 'Sip Society - Daiquiri Depot at 857 S Hwy 46 — our newest spot, toward Seguin.',
  },
];

const faqs = [
  {
    q: 'Do you sell daiquiris to go?',
    a: 'Yes — the FM 306 location is a drive-thru. Every frozen daiquiri is poured to go, from a 16 oz cup to a sealed gallon jug.',
  },
  {
    q: 'How much is a gallon daiquiri?',
    a: 'A gallon jug is $40 and a half-gallon is $22. Single cups are $8.50 (16 oz), $10.50 (24 oz) and $13.50 (32 oz).',
  },
  {
    q: 'Can I take a daiquiri to the river?',
    a: 'Disposable containers are banned on the Comal and the city stretch of the Guadalupe, so river drinks need a reusable container. Our River Jug is reusable and capped — $18 filled, with $12 refills.',
  },
  {
    q: 'Where are you located?',
    a: 'Three New Braunfels spots: the drive-thru at 311 FM 306, Suite 1A; The Backyard in Gruene at 1706 Hunter Rd; and Sip Society - Daiquiri Depot at 857 S Hwy 46, toward Seguin.',
  },
  {
    q: 'What are your hours?',
    a: "The FM 306 drive-thru is open Sunday–Thursday 9 AM–9 PM and Friday–Saturday 9 AM–10 PM. The Backyard in Gruene's hours change with live music and events, and the Highway 46 location is new, so its hours may vary — check Facebook or call (830) 632-5888.",
  },
  {
    q: 'Do you have non-alcoholic drinks?',
    a: 'Yes — boba milk teas, dirty sodas, smoothies and gourmet coffee, so the whole crew can order at one stop.',
  },
];

export function SeoGuide() {
  return (
    <section className="seo-guide section-pad" aria-labelledby="guide-heading">
      <div className="shell">
        <div className="section-heading">
          <h2 id="guide-heading">Drive-thru daiquiris to go — on the way to the river, the lake, or the couch.</h2>
          <p>
            We're the FM 306 drive-thru in New Braunfels pouring frozen daiquiris to go, from a 16 oz cup to a
            gallon jug, plus coffee, boba, dirty sodas and smoothies. Headed out River Road toward Canyon Lake?
            Grab a reusable River Jug — disposable containers are banned on the Comal and the city stretch of
            the Guadalupe, and refills are $12 all season.
          </p>
        </div>
        <div className="guide-grid">
          {guideLinks.map((link) => (
            <a className="guide-card" href={link.href} key={link.href}>
              <h3>{link.title}</h3>
              <p>{link.detail}</p>
              <span>See more →</span>
            </a>
          ))}
        </div>
        <div className="faq-block">
          <h2>Good to know</h2>
          {faqs.map((faq) => (
            <div className="faq-item" key={faq.q}>
              <h3>{faq.q}</h3>
              <p>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
