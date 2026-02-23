import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../auth/hooks/useAuth";
const PAGE_SIZE = 25;
export type SecurityLogItem = {
  id: string;
  company_id: string | null;
  created_at: string | null;
  event_type: string | null;
  action: string | null;
  status: string | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_id: string | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
};
type FetchMode = "reset" | "append";
export function useSecurityLogs() {
  const mountedRef = useRef(true);
  const { isAuthenticated, companyId } = useAuth();
  const [items, setItems] = useState<SecurityLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fetchLogs = useCallback(
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
        const { data, error: queryError } = await supabase
          .from("security_logs")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .range(from, to);
        if (!mountedRef.current) return;
        if (queryError) {
          if (mode === "reset") {
            setItems([]);
            setHasMore(false);
            setPage(0);
          }
          setError(queryError.message);
          return;
        }
        const rows = (data ?? []) as Record<string, unknown>[];
        const mapped = rows.map((row): SecurityLogItem => ({
          id: String(row.id ?? ""),
          company_id: (row.company_id as string | null) ?? null,
          created_at: (row.created_at as string | null) ?? null,
          event_type: (row.event_type as string | null) ?? null,
          action: (row.action as string | null) ?? null,
          status: (row.status as string | null) ?? null,
          actor_name: (row.actor_name as string | null) ?? null,
          actor_email: (row.actor_email as string | null) ?? null,
          actor_id: (row.actor_id as string | null) ?? null,
          message: (row.message as string | null) ?? null,
          metadata: (row.metadata as Record<string, unknown> | null) ?? null,
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
        setError(e instanceof Error ? e.message : "Impossible de charger les logs de sécurité");
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
    await fetchLogs(0, "reset");
  }, [fetchLogs]);
  const loadMore = useCallback(async () => {
    if (loading || refreshing || loadingMore || !hasMore) return;
    await fetchLogs(page + 1, "append");
  }, [fetchLogs, page, loading, refreshing, loadingMore, hasMore]);
  useEffect(() => {
    mountedRef.current = true;
    void reload();
    return () => {
      mountedRef.current = false;
    };
  }, [reload]);
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
