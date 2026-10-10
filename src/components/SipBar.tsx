import { Coffee, CupSoda, GlassWater, Leaf, Sparkles } from 'lucide-react';

const offerings = [
  { name: 'Coffee & espresso', detail: 'Made with beans from Texas Artisan Roasters in New Braunfels.', icon: Coffee },
  { name: 'Matcha', detail: 'A bright, non-alcoholic option for your afternoon.', icon: Leaf },
  { name: 'Boba', detail: 'Also available as a $2 add-on to any daiquiri.', icon: GlassWater },
  { name: 'Dirty sodas', detail: 'A splashy soda stop for everyone in the group.', icon: CupSoda },
  { name: 'Smoothies', detail: 'Frozen, non-alcoholic sips for an easy treat.', icon: Sparkles },
];

export function SipBar() {
  return (
    <section className="sip-section section-pad" aria-labelledby="sip-heading">
      <div className="shell sip-layout">
        <div className="sip-intro">
          <p className="eyebrow">At Sip Society</p>
          <h2 id="sip-heading">More than a daiquiri stop.</h2>
          <p>Our coffee-bar side is non-alcoholic and made for everyone. Seasonal menu drops land first on Facebook and Instagram.</p>
          <div className="sip-accent">Good for the whole crew.</div>
        </div>
        <div className="sip-grid">
          {offerings.map(({ name, detail, icon: Icon }) => <article className="sip-tile" key={name}><Icon aria-hidden="true" /><h3>{name}</h3><p>{detail}</p></article>)}
        </div>
      </div>
    </section>
  );
}
