import { useCallback, useEffect, useMemo, useState } from "react";
import * as defaultService from "../services/contributonService";
import { sameTarget } from "../utils/boardModel";

export function useContributions(patientId, viewer, service = defaultService) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastSeen, setLastSeen] = useState(() => (viewer ? service.getLastSeen(patientId, viewer.key) : ""));
  const [seenBefore, setSeenBefore] = useState(lastSeen);

  const sectionsKey = (viewer?.sections ?? []).join(",");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!viewer || patientId == null) return;
    if (!silent) setLoading(true);
    setError("");
    try {
      setItems(await service.listContributions(patientId, viewer));
    } catch (err) {
      setError(err.message || "No pudimos cargar los aportes.");
    } finally {
      if (!silent) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, viewer?.key, viewer?.isAT, sectionsKey, service]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!viewer) return;
    const value = service.getLastSeen(patientId, viewer.key);
    setLastSeen(value);
    setSeenBefore(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, viewer?.key, service]);

  // Otro hilo de la misma página publicó, editó u ocultó un aporte: se recarga la lista desde el backend
  useEffect(() => {
    const onChange = (event) => {
      if (event.detail?.patientId && event.detail.patientId !== String(patientId)) return;
      load({ silent: true });
    };
    window.addEventListener(service.CHANGE_EVENT ?? "redat:contributions", onChange);
    return () => window.removeEventListener(service.CHANGE_EVENT ?? "redat:contributions", onChange);
  }, [load, patientId, service]);

  const forTarget = useCallback((target) => items.filter((item) => sameTarget(item.target, target)), [items]);

  const add = useCallback(async (target, text) => {
    const created = await service.addContribution(patientId, { target, text }, viewer, viewer);
    setItems((prev) => (prev.some((item) => item.id === created.id) ? prev : [...prev, created]));
    return created;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, viewer?.key, sectionsKey, service]);

  const edit = useCallback(async (id, text) => {
    const updated = await service.editContribution(patientId, id, text, viewer);
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, viewer?.key, service]);

  const remove = useCallback(async (id) => {
    await service.deleteContribution(patientId, id, viewer);
    setItems((prev) => prev.filter((item) => item.id !== id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, viewer?.key, service]);

  const setHidden = useCallback(async (id, hidden) => {
    const updated = await service.setContributionHidden(patientId, id, hidden, viewer);
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, viewer?.key, viewer?.isAT, service]);

  // Aportes de otras personas publicados después de la última visita
  const unseenCount = useMemo(
    () => items.filter((item) => item.authorKey !== viewer?.key && (!lastSeen || item.createdAt > lastSeen)).length,
    [items, lastSeen, viewer?.key]
  );

  const markSeen = useCallback(() => {
    if (!viewer) return;
    setSeenBefore(service.getLastSeen(patientId, viewer.key));
    service.markSeen(patientId, viewer.key);
    setLastSeen(service.getLastSeen(patientId, viewer.key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, viewer?.key, service]);

  const isNew = useCallback(
    (item) => item.authorKey !== viewer?.key && (!seenBefore || item.createdAt > seenBefore),
    [seenBefore, viewer?.key]
  );

  return { items, loading, error, reload: load, forTarget, add, edit, remove, setHidden, unseenCount, markSeen, isNew, viewer };
}