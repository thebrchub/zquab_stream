import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket, wsEvents } from '../context/WebSocketContext';
import { useWallet } from '../context/WalletContext';
import type {
  StreamConfirmRequiredEvent,
  StreamEnterErrorEvent,
  StreamEnterOkEvent,
} from '../types/streamEvents';

// Renew a random 1–2 minutes before the ticket expires. Viewers who joined in the same window share
// one ticket and expiry (5–10 min), so the random lead keeps them from all renewing at once.
const RENEW_LEAD_MIN_MS = 60_000;
const RENEW_LEAD_MAX_MS = 120_000;
const MIN_RENEW_DELAY_MS = 15_000;
const RENEW_RETRY_MS = 30_000;
// No answer to stream_enter within this long counts as the stream being unavailable.
const ANSWER_TIMEOUT_MS = 15_000;

const UNAVAILABLE = 'Stream is offline or unavailable.';

interface EntryState {
  streamId?: string;
  isAnswered: boolean;
  playbackUrl: string | null;
  error: string | null;
  isLoginRequired: boolean;
  confirmPrice: number | null;
  // Balance the server called too low; the paywall lifts once the balance changes.
  paywallBalance: number | null;
  isUnlocking: boolean;
}

const initialState = (streamId?: string): EntryState => ({
  streamId,
  isAnswered: false,
  playbackUrl: null,
  error: null,
  isLoginRequired: false,
  confirmPrice: null,
  paywallBalance: null,
  isUnlocking: false,
});

type EntryChanges = Partial<EntryState> | ((current: EntryState) => Partial<EntryState>);

// Gets (and keeps renewing) the playback ticket over the WebSocket with "stream_enter".
export const useStreamEntry = (streamId: string | undefined, enabled = true) => {
  const { isConnected, sendMessage } = useWebSocket();
  const { balanceCoins, updateBalanceLocally } = useWallet();
  const [state, setState] = useState<EntryState>(() => initialState(streamId));

  const renewTimerRef = useRef<number | undefined>(undefined);
  const answerTimerRef = useRef<number | undefined>(undefined);
  const answerWaitersRef = useRef<Array<() => void>>([]);
  const hasTicketRef = useRef(false);
  const sendEnterRef = useRef<(confirm: boolean) => boolean>(() => false);
  const walletRef = useRef({ balanceCoins, updateBalanceLocally });

  useEffect(() => {
    walletRef.current = { balanceCoins, updateBalanceLocally };
  }, [balanceCoins, updateBalanceLocally]);

  const update = useCallback((id: string, changes: EntryChanges) => {
    setState((s) => {
      const current = s.streamId === id ? s : initialState(id);
      return { ...current, ...(typeof changes === 'function' ? changes(current) : changes) };
    });
  }, []);

  const settleAnswer = useCallback(() => {
    window.clearTimeout(answerTimerRef.current);
    const waiters = answerWaitersRef.current;
    answerWaitersRef.current = [];
    waiters.forEach((resolve) => resolve());
  }, []);

  const scheduleRenewal = useCallback((delayMs: number) => {
    window.clearTimeout(renewTimerRef.current);
    renewTimerRef.current = window.setTimeout(() => sendEnterRef.current(false), delayMs);
  }, []);

  const sendEnter = useCallback((confirm: boolean) => {
    if (!streamId || !enabled) return false;
    if (!sendMessage('stream_enter', { stream_id: streamId, confirm })) return false;

    const id = streamId;
    window.clearTimeout(answerTimerRef.current);
    answerTimerRef.current = window.setTimeout(() => {
      settleAnswer();
      if (hasTicketRef.current) scheduleRenewal(RENEW_RETRY_MS);
      update(id, (s) => (s.isAnswered ? { isUnlocking: false } : { isAnswered: true, error: UNAVAILABLE }));
    }, ANSWER_TIMEOUT_MS);
    return true;
  }, [streamId, enabled, sendMessage, settleAnswer, scheduleRenewal, update]);

  useEffect(() => {
    sendEnterRef.current = sendEnter;
  }, [sendEnter]);

  // Answers carry the stream_id they answer; anything for another stream is ignored.
  useEffect(() => {
    if (!streamId || !enabled) return;
    const id = streamId;

    const unsubscribe = wsEvents.subscribe((msg) => {
      if (msg.type !== 'stream_enter_ok' && msg.type !== 'stream_confirm_required' && msg.type !== 'stream_enter_error') return;
      if (msg.payload?.stream_id !== id) return;
      settleAnswer();

      if (msg.type === 'stream_enter_ok') {
        const ok = msg.payload as StreamEnterOkEvent;
        if (ok.has_balance) walletRef.current.updateBalanceLocally(Number(ok.balance_coins));
        hasTicketRef.current = true;

        const expiresAtMs = Number(ok.expires_at) * 1000;
        if (expiresAtMs > 0) {
          const remainingMs = expiresAtMs - Date.now();
          const leadMs = RENEW_LEAD_MIN_MS + Math.random() * (RENEW_LEAD_MAX_MS - RENEW_LEAD_MIN_MS);
          scheduleRenewal(Math.max(MIN_RENEW_DELAY_MS, remainingMs > leadMs ? remainingMs - leadMs : remainingMs / 2));
        }
        update(id, {
          isAnswered: true,
          playbackUrl: ok.playback_url,
          error: null,
          isLoginRequired: false,
          confirmPrice: null,
          paywallBalance: null,
          isUnlocking: false,
        });
        return;
      }

      if (msg.type === 'stream_confirm_required') {
        const ask = msg.payload as StreamConfirmRequiredEvent;
        hasTicketRef.current = false;
        window.clearTimeout(renewTimerRef.current);
        update(id, {
          isAnswered: true,
          playbackUrl: null,
          error: null,
          confirmPrice: Number(ask.entry_price_coins),
          isUnlocking: false,
        });
        return;
      }

      const failure = msg.payload as StreamEnterErrorEvent;
      if (failure.code === 'INSUFFICIENT_BALANCE') {
        // The server sends the balance it refused at: no extra request.
        const balance = failure.has_balance ? Number(failure.balance_coins) : walletRef.current.balanceCoins;
        if (failure.has_balance) walletRef.current.updateBalanceLocally(balance);
        update(id, { isAnswered: true, paywallBalance: balance, isUnlocking: false });
        return;
      }
      if (failure.code === 'LOGIN_REQUIRED') {
        hasTicketRef.current = false;
        window.clearTimeout(renewTimerRef.current);
        update(id, {
          isAnswered: true,
          playbackUrl: null,
          isLoginRequired: true,
          error: failure.message || 'Log in to unlock this stream.',
          isUnlocking: false,
        });
        return;
      }
      if (hasTicketRef.current) {
        // A renewal failed: keep playing on the current ticket (the room's own events report an ended stream).
        if (failure.code === 'ENTER_FAILED') scheduleRenewal(RENEW_RETRY_MS);
        update(id, { isUnlocking: false });
        return;
      }
      update(id, { isAnswered: true, playbackUrl: null, error: failure.message || UNAVAILABLE, isUnlocking: false });
    });

    return () => {
      unsubscribe();
      window.clearTimeout(renewTimerRef.current);
      hasTicketRef.current = false;
      settleAnswer();
    };
  }, [streamId, enabled, settleAnswer, scheduleRenewal, update]);

  // Ask once the socket is open, and again after every reconnect (renewing never charges).
  useEffect(() => {
    if (isConnected) sendEnter(false);
  }, [isConnected, sendEnter]);

  const retryEnter = useCallback(() => {
    if (!streamId) return;
    hasTicketRef.current = false;
    setState(initialState(streamId));
    sendEnter(false);
  }, [streamId, sendEnter]);

  // The viewer's Unlock click: the only request that may charge.
  const unlock = useCallback(() => {
    if (!streamId || !sendEnter(true)) return;
    update(streamId, { isUnlocking: true, paywallBalance: null });
  }, [streamId, sendEnter, update]);

  // Asks for a fresh ticket without showing the loading state; resolves once the server answers.
  const refreshPlaybackUrl = useCallback(() => new Promise<void>((resolve) => {
    if (!sendEnter(false)) {
      resolve();
      return;
    }
    answerWaitersRef.current.push(resolve);
  }), [sendEnter]);

  const current = state.streamId === streamId ? state : initialState(streamId);

  return {
    playbackUrl: current.playbackUrl,
    isLoading: !current.isAnswered,
    error: current.error,
    isPaywall: current.paywallBalance !== null && current.paywallBalance === balanceCoins,
    isLoginRequired: current.isLoginRequired,
    confirmPrice: current.confirmPrice,
    needsConfirm: current.confirmPrice !== null && !current.playbackUrl,
    isUnlocking: current.isUnlocking,
    hasAccess: !!current.playbackUrl,
    unlock,
    retryEnter,
    refreshPlaybackUrl,
  };
};
