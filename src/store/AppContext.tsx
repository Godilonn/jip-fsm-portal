/**
 * @file store/AppContext.tsx
 * @description Global state context untuk JIP FSM Portal.
 *
 * AUTH STRATEGY (Real DB):
 *  - On mount: cek session aktif via GET /api/auth/get-session
 *  - Login: POST /api/auth/sign-in/email → cookie session otomatis di-set
 *  - Logout: POST /api/auth/sign-out → hapus cookie
 *  - User list: fetch dari GET /api/admin/users (MANAGER only)
 *
 * Fallback in-memory (kalau DATABASE_URL tidak diset):
 *  - Login pakai mock user dari MOCK_USERS di constants.ts
 *  - User list pakai state lokal
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

import type {
  UserSession,
  TabKey,
  Language,
  SystemNotification,
  ToastItem,
  PrinterService,
  SPH,
  BarangAktif,
  SparepartItem,
  ATKItem,
  AsetDemoItem,
} from "../types";

import { MOCK_USERS, getDefaultTab, API } from "../lib/constants";

// ─────────────────────────────────────────────────────────────────────────────
// SHAPE CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

interface AppContextValue {
  // ── Auth ──────────────────────────────────────────────────────────────────
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  currentUser: UserSession;
  login: (user: UserSession) => void;
  logout: () => void;

  // ── UI State ──────────────────────────────────────────────────────────────
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  language: Language;
  toggleLanguage: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // ── Notifikasi & Toast ────────────────────────────────────────────────────
  notifications: SystemNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  toastQueue: ToastItem[];
  addToast: (title: string, message: string, type: ToastItem["type"]) => void;
  showNotificationDropdown: boolean;
  setShowNotificationDropdown: (open: boolean) => void;

  // ── Data (global state dari DB) ───────────────────────────────────────────
  services: PrinterService[];
  sphList: SPH[];
  logistics: BarangAktif[];
  spareparts: SparepartItem[];
  atkList: ATKItem[];
  assets: AsetDemoItem[];
  fetchAllData: () => Promise<void>;

  // ── User Management (Settings) ───────────────────────────────────────────
  users: UserSession[];
  fetchUsers: () => Promise<void>;
  addUser: (data: { name: string; email: string; password: string; role: string }) => Promise<{ ok: boolean; error?: string }>;
  updateUser: (id: string, updates: { name?: string; role?: string }) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // ── Misc ──────────────────────────────────────────────────────────────────
  penerimaanSearchTerm: string;
  setPenerimaanSearchTerm: (term: string) => void;
  selectedDeviceForChat: string;
  setSelectedDeviceForChat: (device: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: ubah response Better Auth session → UserSession
// ─────────────────────────────────────────────────────────────────────────────

function sessionToUserSession(sessionUser: any): UserSession {
  const email: string = sessionUser.email ?? "";
  const username = email.split("@")[0] ?? sessionUser.name ?? "user";
  return {
    id: sessionUser.id,
    username,
    fullName: sessionUser.name ?? username,
    email,
    role: (sessionUser.role as UserSession["role"]) ?? "CUSTOMER",
    avatar: sessionUser.image ?? undefined,
    password: undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Generate notifikasi dinamis dari data stok dan tiket */
function buildNotifications(
  sparepartList: SparepartItem[],
  atkItems: ATKItem[],
  serviceList: PrinterService[],
): SystemNotification[] {
  const result: SystemNotification[] = [];
  const now = "Baru saja";

  // Cek sparepart stok kritis (< 3)
  const lowSpareparts = sparepartList.filter((s) => s.stok < 3);
  lowSpareparts.slice(0, 3).forEach((s, i) => {
    result.push({
      id: `notif-sp-${s.id}`,
      title: s.stok === 0 ? "🚨 STOK HABIS — SPAREPART" : "⚠️ STOK MENIPIS — SPAREPART",
      message: `${s.namaBarang} — sisa ${s.stok} unit${s.stok === 0 ? " (HABIS)" : ""}. Segera lakukan pemesanan ulang.`,
      type: s.stok === 0 ? "critical" : "warning",
      timestamp: now,
      read: false,
    });
  });

  // Cek ATK stok kritis (< 3)
  const lowAtk = atkItems.filter((a) => a.stok < 3);
  lowAtk.slice(0, 2).forEach((a) => {
    result.push({
      id: `notif-atk-${a.id}`,
      title: a.stok === 0 ? "🚨 STOK HABIS — ATK" : "⚠️ STOK MENIPIS — ATK",
      message: `${a.namaBarang} — sisa ${a.stok} unit${a.stok === 0 ? " (HABIS)" : ""}. Perlu pengisian stok segera.`,
      type: a.stok === 0 ? "critical" : "warning",
      timestamp: now,
      read: false,
    });
  });

  // Tiket baru (OPEN) yang belum di-assign
  const unassigned = serviceList.filter((s) => s.statusServis === "OPEN" && !s.assignee);
  unassigned.slice(0, 2).forEach((s) => {
    result.push({
      id: `notif-svc-${s.id}`,
      title: "📬 TIKET BELUM DI-ASSIGN",
      message: `Tiket #${s.id} (${s.device} — ${s.customer}) belum memiliki teknisi yang bertanggung jawab.`,
      type: "info",
      timestamp: now,
      read: false,
    });
  });

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserSession>(MOCK_USERS[0]);
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

  /**
   * Cek session aktif di backend saat pertama kali load.
   * Jika ada session (cookie masih valid), langsung masuk.
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/get-session", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            const user = sessionToUserSession(data.user);
            setCurrentUser(user);
            setIsAuthenticated(true);
            setActiveTab(getDefaultTab(user.role));
          }
        }
      } catch {
        // Server belum siap atau network error — biarkan saja, tampilkan login
      } finally {
        setIsAuthLoading(false);
      }
    };
    checkSession();
  }, []);

  /**
   * login() dipanggil oleh LoginPage setelah POST /api/auth/sign-in/email sukses.
   * UserSession dibangun dari data yang sudah di-fetch dari /api/auth/get-session.
   */
  const login = useCallback((user: UserSession) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActiveTab(getDefaultTab(user.role));
  }, []);

  /**
   * logout() memanggil /api/auth/sign-out untuk invalidate cookie session.
   * Jika DB tidak dikonfigurasi (mode in-memory), cukup reset state.
   */
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Abaikan error logout — tetap reset state
    }
    setIsAuthenticated(false);
    setCurrentUser(MOCK_USERS[0]);
    setActiveTab("dashboard");
  }, []);

  // ── UI State ───────────────────────────────────────────────────────────────
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>("ID");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  const toggleDarkMode = useCallback(() => setIsDarkMode((prev) => !prev), []);
  const toggleLanguage = useCallback(
    () => setLanguage((prev) => (prev === "ID" ? "EN" : "ID")),
    []
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  // ── Notifikasi & Toast ─────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [toastQueue, setToastQueue] = useState<ToastItem[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const addToast = useCallback(
    (title: string, message: string, type: ToastItem["type"] = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newToast: ToastItem = { id, title, message, type };
      setToastQueue((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToastQueue((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
      const newNotif: SystemNotification = {
        id, title, message, type, timestamp: "Baru saja", read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    },
    []
  );

  // ── Data state ─────────────────────────────────────────────────────────────
  const [services, setServices] = useState<PrinterService[]>([]);
  const [sphList, setSphList] = useState<SPH[]>([]);
  const [logistics, setLogistics] = useState<BarangAktif[]>([]);
  const [spareparts, setSpareparts] = useState<SparepartItem[]>([]);
  const [atkList, setAtkList] = useState<ATKItem[]>([]);
  const [assets, setAssets] = useState<AsetDemoItem[]>([]);

  const fetchAllData = useCallback(async () => {
    try {
      const [srvRes, sphRes, logRes, spRes, atkRes, astRes] = await Promise.all([
        fetch(API.printers),
        fetch(API.sph),
        fetch(API.logistics),
        fetch(API.spareparts),
        fetch(API.atk),
        fetch(API.demoAssets),
      ]);
      const spData: SparepartItem[] = spRes.ok ? await spRes.json() : [];
      const atkData: ATKItem[] = atkRes.ok ? await atkRes.json() : [];
      const srvData: PrinterService[] = srvRes.ok ? await srvRes.json() : [];
      const astData: AsetDemoItem[] = astRes.ok ? await astRes.json() : [];
      const sphData: SPH[] = sphRes.ok ? await sphRes.json() : [];
      const logData: BarangAktif[] = logRes.ok ? await logRes.json() : [];

      setServices(srvData);
      setSphList(sphData);
      setLogistics(logData);
      setSpareparts(spData);
      setAtkList(atkData);
      setAssets(astData);

      // Bangun ulang notifikasi dari data nyata
      setNotifications((prev) => {
        const dynamic = buildNotifications(spData, atkData, srvData);
        // Pertahankan notifikasi manual (addToast) yang belum di-read
        const manual = prev.filter(
          (n) => !n.id.startsWith("notif-sp-") && !n.id.startsWith("notif-atk-") && !n.id.startsWith("notif-svc-")
        );
        return [...dynamic, ...manual];
      });
    } catch (err) {
      console.error("[AppContext] fetchAllData gagal:", err);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ── User Management ────────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserSession[]>([]);

  /** Ambil daftar user dari DB (hanya MANAGER yang dapat akses) */
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as any[];
        // Kalau DB belum dikonfigurasi, server kembalikan [] — fallback ke MOCK_USERS
        if (data.length === 0 && !isAuthenticated) return;
        if (data.length === 0) {
          setUsers(MOCK_USERS);
          return;
        }
        setUsers(
          data.map((u) => ({
            id: u.id,
            username: u.email.split("@")[0],
            fullName: u.name,
            email: u.email,
            role: u.role as UserSession["role"],
          }))
        );
      }
    } catch {
      setUsers(MOCK_USERS);
    }
  }, [isAuthenticated]);

  // Fetch users saat user sudah login sebagai Manager
  useEffect(() => {
    if (isAuthenticated && currentUser.role === "MANAGER") {
      fetchUsers();
    }
  }, [isAuthenticated, currentUser.role, fetchUsers]);

  const addUser = useCallback(async (data: {
    name: string; email: string; password: string; role: string;
  }) => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const body = await res.json() as any;
    if (!res.ok) {
      return { ok: false, error: body.error ?? "Gagal membuat user." };
    }
    await fetchUsers();
    return { ok: true };
  }, [fetchUsers]);

  const updateUser = useCallback(async (id: string, updates: { name?: string; role?: string }) => {
    await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    });
    await fetchUsers();
    // Kalau yang diupdate adalah currentUser sendiri, sinkronkan state
    if (id === currentUser.id) {
      setCurrentUser((prev) => ({
        ...prev,
        fullName: updates.name ?? prev.fullName,
        role: (updates.role as UserSession["role"]) ?? prev.role,
      }));
    }
  }, [fetchUsers, currentUser.id]);

  const deleteUser = useCallback(async (id: string) => {
    await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    await fetchUsers();
  }, [fetchUsers]);

  // ── Misc ───────────────────────────────────────────────────────────────────
  const [penerimaanSearchTerm, setPenerimaanSearchTerm] = useState("");
  const [selectedDeviceForChat, setSelectedDeviceForChat] = useState("Printer Umum");

  // ─────────────────────────────────────────────────────────────────────────
  const value: AppContextValue = {
    isAuthenticated,
    isAuthLoading,
    currentUser,
    login,
    logout,

    activeTab,
    setActiveTab,
    isDarkMode,
    toggleDarkMode,
    language,
    toggleLanguage,
    mobileMenuOpen,
    setMobileMenuOpen,

    notifications,
    unreadCount,
    markAllRead,
    markRead,
    toastQueue,
    addToast,
    showNotificationDropdown,
    setShowNotificationDropdown,

    services,
    sphList,
    logistics,
    spareparts,
    atkList,
    assets,
    fetchAllData,

    users,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser,

    penerimaanSearchTerm,
    setPenerimaanSearchTerm,
    selectedDeviceForChat,
    setSelectedDeviceForChat,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp harus digunakan di dalam <AppProvider>.");
  }
  return ctx;
}
