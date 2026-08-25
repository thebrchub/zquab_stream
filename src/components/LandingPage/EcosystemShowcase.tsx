import React, { useEffect, useRef, type CSSProperties, type MouseEvent } from 'react';
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
      className="group relative rounded-3xl sm:rounded-[2rem] border border-white/10 bg-[#0D0D0D] p-6 sm:p-12 overflow-hidden shadow-2xl shadow-black/80 hover:border-white/20 transition-colors duration-500 w-full"
      style={{ '--x': '50%', '--y': '50%', willChange: 'transform, filter' } as SpotlightStyle}
    >
      {/* Cursor-tracked spotlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            'radial-gradient(600px circle at var(--x) var(--y), rgba(255,255,255,0.06), transparent 65%)',
        }}
      />

      <div className="relative z-10 flex flex-col gap-8 sm:gap-14 w-full">
        
        <div className="flex flex-col items-start w-full">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/[0.05] border border-white/10 mb-4 sm:mb-6">
            <Icon size={14} className="text-white/70" strokeWidth={2.5} />
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.15em] uppercase text-white/60 font-bold">
              {sec.tag}
            </span>
          </div>

          <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-[-0.02em] leading-[1.05] text-white mb-3 sm:mb-4">
            {sec.title}
          </h3>
          <p className="text-sm sm:text-lg text-white/50 leading-relaxed max-w-2xl">
            {sec.description}
          </p>
        </div>

        <div className="relative w-full aspect-video sm:aspect-[21/9] rounded-xl sm:rounded-2xl border border-white/10 bg-[#050505] overflow-hidden shadow-inner flex items-center justify-center">
          <Icon
            size={48}
            strokeWidth={1}
            className="text-white/10 group-hover:text-white/20 group-hover:scale-110 transition-all duration-700 ease-out"
          />
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white/30 group-hover:bg-white transition-colors duration-500" />
            <span className="font-mono text-[10px] sm:text-[11px] tracking-widest text-white/25 uppercase">Preview</span>
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
      
      // ✅ BATCH READS: Grab all coordinates at once to prevent layout thrashing
      const rects = cardRefs.current.map(card => card?.getBoundingClientRect());

      // ✅ BATCH WRITES: Apply the math after everything is read
      for (let i = 0; i < SECTIONS.length - 1; i++) {
        const currentCard = cardRefs.current[i];
        const currentRect = rects[i];
        const nextRect = rects[i + 1];
        
        if (!currentCard || !currentRect || !nextRect) continue;

        const distance = nextRect.top - currentRect.top;
        
        let progress = 0;
        // Start the effect a bit earlier (0.85 of viewport height) for a smoother lead-in
        if (distance < vh * 0.85) {
          progress = Math.max(0, 1 - (distance / (vh * 0.85)));
        }
        if (distance <= 0) progress = 1;

        // ✅ APPLY EASING: Ease-Out-Cubic makes the animation curve smooth instead of linear
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        // Apply a slight Y-axis lift (-12px) as it scales down to make the stacking feel layered and dynamic
        currentCard.style.transform = `scale(${1 - easeProgress * 0.05}) translateY(-${easeProgress * 12}px)`;
        currentCard.style.filter = `brightness(${1 - easeProgress * 0.5})`;
      }

      frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="relative bg-[#0A0A0A] px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center pt-20 sm:pt-32 pb-12 sm:pb-24">
        <p className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] text-white/40 uppercase mb-3">
          The Ecosystem
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] text-white">
          One app, three ways to connect.
        </h2>
      </div>

      {/* Reduced the massive gap on mobile to 40vh, keeping 70vh for desktop */}
      <div className="max-w-4xl mx-auto px-0 pb-[15vh] flex flex-col gap-[40vh] md:gap-[70vh]">
        {SECTIONS.map((sec, i) => (
          <div
            key={sec.id}
            className="sticky"
            // Tighter vertical stacking offset for mobile to preserve screen space
            style={{ 
              top: `calc(4rem + ${i * 1.2}rem)`, 
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