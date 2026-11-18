
import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Globe,
  LogIn,
  Radio,
  ShieldCheck,
  Users,
  Video,
  Loader2
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

type AccountType = 'user' | 'creator';

type SocialLinks = {
  instagram: string;
  youtube: string;
  twitter: string;
  other: string;
};

const initialLinks: SocialLinks = {
  instagram: '',
  youtube: '',
  twitter: '',
  other: '',
};

const socialFields = [
  {
    key: 'instagram' as const,
    label: 'Instagram',
    placeholder: 'Instagram URL',
    Icon: Camera,
  },
  {
    key: 'youtube' as const,
    label: 'YouTube',
    placeholder: 'YouTube URL',
    Icon: Video,
  },
  {
    key: 'twitter' as const,
    label: 'X / Twitter',
    placeholder: 'X profile URL',
    Icon: Globe,
  },
  {
    key: 'other' as const,
    label: 'Other',
    placeholder: 'Other profile URL',
    Icon: Radio,
  },
];

export default function WaitlistPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const initialType = searchParams.get('type');

  const [accountType, setAccountType] = useState<AccountType | null>(
    initialType === 'user' || initialType === 'creator'
      ? initialType
      : null
  );

  const [links, setLinks] = useState<SocialLinks>(initialLinks);
  const [error, setError] = useState('');
  // The waitlist API is not connected yet, so submission cannot enter a loading/success state.
  const isApplying = false;
  const submitted = false;

  const filledLinks = Object.values(links).filter(
    (value) => value.trim().length > 0
  ).length;

  const canApply =
    accountType === 'user' ||
    (accountType === 'creator' && filledLinks >= 2);

  const clayCard =
    'bg-[var(--card)] border border-[var(--border-color)] ' +
    'shadow-[7px_7px_18px_rgba(0,0,0,0.30),-3px_-3px_12px_rgba(255,255,255,0.035),inset_1px_1px_3px_rgba(255,255,255,0.07),inset_-1px_-1px_3px_rgba(0,0,0,0.18)]';

  const clayButton =
    'shadow-[3px_3px_7px_rgba(0,0,0,0.35),-2px_-2px_5px_rgba(255,255,255,0.04),inset_1px_1px_3px_rgba(255,255,255,0.15),inset_-1px_-1px_3px_rgba(0,0,0,0.25)] transition-all duration-200 active:scale-[0.98]';

  const inputClass =
    'w-full rounded-xl border border-[var(--border-color)] ' +
    'bg-[var(--background)] px-4 py-3 text-sm ' +
    'text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)] ' +
    'focus:border-[#4F46E5] transition-colors';

  const handleLogin = () => {
    if (!accountType) return;

    const returnPath = `${location.pathname}?type=${accountType}`;

    navigate(`/auth?next=${encodeURIComponent(returnPath)}`);
  };

  const handleApply = async () => {
    if (!user || !accountType) return;

    if (accountType === 'creator' && filledLinks < 2) {
      setError('Please provide at least two social profile links.');
      return;
    }

    setError('');

    /*
      TODO: Connect the actual waitlist application API here.

      Expected data:
      {
        account_type: accountType,
        social_links: accountType === 'creator' ? links : null
      }

      Use the authenticated session with credentials: 'include'.

      Do not show success until the backend confirms the application.
    */

    setError('Waitlist application API is not connected yet.');
  };

  const updateLink = (key: keyof SocialLinks, value: string) => {
    setLinks((current) => ({
      ...current,
      [key]: value,
    }));

    setError('');
  };

  const changeAccountType = () => {
    setAccountType(null);
    setLinks(initialLinks);
    setError('');

    navigate(location.pathname, { replace: true });
  };

  return (
    <main className="
      relative isolate w-full min-h-[100dvh]
      bg-[var(--background)] text-[var(--text-main)]
      overflow-x-hidden
      lg:h-[100dvh] lg:min-h-0 lg:overflow-hidden
    ">
      <SEO
        title="Early Access | zQuab"
        description="Apply for early access to zQuab."
        path="/waitlist"
      />

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[450px] w-[450px] rounded-full bg-blue-500/[0.09] blur-[130px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/[0.11] blur-[140px]" />
        <div className="absolute left-1/2 top-1/2 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/[0.035] blur-[120px]" />
      </div>

      {/* Main layout - space reserved for future navbar */}
      <div className="
        mx-auto flex w-full max-w-[1200px] flex-col
        px-5 pb-8 pt-8
        lg:h-full lg:justify-center lg:px-10
        lg:pb-8 lg:pt-20
      ">
        <div className="
          grid w-full items-center gap-9
          lg:grid-cols-[1fr_460px] lg:gap-16
        ">

          {/* Left content */}
          <section className="
            flex flex-col justify-center text-center
            lg:text-left
          ">
            <div className="
              mx-auto mb-6 inline-flex items-center gap-2
              rounded-full border border-[#4F46E5]/20
              bg-[#4F46E5]/[0.08] px-3.5 py-2
              text-[10px] font-bold uppercase tracking-[0.17em]
              text-[#818CF8]
              lg:mx-0 lg:w-fit
            ">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              A new way to connect
            </div>

            <h1 className="
              text-4xl font-black leading-[1.08]
              tracking-[-0.055em]
              sm:text-5xl
              lg:text-[clamp(3.2rem,5vw,5rem)]
            ">
              Your next
              <br />
              connection
              <span className="
                block bg-gradient-to-r from-blue-400
                via-indigo-400 to-violet-500
                bg-clip-text text-transparent
              ">
                starts here.
              </span>
            </h1>

            <p className="
              mx-auto mt-5 max-w-[430px]
              text-sm leading-7 text-[var(--text-muted)]
              sm:text-base
              lg:mx-0
            ">
              Meet new people, discover creators and experience
              live connections. Something new is coming to zQuab.
            </p>

            {/* Small supporting points */}
            <div className="
              mt-7 flex flex-wrap items-center
              justify-center gap-x-5 gap-y-3
              text-xs font-medium text-[var(--text-muted)]
              lg:justify-start
            ">
              <span className="flex items-center gap-2">
                <Users size={15} className="text-blue-400" />
                Meet people
              </span>

              <span className="flex items-center gap-2">
                <Radio size={15} className="text-violet-400" />
                Discover creators
              </span>
            </div>
          </section>

          {/* Application card */}
          <section className="
            w-full max-w-[460px] justify-self-center
            lg:justify-self-end
          ">
            <div className={`
              ${clayCard}
              rounded-[28px] p-6 sm:p-8
            `}>

              {!submitted ? (
                <>
                  {/* Card heading */}
                  <div className="mb-6">
                    <p className="
                      text-[10px] font-bold uppercase
                      tracking-[0.19em] text-[#818CF8]
                    ">
                      Early access application
                    </p>

                    <h2 className="mt-2 text-2xl font-black tracking-tight">
                      {accountType ? 'Almost there.' : 'Get on the list.'}
                    </h2>

                    <p className="
                      mt-2 text-sm leading-6
                      text-[var(--text-muted)]
                    ">
                      {accountType
                        ? 'Complete your application to get early access.'
                        : 'Choose how you would like to experience zQuab.'}
                    </p>
                  </div>

                  {!accountType ? (
                    /* Account selection */
                    <div className="space-y-3">

                      <button
                        type="button"
                        onClick={() => setAccountType('user')}
                        className={`
                          ${clayCard} ${clayButton}
                          group flex w-full items-center gap-4
                          rounded-2xl p-4 text-left
                          hover:border-blue-500/40
                        `}
                      >
                        <div className="
                          flex h-12 w-12 shrink-0 items-center
                          justify-center rounded-xl
                          border border-blue-500/15
                          bg-blue-500/[0.09] text-blue-400
                          shadow-[inset_2px_2px_5px_rgba(0,0,0,.2),inset_-2px_-2px_5px_rgba(255,255,255,.03)]
                        ">
                          <Users size={22} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold">
                            Regular User
                          </p>
                          <p className="
                            mt-1 text-xs leading-5
                            text-[var(--text-muted)]
                          ">
                            Chat, meet people and discover streams.
                          </p>
                        </div>

                        <ArrowRight
                          size={18}
                          className="
                            shrink-0 text-[var(--text-muted)]
                            transition group-hover:translate-x-1
                            group-hover:text-blue-400
                          "
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => setAccountType('creator')}
                        className={`
                          ${clayCard} ${clayButton}
                          group flex w-full items-center gap-4
                          rounded-2xl p-4 text-left
                          hover:border-violet-500/40
                        `}
                      >
                        <div className="
                          flex h-12 w-12 shrink-0 items-center
                          justify-center rounded-xl
                          border border-violet-500/15
                          bg-violet-500/[0.09] text-violet-400
                          shadow-[inset_2px_2px_5px_rgba(0,0,0,.2),inset_-2px_-2px_5px_rgba(255,255,255,.03)]
                        ">
                          <Radio size={22} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold">
                              Content Creator
                            </p>
                            <span className="
                              rounded-full bg-violet-500/10
                              px-2 py-0.5 text-[9px]
                              font-bold uppercase tracking-wider
                              text-violet-400
                            ">
                              Early access
                            </span>
                          </div>

                          <p className="
                            mt-1 text-xs leading-5
                            text-[var(--text-muted)]
                          ">
                            Go live and build your community.
                          </p>
                        </div>

                        <ArrowRight
                          size={18}
                          className="
                            shrink-0 text-[var(--text-muted)]
                            transition group-hover:translate-x-1
                            group-hover:text-violet-400
                          "
                        />
                      </button>
                    </div>
                  ) : (
                    /* Application details */
                    <div className="space-y-4">

                      <button
                        type="button"
                        onClick={changeAccountType}
                        className="
                          flex items-center gap-2 text-xs
                          font-semibold text-[var(--text-muted)]
                          transition hover:text-[var(--text-main)]
                        "
                      >
                        <ArrowLeft size={14} />
                        Change account type
                      </button>

                      <div className="
                        flex items-center gap-3 rounded-xl
                        border border-[var(--border-color)]
                        bg-[var(--background)] p-3
                      ">
                        {accountType === 'creator' ? (
                          <Radio size={19} className="text-violet-400" />
                        ) : (
                          <Users size={19} className="text-blue-400" />
                        )}

                        <div>
                          <p className="text-sm font-bold">
                            {accountType === 'creator'
                              ? 'Content Creator'
                              : 'Regular User'}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            Selected account type
                          </p>
                        </div>
                      </div>

                      {/* Creator links */}
                      {accountType === 'creator' && (
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-bold">
                              Social profiles
                            </p>

                            <span className="
                              text-[10px] font-bold
                              text-[#818CF8]
                            ">
                              {filledLinks}/2 required
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {socialFields.map(({ key, placeholder, Icon }) => (
                              <div className="relative" key={key}>
                                <Icon
                                  size={15}
                                  className="
                                    absolute left-3.5 top-1/2
                                    -translate-y-1/2
                                    text-[var(--text-muted)]
                                  "
                                />

                                <input
                                  type="url"
                                  value={links[key]}
                                  onChange={(event) =>
                                    updateLink(key, event.target.value)
                                  }
                                  placeholder={placeholder}
                                  className={`${inputClass} pl-10 pr-9`}
                                />

                                {links[key].trim() && (
                                  <Check
                                    size={14}
                                    className="
                                      absolute right-3 top-1/2
                                      -translate-y-1/2
                                      text-emerald-400
                                    "
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Authentication */}
                      {user ? (
                        <div className="
                          flex items-center gap-3 rounded-xl
                          border border-emerald-500/20
                          bg-emerald-500/[0.06] p-3.5
                        ">
                          <CheckCircle2
                            size={19}
                            className="text-emerald-400"
                          />
                          <div>
                            <p className="text-xs font-bold text-emerald-400">
                              You're signed in
                            </p>
                            <p className="
                              mt-0.5 text-[10px]
                              text-[var(--text-muted)]
                            ">
                              Your account is ready.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="
                          rounded-xl border border-[var(--border-color)]
                          bg-[var(--background)] p-4 text-center
                        ">
                          <LogIn
                            size={21}
                            className="mx-auto text-[#818CF8]"
                          />

                          <p className="mt-2 text-sm font-bold">
                            Sign in to continue
                          </p>

                          <p className="
                            mt-1 text-xs
                            text-[var(--text-muted)]
                          ">
                            Use your Google account to apply.
                          </p>

                          <button
                            type="button"
                            onClick={handleLogin}
                            className={`
                              ${clayButton}
                              mt-3 flex w-full items-center
                              justify-center gap-2 rounded-full
                              bg-[#4F46E5] px-4 py-3
                              text-xs font-bold text-white
                            `}
                          >
                            Continue with Google
                            <ArrowRight size={15} />
                          </button>
                        </div>
                      )}

                      {/* Apply button */}
                      {user && (
                        <button
                          type="button"
                          onClick={handleApply}
                          disabled={isApplying || !canApply}
                          className={`
                            ${clayButton}
                            flex w-full items-center
                            justify-center gap-2 rounded-full
                            bg-[#4F46E5] px-5 py-3.5
                            text-sm font-bold text-white
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          `}
                        >
                          {isApplying ? (
                            <Loader2 size={17} className="animate-spin" />
                          ) : (
                            <>
                              Apply for early access
                              <ArrowRight size={16} />
                            </>
                          )}
                        </button>
                      )}

                      {error && (
                        <p
                          role="alert"
                          className="text-center text-xs text-rose-400"
                        >
                          {error}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center">
                  <CheckCircle2
                    size={42}
                    className="mx-auto text-emerald-400"
                  />
                  <h2 className="mt-4 text-2xl font-black">
                    Application received!
                  </h2>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    Thank you for your interest in zQuab.
                  </p>
                </div>
              )}

              {/* Card footer */}
              <div className="
                mt-6 flex items-center justify-center gap-2
                border-t border-[var(--border-color)] pt-4
              ">
                <ShieldCheck
                  size={13}
                  className="text-[var(--text-muted)]"
                />
                <span className="
                  text-[10px] text-[var(--text-muted)]
                ">
                  Your information stays private.
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="
          mt-8 flex items-center justify-center
          text-[10px] text-[var(--text-muted)]
          lg:mt-5
        ">
          © {new Date().getFullYear()} zQuab · Made for real connections.
        </footer>
      </div>
    </main>
  );
}
