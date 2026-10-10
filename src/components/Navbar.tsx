import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from '../data/site';

const links = [
  ['Locations', '#locations'], ['Help me choose', '#choose'], ['Menu', '#menu'], ['Visit', '#visit'],
] as const;

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  return (
    <header className="site-nav">
      <div className="shell nav-row">
        <a className="brand-mark" href="#top" aria-label="Sip Society and Daiquiri Depot home">
          <img src="/brand/sip-society-daiquiri-depot.webp" alt="Sip Society + Daiquiri Depot" />
        </a>
        <nav className="nav-links" aria-label="Primary navigation">
          {links.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
        </nav>
        <a className="button button-coral nav-order" href={toast.orderUrl} target="_blank" rel="noreferrer">Order pickup <span aria-hidden="true">↗</span></a>
        <button className="menu-toggle" onClick={() => setIsOpen((open) => !open)} aria-label={isOpen ? 'Close menu' : 'Open menu'} aria-expanded={isOpen}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>
      {isOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {links.map(([label, href]) => <a href={href} key={href} onClick={close}>{label}</a>)}
          <a className="button button-coral" href={toast.orderUrl} target="_blank" rel="noreferrer">Order pickup ↗</a>
        </nav>
      )}
    </header>
  );
}
