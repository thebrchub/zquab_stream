import { useEffect, useRef, type CSSProperties, type MouseEvent } from 'react';
import { Radio, Video, Shuffle, type LucideIcon } from 'lucide-react';

interface EcosystemSection {
  id: number;
  tag: string;
  title: string;
  description: string;
  Icon: LucideIcon;
}

const SECTIONS: EcosystemSection[] = [
  {
    id: 1,
    tag: 'Live Streams',
    title: 'Hang out in real-time.',
    description:
      'Join your favorite creators while they game, chat, or perform. Drop gifts, join the conversation, and be part of the room.',
    Icon: Radio,
  },
  {
    id: 2,
    tag: '1:1 Interaction',
    title: 'Skip the crowd. Talk directly.',
    description:
      'Jump into the queue for a private, premium 1-on-1 video call. Set your duration, pay with zCoins, and connect face-to-face.',
    Icon: Video,
  },
  {
    id: 3,
    tag: 'Stranger Chat',
    title: 'Meet someone entirely new.',
    description:
      'The classic zQuab experience. Swipe into an anonymous text or video chat and instantly match with someone across the globe.',
    Icon: Shuffle,
  },
];

interface SpotlightStyle extends CSSProperties {
  '--x'?: string;
  '--y'?: string;
}

function SpotlightCard({
  sec,
  onMount,
}: {
  sec: EcosystemSection;
  onMount: (el: HTMLDivElement | null) => void;
}) {
  const localRef = useRef<HTMLDivElement>(null);
  const { Icon } = sec;

  const setRefs = (node: HTMLDivElement | null) => {
    localRef.current = node;
    onMount(node);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = localRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty('--y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  return (
    <div
      ref={setRefs}
      onMouseMove={handleMouseMove}
      // 🚀 THEME FIX: Using your app's global CSS variables for colors
      className="group relative rounded-3xl sm:rounded-[2rem] border border-[var(--border-color)] bg-[var(--card)] p-6 sm:p-12 overflow-hidden shadow-2xl shadow-black/5 dark:shadow-black/80 hover:border-[#3B82F6]/50 transition-colors duration-500 w-full"
      style={{ 
        '--x': '50%', 
        '--y': '50%', 
        willChange: 'transform, filter',
        transformOrigin: 'top center' 
      } as SpotlightStyle}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-black/5 dark:bg-white/5"
        style={{
          WebkitMaskImage: 'radial-gradient(600px circle at var(--x) var(--y), black, transparent 65%)',
          maskImage: 'radial-gradient(600px circle at var(--x) var(--y), black, transparent 65%)',
        }}
      />

      <div className="relative z-10 flex flex-col gap-8 sm:gap-14 w-full">
        <div className="flex flex-col items-start w-full">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[var(--background)] border border-[var(--border-color)] mb-4 sm:mb-6">
            <Icon size={14} className="text-[var(--text-muted)]" strokeWidth={2.5} />
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.15em] uppercase text-[var(--text-muted)] font-bold">
              {sec.tag}
            </span>
          </div>

          <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-[-0.02em] leading-[1.05] text-[var(--text-main)] mb-3 sm:mb-4">
            {sec.title}
          </h3>
          <p className="text-sm sm:text-lg text-[var(--text-muted)] leading-relaxed max-w-2xl">
            {sec.description}
          </p>
        </div>

        <div className="relative w-full aspect-video sm:aspect-[21/9] rounded-xl sm:rounded-2xl border border-[var(--border-color)] bg-[var(--background)] overflow-hidden shadow-inner flex items-center justify-center">
          <Icon
            size={48}
            strokeWidth={1}
            className="text-[var(--text-muted)] opacity-20 group-hover:opacity-50 group-hover:scale-110 transition-all duration-700 ease-out"
          />
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] opacity-30 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="font-mono text-[10px] sm:text-[11px] tracking-widest text-[var(--text-muted)] opacity-50 uppercase">Preview</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EcosystemShowcase() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let frame: number;

    const update = () => {
      const vh = window.innerHeight;
      const rects = cardRefs.current.map(card => card?.getBoundingClientRect());

      for (let i = 0; i < SECTIONS.length - 1; i++) {
        const currentCard = cardRefs.current[i];
        const currentRect = rects[i];
        const nextRect = rects[i + 1];
        
        if (!currentCard || !currentRect || !nextRect) continue;

        const distance = nextRect.top - currentRect.top;
        
        // 🚀 SCROLL FIX: Starts animating much earlier so it feels like a continuous swipe
        let progress = 0;
        const activationDistance = vh * 0.7; // Starts when the next card is 70% of the screen away
        
        if (distance < activationDistance) {
          progress = 1 - (distance / activationDistance);
        }
        progress = Math.max(0, Math.min(1, progress)); // Lock between 0 and 1

        const scale = 1 - (progress * 0.08); 
        const translate = progress * 30; 
        const dim = 1 - (progress * 0.3); // Slight dimming effect

        currentCard.style.transform = `scale(${scale}) translateY(${translate}px)`;
        currentCard.style.filter = `brightness(${dim})`;
      }

      frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    // 🚀 THEME FIX: Main container respects global theme
    <section className="relative bg-[var(--background)] px-4 sm:px-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto text-center pt-20 sm:pt-32 pb-12 sm:pb-24">
        <p className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] text-[var(--text-muted)] uppercase mb-3">
          The Ecosystem
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] text-[var(--text-main)]">
          One app, three ways to connect.
        </h2>
      </div>

      {/* 🚀 SCROLL FIX: Drastically reduced the gap so it overlaps in a single scroll motion */}
      <div className="max-w-4xl mx-auto px-0 pb-[15vh] flex flex-col gap-[20vh] md:gap-[25vh]">
        {SECTIONS.map((sec, i) => (
          <div
            key={sec.id}
            className="sticky"
            style={{ 
              top: `calc(5rem + ${i * 1.5}rem)`, // Creates the stacked "deck of cards" effect
              zIndex: i + 1 
            }}
          >
            <SpotlightCard
              sec={sec}
              onMount={(el) => {
                cardRefs.current[i] = el;
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}