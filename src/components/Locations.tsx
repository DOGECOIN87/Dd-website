import { Check, Compass, MapPin, Navigation, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { directionsUrl, locations, type Location, type LocationId } from '../data/locations';
import { distanceToLocations } from '../lib/geo';
import { openStatus } from '../lib/hours';

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function LocationArt({ location }: { location: Location }) {
  if (location.id === 'fm306') {
    return <div className="location-art"><img src="/photos/fm306-drive-thru.webp" alt="" /></div>;
  }
  return (
    <div className="location-art">
      <img src="/photos/backyard-in-gruene-night.webp" alt="" />
      <img className="location-badge" src="/brand/backyard-in-gruene.webp" alt="" />
    </div>
  );
}

function LocationCard({ location, distance, closest, now }: { location: Location; distance?: number; closest: boolean; now: Date }) {
  const status = openStatus(location, now);
  const isDepot = location.id === 'fm306';
  const facebook = location.links.find((link) => link.label === 'Facebook')?.href;
  return (
    <motion.article className={`location-card ${location.theme}`} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45 }}>
      <LocationArt location={location} />
      <div className="location-copy">
        <div className="card-topline">
          <span className={`status-pill ${status.kind}`}>{status.label}</span>
          {location.isNew && <span className="new-pill">New location</span>}
          {closest && <span className="nearest-pill"><Navigation size={14} /> Closest to you</span>}
        </div>
        <p className="eyebrow">{location.area}</p>
        <h3>{location.name}</h3>
        <p className="location-address"><MapPin size={15} /> {location.address.street}, {location.address.city}</p>
        <p className="location-tagline">{location.tagline}</p>
        <div className="chips" aria-label={`${location.nickname} highlights`}>
          {location.features.slice(0, 4).map((feature) => <span className="chip" key={feature}>{feature}</span>)}
        </div>
        <p className="best-for"><Sparkles size={16} /> <strong>Best for:</strong> {location.bestFor}</p>
        {distance !== undefined && <p className="distance"><Compass size={16} /> {distance.toFixed(1)} miles away as the crow flies</p>}
        <div className="card-actions">
          {isDepot ? <a className="button button-light" href={location.orderUrl} target="_blank" rel="noreferrer">Order ahead ↗</a> : <a className="button button-yard-light" href={directionsUrl(location)} target="_blank" rel="noreferrer"><MapPin size={17} /> Directions</a>}
          {isDepot ? <a className="text-link" href={directionsUrl(location)} target="_blank" rel="noreferrer">Directions <span>→</span></a> : <a className="text-link" href={facebook} target="_blank" rel="noreferrer">What’s on <span>→</span></a>}
        </div>
      </div>
    </motion.article>
  );
}

export function Locations() {
  const now = useNow();
  const [distances, setDistances] = useState<Partial<Record<LocationId, number>>>({});
  const [geoMessage, setGeoMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const closest = Object.entries(distances).length === 2
    ? (distances.fm306! <= distances.gruene! ? 'fm306' : 'gruene')
    : undefined;

  const findClosest = () => {
    if (!navigator.geolocation) {
      setGeoMessage('Your browser does not offer location sharing. Use the directions links instead.');
      return;
    }
    setLocating(true);
    setGeoMessage('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDistances(distanceToLocations(position.coords, locations));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setGeoMessage('We could not access your location. You can still choose a spot or use directions.');
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  return (
    <section id="locations" className="locations-section section-pad" aria-labelledby="locations-heading">
      <div className="shell">
        <div className="section-heading locations-heading">
          <p className="now-two">Now in 2 locations</p>
          <h2 id="locations-heading">Where are we <em>sipping</em> today?</h2>
          <p>Grab-and-go at the original FM 306 drive-thru, or kick back on the turf at our new Backyard in Gruene.</p>
        </div>
        <div className="location-grid">
          {locations.map((location) => <LocationCard key={location.id} location={location} now={now} distance={distances[location.id]} closest={closest === location.id} />)}
        </div>
        <div className="hero-tools">
          <a href="#choose" className="quiz-prompt"><Check size={18} /> Not sure? Take the 3-question quiz <span>↓</span></a>
          <button className="closest-button" onClick={findClosest} disabled={locating}><Navigation size={18} /> {locating ? 'Finding you…' : 'Which is closer to me?'}</button>
        </div>
        {geoMessage && <p className="geo-message" role="status">{geoMessage}</p>}
      </div>
    </section>
  );
}
