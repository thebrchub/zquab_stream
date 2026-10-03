import { useState } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import SEO from '../components/SEO';

const GOOGLE_CLIENT_ID = "1024944888869-9356nb9mq73ki2u2tch6ebtaoic7q3bg.apps.googleusercontent.com";

function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshSession, loginAsGuest } = useAuth();

  const handleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    const HOST = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8080' : 'https://aarpaar-api.brchub.tech');
    
    try {
      const response = await fetch(`${HOST}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ google_id_token: credentialResponse.credential }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Backend authentication failed');
      }

      await refreshSession();
      navigate('/home');
    } catch (error: any) {
      console.error(error);
      alert(`Failed to log in: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      await loginAsGuest();
      navigate('/chat');
    } catch (err) {
      console.error('Failed to authenticate as guest:', err);
      alert('Failed to connect as guest. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Log In / Sign Up | zQuab Anonymous Chat"
        description="Create a free zQuab account to save your connections, add friends from your anonymous chats, and keep the conversation going safely in DMs."
        path="/auth"
      />

      <div className="w-full max-w-md z-10 flex flex-col">
        {/* Claymorphic Card Shell matching Navbar center pill depth */}
        <div className="bg-[var(--card)] border border-[var(--border-color)] rounded-[2.5rem] p-8 sm:p-10 shadow-[8px_8px_24px_rgba(0,0,0,0.35),-4px_-4px_16px_rgba(255,255,255,0.03),inset_1px_1px_3px_rgba(255,255,255,0.08),inset_-1px_-1px_3px_rgba(0,0,0,0.25)] w-full text-center relative z-10">
          
          <div className="mb-8">
            <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">
              Welcome to zQuab
            </h1>
            <p className="text-[var(--text-muted)] text-sm sm:text-base mt-3 leading-relaxed">
              Sign in or create an account in seconds to start adding friends and saving your chats.
            </p>
          </div>

          <div className="flex flex-col gap-4 items-center w-full">
            {/* Claymorphic Pill Wrapper for Google Auth */}
            <div className="w-full max-w-[320px] flex items-center justify-center min-h-[50px] bg-[var(--card)] border border-[var(--border-color)] rounded-full p-1 shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.03),inset_1px_1px_3px_rgba(255,255,255,0.1),inset_-1px_-1px_3px_rgba(0,0,0,0.2)] transition-transform duration-200 active:scale-95">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-[var(--text-muted)]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#4F46E5]" />
                  <span>Connecting...</span>
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => {
                    console.error('Google Login Failed');
                    alert('Google Login failed. Please try again.');
                  }}
                  useOneTap
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  width="300"
                />
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center w-full max-w-[320px] my-2">
              <div className="flex-1 h-px bg-[var(--border-color)]"></div>
              <span className="px-3 text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">or</span>
              <div className="flex-1 h-px bg-[var(--border-color)]"></div>
            </div>

            {/* Exact Navbar Clay Button Replica (Start as Guest) */}
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full max-w-[320px] flex items-center justify-center gap-2 bg-[#4F46E5] text-white px-5 py-3 rounded-full font-bold transition-transform duration-200 active:scale-95 disabled:opacity-70 text-sm shadow-[4px_4px_8px_rgba(0,0,0,0.5),-2px_-2px_6px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] hover:shadow-[2px_2px_6px_rgba(0,0,0,0.5),-1px_-1px_4px_rgba(255,255,255,0.05),inset_1px_1px_3px_rgba(255,255,255,0.3),inset_-1px_-1px_3px_rgba(0,0,0,0.4)]"
            >
              <span>Continue as Guest</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[var(--text-muted)] mt-8 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="/terms" className="underline hover:text-[#4F46E5] transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline hover:text-[#4F46E5] transition-colors">
              Privacy Policy
            </a>.
          </p>
        </div>
      </div>
    </>
  );
}

export default function AuthPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-[calc(100dvh-5rem)] flex flex-col justify-center items-center px-4 py-12 bg-[var(--background)] relative overflow-hidden">
        {/* Soft background ambient glows */}
        <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-[#4F46E5]/15 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

        <AuthForm />
      </div>
    </GoogleOAuthProvider>
  );
}