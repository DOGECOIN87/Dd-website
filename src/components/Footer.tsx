import { Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { fullAddress, locations } from '../data/locations';
import { site } from '../data/site';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div><img className="footer-logo" src="/brand/sip-society-daiquiri-depot.webp" alt="Sip Society + Daiquiri Depot" /><p>Two New Braunfels places for the sips that match your day.</p></div>
        <div><h2>Find us</h2>{locations.map((location) => <p className="footer-location" key={location.id}><strong>{location.name}</strong><span><MapPin size={14} /> {fullAddress(location)}</span></p>)}</div>
        <div><h2>Stay in touch</h2><a href={site.phoneHref}><Phone size={16} /> {site.phone}</a><a href={`mailto:${site.email}`}><Mail size={16} /> {site.email}</a><div className="footer-socials"><a href={site.socials.facebook} target="_blank" rel="noreferrer">Facebook ↗</a><a href={site.socials.instagram} target="_blank" rel="noreferrer"><Instagram size={15} /> Instagram ↗</a></div></div>
      </div>
      <div className="shell footer-bottom"><span>© {new Date().getFullYear()} Sip Society + Daiquiri Depot</span><span>21+ for alcohol · Drink responsibly · Never drink and drive</span></div>
    </footer>
  );
}
