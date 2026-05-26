/**
 * @file hooks/useCrud.ts
 * @description Generic CRUD hook — menggantikan 18 fungsi handleAdd/Update/Delete
 * yang copy-paste di App.tsx (baris 156-387).
 *
 * SEBELUM (App.tsx lama — 18 fungsi identik):
 *   const handleAddService = async (item) => {
 *     const res = await fetch("/api/printers", { method: "POST", ... });
 *     if (res.ok) await fetchAllData();
 *   };
 *   const handleUpdateService = async (id, updated) => { ... };
 *   // ... diulang untuk SPH, Logistics, Sparepart, ATK, Assets
 *
 * SESUDAH:
 *   const serviceCrud = useCrud("/api/printers", fetchAllData);
 *   await serviceCrud.add(payload);
 *   await serviceCrud.update(id, partial);
 *   await serviceCrud.remove(id);
 *
 * FITUR:
 *  - Loading state per operasi
 *  - Error state dengan pesan deskriptif
 *  - Auto-refresh data setelah mutasi
 *  - TypeScript generik
 */

import { useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface CrudState {
  loading: boolean;
  error: string | null;
}

interface CrudActions<T> {
  add: (payload: Omit<T, "id">) => Promise<boolean>;
  update: (id: string, payload: Partial<T>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  patch: (id: string, field: string, value: unknown) => Promise<boolean>;
  state: CrudState;
  clearError: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param endpoint — Base API URL, misal "/api/printers"
 * @param onSuccess — Callback setelah mutasi berhasil (biasanya fetchAllData)
 */
export function useCrud<T extends { id: string }>(
  endpoint: string,
  onSuccess: () => Promise<void>
): CrudActions<T> {
  const [state, setState] = useState<CrudState>({ loading: false, error: null });

  const setLoading = (loading: boolean) => setState((prev) => ({ ...prev, loading }));
  const setError = (error: string | null) => setState((prev) => ({ ...prev, error }));

  const request = useCallback(
    async (url: string, options: RequestInit): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, {
          headers: { "Content-Type": "application/json" },
          ...options,
        });
        if (!res.ok) {
          const msg = await res.text().catch(() => "Request gagal");
          throw new Error(msg || `HTTP ${res.status}`);
        }
        await onSuccess();
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui";
        setError(msg);
        console.error(`[useCrud] ${options.method} ${url} failed:`, err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  const add = useCallback(
    (payload: Omit<T, "id">) =>
      request(endpoint, { method: "POST", body: JSON.stringify(payload) }),
    [endpoint, request]
  );

  const update = useCallback(
    (id: string, payload: Partial<T>) =>
      request(`${endpoint}/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    [endpoint, request]
  );

  const remove = useCallback(
    (id: string) => request(`${endpoint}/${id}`, { method: "DELETE" }),
    [endpoint, request]
  );

  /** Patch satu field saja — shorthand untuk update dengan satu key */
  const patch = useCallback(
    (id: string, field: string, value: unknown) =>
      request(`${endpoint}/${id}`, { method: "PUT", body: JSON.stringify({ [field]: value }) }),
    [endpoint, request]
  );

  const clearError = useCallback(() => setError(null), []);

  return { add, update, remove, patch, state, clearError };
}
