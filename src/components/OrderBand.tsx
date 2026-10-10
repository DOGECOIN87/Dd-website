import { ArrowUpRight, Gift, Star } from 'lucide-react';
import { toast } from '../data/site';

export function OrderBand() {
  return (
    <section className="order-band" aria-labelledby="order-heading">
      <div className="shell order-layout">
        <div><p className="eyebrow">Toast online ordering · FM 306 only</p><h2 id="order-heading">Pick it up. Get it delivered.</h2><p>Order is handled securely on Toast, where you can choose pickup or delivery.</p><a className="button button-cream" href={toast.orderUrl} target="_blank" rel="noreferrer">Start a Toast order <ArrowUpRight size={18} /></a></div>
        <div className="reward-panel"><div className="reward-title"><Star size={20} /> Toast Loyalty</div><div className="rewards">{toast.rewards.map((reward) => <p key={reward.big}><strong>{reward.big}</strong><span>{reward.small}</span></p>)}</div><a href={toast.giftCardUrl} target="_blank" rel="noreferrer"><Gift size={17} /> Send a gift card <ArrowUpRight size={16} /></a></div>
      </div>
    </section>
  );
}
