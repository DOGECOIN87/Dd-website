import { Citrus, Droplets, Quote, Star } from 'lucide-react';
import { site } from '../data/site';

const realDeal = [
  { heading: 'Real sugar cane', icon: Citrus }, { heading: 'Real fruit purée', icon: Droplets }, { heading: 'Citrus-fermented alcohol', icon: Star },
];

export function About() {
  return (
    <section className="real-deal section-pad" aria-labelledby="real-heading">
      <div className="shell">
        <div className="section-heading centered"><p className="eyebrow">The real deal</p><h2 id="real-heading">Made with the good stuff.</h2><p>Our frozen daiquiris are made with real sugar cane, real fruit purée, and a vinous citrus neutral alcohol fermented from oranges and citrus.</p></div>
        <div className="deal-grid">{realDeal.map(({ heading, icon: Icon }) => <div className="deal-item" key={heading}><Icon aria-hidden="true" /><span>{heading}</span></div>)}</div>
        <div className="quote-ratings">
          <blockquote><Quote aria-hidden="true" /><p>“My kids were my inspiration for the merger and to do a new brand. I wanted to make it a one-stop shop for beverages.”</p><cite>— {site.owner}</cite></blockquote>
          <div className="rating-links"><a href={site.socials.yelp} target="_blank" rel="noreferrer"><strong>{site.ratings.yelp.score}★</strong><span>Yelp<br />{site.ratings.yelp.count} reviews</span></a><a href={site.socials.facebook} target="_blank" rel="noreferrer"><strong>{site.ratings.facebook.recommend}</strong><span>recommend<br />{site.ratings.facebook.count} reviews</span></a></div>
        </div>
      </div>
    </section>
  );
}
