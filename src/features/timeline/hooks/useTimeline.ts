import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../auth/hooks/useAuth";
const PAGE_SIZE = 20;
export type TimelineItem = {
  id: string;
  company_id: string | null;
  action: string | null;
  entity_type: string | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};
type FetchMode = "reset" | "append";
export function useTimeline() {
  const mountedRef = useRef(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { isAuthenticated, companyId } = useAuth();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fetchPage = useCallback(
    async (targetPage: number, mode: FetchMode) => {
      if (!isAuthenticated || !companyId) {
        if (!mountedRef.current) return;
        setItems([]);
        setHasMore(false);
        setPage(0);
        setError(null);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }
      if (mode === "reset") {
        if (targetPage === 0) setLoading(true);
        else setRefreshing(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      const from = targetPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      try {
        const { data, error: fetchError } = await supabase
          .from("audit_logs")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .range(from, to);
        if (!mountedRef.current) return;
        if (fetchError) {
          if (mode === "reset") {
            setItems([]);
            setHasMore(false);
            setPage(0);
          }
          setError(fetchError.message);
          return;
        }
        const rows = (data ?? []) as Record<string, unknown>[];
        const mapped: TimelineItem[] = rows.map((r) => ({
          id: String(r.id ?? ""),
          company_id: (r.company_id as string | null) ?? null,
          action: (r.action as string | null) ?? null,
          entity_type:
            (r.entity_type as string | null) ??
            ((r.metadata as Record<string, unknown> | null)?.entity_type as string | null) ??
            null,
          actor_name: (r.actor_name as string | null) ?? null,
          actor_email: (r.actor_email as string | null) ?? null,
          actor_id: (r.actor_id as string | null) ?? null,
          metadata: (r.metadata as Record<string, unknown> | null) ?? null,
          created_at: (r.created_at as string | null) ?? null,
        }));
        if (mode === "reset") {
          setItems(mapped);
        } else {
          setItems((prev) => {
            const next = [...prev];
            for (const row of mapped) {
              if (!next.some((x) => x.id === row.id)) next.push(row);
            }
            return next;
          });
        }
        setHasMore(mapped.length === PAGE_SIZE);
        setPage(targetPage);
      } catch (e: unknown) {
        if (!mountedRef.current) return;
        if (mode === "reset") {
          setItems([]);
          setHasMore(false);
          setPage(0);
        }
        setError(e instanceof Error ? e.message : "Impossible de charger la timeline");
      } finally {
        if (!mountedRef.current) return;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [isAuthenticated, companyId]
  );
  const reload = useCallback(async () => {
    await fetchPage(0, "reset");
  }, [fetchPage]);
  const loadMore = useCallback(async () => {
    if (loading || refreshing || loadingMore || !hasMore) return;
    await fetchPage(page + 1, "append");
  }, [fetchPage, page, loading, refreshing, loadingMore, hasMore]);
  useEffect(() => {
    mountedRef.current = true;
    void reload();
    return () => {
      mountedRef.current = false;
    };
  }, [reload]);
  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (!isAuthenticated || !companyId) return;
    const channel = supabase
      .channel(`timeline:audit_logs:${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "audit_logs",
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          const r = (payload.new ?? {}) as Record<string, unknown>;
          const next: TimelineItem = {
            id: String(r.id ?? ""),
            company_id: (r.company_id as string | null) ?? null,
            action: (r.action as string | null) ?? null,
            entity_type:
              (r.entity_type as string | null) ??
              ((r.metadata as Record<string, unknown> | null)?.entity_type as string | null) ??
              null,
            actor_name: (r.actor_name as string | null) ?? null,
            actor_email: (r.actor_email as string | null) ?? null,
            actor_id: (r.actor_id as string | null) ?? null,
            metadata: (r.metadata as Record<string, unknown> | null) ?? null,
            created_at: (r.created_at as string | null) ?? null,
          };
          setItems((prev) => {
            if (prev.some((x) => x.id === next.id)) return prev;
            return [next, ...prev];
          });
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAuthenticated, companyId]);
  return useMemo(
    () => ({
      items,
      loading,
      refreshing,
      loadingMore,
      hasMore,
      error,
      reload,
      loadMore,
    }),
    [items, loading, refreshing, loadingMore, hasMore, error, reload, loadMore]
  );
}
