import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
// @ts-ignore
import PizZip from "pizzip";
// @ts-ignore
import Docxtemplater from "docxtemplater";
// @ts-ignore
import multer from "multer";
import { dbService } from "./src/db/db_service";
import { parseLogFile } from "./src/lib/logParser";
import { getAuth } from "./src/lib/auth";
import { toNodeHandler } from "better-auth/node";
import { getDb, isDbConfigured } from "./src/db";
import { user as userTable, downloads as downloadsTable } from "./src/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
// @ts-ignore
import helmet from "helmet";
// @ts-ignore
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const IS_PROD = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "10mb" }));

// ── Security headers (helmet) ─────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ── Rate limiting — maks 120 req/menit per IP ─────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak request. Coba lagi dalam 1 menit." },
});
app.use("/api/", apiLimiter);

// ── Static file serving untuk uploads (driver, firmware, dll) ────────────────
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const DOWNLOADS_DIR = path.join(UPLOADS_DIR, "downloads");
// Buat folder jika belum ada
if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOADS_DIR));

// ── Multer storage config ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, DOWNLOADS_DIR),
  filename: (_req: any, file: any, cb: any) => {
    const unique = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});
// Tipe file yang diizinkan untuk diupload ke DownloadCenter
const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".zip", ".7z", ".rar", ".exe", ".msi",
  ".docx", ".xlsx", ".txt", ".png", ".jpg", ".jpeg",
  ".bin", ".inf", ".cab",
]);
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // max 100 MB
  fileFilter: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipe file tidak diizinkan: "${ext}". Hanya PDF, ZIP, EXE, DOCX, XLSX, TXT, dan gambar.`));
    }
  },
});

// Initialize Gemini SDK if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("Pemberitahuan: GEMINI_API_KEY tidak dikonfigurasi. Agen AI akan berjalan dalam mode fallback simulasi.");
}

// Database operations and local memory persistence are now managed by dbService in /src/db/db_service.ts


// --- API ENDPOINTS ---

app.all("/api/auth/*", (req, res) => {
  const authInstance = getAuth();
  if (!authInstance) {
    return res.status(503).json({
      error: "Better Auth not initialized. Silakan konfigurasi DATABASE_URL terlebih dahulu."
    });
  }
  return toNodeHandler(authInstance)(req, res);
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS: requireAuth (semua user login) + requireManager (MANAGER only)
// ─────────────────────────────────────────────────────────────────────────────
async function requireAuth(req: express.Request, res: express.Response): Promise<boolean> {
  const auth = getAuth();
  if (!auth) return true; // in-memory/dev mode — izinkan semua
  try {
    const session = await auth.api.getSession({ headers: req.headers as any });
    if (!session?.user) {
      res.status(401).json({ error: "Tidak terautentikasi. Silakan login terlebih dahulu." });
      return false;
    }
    return true;
  } catch {
    res.status(401).json({ error: "Session tidak valid." });
    return false;
  }
}

async function requireManager(req: express.Request, res: express.Response): Promise<boolean> {
  const auth = getAuth();
  if (!auth) {
    // Mode in-memory: izinkan semua (dev mode)
    return true;
  }
  try {
    const session = await auth.api.getSession({ headers: req.headers as any });
    if (!session?.user) {
      res.status(401).json({ error: "Tidak terautentikasi." });
      return false;
    }
    const role = (session.user as any).role;
    if (role !== "MANAGER") {
      res.status(403).json({ error: "Akses ditolak. Hanya MANAGER yang dapat mengelola user." });
      return false;
    }
    return true;
  } catch {
    res.status(401).json({ error: "Session tidak valid." });
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN USER MANAGEMENT — /api/admin/users
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/users — daftar semua user
app.get("/api/admin/users", async (req, res) => {
  if (!isDbConfigured()) {
    // Mode in-memory: kembalikan array kosong (frontend pakai state lokal)
    return res.json([]);
  }
  const allowed = await requireManager(req, res);
  if (!allowed) return;
  try {
    const db = getDb();
    const users = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        role: userTable.role,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .orderBy(userTable.createdAt);
    res.json(users);
  } catch (err) {
    console.error("[admin/users GET]", err);
    res.status(500).json({ error: "Gagal mengambil data user." });
  }
});

// POST /api/admin/users — buat user baru (MANAGER only)
app.post("/api/admin/users", async (req, res) => {
  if (!isDbConfigured()) {
    return res.status(503).json({ error: "Database belum dikonfigurasi." });
  }
  const allowed = await requireManager(req, res);
  if (!allowed) return;
  try {
    const { name, email, password, role } = req.body as {
      name: string; email: string; password: string; role: string;
    };
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "name, email, password, role wajib diisi." });
    }
    // Buat user via Better Auth sign-up endpoint (agar password di-hash otomatis)
    const auth = getAuth()!;
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
    });
    if (!result?.user?.id) {
      return res.status(400).json({ error: "Gagal membuat user. Email mungkin sudah terdaftar." });
    }
    // Set role (Better Auth sign-up tidak bisa set role — harus update manual)
    const db = getDb();
    await db
      .update(userTable)
      .set({ role, updatedAt: new Date() })
      .where(eq(userTable.id, result.user.id));

    res.status(201).json({ id: result.user.id, name, email, role });
  } catch (err: any) {
    console.error("[admin/users POST]", err);
    res.status(500).json({ error: err.message || "Gagal membuat user." });
  }
});

// PUT /api/admin/users/:id — update nama, role, atau password
app.put("/api/admin/users/:id", async (req, res) => {
  if (!isDbConfigured()) {
    return res.status(503).json({ error: "Database belum dikonfigurasi." });
  }
  const allowed = await requireManager(req, res);
  if (!allowed) return;
  try {
    const { id } = req.params;
    const { name, role } = req.body as { name?: string; role?: string };
    const db = getDb();
    const updatePayload: Record<string, any> = { updatedAt: new Date() };
    if (name) updatePayload.name = name;
    if (role) updatePayload.role = role;
    await db.update(userTable).set(updatePayload).where(eq(userTable.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error("[admin/users PUT]", err);
    res.status(500).json({ error: "Gagal update user." });
  }
});

// DELETE /api/admin/users/:id — hapus user
app.delete("/api/admin/users/:id", async (req, res) => {
  if (!isDbConfigured()) {
    return res.status(503).json({ error: "Database belum dikonfigurasi." });
  }
  const allowed = await requireManager(req, res);
  if (!allowed) return;
  try {
    const { id } = req.params;
    // Cegah hapus diri sendiri
    const auth = getAuth()!;
    const session = await auth.api.getSession({ headers: req.headers as any });
    if (session?.user?.id === id) {
      return res.status(400).json({ error: "Tidak bisa menghapus akun sendiri yang sedang aktif." });
    }
    const db = getDb();
    await db.delete(userTable).where(eq(userTable.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error("[admin/users DELETE]", err);
    res.status(500).json({ error: "Gagal hapus user." });
  }
});

// ── Printer / Service Tickets ─────────────────────────────────────────────────
app.get("/api/printers", async (req, res) => {
  if (!await requireAuth(req, res)) return;
  try {
    res.json(await dbService.getPrinters());
  } catch (err) { res.status(500).json({ error: "Gagal mengambil data printer." }); }
});

app.post("/api/printers", async (req, res) => {
  if (!await requireAuth(req, res)) return;
  try {
    const reqBody = req.body;
    let status = reqBody.statusServis || "OPEN";
    if (["Diterima","Diagnosa AI","SPH Dibuat","Perbaikan"].includes(status)) status = "OPEN";
    else if (["Selesai","Diambil"].includes(status)) status = "RESOLVED";
    res.status(201).json(await dbService.addPrinter({ ...reqBody, statusServis: status }));
  } catch (err) { res.status(500).json({ error: "Gagal menambah data printer." }); }
});

app.put("/api/printers/:id", async (req, res) => {
  if (!await requireAuth(req, res)) return;
  try {
    const updated = await dbService.updatePrinter(req.params.id, req.body);
    updated ? res.json(updated) : res.status(404).json({ error: "Layanan printer tidak ditemukan." });
  } catch (err) { res.status(500).json({ error: "Gagal update printer." }); }
});

app.delete("/api/printers/:id", async (req, res) => {
  if (!await requireManager(req, res)) return;
  try {
    const success = await dbService.deletePrinter(req.params.id);
    res.json({ success, message: "Layanan printer berhasil dihapus." });
  } catch (err) { res.status(500).json({ error: "Gagal hapus printer." }); }
});

// ── SPH Quotation ─────────────────────────────────────────────────────────────
app.get("/api/sph", async (req, res) => {
  if (!await requireAuth(req, res)) return;
  try { res.json(await dbService.getSph()); }
  catch (err) { res.status(500).json({ error: "Gagal mengambil SPH." }); }
});

app.post("/api/sph", async (req, res) => {
  if (!await requireAuth(req, res)) return;
  try { res.status(201).json(await dbService.addSph(req.body)); }
  catch (err) { res.status(500).json({ error: "Gagal membuat SPH." }); }
});

app.put("/api/sph/:id", async (req, res) => {
  if (!await requireAuth(req, res)) return;
  try {
    const updated = await dbService.updateSph(req.params.id, req.body);
    updated ? res.json(updated) : res.status(404).json({ error: "SPH tidak ditemukan." });
  } catch (err) { res.status(500).json({ error: "Gagal update SPH." }); }
});

app.delete("/api/sph/:id", async (req, res) => {
  if (!await requireManager(req, res)) return;
  try {
    const success = await dbService.deleteSph(req.params.id);
    res.json({ success, message: "SPH berhasil dihapus." });
  } catch (err) { res.status(500).json({ error: "Gagal hapus SPH." }); }
});

// Endpoint untuk Export SPH sebagai dokumen Microsoft Word (.docx)
// Menggunakan template-sph.docx + docxtemplater untuk layout persis
app.get("/api/sph/:id/docx", async (req, res) => {
  try {
    const { id } = req.params;
    const sphList = await dbService.getSph();
    const sph = sphList.find((s: any) => s.id === id);
    if (!sph) {
      return res.status(404).json({ error: "SPH tidak ditemukan." });
    }

    // Update status printer ke PENDING saat export
    if (sph.serviceId) {
      const printers = await dbService.getPrinters();
      const printer = printers.find((p: any) => p.id === sph.serviceId);
      if (printer) {
        printer.statusServis = "PENDING";
        printer.slaStatus = "PAUSED";
        const timestamp = new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
        });
        printer.actionLogs = printer.actionLogs || [];
        printer.actionLogs.push(
          `[${new Date().toLocaleDateString("id-ID")} ${timestamp}] statusServis berubah ke PENDING. SLA dipaused otomatis karena proses EXPORT SPH bermandat.`
        );
        await dbService.updatePrinter(sph.serviceId, printer);
      }
    }

    let service: any = null;
    if (sph.serviceId) {
      const printers = await dbService.getPrinters();
      service = printers.find((p: any) => p.id === sph.serviceId);
    }

    // Muat template docx
    const templatePath = path.join(process.cwd(), "template-sph.docx");
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ error: "Template SPH tidak ditemukan. Pastikan template-sph.docx ada di root project." });
    }
    const templateContent = fs.readFileSync(templatePath);
    const zip = new PizZip(templateContent);
    const docTpl = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    // Helpers
    const fmtRp = (n: number) => `Rp.${(n || 0).toLocaleString("id-ID")}`;
    const cek   = (v: boolean) => v ? "☒" : "☐";

    // Data
    const kelengkapan = service?.kelengkapan || {};
    const namaTs = service?.namaTs || "Technical Support";
    const tanggalFormatted = sph.tanggal
      ? new Date(sph.tanggal).toLocaleDateString("id-ID", {
          day: "numeric", month: "long", year: "numeric",
        })
      : "-";
    const tglTerima = service?.tanggalTerima
      ? new Date(service.tanggalTerima).toLocaleDateString("id-ID", {
          day: "2-digit", month: "2-digit", year: "numeric",
        })
      : "-";

    // Grand total tanpa PPN (sesuai permintaan)
    const subtotalNum  = sph.subtotal ?? 0;
    const statusCharge = sph.statusCharge || "Bayar";
    const grandTotal   = statusCharge !== "Bayar"
      ? `${statusCharge} (Bebas Biaya)`
      : fmtRp(subtotalNum);

    const renderPayload = {
      tanggal_sph:    tanggalFormatted,
      nomor_sph:      sph.nomorSurat || "-",
      customer_name:  sph.dinasMana || "-",
      nama_ts:        namaTs,
      // Grand total (tanpa PPN)
      grand_total:    grandTotal,
      // Item loop
      items: (sph.items || []).map((item: any, i: number) => ({
        no:           String(i + 1),
        uraian:       item.partNumber ? `${item.namaPart} / ${item.partNumber}` : (item.namaPart || "-"),
        qty:          String(item.qty ?? 1),
        satuan:       item.satuan || "pcs",
        harga_satuan: fmtRp(item.harga ?? 0),
        total_harga:  fmtRp(item.jumlah ?? (item.qty ?? 1) * (item.harga ?? 0)),
      })),
      // Form Penerimaan Service
      device:               service?.device || "-",
      serial_number:        service?.serialNumber || "-",
      keluhan:              service?.keluhan || "-",
      // Device checkboxes
      dev_em2s:   cek(service?.device === "Em2s"),
      dev_cr707:  cek(service?.device === "CR707"),
      dev_sr200:  cek(service?.device === "SR200"),
      dev_sd307:  cek(service?.device === "SD307"),
      dev_cr805:  cek(service?.device === "CR805"),
      dev_minipc: cek(service?.device === "mini PC"),
      dev_rekam:  cek(service?.device === "Alat rekam"),
      dev_lain:   cek(service?.device === "Lainnya"),
      // Kelengkapan checkboxes (☒ = ada, ☐ = tidak)
      kel_ribbon:   cek(kelengkapan.ribbon),
      kel_film:     cek(kelengkapan.film),
      kel_kartu:    cek(false),                          // tidak ada di model lama
      kel_adaptor:  cek(kelengkapan.adaptor),
      kel_kabel:    cek(kelengkapan.kabelUsb),
      kel_catr:     cek(kelengkapan.catrigeRibbon),
      kel_catf:     cek(kelengkapan.catrigeFilm),
      kel_lainnya:  kelengkapan.lainnya || "-",
      tgl_terima:           tglTerima,
      status_garansi:       service?.statusGaransi || "-",
      hasil_pengecekan:     service?.hasilPengecekan || "-",
      catatan_rekomendasi:  service?.catatanRekomendasi || "-",
    };

    docTpl.render(renderPayload);
    const outputBuffer = docTpl.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
    const cleanFileName = `${(sph.nomorSurat || "SPH").replace(/\//g, "-")}.docx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${cleanFileName}"`);
    res.send(outputBuffer);

  } catch (err) {
    console.error("Gagal export Word SPH:", err);
    res.status(500).json({ error: `Gagal generate dokumen SPH: ${String(err)}` });
  }
});

// ── Legacy: hapus template.docx lama jika ada ─────────────────────────────────
const legacyTemplate = path.join(process.cwd(), "template.docx");
if (fs.existsSync(legacyTemplate)) {
  try { fs.unlinkSync(legacyTemplate); } catch {}
}

// Endpoint untuk Sales Review & Approval (Setuju / Gratis) + Logistik packaging trigger

// Endpoint untuk Sales Review & Approval (Setuju / Gratis) + Logistik packaging trigger
app.post("/api/sph/:id/approve", async (req, res) => {
  const { id } = req.params;
  const { action, estimatedDeliverySchedule } = req.body; // action: "DISETUJUI" | "GRATIS"
  const sphList = await dbService.getSph();
  const sph = sphList.find(s => s.id === id);

  if (!sph) {
    return res.status(404).json({ error: "SPH tidak ditemukan." });
  }

  // A. Pilihan "DISETUJUI (Berbayar)"
  if (action === "DISETUJUI") {
    sph.statusCharge = "Bayar";
    const subtotal = sph.subtotal;
    const ppn = Math.round(subtotal * 0.11);
    sph.ppn = ppn;
    sph.total = subtotal + ppn;

    await dbService.updateSph(id, sph);

    if (sph.serviceId) {
      const printers = await dbService.getPrinters();
      const printer = printers.find(p => p.id === sph.serviceId);
      if (printer) {
        printer.statusServis = "IN_PROGRESS";
        printer.repairSlaStatus = "RUNNING";
        printer.actionLogs = printer.actionLogs || [];
        printer.actionLogs.push(
          `[SPH APPROVED - BERBAYAR] SPH ${sph.nomorSurat} disetujui. Status diset ke IN_PROGRESS. SLA dijalankan kembali. Mengirim sinyal logistik: READY_TO_PACK.`
        );
        await dbService.updatePrinter(sph.serviceId, printer);

        // Ubah atau tambah data logistik
        const logisticsList = await dbService.getLogistics();
        const existingLog = logisticsList.find(l => l.serviceId === sph.serviceId);
        if (existingLog) {
          existingLog.packingStatus = "READY_TO_PACK";
          existingLog.status = "Menunggu";
          await dbService.updateLogistics(existingLog.id, existingLog);
        } else {
          await dbService.addLogistics({
            barang: `Unit Printer ${printer.device} Penanganan (${printer.id})`,
            berat: 11.5,
            ukuran: "35x35x35 cm",
            pemilik: printer.customer,
            tujuan: "Gudang Logistik JIP",
            status: "Menunggu",
            packingStatus: "READY_TO_PACK",
            serviceId: printer.id
          });
        }
      }
    }
  }
  // B. Pilihan "GRATIS (Garansi/Free)"
  else if (action === "GRATIS") {
    sph.statusCharge = "Free of Charge";
    sph.ppn = 0;
    sph.total = 0;

    await dbService.updateSph(id, sph);

    if (sph.serviceId) {
      const printers = await dbService.getPrinters();
      const printer = printers.find(p => p.id === sph.serviceId);
      if (printer) {
        printer.statusServis = "RESOLVED";
        printer.repairSlaStatus = "STOPPED";
        printer.actionLogs = printer.actionLogs || [];
        printer.actionLogs.push(
          `[SPH APPROVED - GRATIS/FREE] SPH ${sph.nomorSurat} di-bebas biayakan (Rp 0). Status diset ke RESOLVED. SLA dihentikan. Mengirim sinyal logistik: READY_TO_PACK.`
        );
        await dbService.updatePrinter(sph.serviceId, printer);

        // Sinyal logistik langsung, atur tujuan langsung ke alamat pengiriman dinas instansi
        const logisticsList = await dbService.getLogistics();
        const existingLog = logisticsList.find(l => l.serviceId === sph.serviceId);
        if (existingLog) {
          existingLog.packingStatus = "READY_TO_PACK";
          existingLog.scheduleShipping = estimatedDeliverySchedule || "Pengiriman terjadwal kilat";
          await dbService.updateLogistics(existingLog.id, existingLog);
        } else {
          await dbService.addLogistics({
            barang: `Unit Printer ${printer.device} SPH Gratis (${printer.id})`,
            berat: 11.5,
            ukuran: "35x35x35 cm",
            pemilik: printer.customer,
            tujuan: `Kantor Dinas Pelanggan - Jadwal: ${estimatedDeliverySchedule || "Pengiriman Cepat"}`,
            status: "Menunggu",
            packingStatus: "READY_TO_PACK",
            scheduleShipping: estimatedDeliverySchedule || "Segera Diproses",
            serviceId: printer.id
          });
        }
      }
    }
  }

  const updatedPrinters = await dbService.getPrinters();
  const updatedLogistics = await dbService.getLogistics();
  res.json({ success: true, sph, printerServices: updatedPrinters, barangAktif: updatedLogistics });
});

// ── Logistics ─────────────────────────────────────────────────────────────────
app.get("/api/logistics", async (req, res) => {
  if (!await requireAuth(req, res)) return;
  try { res.json(await dbService.getLogistics()); }
  catch (err) { res.status(500).json({ error: "Gagal mengambil data logistik." }); }
});

app.post("/api/logistics", async (req, res) => {
  if (!await requireAuth(req, res)) return;
  try { res.status(201).json(await dbService.addLogistics(req.body)); }
  catch (err) { res.status(500).json({ error: "Gagal tambah logistik." }); }
});

app.put("/api/logistics/:id", async (req, res) => {
  if (!await requireAuth(req, res)) return;
  try {
    const updated = await dbService.updateLogistics(req.params.id, req.body);
    updated ? res.json(updated) : res.status(404).json({ error: "Logistik tidak ditemukan." });
  } catch (err) { res.status(500).json({ error: "Gagal update logistik." }); }
});

app.delete("/api/logistics/:id", async (req, res) => {
  if (!await requireManager(req, res)) return;
  try { res.json({ success: await dbService.deleteLogistics(req.params.id) }); }
  catch (err) { res.status(500).json({ error: "Gagal hapus logistik." }); }
});

// ── Inventory — Spareparts ────────────────────────────────────────────────────
app.get("/api/inventory/spareparts", async (req, res) => {
  if (!await requireAuth(req, res)) return;
  try { res.json(await dbService.getSpareparts()); }
  catch (err) { res.status(500).json({ error: "Gagal mengambil sparepart." }); }
});

app.post("/api/inventory/spareparts", async (req, res) => {
  if (!await requireAuth(req, res)) return;
  try { res.status(201).json(await dbService.addSparepart(req.body)); }
  catch (err) { res.status(500).json({ error: "Gagal tambah sparepart." }); }
});

app.put("/api/inventory/spareparts/:id", async (req, res) => {
  if (!await requireAuth(req, res)) return;
  try {
    const updated = await dbService.updateSparepart(req.params.id, req.body);
    updated ? res.json(updated) : res.status(404).json({ error: "Sparepart tidak ditemukan." });
  } catch (err) { res.status(500).json({ error: "Gagal update sparepart." }); }
});

app.delete("/api/inventory/spareparts/:id", async (req, res) => {
  if (!await requireManager(req, res)) return;
  try { res.json({ success: await dbService.deleteSparepart(req.params.id) }); }
  catch (err) { res.status(500).json({ error: "Gagal hapus sparepart." }); }
});

// ── Inventory — ATK ──────────────────────────────────────────────────────────
app.get("/api/inventory/atk", async (req, res) => {
  if (!await requireAuth(req, res)) return;
  try { res.json(await dbService.getAtk()); }
  catch (err) { res.status(500).json({ error: "Gagal mengambil ATK." }); }
});

app.post("/api/inventory/atk", async (req, res) => {
  if (!await requireAuth(req, res)) return;
  try { res.status(201).json(await dbService.addAtk(req.body)); }
  catch (err) { res.status(500).json({ error: "Gagal tambah ATK." }); }
});

app.put("/api/inventory/atk/:id", async (req, res) => {
  if (!await requireAuth(req, res)) return;
  try {
    const updated = await dbService.updateAtk(req.params.id, req.body);
    updated ? res.json(updated) : res.status(404).json({ error: "ATK tidak ditemukan." });
  } catch (err) { res.status(500).json({ error: "Gagal update ATK." }); }
});

app.delete("/api/inventory/atk/:id", async (req, res) => {
  if (!await requireManager(req, res)) return;
  try { res.json({ success: await dbService.deleteAtk(req.params.id) }); }
  catch (err) { res.status(500).json({ error: "Gagal hapus ATK." }); }
});

// Inventory - Demo Assets
app.get("/api/inventory/demo-assets", async (req, res) => {
  const list = await dbService.getDemoAssets();
  res.json(list);
});

app.post("/api/inventory/demo-assets", async (req, res) => {
  const item = await dbService.addDemoAsset(req.body);
  res.status(201).json(item);
});

app.put("/api/inventory/demo-assets/:id", async (req, res) => {
  const { id } = req.params;
  const updated = await dbService.updateDemoAsset(id, req.body);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: "Aset Demo tidak ditemukan." });
  }
});

app.delete("/api/inventory/demo-assets/:id", async (req, res) => {
  const success = await dbService.deleteDemoAsset(req.params.id);
  res.json({ success });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE DOWNLOAD — file Excel pre-filled data sparepart JIP
// ─────────────────────────────────────────────────────────────────────────────

app.get("/api/inventory/spareparts/template", (_req, res) => {
  const templatePath = path.join(process.cwd(), "uploads", "template-import-sparepart.csv");
  if (!fs.existsSync(templatePath)) {
    return res.status(404).json({ error: "Template belum tersedia." });
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.download(templatePath, "template-import-sparepart.csv");
});

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY — BULK IMPORT SPAREPARTS
// POST /api/inventory/spareparts/import
// Body: { rows: Array<{kodeItem,partNumber,namaBarang,kategori,stok,harga,untukMesinApa}> }
// ─────────────────────────────────────────────────────────────────────────────

app.post("/api/inventory/spareparts/import", async (req, res) => {
  if (!await requireManager(req, res)) return;
  const { rows } = req.body as { rows: any[] };
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "Tidak ada data untuk diimport." });
  }

  let imported = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      const namaBarang = String(r.namaBarang || r["Nama Barang"] || "").trim();
      if (!namaBarang) {
        errors.push(`Baris ${i + 2}: 'Nama Barang' kosong — dilewati.`);
        continue;
      }
      await dbService.addSparepart({
        kodeItem:     String(r.kodeItem     || r["Kode Item"]          || "").trim(),
        partNumber:   String(r.partNumber   || r["Part Number"]        || "").trim(),
        namaBarang,
        kategori:     String(r.kategori     || r["Kategori"]           || "Lainnya").trim(),
        stok:         parseInt(r.stok       ?? r["Stok"])              || 0,
        harga:        parseInt(r.harga      ?? r["Harga"])             || 0,
        untukMesinApa: String(r.untukMesinApa || r["Untuk Mesin Apa"] || "Semua").trim(),
      });
      imported++;
    } catch (err: any) {
      errors.push(`Baris ${i + 2} (${r.namaBarang || "?"}): ${err.message || "Gagal insert"}`);
    }
  }

  res.json({ imported, errors, total: rows.length });
});

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOADS / FILE REPOSITORY API
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/downloads — ambil semua file yang sudah diupload
app.get("/api/downloads", async (req, res) => {
  if (!await requireAuth(req, res)) return;
  try {
    const db = getDb();
    if (!db) return res.json([]);
    const rows = await db.select().from(downloadsTable);
    res.json(rows);
  } catch (e) {
    console.error("GET /api/downloads error:", e);
    res.json([]);
  }
});

// POST /api/downloads — upload file baru (multipart/form-data)
app.post("/api/downloads", upload.single("file"), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Tidak ada file yang diupload." });

    const {
      name, version, type, device, description,
      compatibility, releaseDate, status, allowedRoles, uploadedBy,
    } = req.body;

    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(1) + " MB";
    const fileUrl = `/uploads/downloads/${req.file.filename}`;

    const db = getDb();
    if (!db) return res.status(500).json({ error: "Database tidak terhubung." });

    const id = `DL-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const rolesArray = allowedRoles
      ? (typeof allowedRoles === "string" ? JSON.parse(allowedRoles) : allowedRoles)
      : null;

    const [created] = await db.insert(downloadsTable).values({
      id,
      name: name || req.file.originalname,
      version: version || "v1.0.0",
      type: type || "Driver",
      device: device || "Semua",
      description: description || "",
      compatibility: compatibility || "Windows 10/11",
      releaseDate: releaseDate || new Date().toISOString().split("T")[0],
      fileSize: fileSizeMB,
      fileName: req.file.originalname,
      filePath: fileUrl,
      status: status || "Official Release",
      allowedRoles: rolesArray,
      uploadedBy: uploadedBy || "MANAGER",
    }).returning();

    res.status(201).json(created);
  } catch (e) {
    console.error("POST /api/downloads error:", e);
    res.status(500).json({ error: String(e) });
  }
});

// DELETE /api/downloads/:id — hapus entri + file fisik
app.delete("/api/downloads/:id", async (req, res) => {
  if (!await requireManager(req, res)) return;
  try {
    const db = getDb();
    if (!db) return res.status(500).json({ error: "Database tidak terhubung." });

    const [row] = await db.select().from(downloadsTable).where(eq(downloadsTable.id, req.params.id));
    if (!row) return res.status(404).json({ error: "File tidak ditemukan." });

    // Hapus file fisik
    const absPath = path.join(process.cwd(), row.filePath);
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);

    await db.delete(downloadsTable).where(eq(downloadsTable.id, req.params.id));
    res.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/downloads error:", e);
    res.status(500).json({ error: String(e) });
  }
});

// --- GOOGLE GEMINI AI ENDPOINTS ---

// AI Smart Diagnosis
app.post("/api/diagnose", async (req, res) => {
  const { device, keluhan, kelengkapan, logContent } = req.body;

  if (!device || !keluhan) {
    return res.status(400).json({ error: "Mohon isi tipe printer dan keluhan." });
  }

  const kelengkapanList = Object.entries(kelengkapan || {})
    .filter(([_, value]) => value === true)
    .map(([key]) => key)
    .join(", ");

  // ── Parse logfile jika disertakan ────────────────────────────────────────
  let logSection = "";
  let parsedLog = null;
  if (logContent && typeof logContent === "string" && logContent.trim().length > 0) {
    try {
      parsedLog = parseLogFile(logContent);
      logSection = `\n\n${parsedLog.summary}`;
      console.log(`[Diagnose] Log parsed: format=${parsedLog.format}, errors=${parsedLog.errorCount}, warnings=${parsedLog.warningCount}`);
    } catch (e) {
      console.warn("[Diagnose] Gagal parse log file:", e);
    }
  }

  const hasLog = logSection.length > 0;

  const prompt = `Analisis masalah teknis printer kartu berdasarkan info berikut:

MODEL PRINTER: ${device}
KELUHAN TEKNISI: ${keluhan}
KELENGKAPAN TERPASANG: ${kelengkapanList || "Tidak ada data"}
${hasLog ? logSection : "\n(Tidak ada file log printer yang diunggah — analisis berdasarkan keluhan saja)"}

${hasLog ? `INSTRUKSI KHUSUS: Kamu memiliki akses ke data log nyata dari printer ini. Gunakan error code, event timestamp, suhu, card count, dan ribbon level dari log untuk memperkuat dan memvalidasi diagnosamu. Sebutkan kode error spesifik yang relevan dalam analisismu.` : ""}

TOLAK UKUR KEPUTUSAN MANDAT:
- "Pandu" = Kerusakan sederhana (pembersihan sensor, ganti consumable, reboot, reset). Panduan teks cukup.
- "Remote" = Konfigurasi software, driver, kalibrasi warna, firmware update via jaringan.
- "Kirim Service Center" = Kerusakan fisik berat — printhead pecah, mainboard rusak, encoder sensor mati, perlu bongkar mekanis di workshop.

Berikan analisis dalam format JSON terstruktur dengan kunci:
- analisis: Penjelasan penyebab teknis rinci (bahasa Indonesia)${hasLog ? ", sertakan referensi ke kode error/data log yang mendukung" : ""}
- rekomendasiTindakan: Panduan penanganan bertahap (bahasa Indonesia)
- sparepartsDibutuhkan: Array objek { namaPart, partNumber, estimasiQty, estimasiHarga } — estimasi harga rupiah yang logis
- keputusanMandat: "Pandu", "Remote", atau "Kirim Service Center"`;

  if (!ai) {
    // Simulated fallback diagnosis if GEMINI_API_KEY is not configured
    console.log("Menjalankan analisis fallback (API Key tidak terdeteksi)...");
    const simulatedResponse = getSimulatedDiagnostics(device, keluhan, parsedLog);
    return res.json(simulatedResponse);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["analisis", "rekomendasiTindakan", "sparepartsDibutuhkan", "keputusanMandat"],
          properties: {
            analisis: { type: Type.STRING, description: "Penjelasan diagnosis teknis rinci dalam bahasa indonesia" },
            rekomendasiTindakan: { type: Type.STRING, description: "Rangkaian tindakan perbaikan mandiri atau terpadu" },
            sparepartsDibutuhkan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["namaPart", "partNumber", "estimasiQty", "estimasiHarga"],
                properties: {
                  namaPart: { type: Type.STRING },
                  partNumber: { type: Type.STRING },
                  estimasiQty: { type: Type.INTEGER },
                  estimasiHarga: { type: Type.INTEGER },
                },
              },
            },
            keputusanMandat: { type: Type.STRING, description: "'Pandu', 'Remote', atau 'Kirim Service Center'" },
          },
        },
      },
    });

    const raw = response.text ?? "{}";
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (err: any) {
    console.error("[Diagnose] Gemini error:", err);
    const fallback = getSimulatedDiagnostics(device, keluhan, null);
    res.json(fallback);
  }
});

// ── Simulated diagnostics fallback ────────────────────────────────────────────
function getSimulatedDiagnostics(device: string, keluhan: string, _log: any) {
  return {
    analisis: `[SIMULASI] Printer ${device} mengalami masalah berdasarkan keluhan: "${keluhan}". Analisis lengkap memerlukan GEMINI_API_KEY yang valid.`,
    rekomendasiTindakan: "1. Restart printer dan periksa koneksi kabel.\n2. Periksa ribbon dan film.\n3. Jalankan cleaning cycle dari software driver.\n4. Jika masalah berlanjut, kirim ke Service Center.",
    sparepartsDibutuhkan: [
      { namaPart: "Cleaning Kit", partNumber: "CK-UNIV-001", estimasiQty: 1, estimasiHarga: 150000 },
    ],
    keputusanMandat: "Pandu",
  };
}


// ── Health check (untuk cloud platform) ────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Start server ────────────────────────────────────────────────────────────────
async function startServer() {
  if (IS_PROD) {
    // Production: serve built static files dari dist/
    // esbuild --format=cjs selalu inject __dirname; di ESM dev mode pakai process.cwd()/dist
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA fallback — semua route non-API dikembalikan ke index.html
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api") && !req.path.startsWith("/uploads")) {
        res.sendFile(path.join(distPath, "index.html"));
      }
    });
  } else {
    // Development: gunakan Vite dev server dengan HMR
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    const mode = IS_PROD ? "production" : "development";
    console.log(`\u2705 JIP Service Center [${mode}] running at http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
