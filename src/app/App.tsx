/**
 * @file app/App.tsx
 * @description Entry point aplikasi JIP FSM Portal (post-refactor).
 *
 * PERUBAHAN DARI App.tsx LAMA:
 *  - Semua state global dipindah ke AppContext (store/AppContext.tsx)
 *  - Login UI dipindah ke features/auth/components/LoginPage.tsx
 *  - Layout dipindah ke components/layout/AppShell.tsx
 *  - Konten per tab dipindah ke features/[feature]/components/
 *  - App.tsx ini hanya bertugas: route ke LoginPage ATAU AppShell + konten
 *
 * FASE 1 — Komponen feature masih mengimpor dari src/components/ lama
 *          (StatsDashboard, PenerimaanPrinter, dll) untuk mempertahankan
 *          fungsionalitas sambil migrasi berlangsung.
 */

import React from "react";
import { AppProvider, useApp } from "../store/AppContext";
import AppShell from "../components/layout/AppShell";

// ── Feature pages — feature-sliced paths (Fase 2 ✅)
import StatsDashboard from "../features/dashboard/components/StatsDashboard";
import PenerimaanPrinter from "../features/service-reception/components/PenerimaanPrinter";
import AdministrasiSPH from "../features/sph/components/AdministrasiSPH";
import LogistikInventori from "../features/logistics/components/LogistikInventori";
import AIAgentChat from "../features/ai-chat/components/AIAgentChat";
import DownloadCenter from "../components/DownloadCenter";
import SettingsPage from "../features/settings/components/SettingsPage";

// ── Auth page — TODO: pindah ke features/auth/components/LoginPage.tsx (Fase 2)
// import LoginPage from "../features/auth/components/LoginPage";

// ── Placeholder: untuk sementara, gunakan login inline sederhana
import LoginPagePlaceholder from "../features/auth/components/LoginPage";

// ─────────────────────────────────────────────────────────────────────────────
// INNER APP — membaca context, memilih tampilan
// ─────────────────────────────────────────────────────────────────────────────

function InnerApp() {
  const {
    isAuthenticated,
    currentUser,
    activeTab,
    setActiveTab,
    setPenerimaanSearchTerm,
    penerimaanSearchTerm,
    selectedDeviceForChat,
    setSelectedDeviceForChat,
    addToast,
    services,
    sphList,
    logistics,
    spareparts,
    atkList,
    assets,
    fetchAllData,
  } = useApp();

  // ── Belum login → tampilkan LoginPage ────────────────────────────────────
  if (!isAuthenticated) {
    return <LoginPagePlaceholder />;
  }

  // ── Helper navigasi dari komponen anak ──────────────────────────────────
  const handleQuickSendToLogistics = async (
    service: import("../types").PrinterService,
    target: string
  ) => {
    // TODO: pindahkan logic ini ke service layer (Fase 2)
    const newLog = {
      noResi: `RESI-${Math.floor(10000000 + Math.random() * 90000000)}`,
      barang: `Unit Printer ${service.device} Servis (${service.id})`,
      berat: 12.0,
      ukuran: "40x30x30 cm",
      pemilik: service.customer,
      tujuan: target,
      status: "Menunggu" as const,
    };
    try {
      const res = await fetch("/api/logistics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLog),
      });
      if (res.ok) {
        await fetchAllData();
        setActiveTab("logistics");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectServiceForChat = (device: string) => {
    setSelectedDeviceForChat(device);
    setActiveTab("ai");
  };

  // ── CRUD helpers (akan dipindah ke service layer di Fase 2) ──────────────

  const crudFetch = async (url: string, method: string, body?: object): Promise<void> => {
    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error || `Request gagal (${res.status})`);
    }
    await fetchAllData();
  };

  // Printer Services
  const handleAddService    = (item: Omit<import("../types").PrinterService, "id">) => crudFetch("/api/printers", "POST", item);
  const handleUpdateService = (id: string, u: Partial<import("../types").PrinterService>) => crudFetch(`/api/printers/${id}`, "PUT", u);
  const handleDeleteService = (id: string) => crudFetch(`/api/printers/${id}`, "DELETE");

  // SPH
  const handleAddSph          = (item: Omit<import("../types").SPH, "id">) => crudFetch("/api/sph", "POST", item);
  const handleDeleteSph       = (id: string) => crudFetch(`/api/sph/${id}`, "DELETE");
  const handleUpdateSphStatus = (id: string, s: import("../types").SphChargeStatus) => crudFetch(`/api/sph/${id}`, "PUT", { statusCharge: s });

  // Logistics
  const handleAddLogistics    = (item: Omit<import("../types").BarangAktif, "id">) => crudFetch("/api/logistics", "POST", item);
  const handleUpdateLogistics = (id: string, u: Partial<import("../types").BarangAktif>) => crudFetch(`/api/logistics/${id}`, "PUT", u);
  const handleDeleteLogistics = (id: string) => crudFetch(`/api/logistics/${id}`, "DELETE");

  // Spareparts
  const handleAddSparepart    = (item: Omit<import("../types").SparepartItem, "id" | "status">) => crudFetch("/api/inventory/spareparts", "POST", item);
  const handleUpdateSparepart = (id: string, u: Partial<import("../types").SparepartItem>) => crudFetch(`/api/inventory/spareparts/${id}`, "PUT", u);
  const handleDeleteSparepart = (id: string) => crudFetch(`/api/inventory/spareparts/${id}`, "DELETE");

  // ATK
  const handleAddAtk    = (item: Omit<import("../types").ATKItem, "id" | "status">) => crudFetch("/api/inventory/atk", "POST", item);
  const handleUpdateAtk = (id: string, u: Partial<import("../types").ATKItem>) => crudFetch(`/api/inventory/atk/${id}`, "PUT", u);
  const handleDeleteAtk = (id: string) => crudFetch(`/api/inventory/atk/${id}`, "DELETE");

  // Demo Assets
  const handleAddAsset    = (item: Omit<import("../types").AsetDemoItem, "id">) => crudFetch("/api/inventory/demo-assets", "POST", item);
  const handleUpdateAsset = (id: string, u: Partial<import("../types").AsetDemoItem>) => crudFetch(`/api/inventory/demo-assets/${id}`, "PUT", u);
  const handleDeleteAsset = (id: string) => crudFetch(`/api/inventory/demo-assets/${id}`, "DELETE");

  // ── Render AppShell + konten tab aktif ───────────────────────────────────
  return (
    <AppShell>

      {activeTab === "dashboard" && (
        <StatsDashboard
          services={services}
          sphList={sphList}
          currentUserRole={currentUser?.role}
          currentUserName={currentUser?.fullName}
          onNavigateToTab={(tab, ticketId) => {
            if (tab === "penerimaan") {
              setPenerimaanSearchTerm(ticketId ?? "");
            }
            setActiveTab(tab);
          }}
          onSelectSearchDevice={handleSelectServiceForChat}
          onAddService={handleAddService}
        />
      )}

      {activeTab === "penerimaan" && (
        <PenerimaanPrinter
          services={services}
          currentUser={currentUser}
          onAddService={handleAddService}
          onUpdateService={handleUpdateService}
          onDeleteService={handleDeleteService}
          onCreateSph={() => setActiveTab("sph")}
          onSendToLogistics={handleQuickSendToLogistics}
          onSelectServiceForChat={handleSelectServiceForChat}
          searchTerm={penerimaanSearchTerm}
          onSearchTermChange={setPenerimaanSearchTerm}
        />
      )}

      {activeTab === "sph" && (
        <AdministrasiSPH
          sphList={sphList}
          services={services}
          spareparts={spareparts}
          onAddSph={handleAddSph}
          onDeleteSph={handleDeleteSph}
          onUpdateSphStatus={handleUpdateSphStatus}
          onRefreshAllData={fetchAllData}
        />
      )}

      {activeTab === "logistics" && (
        <LogistikInventori
          logistics={logistics}
          spareparts={spareparts}
          atkList={atkList}
          assets={assets}
          currentUserRole={currentUser?.role}
          onAddLogistics={handleAddLogistics}
          onUpdateLogistics={handleUpdateLogistics}
          onDeleteLogistics={handleDeleteLogistics}
          onAddSpareparts={handleAddSparepart}
          onUpdateSpareparts={handleUpdateSparepart}
          onDeleteSpareparts={handleDeleteSparepart}
          onAddAtk={handleAddAtk}
          onUpdateAtk={handleUpdateAtk}
          onDeleteAtk={handleDeleteAtk}
          onAddAsset={handleAddAsset}
          onUpdateAsset={handleUpdateAsset}
          onDeleteAsset={handleDeleteAsset}
          onRefreshAllData={fetchAllData}
        />
      )}

      {activeTab === "downloads" && <DownloadCenter currentUserRole={currentUser.role} />}

      {activeTab === "settings" && <SettingsPage />}

      {activeTab === "ai" && (
        <div className="h-[680px] w-full">
          <AIAgentChat
            currentDevice={selectedDeviceForChat}
            onSetRecommendation={(rec, chk, path) => {
              addToast(
                "✅ REKOMENDASI AI DITERAPKAN",
                `Diagnosa diterapkan dengan mandat ${path}!`,
                "success"
              );
            }}
          />
        </div>
      )}

    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT — Bungkus dengan AppProvider
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AppProvider>
      <InnerApp />
    </AppProvider>
  );
}
