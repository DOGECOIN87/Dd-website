import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { CupControls } from '../cups/engine';
import { specKey, type DrinkSpec } from '../cups/types';

/**
 * A 3D drink in a clear PET cup that spins in place while its card is hovered,
 * focused or tapped. The three.js engine is loaded on demand and shared by every
 * cup on the page. Falls back to a flat silhouette if WebGL is unavailable.
 *
 * The interaction target is the nearest ancestor marked `data-cup-trigger`
 * (a whole menu card, say), or the cup itself.
 */
export function RealCup({ spec, label, className = '' }: { spec: DrinkSpec; label: string; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const key = specKey(spec);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;
    const trigger = wrap.closest<HTMLElement>('[data-cup-trigger]') ?? wrap;
    let controls: CupControls | null = null;
    let cancelled = false;
    let hovered = false;
    let focused = false;
    let selected = false;
    const sync = () => controls?.setActive(hovered || focused || selected);

    const enter = (e: PointerEvent) => { if (e.pointerType !== 'touch') { hovered = true; sync(); } };
    const leave = (e: PointerEvent) => { if (e.pointerType !== 'touch') { hovered = false; sync(); } };
    const focusIn = () => { focused = true; sync(); };
    const focusOut = (e: FocusEvent) => {
      if (!trigger.contains(e.relatedTarget as Node | null)) { focused = false; sync(); }
    };
    // Touch has no hover: a tap on the card (not on its links or buttons) toggles the spin.
    const tap = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' || (e.target as Element).closest('a, button')) return;
      selected = !selected;
      sync();
    };
    trigger.addEventListener('pointerenter', enter);
    trigger.addEventListener('pointerleave', leave);
    trigger.addEventListener('focusin', focusIn);
    trigger.addEventListener('focusout', focusOut);
    trigger.addEventListener('pointerup', tap);

    import('../cups/engine')
      .then(({ mountCup }) => {
        if (cancelled) return;
        controls = mountCup(canvas, JSON.parse(key) as DrinkSpec);
        if (!controls) setFailed(true);
        else sync();
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      controls?.dispose();
      trigger.removeEventListener('pointerenter', enter);
      trigger.removeEventListener('pointerleave', leave);
      trigger.removeEventListener('focusin', focusIn);
      trigger.removeEventListener('focusout', focusOut);
      trigger.removeEventListener('pointerup', tap);
    };
  }, [key]);

  const fill = spec.colors.length ? spec.colors : ['#d9e6ea'];
  const fallback = { '--cup-fill': `linear-gradient(180deg, ${fill.join(', ')})` } as CSSProperties;

  return (
    <div ref={wrapRef} className={`real-cup ${className}`} role="img" aria-label={label}>
      {failed ? <span className="real-cup-fallback" style={fallback} /> : <canvas ref={canvasRef} aria-hidden="true" />}
    </div>
  );
}
