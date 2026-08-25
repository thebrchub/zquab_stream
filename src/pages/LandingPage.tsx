import Hero from '../components/LandingPage/Hero';
import MarqueeDivider from '../components/LandingPage/MarqueeDivider';
import EcosystemShowcase from '../components/LandingPage/EcosystemShowcase';
import CTAFooter from '../components/CTAFooter';
import SEO from '../components/SEO';

export default function LandingPage() {
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