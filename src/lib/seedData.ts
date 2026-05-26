/**
 * @file lib/seedData.ts
 * @description Dummy dataset untuk development & Prisma seeding.
 *
 * CARA PAKAI DENGAN PRISMA:
 * ─────────────────────────
 *   // prisma/seed.ts
 *   import { SEED_SERVICES, SEED_SPH, SEED_SPAREPARTS, SEED_LOGISTICS } from "../src/lib/seedData";
 *   import { PrismaClient } from "@prisma/client";
 *   const prisma = new PrismaClient();
 *
 *   async function main() {
 *     await prisma.printerService.createMany({ data: SEED_SERVICES });
 *     await prisma.sparepartItem.createMany({ data: SEED_SPAREPARTS });
 *     await prisma.sPH.createMany({ data: SEED_SPH });
 *     await prisma.barangAktif.createMany({ data: SEED_LOGISTICS });
 *   }
 *   main().then(() => prisma.$disconnect());
 *
 * CATATAN:
 *  - Field `id` menggunakan format PRN-XXX / SPH-XXX / etc.
 *  - Semua tanggal dalam ISO string (YYYY-MM-DD atau full ISO).
 *  - `kelengkapan` akan perlu dikonversi ke JSON di skema Prisma.
 */

import type {
  PrinterService,
  SPH,
  SparepartItem,
  BarangAktif,
  ATKItem,
  AsetDemoItem,
} from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// PRINTER SERVICES (Tiket Penerimaan)
// ─────────────────────────────────────────────────────────────────────────────

export const SEED_SERVICES: PrinterService[] = [
  {
    id: "PRN-001",
    device: "SR200",
    customer: "Dinas Kependudukan Kota Surabaya",
    serialNumber: "SR200-SBY-0012",
    keluhan: "Hasil cetak bergaris putih vertikal pada setiap kartu KTP yang dicetak",
    kelengkapan: { ribbon: true, film: true, catrigeFilm: false, catrigeRibbon: true, adaptor: true, kabelUsb: true, lainnya: "" },
    tanggalTerima: "2026-05-01",
    statusGaransi: "Non-Garansi",
    hasilPengecekan: "Elemen thermal printhead ditemukan tergores. Perlu penggantian unit.",
    catatanRekomendasi: "Kirim ke workshop untuk penggantian printhead. Estimasi 3 hari kerja.",
    namaTs: "Eko Prasetyo",
    assignee: "Eko Prasetyo",
    statusServis: "Perbaikan",
    ticketType: "INCIDENT",
    sphId: "SPH-001",
    actionLogs: [
      "[01/05/2026] Ticket PRN-001 dibuka — status OPEN.",
      "[01/05/2026 09:15:22] Ditugaskan ke Eko Prasetyo.",
      "[02/05/2026 11:30:00] Diagnosa selesai. Status → Perbaikan.",
    ],
    travelSlaStatus: "STOPPED",
    repairSlaStatus: "RUNNING",
    travelSlaMinutes: 22,
    slaTimeStart: "2026-05-02T09:00:00.000Z",
  },
  {
    id: "PRN-002",
    device: "CR805",
    customer: "Bappenda Kabupaten Pasuruan",
    serialNumber: "CR805-PSR-0034",
    keluhan: "Retransfer film sobek saat proses pemanasan dan melilit di roller",
    kelengkapan: { ribbon: true, film: false, catrigeFilm: false, catrigeRibbon: true, adaptor: true, kabelUsb: true, lainnya: "" },
    tanggalTerima: "2026-05-05",
    statusGaransi: "Garansi",
    hasilPengecekan: "Heating roller melampaui batas suhu normal. Thermistor soak.",
    catatanRekomendasi: "Ganti heating roller. Masih dalam periode garansi, tidak ada biaya.",
    namaTs: "Bambang Setiawan",
    assignee: "Bambang Setiawan",
    statusServis: "SPH Dibuat",
    ticketType: "INCIDENT",
    sphId: "SPH-002",
    actionLogs: [
      "[05/05/2026] Ticket PRN-002 diterima.",
      "[05/05/2026 14:00:00] Ditugaskan ke Bambang Setiawan.",
      "[06/05/2026 10:00:00] SPH Garansi diterbitkan.",
    ],
    travelSlaStatus: "STOPPED",
    repairSlaStatus: "PAUSED",
    travelSlaMinutes: 45,
    slaTimeStart: "2026-05-05T13:00:00.000Z",
  },
  {
    id: "PRN-003",
    device: "Em2s",
    customer: "Dinas Kesehatan Kabupaten Mojokerto",
    serialNumber: "EM2S-MJK-0007",
    keluhan: "Lampu indicator berkedip merah — kode error: Ribbon Out, padahal ribbon baru dipasang",
    kelengkapan: { ribbon: true, film: true, catrigeFilm: true, catrigeRibbon: false, adaptor: true, kabelUsb: true, lainnya: "" },
    tanggalTerima: "2026-05-08",
    statusGaransi: "Non-Garansi",
    hasilPengecekan: "Sensor optik RFID ribbon tertutup debu halus. RFID chip pada cartridge masih terbaca.",
    catatanRekomendasi: "Bersihkan sensor dengan air duster, lakukan uji cetak ulang.",
    namaTs: "Eko Prasetyo",
    assignee: "Eko Prasetyo",
    statusServis: "Diagnosa AI",
    ticketType: "INCIDENT",
    actionLogs: [
      "[08/05/2026] Tiket PRN-003 dibuka.",
      "[08/05/2026 10:30:00] Dianalisis oleh sistem AI — mandat: Pandu.",
    ],
    travelSlaStatus: "RUNNING",
    repairSlaStatus: "PAUSED",
    travelSlaMinutes: 0,
    slaTimeStart: "2026-05-08T10:00:00.000Z",
  },
  {
    id: "PRN-004",
    device: "SD307",
    customer: "BPJS Ketenagakerjaan Cab. Sidoarjo",
    serialNumber: "SD307-SDJ-0019",
    keluhan: "Kartu selalu tersangkut (card jam) di bagian feeder sebelum encoder magnetic",
    kelengkapan: { ribbon: true, film: true, catrigeFilm: true, catrigeRibbon: true, adaptor: true, kabelUsb: false, lainnya: "" },
    tanggalTerima: "2026-05-10",
    statusGaransi: "Non-Garansi",
    namaTs: "Yusuf Mansur",
    assignee: "Yusuf Mansur",
    statusServis: "Diterima",
    ticketType: "INCIDENT",
    actionLogs: [
      "[10/05/2026] Tiket PRN-004 diterima di workshop.",
    ],
    travelSlaStatus: "PAUSED",
    repairSlaStatus: "PAUSED",
    slaTimeStart: "2026-05-10T08:00:00.000Z",
  },
  {
    id: "PRN-005",
    device: "CR707",
    customer: "Kepolisian Resort Kota Malang",
    serialNumber: "CR707-MLG-0003",
    keluhan: "Driver tidak terdeteksi di komputer Windows 11, printer tidak muncul di device manager",
    kelengkapan: { ribbon: true, film: false, catrigeFilm: false, catrigeRibbon: true, adaptor: true, kabelUsb: true, lainnya: "" },
    tanggalTerima: "2026-05-12",
    statusGaransi: "Garansi",
    hasilPengecekan: "Incompatible USB driver. Perlu reinstall driver v5.1.0-JIP dan firmware update.",
    catatanRekomendasi: "Remote assistance — firmware + driver via TeamViewer dengan operator dinas.",
    namaTs: "Bambang Setiawan",
    assignee: "Bambang Setiawan",
    statusServis: "OPEN",
    ticketType: "TASK/DEMO",
    actionLogs: [
      "[12/05/2026] Tiket PRN-005 masuk via telepon helpdesk.",
    ],
    travelSlaStatus: "PAUSED",
    repairSlaStatus: "PAUSED",
    slaTimeStart: "2026-05-12T09:30:00.000Z",
  },
  {
    id: "PRN-006",
    device: "SR200",
    customer: "Dinas Perhubungan Kota Kediri",
    serialNumber: "SR200-KDR-0028",
    keluhan: "Printer mati total setelah kantor kebanjiran — adaptor dan PSU kemungkinan rusak",
    kelengkapan: { ribbon: false, film: false, catrigeFilm: false, catrigeRibbon: false, adaptor: false, kabelUsb: true, lainnya: "Fisik printer ada bekas air" },
    tanggalTerima: "2026-05-03",
    statusGaransi: "Non-Garansi",
    hasilPengecekan: "Mainboard mengalami korsleting akibat cairan. Komponen IC regulator hangus.",
    catatanRekomendasi: "Tidak bisa diperbaiki — rekomendasi penggantian unit baru.",
    namaTs: "Eko Prasetyo",
    assignee: "Eko Prasetyo",
    statusServis: "Selesai",
    ticketType: "INCIDENT",
    sphId: "SPH-003",
    actionLogs: [
      "[03/05/2026] Tiket PRN-006 diterima — printer terendam banjir.",
      "[04/05/2026] Diagnosa: mainboard hangus. SPH penggantian unit diterbitkan.",
      "[15/05/2026] Tiket selesai. Diinformasikan ke dinas untuk pengadaan unit baru.",
    ],
    travelSlaStatus: "STOPPED",
    repairSlaStatus: "STOPPED",
    travelSlaMinutes: 30,
    repairSlaMinutes: 120,
    slaTimeStart: "2026-05-03T08:00:00.000Z",
  },
  {
    id: "PRN-007",
    device: "Em2s",
    customer: "Dinas Kependudukan Kab. Gresik",
    serialNumber: "EM2S-GRK-0015",
    keluhan: "Warna hasil cetak memudar dan tidak tajam setelah ganti ribbon baru",
    kelengkapan: { ribbon: true, film: true, catrigeFilm: true, catrigeRibbon: true, adaptor: true, kabelUsb: true, lainnya: "" },
    tanggalTerima: "2026-05-15",
    statusGaransi: "Garansi",
    namaTs: "Unassigned",
    statusServis: "Diterima",
    ticketType: "INCIDENT",
    actionLogs: [
      "[15/05/2026] Tiket PRN-007 diterima — antrian penerimaan.",
    ],
    travelSlaStatus: "PAUSED",
    repairSlaStatus: "PAUSED",
    slaTimeStart: "2026-05-15T11:00:00.000Z",
  },
  {
    id: "PRN-008",
    device: "SR200",
    customer: "Satuan Polisi Pamong Praja Surabaya",
    serialNumber: "SR200-SBY-0041",
    keluhan: "Kartu KTP hasil cetak mengelupas lapisannya dalam 2 minggu setelah cetak",
    kelengkapan: { ribbon: true, film: true, catrigeFilm: true, catrigeRibbon: true, adaptor: true, kabelUsb: true, lainnya: "" },
    tanggalTerima: "2026-05-18",
    statusGaransi: "Non-Garansi",
    namaTs: "Eko Prasetyo",
    assignee: "Eko Prasetyo",
    statusServis: "Diagnosa AI",
    ticketType: "INCIDENT",
    actionLogs: [
      "[18/05/2026] Tiket PRN-008 diterima. Diagnosa AI: masalah suhu retransfer.",
    ],
    travelSlaStatus: "PAUSED",
    repairSlaStatus: "RUNNING",
    slaTimeStart: "2026-05-18T08:30:00.000Z",
  },
  {
    id: "PRN-009",
    device: "CR805",
    customer: "Rumah Sakit Umum Daerah Sidoarjo",
    serialNumber: "CR805-SDJ-0009",
    keluhan: "Error kode E-03: Cleaning required — sudah dibersihkan tapi masih muncul",
    kelengkapan: { ribbon: true, film: false, catrigeFilm: false, catrigeRibbon: true, adaptor: true, kabelUsb: true, lainnya: "Film tidak disertakan" },
    tanggalTerima: "2026-05-20",
    statusGaransi: "Non-Garansi",
    namaTs: "Bambang Setiawan",
    assignee: "Bambang Setiawan",
    statusServis: "Perbaikan",
    ticketType: "INCIDENT",
    actionLogs: [
      "[20/05/2026] Tiket PRN-009 masuk. Teknisi sedang on-site.",
    ],
    travelSlaStatus: "STOPPED",
    repairSlaStatus: "RUNNING",
    travelSlaMinutes: 38,
    slaTimeStart: "2026-05-20T10:00:00.000Z",
  },
  {
    id: "PRN-010",
    device: "SD307",
    customer: "Kantor Imigrasi Kelas II Malang",
    serialNumber: "SD307-MLG-0022",
    keluhan: "Unit baru tiba tapi tidak bisa cetak — perlu setup konfigurasi jaringan dan driver",
    kelengkapan: { ribbon: true, film: true, catrigeFilm: true, catrigeRibbon: true, adaptor: true, kabelUsb: true, lainnya: "Semua aksesoris lengkap dari kardus" },
    tanggalTerima: "2026-05-22",
    statusGaransi: "Garansi",
    namaTs: "Yusuf Mansur",
    assignee: "Yusuf Mansur",
    statusServis: "Diterima",
    ticketType: "TASK/DEMO",
    actionLogs: [
      "[22/05/2026] Tiket PRN-010 dibuat untuk instalasi unit baru.",
    ],
    travelSlaStatus: "PAUSED",
    repairSlaStatus: "PAUSED",
    slaTimeStart: "2026-05-22T08:00:00.000Z",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SPAREPARTS INVENTORY
// ─────────────────────────────────────────────────────────────────────────────

export const SEED_SPAREPARTS = [
  { id: "SP-001", namaBarang: "Printhead Thermal SR200", partNumber: "512122-001", stok: 3, harga: 3500000, satuan: "Unit", kategori: "Printhead", status: "Tersedia" },
  { id: "SP-002", namaBarang: "Retransfer Film CR805 (200 lembar)", partNumber: "CR805-FILM-200", stok: 8, harga: 850000, satuan: "Roll", kategori: "Consumable", status: "Tersedia" },
  { id: "SP-003", namaBarang: "Ribbon YMCKO SR200 (250 prints)", partNumber: "SR200-RBN-250", stok: 12, harga: 650000, satuan: "Roll", kategori: "Consumable", status: "Tersedia" },
  { id: "SP-004", namaBarang: "Heating Roller CR805", partNumber: "CR805-HROL-01", stok: 2, harga: 1200000, satuan: "Unit", kategori: "Mekanik", status: "Tersedia" },
  { id: "SP-005", namaBarang: "Grip Roller SR200 (set of 3)", partNumber: "SR200-GROL-SET3", stok: 5, harga: 450000, satuan: "Set", kategori: "Mekanik", status: "Tersedia" },
  { id: "SP-006", namaBarang: "Adaptor Power 24V DC SR200", partNumber: "SR200-ADP-24V", stok: 4, harga: 750000, satuan: "Unit", kategori: "Elektronik", status: "Tersedia" },
  { id: "SP-007", namaBarang: "Kabel USB Type-B 1.8m", partNumber: "USB-TB-180", stok: 20, harga: 85000, satuan: "Pcs", kategori: "Kabel", status: "Tersedia" },
  { id: "SP-008", namaBarang: "Cleaning Kit (Swab + Card + Pen)", partNumber: "JIP-CLN-KIT-01", stok: 15, harga: 185000, satuan: "Kit", kategori: "Consumable", status: "Tersedia" },
  { id: "SP-009", namaBarang: "Encoder Magnetic Stripe Module SD307", partNumber: "SD307-ENC-MAG", stok: 1, harga: 2800000, satuan: "Unit", kategori: "Elektronik", status: "Hampir Habis" },
  { id: "SP-010", namaBarang: "Printhead Entrust EM2s", partNumber: "EM2S-PH-001", stok: 2, harga: 4200000, satuan: "Unit", kategori: "Printhead", status: "Tersedia" },
  { id: "SP-011", namaBarang: "Ribbon YMCKO Em2s (300 prints)", partNumber: "EM2S-RBN-300", stok: 0, harga: 920000, satuan: "Roll", kategori: "Consumable", status: "Habis" },
  { id: "SP-012", namaBarang: "Mainboard SR200 Replacement", partNumber: "SR200-MB-REP", stok: 1, harga: 5500000, satuan: "Unit", kategori: "Elektronik", status: "Hampir Habis" },
];

// ─────────────────────────────────────────────────────────────────────────────
// SPH (Surat Penawaran Harga)
// ─────────────────────────────────────────────────────────────────────────────

export const SEED_SPH: SPH[] = [
  {
    id: "SPH-001",
    nomorSurat: "SPH/PNT/V/2026/001",
    tanggal: "2026-05-03",
    dinasMana: "Dinas Kependudukan Kota Surabaya",
    serviceId: "PRN-001",
    items: [
      { id: "SPHI-001", itemNumber: "1", partNumber: "512122-001", namaPart: "Printhead Thermal SR200", qty: 1, harga: 3500000, jumlah: 3500000 },
      { id: "SPHI-002", itemNumber: "2", partNumber: "JIP-CLN-KIT-01", namaPart: "Cleaning Kit Standar", qty: 2, harga: 185000, jumlah: 370000 },
    ],
    subtotal: 3870000,
    ppn: 425700,
    total: 4295700,
    statusCharge: "Bayar",
    catatan: "Penggantian printhead akibat keausan fisik — tidak tercover garansi.",
  },
  {
    id: "SPH-002",
    nomorSurat: "SPH/PNT/V/2026/002",
    tanggal: "2026-05-06",
    dinasMana: "Bappenda Kabupaten Pasuruan",
    serviceId: "PRN-002",
    items: [
      { id: "SPHI-003", itemNumber: "1", partNumber: "CR805-HROL-01", namaPart: "Heating Roller CR805", qty: 1, harga: 1200000, jumlah: 1200000 },
    ],
    subtotal: 1200000,
    ppn: 0,
    total: 0,
    statusCharge: "Garansi",
    catatan: "Unit dalam masa garansi 1 tahun — biaya ditanggung JIP sepenuhnya.",
  },
  {
    id: "SPH-003",
    nomorSurat: "SPH/PNT/V/2026/003",
    tanggal: "2026-05-04",
    dinasMana: "Dinas Perhubungan Kota Kediri",
    serviceId: "PRN-006",
    items: [
      { id: "SPHI-004", itemNumber: "1", partNumber: "SR200-MB-REP", namaPart: "Mainboard SR200 Replacement", qty: 1, harga: 5500000, jumlah: 5500000 },
      { id: "SPHI-005", itemNumber: "2", partNumber: "SR200-ADP-24V", namaPart: "Adaptor Power 24V DC", qty: 1, harga: 750000, jumlah: 750000 },
    ],
    subtotal: 6250000,
    ppn: 687500,
    total: 6937500,
    statusCharge: "Bayar",
    catatan: "Kerusakan akibat bencana alam (banjir) — tidak tercover garansi.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LOGISTICS (Barang Aktif Pengiriman)
// ─────────────────────────────────────────────────────────────────────────────

export const SEED_LOGISTICS: BarangAktif[] = [
  {
    id: "LOG-001",
    noResi: "JIP-EXP-884721",
    barang: "Unit Printer SR200 Servis (PRN-001)",
    berat: 8.5,
    ukuran: "40x30x25 cm",
    pemilik: "Dinas Kependudukan Kota Surabaya",
    tujuan: "Workshop JIP — Sidoarjo",
    status: "Dalam Perjalanan",
    tanggalKirim: "2026-05-02",
    estimasiTiba: "2026-05-03",
  },
  {
    id: "LOG-002",
    noResi: "JIP-EXP-221034",
    barang: "Unit Printer CR805 Servis (PRN-002)",
    berat: 12.0,
    ukuran: "45x35x30 cm",
    pemilik: "Bappenda Kabupaten Pasuruan",
    tujuan: "Workshop JIP — Sidoarjo",
    status: "Dalam Perjalanan",
    tanggalKirim: "2026-05-06",
    estimasiTiba: "2026-05-07",
  },
  {
    id: "LOG-003",
    noResi: "JIP-EXP-557892",
    barang: "Unit Printer SR200 Servis (PRN-006) + Dokumen BA",
    berat: 8.5,
    ukuran: "40x30x25 cm",
    pemilik: "Dinas Perhubungan Kota Kediri",
    tujuan: "Dinas Perhubungan Kota Kediri — Kembali",
    status: "Menunggu",
    tanggalKirim: "2026-05-16",
  },
  {
    id: "LOG-004",
    noResi: "JIP-EXP-993310",
    barang: "Ribbon SR200 YMCKO x5 Roll + Cleaning Kit x3",
    berat: 2.5,
    ukuran: "30x20x15 cm",
    pemilik: "Gudang JIP",
    tujuan: "Kantor Imigrasi Kelas II Malang",
    status: "Diterima",
    tanggalKirim: "2026-05-10",
    estimasiTiba: "2026-05-11",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ATK (Alat Tulis Kantor)
// ─────────────────────────────────────────────────────────────────────────────

export const SEED_ATK = [
  { id: "ATK-001", namaBarang: "Kertas A4 80gsm (rim)", stok: 25, satuan: "Rim", harga: 65000, status: "Tersedia" },
  { id: "ATK-002", namaBarang: "Toner Printer Laserjet Canon", stok: 4, satuan: "Cartridge", harga: 285000, status: "Tersedia" },
  { id: "ATK-003", namaBarang: "Pulpen Ballpoint (box)", stok: 3, satuan: "Box", harga: 45000, status: "Tersedia" },
  { id: "ATK-004", namaBarang: "Plastik Laminating A4 (100 pcs)", stok: 1, satuan: "Pack", harga: 75000, status: "Hampir Habis" },
  { id: "ATK-005", namaBarang: "Label Sticker Thermal 4x6cm (500pcs)", stok: 8, satuan: "Roll", harga: 35000, status: "Tersedia" },
];

// ─────────────────────────────────────────────────────────────────────────────
// ASET DEMO
// ─────────────────────────────────────────────────────────────────────────────

export const SEED_ASSETS = [
  { id: "AST-001", namaAset: "Laptop Demo Lenovo ThinkPad X1", serialNumber: "LNV-X1-2024-007", kondisi: "Bagus", lokasi: "Kantor JIP Sidoarjo", tanggalPengadaan: "2024-03-15" },
  { id: "AST-002", namaAset: "Printer Demo Entrust EM2s", serialNumber: "EM2S-DEMO-001", kondisi: "Bagus", lokasi: "Kantor JIP Sidoarjo", tanggalPengadaan: "2024-06-01" },
  { id: "AST-003", namaAset: "Proyektor Epson EB-X51", serialNumber: "EPS-X51-2023-003", kondisi: "Perlu Servis", lokasi: "Ruang Meeting JIP", tanggalPengadaan: "2023-09-20" },
  { id: "AST-004", namaAset: "Printer Demo Datacard SR200", serialNumber: "SR200-DEMO-003", kondisi: "Bagus", lokasi: "Mobil Demo Teknisi — Eko", tanggalPengadaan: "2025-01-10" },
  { id: "AST-005", namaAset: "UPS APC BX1000M", serialNumber: "APC-BX1K-088", kondisi: "Bagus", lokasi: "Server Room JIP", tanggalPengadaan: "2024-11-05" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONVENIENCE RE-EXPORT (semua dataset dalam satu objek)
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_SEED_DATA = {
  services:   SEED_SERVICES,
  spareparts: SEED_SPAREPARTS,
  sph:        SEED_SPH,
  logistics:  SEED_LOGISTICS,
  atk:        SEED_ATK,
  assets:     SEED_ASSETS,
};
