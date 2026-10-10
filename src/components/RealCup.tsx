import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { specKey, type DrinkSpec } from '../cups/types';

/**
 * A live, slowly spinning 3D drink in a clear PET cup. The three.js engine is
 * loaded on demand and shared by every cup on the page. Falls back to a flat
 * silhouette if WebGL is unavailable.
 */
export function RealCup({ spec, label, className = '' }: { spec: DrinkSpec; label: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const key = specKey(spec);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cleanup: (() => void) | null | undefined;
    let cancelled = false;
    import('../cups/engine')
      .then(({ mountCup }) => {
        if (cancelled) return;
        cleanup = mountCup(canvas, JSON.parse(key) as DrinkSpec);
        if (!cleanup) setFailed(true);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [key]);

  const fill = spec.colors.length ? spec.colors : ['#d9e6ea'];
  const fallback = { '--cup-fill': `linear-gradient(180deg, ${fill.join(', ')})` } as CSSProperties;

  return (
    <div className={`real-cup ${className}`} role="img" aria-label={label}>
      {failed ? <span className="real-cup-fallback" style={fallback} /> : <canvas ref={canvasRef} aria-hidden="true" />}
    </div>
  );
}
