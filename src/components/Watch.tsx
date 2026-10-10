import { useEffect, useRef } from 'react';

const clips = [
  { src: '/video/clip-1.mp4', poster: '/video/clip-1-poster.webp', caption: 'Fresh from the machine, out the drive-thru' },
  { src: '/video/clip-2.mp4', poster: '/video/clip-2-poster.webp', caption: 'River days, sorted' },
  { src: '/video/clip-3.mp4', poster: '/video/clip-3-poster.webp', caption: 'Coffee, boba and dirty sodas too' },
];

/** Muted loop that only plays while on screen, and never for reduced-motion visitors. */
function LoopClip({ src, poster, caption }: (typeof clips)[number]) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => undefined);
      else video.pause();
    }, { threshold: 0.35 });
    io.observe(video);
    return () => io.disconnect();
  }, []);
  return (
    <figure className="clip">
      <video ref={ref} src={src} poster={poster} muted loop playsInline preload="none" aria-label={caption} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function Watch() {
  return (
    <section id="watch" className="watch-section section-pad" aria-labelledby="watch-heading">
      <div className="shell">
        <div className="section-heading centered">
          <p className="eyebrow">Frozen. Fresh. To go.</p>
          <h2 id="watch-heading">Every flavor. Every sip.</h2>
        </div>
        <div className="watch-feature">
          <video className="ad-wide" controls playsInline preload="none" poster="/video/daiquiri-depot-ad-poster.webp" aria-label="Sip Society + Daiquiri Depot video">
            <source src="/video/daiquiri-depot-ad.mp4" type="video/mp4" />
          </video>
          <video className="ad-tall" controls playsInline preload="none" poster="/video/daiquiri-depot-ad-vertical-poster.webp" aria-label="Sip Society + Daiquiri Depot video">
            <source src="/video/daiquiri-depot-ad-vertical.mp4" type="video/mp4" />
          </video>
          <figure className="party-photo">
            <img src="/photos/jugs-and-jello-shots.webp" alt="Two half-gallon jugs of layered frozen daiquiri with jello shots and gummy bear shots in front" loading="lazy" />
            <figcaption><strong>Party-sized.</strong> Half gallons, gallons, jello shots and tipsy bears.</figcaption>
          </figure>
        </div>
        <div className="clip-row">{clips.map((clip) => <LoopClip key={clip.src} {...clip} />)}</div>
      </div>
    </section>
  );
}
