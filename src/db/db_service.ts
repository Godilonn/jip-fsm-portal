import { getDb, isDbConfigured } from "./index";
import { 
  printerServices as psTable, 
  sphList as sphTable, 
  sphItems as itemsTable, 
  barangAktif as logTable, 
  spareparts as partsTable, 
  atkList as atkTable, 
  asetDemo as assetsTable 
} from "./schema";
import { eq, desc } from "drizzle-orm";

// ============================================================================
// IN-MEMORY SEEDS (FALLBACK WHEN DATABASE_URL IS NOT DEFINED)
// ============================================================================

let memPrinterServices: any[] = [
  {
    id: "SRV-001",
    device: "SR200",
    customer: "Dinas Kependudukan DKI Jakarta",
    serialNumber: "SN-SR200-9831",
    keluhan: "Printer tidak mendeteksi ribbon, lampu indikator merah berkedip terus menerus setelah mencetak 2 kartu.",
    kelengkapan: {
      ribbon: true,
      film: false,
      catrigeFilm: false,
      catrigeRibbon: true,
      adaptor: true,
      kabelUsb: true,
      lainnya: "Kotak kemasan standar"
    },
    tanggalTerima: "2026-05-18",
    statusGaransi: "Garansi",
    hasilPengecekan: "Sensor optik pendeteksi ribbon tertutup debu halus dari sisa cetakan kartu lama. Setelah sensor dibersihkan, printer mendeteksi ribbon kembali normal.",
    catatanRekomendasi: "Disarankan membersihkan printer secara berkala menggunakan cleaning kit resmi setiap 500 kali pencetakan kartu.",
    namaTs: "Eko Prasetyo",
    statusServis: "CLOSED",
    finalKerusakan: "Sensor optik ribbon kotor oleh residu debu kartu.",
    sphId: undefined,
    actionLogs: [
      "[SLA: START] Ticket opened and registered into system as OPEN.",
      "[EVENT: assign_technician] stop_response_timer, notify_technician. Assigned to Eko Prasetyo.",
      "[EVENT: start_work] log_start_time. Began mechanical diagnostics.",
      "[EVENT: repair_done_onsite] stop_resolution_timer, notify_customer, start_grace_period_72h. Marked RESOLVED.",
      "[EVENT: grace_period_72h_timeout] send_csat_survey, lock_ticket. Closed permanently after 72 hours."
    ],
    slaStatus: "STOPPED",
    slaTimeStart: undefined,
    isLocked: true,
    assignee: "Eko Prasetyo"
  },
  {
    id: "SRV-002",
    device: "CR805",
    customer: "Dinas Perhubungan Surabaya",
    serialNumber: "SN-CR805-4421",
    keluhan: "Hasil cetakan pecah-pecah dan warna pudar di bagian tengah film transfer.",
    kelengkapan: {
      ribbon: true,
      film: true,
      catrigeFilm: true,
      catrigeRibbon: true,
      adaptor: true,
      kabelUsb: true,
      lainnya: ""
    },
    tanggalTerima: "2026-05-19",
    statusGaransi: "Non-Garansi",
    hasilPengecekan: "Printhead CR805 mengalami penurunan suhu pemanas thermal, dan roller penarik film sedikit aus.",
    catatanRekomendasi: "Perlu penggantian module printhead dan karet roller penarik untuk performa optimal.",
    namaTs: "Budi Satrio",
    statusServis: "PENDING",
    finalKerusakan: "Printhead thermal melemah & roller pengetatan film aus.",
    sphId: "SPH-2026-001",
    actionLogs: [
      "[SLA: START] Ticket opened and registered into system as OPEN.",
      "[EVENT: assign_technician] Assigned to technician Budi Satrio.",
      "[EVENT: start_work] Began thermal head test cycles.",
      "[EVENT: need_approval_or_part] pause_resolution_timer, notify_customer. SPH-2026-001 issued; waiting for approval."
    ],
    slaStatus: "PAUSED",
    slaTimeStart: new Date(Date.now() - 3600000 * 24).toISOString(),
    isLocked: false,
    assignee: "Budi Satrio"
  },
  {
    id: "SRV-003",
    device: "SD307",
    customer: "Bank Jatim Cabang Pusat",
    serialNumber: "SN-SD307-1092",
    keluhan: "Kerap kali kartu tersangkut (card jam) saat proses encoding magnetic stripe.",
    kelengkapan: {
      ribbon: false,
      film: false,
      catrigeFilm: false,
      catrigeRibbon: false,
      adaptor: true,
      kabelUsb: true,
      lainnya: "Adaptor power non-ori"
    },
    tanggalTerima: "2026-05-20",
    statusGaransi: "Non-Garansi",
    hasilPengecekan: "Mengalami aus pada gerigi penarik magnetik encoder.",
    catatanRekomendasi: "Disarankan ganti adaptor original untuk daya stabil dan ganti magnetic roller gear.",
    namaTs: "Andi Wijaya",
    statusServis: "OPEN",
    finalKerusakan: "Magnetic gear roller aus.",
    sphId: undefined,
    actionLogs: [
      "[SLA: START] Ticket opened and registered into system as OPEN. Awaiting technician assignment."
    ],
    slaStatus: "START",
    slaTimeStart: new Date().toISOString(),
    isLocked: false,
    assignee: undefined
  }
];

let memSPHList: any[] = [
  {
    id: "SPH-2026-001",
    nomorSurat: "042/SPH-PNT/V/2026",
    tanggal: "2026-05-19",
    dinasMana: "Dinas Perhubungan Surabaya",
    statusCharge: "Bayar",
    items: [
      {
        id: "ITEM-1",
        itemNumber: "1",
        partNumber: "513333-001",
        namaPart: "Retransfer Printhead CR805",
        qty: 1,
        harga: 4500000,
        jumlah: 4500000
      },
      {
        id: "ITEM-2",
        itemNumber: "2",
        partNumber: "512022-105",
        namaPart: "Feed Rollers Kit CR Series",
        qty: 1,
        harga: 750000,
        jumlah: 750000
      }
    ],
    subtotal: 5250000,
    ppn: 577500,
    total: 5827500,
    serviceId: "SRV-002"
  }
];

let memBarangAktif: any[] = [
  {
    id: "LOG-001",
    noResi: "RESI-88291039",
    barang: "Printer Re-transfer CR805 Unit",
    berat: 14.5,
    ukuran: "45x35x40 cm",
    pemilik: "Dinas Perhubungan Surabaya",
    tujuan: "Service Center Jakarta Barat",
    status: "Dalam Perjalanan"
  },
  {
    id: "LOG-002",
    noResi: "RESI-77318820",
    barang: "Sparepart Printhead SR200 & Adaptor Power",
    berat: 2.2,
    ukuran: "25x20x15 cm",
    pemilik: "Dinas Kependudukan DKI Jakarta",
    tujuan: "Kantor Dispendukcapil Menteng",
    status: "Sampai"
  }
];

let memSpareparts: any[] = [
  {
    id: "SP-001",
    kodeItem: "SP-CR805-PRH",
    partNumber: "513333-001",
    namaBarang: "Retransfer Printhead CR805",
    kategori: "Printhead",
    stok: 3,
    harga: 4500000,
    status: "Tersedia",
    untukMesinApa: "CR805"
  },
  {
    id: "SP-002",
    kodeItem: "SP-SR200-ROL",
    partNumber: "512022-105",
    namaBarang: "Feed Rollers Kit SR200/SR300",
    kategori: "Roller",
    stok: 2,
    harga: 750000,
    status: "Stok Rendah",
    untukMesinApa: "SR200"
  },
  {
    id: "SP-003",
    kodeItem: "SP-EM2S-RBNCOS",
    partNumber: "534000-003",
    namaBarang: "YMCKT Color Ribbon EM2s",
    kategori: "Consumable",
    stok: 15,
    harga: 850000,
    status: "Tersedia",
    untukMesinApa: "Em2s"
  },
  {
    id: "SP-004",
    kodeItem: "SP-SD307-MAG",
    partNumber: "511099-002",
    namaBarang: "Magnetic Encoding Module SD307",
    kategori: "Module",
    stok: 0,
    harga: 3200000,
    status: "Habis",
    untukMesinApa: "SD307"
  }
];

let memAtkList: any[] = [
  {
    id: "ATK-001",
    kode: "ATK-PPR-A4",
    namaBarang: "Kertas Double A A4 80g",
    kategori: "Kertas",
    stok: 12,
    status: "Tersedia"
  },
  {
    id: "ATK-002",
    kode: "ATK-PEN-PIL",
    namaBarang: "Pulpen Pilot G2 0.5 Black",
    kategori: "Alat Tulis",
    stok: 4,
    status: "Stok Rendah"
  },
  {
    id: "ATK-003",
    kode: "ATK-LBL-TS",
    namaBarang: "Stiker Label Servis 100x50mm",
    kategori: "Label",
    stok: 25,
    status: "Tersedia"
  }
];

let memAsetDemo: any[] = [
  {
    id: "DEMO-001",
    kode: "DEM-SR200-01",
    namaBarang: "Datacard SR200 Retransfer Demo",
    jenis: "Printer Kartu",
    kondisi: "Bagus",
    status: "Tersedia",
    lokasi: "Showroom lt. 1",
    keterangan: "Digunakan khusus pameran dinas atau instansi pemerintah."
  },
  {
    id: "DEMO-002",
    kode: "DEM-EM2S-02",
    namaBarang: "Entrust EM2s Direct-to-card Demo",
    jenis: "Printer Kartu",
    kondisi: "Bagus",
    status: "Dipinjam",
    lokasi: "Kantor Transisi Bandung",
    keterangan: "Dipinjam sementara untuk trial Cetak KTP di Bandung oleh Pak Roni."
  },
  {
    id: "DEMO-003",
    kode: "DEM-CR707-03",
    namaBarang: "Datacard CR707 Passport Printer Demo Unit",
    jenis: "Passport Printer",
    kondisi: "Rusak",
    status: "Maintenance",
    lokasi: "Lab TS lt. 2",
    keterangan: "Kerusakan powerboard akibat tegangan tidak stabil. Menunggu sparepart pengganti."
  }
];

// ============================================================================
// DATABASE METHODS WITH ENHANCED ON-THE-FLY DRIZZLE SUPPORT
// ============================================================================

export const dbService = {
  // --- PRINTER SERVICES (TICKETS) ---
  getPrinters: async (): Promise<any[]> => {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        return await db.select().from(psTable);
      } catch (err) {
        console.error("Drizzle Query Error, falling back to mem storage:", err);
      }
    }
    return memPrinterServices;
  },

  addPrinter: async (data: any): Promise<any> => {
    const id = `SRV-${String(memPrinterServices.length + 1).padStart(3, "0")}`;
    const newRecord = { id, ...data };
    
    if (isDbConfigured()) {
      try {
        const db = getDb();
        await db.insert(psTable).values({
          id,
          device: data.device,
          customer: data.customer,
          serialNumber: data.serialNumber,
          keluhan: data.keluhan,
          kelengkapan: data.kelengkapan || {
            ribbon: false,
            film: false,
            catrigeFilm: false,
            catrigeRibbon: false,
            adaptor: false,
            kabelUsb: false,
            lainnya: ""
          },
          tanggalTerima: data.tanggalTerima || new Date().toISOString().split("T")[0],
          statusGaransi: data.statusGaransi || "Non-Garansi",
          hasilPengecekan: data.hasilPengecekan || "",
          catatanRekomendasi: data.catatanRekomendasi || "",
          namaTs: data.namaTs || "",
          statusServis: data.statusServis || "OPEN",
          finalKerusakan: data.finalKerusakan || "",
          sphId: data.sphId,
          actionLogs: data.actionLogs || [
            `[SLA: START] Ticket opened and registered into system as ${data.statusServis || "OPEN"}.`
          ],
          slaStatus: data.slaStatus || "START",
          slaTimeStart: data.slaTimeStart || new Date().toISOString(),
          isLocked: data.isLocked || false,
          assignee: data.assignee
        });
        memPrinterServices.unshift(newRecord);
        return newRecord;
      } catch (err) {
        console.error("Drizzle Insert Error, falling back:", err);
      }
    }

    memPrinterServices.unshift(newRecord);
    return newRecord;
  },

  updatePrinter: async (id: string, data: any): Promise<any> => {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        const updateData: any = {};
        if (data.statusServis !== undefined) updateData.statusServis = data.statusServis;
        if (data.hasilPengecekan !== undefined) updateData.hasilPengecekan = data.hasilPengecekan;
        if (data.catatanRekomendasi !== undefined) updateData.catatanRekomendasi = data.catatanRekomendasi;
        if (data.namaTs !== undefined) updateData.namaTs = data.namaTs;
        if (data.finalKerusakan !== undefined) updateData.finalKerusakan = data.finalKerusakan;
        if (data.sphId !== undefined) updateData.sphId = data.sphId;
        if (data.actionLogs !== undefined) updateData.actionLogs = data.actionLogs;
        if (data.slaStatus !== undefined) updateData.slaStatus = data.slaStatus;
        if (data.slaTimeStart !== undefined) updateData.slaTimeStart = data.slaTimeStart;
        if (data.isLocked !== undefined) updateData.isLocked = data.isLocked;
        if (data.assignee !== undefined) updateData.assignee = data.assignee;
        if (data.kelengkapan !== undefined) updateData.kelengkapan = data.kelengkapan;
        
        await db.update(psTable).set(updateData).where(eq(psTable.id, id));
      } catch (err) {
        console.error("Drizzle Update Error, falling back to modification:", err);
      }
    }

    const index = memPrinterServices.findIndex(p => p.id === id);
    if (index !== -1) {
      memPrinterServices[index] = { ...memPrinterServices[index], ...data };
      return memPrinterServices[index];
    }
    return null;
  },

  deletePrinter: async (id: string): Promise<boolean> => {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        await db.delete(psTable).where(eq(psTable.id, id));
      } catch (err) {
        console.error("Drizzle Delete Error, falling back to filter:", err);
      }
    }
    const lenBefore = memPrinterServices.length;
    memPrinterServices = memPrinterServices.filter(p => p.id !== id);
    return memPrinterServices.length < lenBefore;
  },

  // --- SPH (QUOTATIONS) ---
  getSph: async (): Promise<any[]> => {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        const rows = await db.select().from(sphTable);
        // Map nested items
        const results = [];
        for (const r of rows) {
          const items = await db.select().from(itemsTable).where(eq(itemsTable.sphId, r.id));
          results.push({ ...r, items });
        }
        return results;
      } catch (err) {
        console.error("Drizzle SPH Query Error, falling back to mem:", err);
      }
    }
    return memSPHList;
  },

  addSph: async (data: any): Promise<any> => {
    const id = `SPH-2026-${String(memSPHList.length + 1).padStart(3, "0")}`;
    const newRecord = { id, ...data };

    if (isDbConfigured()) {
      try {
        const db = getDb();
        await db.insert(sphTable).values({
          id,
          nomorSurat: data.nomorSurat,
          tanggal: data.tanggal,
          dinasMana: data.dinasMana,
          statusCharge: data.statusCharge || "Bayar",
          subtotal: data.subtotal || 0,
          ppn: data.ppn || 0,
          total: data.total || 0,
          serviceId: data.serviceId
        });

        if (data.items && Array.isArray(data.items)) {
          let itemCounter = 1;
          for (const item of data.items) {
            const itemId = `ITEM-${id}-${itemCounter++}`;
            await db.insert(itemsTable).values({
              id: itemId,
              sphId: id,
              itemNumber: String(item.itemNumber || itemCounter),
              partNumber: item.partNumber || "",
              namaPart: item.namaPart,
              qty: item.qty || 1,
              harga: item.harga || 0,
              jumlah: item.jumlah || 0
            });
          }
        }
        
        // Auto update linked printer
        if (data.serviceId) {
          await db.update(psTable).set({
            sphId: id,
            statusServis: "SPH Dibuat"
          }).where(eq(psTable.id, data.serviceId));
        }
        
        memSPHList.unshift(newRecord);
        return newRecord;
      } catch (err) {
        console.error("Drizzle SPH Insert Error:", err);
      }
    }

    // Auto-update memory service
    if (data.serviceId) {
      const idx = memPrinterServices.findIndex(p => p.id === data.serviceId);
      if (idx !== -1) {
        memPrinterServices[idx].sphId = id;
        memPrinterServices[idx].statusServis = "SPH Dibuat";
      }
    }

    memSPHList.unshift(newRecord);
    return newRecord;
  },

  updateSph: async (id: string, data: any): Promise<any> => {
    const index = memSPHList.findIndex(s => s.id === id);
    if (index !== -1) {
      const original = memSPHList[index];
      const statusCharge = data.statusCharge !== undefined ? data.statusCharge : original.statusCharge;
      const subtotal = original.subtotal;
      const ppn = statusCharge === "Bayar" ? Math.round(subtotal * 0.11) : 0;
      const total = statusCharge === "Bayar" ? (subtotal + ppn) : 0;

      const updated = { 
        ...original, 
        ...data,
        ppn,
        total
      };

      if (isDbConfigured()) {
        try {
          const db = getDb();
          await db.update(sphTable).set({
            statusCharge,
            ppn,
            total,
            dinasMana: data.dinasMana || original.dinasMana,
            tanggal: data.tanggal || original.tanggal,
            nomorSurat: data.nomorSurat || original.nomorSurat,
          }).where(eq(sphTable.id, id));
        } catch (err) {
          console.error("Drizzle SPH Update error code fallback:", err);
        }
      }

      memSPHList[index] = updated;
      return updated;
    }
    return null;
  },

  deleteSph: async (id: string): Promise<boolean> => {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        await db.delete(sphTable).where(eq(sphTable.id, id));
      } catch (err) {
        console.error("Drizzle SPH Delete Error:", err);
      }
    }
    const lenBefore = memSPHList.length;
    memSPHList = memSPHList.filter(s => s.id !== id);
    return memSPHList.length < lenBefore;
  },

  // --- LOGISTICS ---
  getLogistics: async (): Promise<any[]> => {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        return await db.select().from(logTable);
      } catch (err) {
        console.error("Drizzle Logistics query failure:", err);
      }
    }
    return memBarangAktif;
  },

  addLogistics: async (data: any): Promise<any> => {
    const id = `LOG-${String(memBarangAktif.length + 1).padStart(3, "0")}`;
    const newRecord = { id, ...data };

    if (isDbConfigured()) {
      try {
        const db = getDb();
        await db.insert(logTable).values({
          id,
          noResi: data.noResi || `RESI-${Math.floor(10000000 + Math.random() * 90000000)}`,
          barang: data.barang,
          berat: data.berat || 1.0,
          ukuran: data.ukuran || "Standar",
          pemilik: data.pemilik,
          tujuan: data.tujuan,
          status: data.status || "Menunggu",
          packingStatus: data.packingStatus,
          scheduleShipping: data.scheduleShipping,
          serviceId: data.serviceId
        });
        memBarangAktif.unshift(newRecord);
        return newRecord;
      } catch (err) {
        console.error("Drizzle Logistics Insert Error:", err);
      }
    }

    memBarangAktif.unshift(newRecord);
    return newRecord;
  },

  updateLogistics: async (id: string, data: any): Promise<any> => {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        await db.update(logTable).set(data).where(eq(logTable.id, id));
      } catch (err) {
        console.error("Drizzle Logistics Update Error:", err);
      }
    }

    const index = memBarangAktif.findIndex(l => l.id === id);
    if (index !== -1) {
      memBarangAktif[index] = { ...memBarangAktif[index], ...data };
      return memBarangAktif[index];
    }
    return null;
  },

  deleteLogistics: async (id: string): Promise<boolean> => {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        await db.delete(logTable).where(eq(logTable.id, id));
      } catch (err) {
        console.error("Drizzle Logistics Delete Error:", err);
      }
    }
    const lenBefore = memBarangAktif.length;
    memBarangAktif = memBarangAktif.filter(l => l.id !== id);
    return memBarangAktif.length < lenBefore;
  },

  // --- SPAREPARTS INVENTORY ---
  getSpareparts: async (): Promise<any[]> => {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        return await db.select().from(partsTable);
      } catch (err) {
        console.error("Drizzle Spareparts query failure:", err);
      }
    }
    return memSpareparts;
  },

  addSparepart: async (data: any): Promise<any> => {
    const id = `SP-${String(memSpareparts.length + 1).padStart(3, "0")}`;
    const status = data.stok === 0 ? "Habis" : data.stok <= 2 ? "Stok Rendah" : "Tersedia";
    const newRecord = { id, status, ...data };

    if (isDbConfigured()) {
      try {
        const db = getDb();
        await db.insert(partsTable).values({
          id,
          kodeItem: data.kodeItem,
          partNumber: data.partNumber,
          namaBarang: data.namaBarang,
          kategori: data.kategori,
          stok: data.stok || 0,
          harga: data.harga || 0,
          status,
          untukMesinApa: data.untukMesinApa || ""
        });
        memSpareparts.unshift(newRecord);
        return newRecord;
      } catch (err) {
        console.error("Drizzle Spareparts Insert Error:", err);
      }
    }

    memSpareparts.unshift(newRecord);
    return newRecord;
  },

  updateSparepart: async (id: string, data: any): Promise<any> => {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        const updatedStatus = data.stok === 0 ? "Habis" : data.stok <= 2 ? "Stok Rendah" : "Tersedia";
        await db.update(partsTable).set({ ...data, status: updatedStatus }).where(eq(partsTable.id, id));
      } catch (err) {
        console.error("Drizzle Sparepart Update Error:", err);
      }
    }

    const index = memSpareparts.findIndex(s => s.id === id);
    if (index !== -1) {
      const updated = { ...memSpareparts[index], ...data };
      updated.status = updated.stok === 0 ? "Habis" : updated.stok <= 2 ? "Stok Rendah" : "Tersedia";
      memSpareparts[index] = updated;
      return updated;
    }
    return null;
  },

  deleteSparepart: async (id: string): Promise<boolean> => {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        await db.delete(partsTable).where(eq(partsTable.id, id));
      } catch (err) {
        console.error("Drizzle Spareparts Delete Error:", err);
      }
    }
    const lenBefore = memSpareparts.length;
    memSpareparts = memSpareparts.filter(s => s.id !== id);
    return memSpareparts.length < lenBefore;
  },

  // --- ATK INVENTORY ---
  getAtk: async (): Promise<any[]> => {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        return await db.select().from(atkTable);
      } catch (err) {
        console.error("Drizzle ATK query failure:", err);
      }
    }
    return memAtkList;
  },

  addAtk: async (data: any): Promise<any> => {
    const id = `ATK-${String(memAtkList.length + 1).padStart(3, "0")}`;
    const status = data.stok === 0 ? "Habis" : data.stok <= 3 ? "Stok Rendah" : "Tersedia";
    const newRecord = { id, status, ...data };

    if (isDbConfigured()) {
      try {
        const db = getDb();
        await db.insert(atkTable).values({
          id,
          kode: data.kode,
          namaBarang: data.namaBarang,
          kategori: data.kategori,
          stok: data.stok || 0,
          status
        });
        memAtkList.unshift(newRecord);
        return newRecord;
      } catch (err) {
        console.error("Drizzle ATK Insert Error:", err);
      }
    }

    memAtkList.unshift(newRecord);
    return newRecord;
  },

  updateAtk: async (id: string, data: any): Promise<any> => {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        const updatedStatus = data.stok === 0 ? "Habis" : data.stok <= 3 ? "Stok Rendah" : "Tersedia";
        await db.update(atkTable).set({ ...data, status: updatedStatus }).where(eq(atkTable.id, id));
      } catch (err) {
        console.error("Drizzle ATK Update Error:", err);
      }
    }

    const index = memAtkList.findIndex(a => a.id === id);
    if (index !== -1) {
      const updated = { ...memAtkList[index], ...data };
      updated.status = updated.stok === 0 ? "Habis" : updated.stok <= 3 ? "Stok Rendah" : "Tersedia";
      memAtkList[index] = updated;
      return updated;
    }
    return null;
  },

  deleteAtk: async (id: string): Promise<boolean> => {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        await db.delete(atkTable).where(eq(atkTable.id, id));
      } catch (err) {
        console.error("Drizzle ATK Delete Error:", err);
      }
    }
    const lenBefore = memAtkList.length;
    memAtkList = memAtkList.filter(a => a.id !== id);
    return memAtkList.length < lenBefore;
  },

  // --- DEMO ASSETS ---
  getDemoAssets: async (): Promise<any[]> => {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        return await db.select().from(assetsTable);
      } catch (err) {
        console.error("Drizzle Demo Assets query failure:", err);
      }
    }
    return memAsetDemo;
  },

  addDemoAsset: async (data: any): Promise<any> => {
    const id = `DEMO-${String(memAsetDemo.length + 1).padStart(3, "0")}`;
    const newRecord = { id, ...data };

    if (isDbConfigured()) {
      try {
        const db = getDb();
        await db.insert(assetsTable).values({
          id,
          kode: data.kode,
          namaBarang: data.namaBarang,
          jenis: data.jenis,
          kondisi: data.kondisi,
          status: data.status,
          lokasi: data.lokasi,
          keterangan: data.keterangan || ""
        });
        memAsetDemo.unshift(newRecord);
        return newRecord;
      } catch (err) {
        console.error("Drizzle Demo Asset Insert Error:", err);
      }
    }

    memAsetDemo.unshift(newRecord);
    return newRecord;
  },

  updateDemoAsset: async (id: string, data: any): Promise<any> => {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        await db.update(assetsTable).set(data).where(eq(assetsTable.id, id));
      } catch (err) {
        console.error("Drizzle Demo Asset Update Error:", err);
      }
    }

    const index = memAsetDemo.findIndex(d => d.id === id);
    if (index !== -1) {
      memAsetDemo[index] = { ...memAsetDemo[index], ...data };
      return memAsetDemo[index];
    }
    return null;
  },

  deleteDemoAsset: async (id: string): Promise<boolean> => {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        await db.delete(assetsTable).where(eq(assetsTable.id, id));
      } catch (err) {
        console.error("Drizzle Demo Asset Delete Error:", err);
      }
    }
    const lenBefore = memAsetDemo.length;
    memAsetDemo = memAsetDemo.filter(d => d.id !== id);
    return memAsetDemo.length < lenBefore;
  }
};
