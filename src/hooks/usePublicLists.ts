import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// Search boxes: search only from this many characters, after the user stops typing for SEARCH_WAIT_MS.
export const SEARCH_MIN_CHARS = 2;
const SEARCH_WAIT_MS = 300;

// The form every search endpoint normalizes to (trimmed, single spaces).
export const normalizeSearch = (q: string) => q.trim().replace(/\s+/g, ' ');

const isSearchable = (q: string) => [...q].length >= SEARCH_MIN_CHARS;

/**
 * Runs `search` for `query` once typing pauses (300 ms) and only from 2
 * characters; a newer keypress cancels the request in flight (AbortController).
 * Change `scope` to search the same text somewhere else (e.g. "friends" vs "everyone").
 * `search` null turns searching off.
 */
export function useDebouncedSearch<T>(
  query: string,
  search: ((q: string, signal: AbortSignal) => Promise<T[]>) | null,
  scope = '',
) {
  const q = normalizeSearch(query);
  const active = search !== null && isSearchable(q);
  const key = `${scope}\u0000${q}`;
  const [done, setDone] = useState<{ key: string; results: T[]; failed: boolean } | null>(null);

  const searchRef = useRef(search);
  useLayoutEffect(() => {
    searchRef.current = search;
  });

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const run = searchRef.current;
      if (!run) return;
      run(q, controller.signal)
        .then((results) => setDone({ key, results, failed: false }))
        .catch(() => {
          if (!controller.signal.aborted) setDone({ key, results: [], failed: true });
        });
    }, SEARCH_WAIT_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [active, key, q]);

  const current = active && done?.key === key ? done : null;
  return {
    active,
    results: current?.results ?? [],
    isSearching: active && !current,
    failed: current?.failed ?? false,
  };
}

export interface ListPage<T> {
  ver: number;
  has_more: boolean;
  items: T[];
}

/**
 * Loads a public directory list (creators, streams) page by page for infinite
 * scroll. Later pages carry the first page's version, so a list rebuilt in the
 * meantime never repeats or skips items while scrolling; if that version has
 * expired (410) the list starts again from the top. A change of `resetKey`
 * (category, …) reloads from page 0; `enabled` false keeps it empty.
 */
export function useDirectoryList<T>(
  fetchPage: (ver: number | undefined, page: number, signal: AbortSignal) => Promise<ListPage<T>>,
  keyOf: (item: T) => string,
  resetKey: string,
  enabled = true,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const fetchRef = useRef(fetchPage);
  const keyOfRef = useRef(keyOf);
  const resetKeyRef = useRef(resetKey);
  useLayoutEffect(() => {
    fetchRef.current = fetchPage;
    keyOfRef.current = keyOf;
    resetKeyRef.current = resetKey;
  });

  const verRef = useRef<number | undefined>(undefined);
  const nextPageRef = useRef(0);
  const hasMoreRef = useRef(false);
  const loadingRef = useRef(false);
  const generationRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async (reset: boolean) => {
    if (!reset && (loadingRef.current || !hasMoreRef.current)) return;
    // A 410 (the version being scrolled has expired) restarts once from the top.
    let restart = reset;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (restart) {
        generationRef.current += 1;
        verRef.current = undefined;
        nextPageRef.current = 0;
      }
      const fromTop = restart;
      const generation = generationRef.current;
      const listKey = resetKeyRef.current;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      loadingRef.current = true;
      setIsLoading(true);
      try {
        const res = await fetchRef.current(verRef.current, nextPageRef.current, controller.signal);
        if (generation !== generationRef.current) return;
        verRef.current = res.ver || undefined;
        nextPageRef.current += 1;
        hasMoreRef.current = res.has_more;
        setHasMore(res.has_more);
        const keyOfItem = keyOfRef.current;
        setItems((prev) => {
          const base = fromTop ? [] : prev;
          const seen = new Set(base.map(keyOfItem));
          return [...base, ...res.items.filter((item) => !seen.has(keyOfItem(item)))];
        });
        if (fromTop) setLoadedKey(listKey);
        return;
      } catch (err) {
        if (generation !== generationRef.current || controller.signal.aborted) return;
        if ((err as { status?: number })?.status === 410 && attempt === 0) {
          restart = true;
          continue;
        }
        hasMoreRef.current = false;
        setHasMore(false);
        return;
      } finally {
        if (generation === generationRef.current && controllerRef.current === controller) {
          loadingRef.current = false;
          setIsLoading(false);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      void load(true);
    } else {
      generationRef.current += 1;
      controllerRef.current?.abort();
      loadingRef.current = false;
      hasMoreRef.current = false;
    }
    return () => controllerRef.current?.abort();
  }, [enabled, resetKey, load]);

  const loadMore = useCallback(() => void load(false), [load]);
  const reload = useCallback(() => void load(true), [load]);

  // Items of another list (the previous category) are never shown.
  const current = enabled && loadedKey === resetKey;
  return {
    items: current ? items : [],
    setItems,
    isLoading: enabled && isLoading,
    hasMore: current && hasMore,
    loadMore,
    reload,
  };
}
