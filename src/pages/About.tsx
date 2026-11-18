import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Coins,
  Compass,
  Gift,
  Globe2,
  Heart,
  LockKeyhole,
  MessageCircle,
  Radio,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Video,
  Wallet,
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

const features = [
  {
    icon: Compass,
    title: 'Discover',
    text: 'Explore live spaces, discover creators, and find conversations that catch your interest.',
    tone: 'blue',
  },
  {
    icon: MessageCircle,
    title: 'Join the moment',
    text: 'Enter a stream, follow the conversation, and interact with the people bringing the room to life.',
    tone: 'violet',
  },
  {
    icon: Gift,
    title: 'Show your support',
    text: 'Use zCoins for supported virtual gifts and access to eligible premium streams.',
    tone: 'amber',
  },
  {
    icon: Users,
    title: 'Build your circle',
    text: 'Follow creators you enjoy and make it easier to find their content again.',
    tone: 'green',
  },
];

const principles = [
  {
    icon: Heart,
    title: 'People before metrics',
    text: 'We want interactions to feel human. The best moments come from people, not numbers on a screen.',
  },
  {
    icon: ShieldCheck,
    title: 'A respectful community',
    text: 'Everyone should be able to participate without harassment, hate, scams, or deliberate disruption.',
  },
  {
    icon: Sparkles,
    title: 'Room to be discovered',
    text: 'Whether you are here to watch, chat, or create, discovering people and content should feel simple.',
  },
];

const faqs = [
  {
    question: 'What is zQuab?',
    answer:
      'zQuab is a social platform built around live content and real-time interaction. You can discover live streams, join conversations, follow creators, and use zCoins for supported in-app experiences.',
  },
  {
    question: 'Can anyone start a live stream?',
    answer:
      'Live-streaming access is reserved for approved creators. Creator access is reviewed, so creating an account does not automatically grant permission to go live.',
  },
  {
    question: 'What are zCoins used for?',
    answer:
      'zCoins are zQuab’s in-app virtual currency. They can be used for supported virtual gifts and access to eligible premium streams. They are not a bank balance or a general-purpose payment method.',
  },
  {
    question: 'Can I withdraw zCoins as cash?',
    answer:
      'No. zCoins are an in-app currency and should not be treated as cash or as a withdrawable wallet balance. Any future creator payout feature will be communicated separately when it is available.',
  },
  {
    question: 'Do I need to be a creator to use zQuab?',
    answer:
      'No. You can discover and watch live content, take part in conversations, follow creators, and use supported in-app features without being an approved creator.',
  },
  {
    question: 'Does zQuab offer paid one-to-one sessions?',
    answer:
      'Paid one-to-one sessions are not currently part of the available feature set. zQuab’s current experience focuses on live streams and interactions within those spaces.',
  },
  {
    question: 'How should I behave in the community?',
    answer:
      'Be respectful. Do not harass, threaten, impersonate, share hateful content, run scams, or use the platform to exploit others. Respect other people’s boundaries and privacy.',
  },
];

const rules = [
  'Treat creators and viewers with respect. Disagreement is never an excuse for harassment.',
  'No hate speech, bullying, threats, sexual harassment, or targeted abuse.',
  'No impersonation, scams, misleading offers, or attempts to exploit other users.',
  'Respect privacy. Do not publish someone else’s personal or private information.',
  'Do not spam streams, conversations, or the platform with disruptive content.',
];

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 280, damping: 26 },
  },
};

const tones: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

const clayShadow =
  'shadow-[8px_8px_18px_rgba(0,0,0,0.09),-7px_-7px_18px_rgba(255,255,255,0.82),inset_1px_1px_2px_rgba(255,255,255,0.65)] dark:shadow-[8px_8px_18px_rgba(0,0,0,0.32),-5px_-5px_14px_rgba(255,255,255,0.035),inset_1px_1px_2px_rgba(255,255,255,0.035)]';

const clayInset =
  'shadow-[inset_4px_4px_9px_rgba(0,0,0,0.07),inset_-4px_-4px_9px_rgba(255,255,255,0.75)] dark:shadow-[inset_4px_4px_9px_rgba(0,0,0,0.28),inset_-3px_-3px_8px_rgba(255,255,255,0.025)]';

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const navigate = useNavigate();

  const faqSchema = useMemo(
    () =>
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      }),
    [],
  );

  return (
    <>
      <SEO
        title="About zQuab | Live Streams, Creators & Communities"
        description="Learn about zQuab: discover live streams, join real-time conversations, follow creators, and use zCoins for supported in-app experiences."
        path="/about"
        schema={faqSchema}
      />

      <main className="min-h-[100dvh] w-full bg-[var(--background)] pb-24 pt-10 font-sans text-[var(--text-main)] md:pt-14">
        <div className="mx-auto w-full max-w-[1180px] px-4 md:px-8">
          {/* Simple page heading — intentionally no hero */}
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-16 max-w-3xl text-center"
          >
            
            <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
              A little about us
            </p>
            <h1 className="mb-5 text-4xl font-black tracking-tight sm:text-5xl">
              Meet <span className="text-blue-600 dark:text-blue-400">zQuab.</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-[var(--text-muted)] md:text-lg">
              A social space for live content, real-time conversations, creators,
              and the communities that grow around them.
            </p>
          </motion.header>

          {/* What is zQuab */}
          <section className={`mb-20 rounded-[2rem] border border-[var(--border-color)] bg-[var(--card)] p-7 md:p-10 ${clayShadow}`}>
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div className="max-w-3xl">
                <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
                  What is zQuab?
                </p>
                <h2 className="mb-4 text-2xl font-black tracking-tight md:text-3xl">
                  Not just another place to scroll.
                </h2>
                <p className="text-base leading-relaxed text-[var(--text-muted)] md:text-lg">
                  zQuab brings live content and real-time interaction together.
                  Discover creators, join conversations, follow the people you
                  enjoy, and support the moments that make you stay.
                </p>
              </div>
              <div className={`mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-[var(--background)] text-blue-600 dark:text-blue-400 ${clayInset}`}>
                <Radio className="h-12 w-12" />
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="mb-24">
            <div className="mb-9">
              <p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
                The experience
              </p>
              <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                A little more than watching.
              </h2>
              <p className="mt-3 max-w-2xl text-[var(--text-muted)]">
                Discover content, interact in real time, and stay connected to
                the creators you enjoy.
              </p>
            </div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-70px' }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
            >
              {features.map((item, index) => (
                <motion.article
                  key={item.title}
                  variants={rise}
                  whileHover={{ y: -5 }}
                  className={`rounded-[1.8rem] border border-[var(--border-color)] bg-[var(--card)] p-7 transition-shadow duration-300 hover:shadow-[10px_10px_22px_rgba(0,0,0,0.12),-8px_-8px_20px_rgba(255,255,255,0.85)] dark:hover:shadow-[10px_10px_22px_rgba(0,0,0,0.38),-5px_-5px_16px_rgba(255,255,255,0.04)] ${clayShadow}`}
                >
                  <div className="mb-7 flex items-center justify-between">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tones[item.tone]} ${clayShadow}`}>
                      <item.icon className="h-6 w-6" strokeWidth={2.2} />
                    </div>
                    <span className="text-sm font-black tracking-widest text-[var(--text-muted)]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mb-3 text-xl font-black tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                    {item.text}
                  </p>
                </motion.article>
              ))}
            </motion.div>
          </section>

          {/* How it works */}
          <section className="mb-24 grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                Find your way around
              </p>
              <h2 className="mb-5 text-3xl font-black leading-tight tracking-tight md:text-4xl">
                Your next favourite moment is out there.
              </h2>
              <p className="text-lg leading-relaxed text-[var(--text-muted)]">
                Getting started is simple. Explore what’s live, join a space
                that interests you, and keep up with the creators you want to
                see again.
              </p>
            </div>
            <div className="space-y-5">
              {[
                {
                  icon: Globe2,
                  title: 'Discover',
                  text: 'Browse live content and find creators or conversations that interest you.',
                  tone: 'blue',
                },
                {
                  icon: Video,
                  title: 'Join',
                  text: 'Enter a live stream, watch, and participate in its real-time chat.',
                  tone: 'violet',
                },
                {
                  icon: Star,
                  title: 'Stay connected',
                  text: 'Follow creators, send supported gifts, and return to the spaces you enjoy.',
                  tone: 'amber',
                },
              ].map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className={`flex gap-5 rounded-[1.6rem] border border-[var(--border-color)] bg-[var(--card)] p-5 md:p-6 ${clayShadow}`}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tones[step.tone]}`}>
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-black">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                      {step.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Creator section */}
          <section className={`mb-24 rounded-[2rem] border border-violet-300/50 bg-[var(--card)] p-7 md:p-11 ${clayShadow}`}>
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div className="max-w-2xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  <Radio className="h-4 w-4" /> For creators
                </div>
                <h2 className="mb-4 text-3xl font-black leading-tight tracking-tight md:text-4xl">
                  Bring your people together, live.
                </h2>
                <p className="mb-6 text-base leading-relaxed text-[var(--text-muted)] md:text-lg">
                  zQuab gives creators a space to go live and interact with
                  their audience. Creator access is reviewed and approved to
                  help maintain the quality of the platform.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--background)] px-4 py-3 text-sm font-bold">
                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                    Approval-based access
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--background)] px-4 py-3 text-sm font-bold">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    Real-time interaction
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--background)] px-4 py-3 text-sm font-bold">
                    <Gift className="h-4 w-4 text-amber-600" />
                    Virtual gifts
                  </span>
                </div>
              </div>
              <div className={`mx-auto flex h-36 w-36 items-center justify-center rounded-[2.2rem] bg-[var(--background)] text-violet-600 dark:text-violet-400 md:h-40 md:w-40 ${clayInset}`}>
                <Video className="h-16 w-16" />
              </div>
            </div>
          </section>

          {/* zCoins */}
          <section className={`mb-24 grid items-center gap-8 rounded-[2rem] border border-[var(--border-color)] bg-[var(--card)] p-7 md:p-10 lg:grid-cols-[auto_1fr] lg:gap-12 ${clayShadow}`}>
            <div className={`mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 md:h-36 md:w-36 ${clayShadow}`}>
              <Coins className="h-14 w-14 md:h-16 md:w-16" strokeWidth={1.8} />
            </div>
            <div>
              <p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">
                The zQuab economy
              </p>
              <h2 className="mb-4 text-3xl font-black tracking-tight md:text-4xl">
                Meet zCoins.
              </h2>
              <p className="mb-6 max-w-3xl text-base leading-relaxed text-[var(--text-muted)] md:text-lg">
                zCoins are the in-app currency used for supported experiences
                on zQuab. Send virtual gifts to show appreciation and access
                eligible premium streams. They are designed for use within
                zQuab—not as cash or a withdrawable bank balance.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--background)] px-4 py-3 text-sm font-bold">
                  <Gift className="h-4 w-4 text-amber-600" /> Virtual gifts
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--background)] px-4 py-3 text-sm font-bold">
                  <LockKeyhole className="h-4 w-4 text-violet-600" /> Eligible premium streams
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--background)] px-4 py-3 text-sm font-bold">
                  <Wallet className="h-4 w-4 text-blue-600" /> In-app currency
                </span>
              </div>
            </div>
          </section>

          {/* Values */}
          <section className="mb-24">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                What matters here
              </p>
              <h2 className="mb-4 text-3xl font-black tracking-tight md:text-4xl">
                The kind of community we want to build.
              </h2>
              <p className="text-[var(--text-muted)]">
                Features make a platform. People make it worth coming back to.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {principles.map((item) => (
                <motion.article
                  key={item.title}
                  whileHover={{ y: -4 }}
                  className={`rounded-[1.8rem] border border-[var(--border-color)] bg-[var(--card)] p-7 ${clayShadow}`}
                >
                  <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 ${clayShadow}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-black">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                    {item.text}
                  </p>
                </motion.article>
              ))}
            </div>
          </section>

          {/* Community standards */}
          <section className="mb-24 grid gap-9 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="lg:pt-4">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                Community first
              </p>
              <h2 className="mb-5 text-3xl font-black leading-tight tracking-tight md:text-4xl">
                Good spaces are built by everyone in them.
              </h2>
              <p className="text-lg leading-relaxed text-[var(--text-muted)]">
                A great live community needs more than good content. It needs
                people who respect one another, creators who set a positive
                tone, and viewers who help keep conversations constructive.
              </p>
            </div>
            <div className={`rounded-[2rem] border border-[var(--border-color)] bg-[var(--card)] p-7 md:p-9 ${clayShadow}`}>
              <div className="mb-7 flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 ${clayShadow}`}>
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black">Our community standards</h3>
              </div>
              <ul className="space-y-5">
                {rules.map((rule) => (
                  <li key={rule} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <span className="text-sm leading-relaxed text-[var(--text-muted)] md:text-base">
                      {rule}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* FAQ */}
          <section className="mx-auto mb-24 max-w-4xl">
            <div className="mb-10 text-center">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                A few answers
              </p>
              <h2 className="mb-4 text-3xl font-black tracking-tight md:text-4xl">
                Frequently asked questions
              </h2>
              <p className="text-[var(--text-muted)]">
                The essentials about using zQuab.
              </p>
            </div>
            <div className="space-y-5">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={faq.question}
                    className={`overflow-hidden rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--card)] ${clayShadow}`}
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left md:px-7"
                    >
                      <span className={`text-base font-bold md:text-lg ${isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-main)]'}`}>
                        {faq.question}
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="shrink-0 text-blue-600 dark:text-blue-400"
                      >
                        <ChevronDown className="h-5 w-5" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeInOut' }}
                        >
                          <p className="px-5 pb-6 text-sm leading-relaxed text-[var(--text-muted)] md:px-7 md:text-base">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Closing CTA */}
          <section className={`rounded-[2rem] border border-[var(--border-color)] bg-[var(--card)] px-6 py-12 text-center md:px-12 md:py-14 ${clayShadow}`}>
            <div className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 ${clayShadow}`}>
              <ArrowRight className="h-7 w-7" />
            </div>
            <h2 className="mb-4 text-3xl font-black tracking-tight md:text-4xl">
              Your next connection starts here.
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-[var(--text-muted)] md:text-lg">
              Explore what’s live, meet creators, and become part of the
              conversation on zQuab.
            </p>
            <motion.button
              type="button"
              onClick={() => navigate('/')}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-blue-600 px-8 py-4 font-black text-white shadow-[5px_5px_12px_rgba(37,99,235,0.28),-3px_-3px_8px_rgba(255,255,255,0.8)] transition-colors hover:bg-blue-700 dark:shadow-[5px_5px_12px_rgba(0,0,0,0.28),-2px_-2px_6px_rgba(255,255,255,0.04)]"
            >
              Explore zQuab <ArrowRight className="h-5 w-5" />
            </motion.button>
          </section>
        </div>
      </main>
    </>
  );
}
