import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { lineup } from '../data/drinks';
import { toast } from '../data/site';
import { RealCup } from './RealCup';

export function Hero() {
  return (
    <section id="top" className="hero-section" aria-labelledby="hero-heading">
      <div className="hero-glow" aria-hidden="true" />
      <div className="shell hero-inner">
        <motion.div className="hero-intro" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="eyebrow">Sip Society + Daiquiri Depot · New Braunfels</p>
          <h1 id="hero-heading">Everything <em>sip.</em><br />All in one stop.</h1>
          <p>Frozen daiquiris, gourmet coffee, boba, dirty sodas and smoothies. Now pouring at two New Braunfels spots, including our new Backyard in Gruene.</p>
          <div className="hero-actions">
            <a className="button button-pink" href={toast.orderUrl} target="_blank" rel="noreferrer">Order pickup <ArrowUpRight size={18} /></a>
            <a className="button button-ghost" href="#locations">See both locations <ArrowDown size={18} /></a>
          </div>
        </motion.div>
        <ul className="lineup" aria-label="What we pour">
          {lineup.map((drink) => (
            <li className="lineup-item" key={drink.name}>
              <RealCup spec={drink.spec} label={`${drink.name} in a clear Sip Society cup`} className="lineup-cup" />
              <div className="lineup-label">
                <h2>{drink.name}</h2>
                <p>{drink.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="lineup-tagline">Good drinks · Good vibes · Great society</p>
      </div>
    </section>
  );
}
