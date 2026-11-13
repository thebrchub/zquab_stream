import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Coins, History } from 'lucide-react';
import { apiClient } from '../../api/client';
import PaginationLoader from '../../components/PaginationLoader';
import type { TransactionFilter, WalletTransaction } from '../../types/wallet';

const PAGE_SIZE = 20;

const FILTERS: { value: TransactionFilter; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'earned', label: 'Earned' },
  { value: 'spent', label: 'Spent' },
  { value: 'topup', label: 'Top-ups' },
];

const at = (username?: string | null) => (username ? `@${username}` : '');

// What the transaction was for, e.g. "Gift sent to @creator · Stream title".
function describe(tx: WalletTransaction): { title: string; detail: string } {
  const stream = tx.stream_title || '';
  const creator = at(tx.counterparty_username || tx.stream_creator_username);
  const other = at(tx.counterparty_username);
  switch (tx.type) {
    case 'purchase':
      return { title: 'Top-up', detail: 'zCoins bought' };
    case 'gift_sent':
      return { title: creator ? `Gift sent to ${creator}` : 'Gift sent', detail: stream };
    case 'gift_received':
      return { title: other ? `Gift from ${other}` : 'Gift received', detail: stream };
    case 'premium_entry':
      return { title: creator ? `Premium entry · ${creator}` : 'Premium entry', detail: stream };
    case 'premium_entry_earning':
      return { title: other ? `Premium entry from ${other}` : 'Premium entry earned', detail: stream };
    case 'admin_adjustment':
      return { title: 'Adjustment', detail: tx.note || '' };
    default:
      return { title: 'Transaction', detail: tx.note || '' };
  }
}

export default function TransactionHistoryPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<TransactionFilter>('');
  const [items, setItems] = useState<WalletTransaction[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ignores answers for a filter the user has already switched away from.
  const requestIdRef = useRef(0);
  const loadingRef = useRef(false);
  const offsetRef = useRef(0);

  const loadPage = useCallback(async (reset: boolean) => {
    if (loadingRef.current && !reset) return;
    const requestId = ++requestIdRef.current;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    const offset = reset ? 0 : offsetRef.current;
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (filter) params.append('type', filter);
      const res = await apiClient.get(`/wallet/transactions?${params.toString()}`);
      if (requestId !== requestIdRef.current) return;
      const page: WalletTransaction[] = res.data || [];
      offsetRef.current = offset + page.length;
      setItems((prev) => (reset ? page : [...prev, ...page]));
      setHasMore(page.length === PAGE_SIZE);
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      setError(err?.message || 'Could not load transactions.');
      setHasMore(false);
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [filter]);

  useEffect(() => {
    setItems([]);
    setHasMore(true);
    offsetRef.current = 0;
    void loadPage(true);
  }, [loadPage]);

  const loadMore = useCallback(() => void loadPage(false), [loadPage]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-6 sm:px-6 sm:pt-8 text-[var(--text-main)]">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card)] px-3.5 py-2.5 text-xs font-bold text-[var(--text-muted)] transition hover:text-[var(--text-main)] active:scale-95"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-[1.25rem] text-amber-500 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight leading-none mb-1.5">Transaction History</h1>
          <p className="text-xs text-[var(--text-muted)] font-medium">Every zCoin you bought, spent and earned.</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
              filter === f.value
                ? 'bg-[#3B82F6] text-white shadow-md'
                : 'bg-[var(--card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--card)] shadow-[4px_4px_10px_rgba(0,0,0,0.2),-2px_-2px_6px_rgba(255,255,255,0.02)] overflow-hidden">
        {items.length === 0 && !isLoading && !error && (
          <div className="p-10 text-center text-sm font-medium text-[var(--text-muted)]">
            <Coins className="mx-auto mb-3 h-8 w-8 opacity-40" />
            No transactions yet.
          </div>
        )}

        {items.map((tx, idx) => {
          const { title, detail } = describe(tx);
          const incoming = tx.amount_coins > 0;
          return (
            <div
              key={tx.id}
              className={`flex items-center gap-3.5 px-4 py-3.5 sm:px-5 ${idx > 0 ? 'border-t border-[var(--border-color)]' : ''}`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${incoming ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {incoming ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{title}</div>
                <div className="truncate text-[11px] text-[var(--text-muted)]">
                  {new Date(tx.created_at).toLocaleString()}
                  {detail && ` · ${detail}`}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className={`text-sm font-black tabular-nums ${incoming ? 'text-emerald-500' : 'text-red-500'}`}>
                  {incoming ? '+' : ''}{tx.amount_coins.toLocaleString()} 🪙
                </div>
                <div className="text-[10px] text-[var(--text-muted)] tabular-nums">
                  Balance {tx.balance_after.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}

        {error && <p className="p-5 text-center text-sm text-red-500">{error}</p>}
      </div>

      <PaginationLoader onLoadMore={loadMore} hasMore={hasMore && !error} isLoading={isLoading} />
    </main>
  );
}
