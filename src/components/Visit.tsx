import { Clock3, MapPinned, Phone } from 'lucide-react';
import { directionsUrl, fullAddress, locations, mapEmbedUrl, type Location } from '../data/locations';
import { timeLabel, todayIndex } from '../lib/hours';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function LocationVisit({ location }: { location: Location }) {
  const isDepot = location.id === 'fm306';
  const currentDay = todayIndex();
  return (
    <article className={`visit-card ${location.theme}`}>
      <div className="visit-map"><iframe title={`Map to ${location.name}`} src={mapEmbedUrl(location)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
      <div className="visit-copy"><p className="eyebrow">{location.area}</p><h3>{location.name}</h3><address><MapPinned size={17} /> {fullAddress(location)}</address><a className="visit-phone" href={location.phoneHref}><Phone size={16} /> {location.phone}</a>
        <div className="hours-block"><div><Clock3 size={17} /> <strong>{isDepot ? 'Hours' : 'Before you head over'}</strong></div>{location.hours ? <table><tbody>{location.hours.map((hours, index) => <tr className={index === currentDay ? 'today' : ''} key={days[index]}><th>{days[index]}</th><td>{hours ? `${timeLabel(hours.open)} – ${timeLabel(hours.close)}` : 'Not published'}</td></tr>)}</tbody></table> : <p>{location.hoursNote}</p>}{location.hoursNote && location.hours && <small>{location.hoursNote}</small>}</div>
        <a className={isDepot ? 'button button-pink' : 'button button-yard'} href={directionsUrl(location)} target="_blank" rel="noreferrer">Get directions ↗</a>
      </div>
    </article>
  );
}

export function Visit() {
  return (
    <section id="visit" className="visit-section section-pad" aria-labelledby="visit-heading"><div className="shell"><div className="section-heading"><p className="eyebrow">Find your way</p><h2 id="visit-heading">Come say hi.</h2></div><div className="visit-grid">{locations.map((location) => <LocationVisit location={location} key={location.id} />)}</div></div></section>
  );
}
