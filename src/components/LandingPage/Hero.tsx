import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative w-full bg-[var(--background)] text-[var(--text-main)] font-sans overflow-hidden min-h-screen -mt-16 sm:-mt-20 pt-16 sm:pt-20 transition-colors duration-300">
      
      {/* Cinematic Volumetric Lighting */}
      <div className="absolute top-1/4 -left-[25%] w-[60%] md:w-[40%] aspect-square bg-blue-600/30 rounded-full blur-[150px] md:blur-[200px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 -right-[25%] w-[60%] md:w-[40%] aspect-square bg-pink-600/20 rounded-full blur-[150px] md:blur-[200px] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] md:w-[50%] aspect-square bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Status pill + intro copy */}
      <div className="relative z-30 flex items-start justify-between gap-6 px-6 sm:px-10 lg:px-16 pt-10">
      </div>

      {/* Headline, sitting above the art */}
      <div className="relative z-20 text-center px-6 pt-10 sm:pt-6">
        <p className="font-mono text-[9px] sm:text-xs tracking-[0.2em] text-[var(--text-muted)] uppercase mb-3">
          Not a feed. Not a match. A room full of people.
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-7xl font-black tracking-[-0.03em] leading-[1.02] text-[var(--text-main)]">
          Your next favorite person<br className="hidden sm:block" /> is already here.
        </h2>
      </div>

      {/* Character art */}
      <div className="relative z-10 flex justify-center items-end h-full pt-10">
        <img
          src="/hero.png"
          alt="zQuab crew hanging out"
          className="w-full max-w-3xl h-auto object-contain select-none pointer-events-none relative z-10"
          draggable="false"
        />
      </div>

      {/* 
        CTA — Colored Claymorphism Style 
        Mobile: bottom-10 (Anchored cleanly in the empty bottom space)
        Desktop: sm:bottom-[24%] (Restored to its original spot)
      */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-10 sm:bottom-[24%] z-30 transition-all">
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-3xl font-bold text-white bg-[#4F46E5] transition-transform active:scale-95 shadow-[8px_8px_16px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.05),inset_4px_4px_8px_rgba(255,255,255,0.3),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] hover:shadow-[6px_6px_12px_rgba(0,0,0,0.5),-3px_-3px_10px_rgba(255,255,255,0.05),inset_3px_3px_6px_rgba(255,255,255,0.3),inset_-3px_-3px_6px_rgba(0,0,0,0.4)]"
        >
          Start Chat <span aria-hidden className="text-lg leading-none">→</span>
        </Link>
      </div>

      {/* 
        Wordmark
        Mobile: bottom-36 (Fixed distance sitting perfectly across their legs/shoes)
        Desktop: sm:bottom-[4%] (Restored to its original spot)
      */}
      <h1
        className="absolute left-1/2 -translate-x-1/2 bottom-36 sm:bottom-[4%] z-20 select-none font-black tracking-[-0.05em] leading-[0.75] text-[5rem] sm:text-[9rem] lg:text-[12rem] whitespace-nowrap transition-all"
        style={{
          color: 'var(--text-main)',
          filter:
            'drop-shadow(0 0 2px var(--background)) drop-shadow(0 0 14px var(--background)) drop-shadow(0 6px 20px var(--background))',
        }}
      >
        zQuab
      </h1>
      
    </section>
  );
}