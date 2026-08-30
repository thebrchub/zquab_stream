import { useEffect } from 'react';
import Lenis from 'lenis';
import Hero from '../components/LandingPage/Hero';
import MarqueeDivider from '../components/LandingPage/MarqueeDivider';
import EcosystemShowcase from '../components/LandingPage/EcosystemShowcase';
import CTAFooter from '../components/CTAFooter';
import SEO from '../components/SEO';

export default function LandingPage() {
  useEffect(() => {
    // 1. Initialize Lenis with premium easing
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // 2. Connect it to the browser's refresh rate
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const rafId = requestAnimationFrame(raf);

    // 3. CRITICAL: Destroy Lenis on unmount so it doesn't infect your chat/stream routes
    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="flex flex-col w-full bg-[#050608] text-white selection:bg-indigo-500/30">
      <SEO 
        title="zQuab | Watch, Connect & Meet Strangers"
        description="Join live creator rooms, enter private 1:1 video queues, or meet someone new instantly. Your social ecosystem."
        path="/"
      />

      <Hero />
      <MarqueeDivider />
      <EcosystemShowcase />
      <CTAFooter />
    </div>
  );
}