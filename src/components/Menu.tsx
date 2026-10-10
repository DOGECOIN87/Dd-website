import { Check, ExternalLink, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import { addons, daiquiriSizes, flavorColors, menuItems, type Flavor, type MenuCategory, type MenuItem } from '../data/menu';
import { specForItem } from '../data/drinks';
import { site, toast } from '../data/site';
import { RealCup } from './RealCup';

const tabs: { id: MenuCategory; label: string }[] = [
  { id: 'signatures', label: 'Signatures' }, { id: 'classics', label: 'Classics' }, { id: 'cocktails', label: 'Cocktails' }, { id: 'extras', label: 'Party favors & extras' },
];

function DrinkCard({ item }: { item: MenuItem }) {
  const fanFavorite = site.fanFavorites.includes(item.name);
  return (
    <article className="drink-card" data-cup-trigger>
      <RealCup spec={specForItem(item)} label={item.flavors?.length ? `${item.name}: ${item.flavors.join(', ')}` : item.name} className="drink-art" />
      <div className="drink-copy">
        <div className="drink-title"><h3>{item.name}</h3>{fanFavorite && <span className="favorite-badge">Fan favorite</span>}</div>
        {item.flavors?.length ? <div className="flavor-list">{item.flavors.map((flavor) => <span key={flavor} style={{ '--flavor': flavorColors[flavor] } as CSSProperties}>{flavor}</span>)}</div> : <p className="drink-description">{item.description || 'Available through Toast ordering.'}</p>}
        {item.flavors?.length && item.description && <p className="drink-description">{item.description}</p>}
        <div className="drink-footer"><span>{item.price}{item.alcoholic ? <small> · 21+</small> : null}</span><a href={toast.itemUrl(item.itemPath)} target="_blank" rel="noreferrer">Order <ExternalLink size={15} /></a></div>
      </div>
    </article>
  );
}

export function Menu() {
  const [tab, setTab] = useState<MenuCategory>('signatures');
  const [selected, setSelected] = useState<Flavor[]>([]);
  const shownItems = useMemo(() => menuItems.filter((item) => item.category === tab && selected.every((flavor) => item.flavors?.includes(flavor))), [selected, tab]);
  const toggleFlavor = (flavor: Flavor) => setSelected((current) => current.includes(flavor) ? current.filter((item) => item !== flavor) : [...current, flavor]);

  return (
    <section id="menu" className="menu-section section-pad" aria-labelledby="menu-heading">
      <div className="shell">
        <div className="section-heading menu-heading">
          <div><p className="eyebrow">Daiquiri Depot menu · FM 306</p><h2 id="menu-heading">Build a better frozen drink.</h2></div>
          <p>This is the full FM 306 menu. The Backyard pours a selection. Alcoholic drinks are 21+.</p>
        </div>
        <div className="size-strip" aria-label="Daiquiri sizes and prices">
          <p><strong>Pick your size</strong> <span>Mix, match, and make it yours.</span></p>
          <div>{daiquiriSizes.map(([size, price]) => <span key={size}><b>{size}</b> {price}</span>)}</div>
        </div>
        <div className="addon-strip"><strong>Add-ons</strong>{addons.map(([name, price]) => <span key={name}>{name} <b>{price}</b></span>)}</div>
        <div className="menu-controls">
          <div className="tabs" role="tablist" aria-label="Menu categories">
            {tabs.map((item) => <button role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)} key={item.id}>{item.label}</button>)}
          </div>
          {(tab === 'signatures' || tab === 'classics') && <div className="flavor-filter"><span><SlidersHorizontal size={16} /> Filter by every flavor:</span>{(Object.keys(flavorColors) as Flavor[]).map((flavor) => <button key={flavor} className={selected.includes(flavor) ? 'selected' : ''} aria-pressed={selected.includes(flavor)} onClick={() => toggleFlavor(flavor)}><i style={{ backgroundColor: flavorColors[flavor] }} />{flavor}</button>)}{selected.length > 0 && <button className="clear-filter" onClick={() => setSelected([])}><X size={14} /> Clear</button>}</div>}
        </div>
        {shownItems.length ? <div className="drink-grid">{shownItems.map((item) => <DrinkCard item={item} key={item.itemPath} />)}</div> : <div className="empty-menu"><Check size={22} /> No drink has every selected flavor. Try clearing one.</div>}
      </div>
    </section>
  );
}
