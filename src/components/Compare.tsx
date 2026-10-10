import { Check, Minus } from 'lucide-react';
import { byId } from '../data/locations';
import { openStatus } from '../lib/hours';

type Cell = string | boolean;
const comparisons: { label: string; depot: Cell; backyard: Cell }[] = [
  { label: 'Vibe', depot: 'Quick-stop drink bar', backyard: 'Turf-lawn hangout' },
  { label: 'Area', depot: 'FM 306, off I-35', backyard: 'Gruene Historic District' },
  { label: 'Drive-thru', depot: true, backyard: false },
  { label: 'Online ordering', depot: true, backyard: false },
  { label: 'Frozen daiquiris', depot: true, backyard: true },
  { label: 'Coffee, boba & matcha', depot: true, backyard: false },
  { label: 'Dirty sodas', depot: true, backyard: true },
  { label: 'Beer', depot: false, backyard: true },
  { label: 'Wine', depot: 'Sangria & mimosas', backyard: true },
  { label: 'Snacks', depot: 'Not published', backyard: 'Small bites & treats' },
  { label: 'Live music', depot: false, backyard: true },
  { label: 'Big screens', depot: false, backyard: true },
  { label: 'Hours', depot: openStatus(byId('fm306')).label, backyard: 'Hours vary' },
];

function Value({ value }: { value: Cell }) {
  if (value === true) return <span className="check-value"><Check aria-label="Yes" size={18} /></span>;
  if (value === false) return <span className="no-value"><Minus aria-label="No" size={18} /></span>;
  return <span>{value}</span>;
}

export function Compare() {
  return (
    <section className="compare-section section-pad" aria-labelledby="compare-heading">
      <div className="shell">
        <div className="section-heading">
          <p className="eyebrow">At a glance</p>
          <h2 id="compare-heading">Same family. Different kind of day.</h2>
        </div>
        <div className="comparison-wrap" role="region" aria-label="Location comparison" tabIndex={0}>
          <table className="comparison-table">
            <thead><tr><th scope="col">Good to know</th><th scope="col">Sip Society +<br />Daiquiri Depot</th><th scope="col">The Backyard<br />in Gruene</th></tr></thead>
            <tbody>{comparisons.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td><Value value={row.depot} /></td><td><Value value={row.backyard} /></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
