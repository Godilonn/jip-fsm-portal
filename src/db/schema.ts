import { pgTable, text, integer, boolean, real, timestamp, jsonb } from "drizzle-orm/pg-core";

// 1. Printer Services / Tickets Table
export const printerServices = pgTable("printer_services", {
  id: text("id").primaryKey(),
  device: text("device").notNull(),
  customer: text("customer").notNull(),
  serialNumber: text("serial_number").notNull(),
  keluhan: text("keluhan").notNull(),
  kelengkapan: jsonb("kelengkapan").$type<{
    ribbon: boolean;
    film: boolean;
    catrigeFilm: boolean;
    catrigeRibbon: boolean;
    adaptor: boolean;
    kabelUsb: boolean;
    lainnya: string;
  }>().notNull(),
  tanggalTerima: text("tanggal_terima").notNull(),
  statusGaransi: text("status_garansi").notNull(),
  hasilPengecekan: text("hasil_pengecekan"),
  catatanRekomendasi: text("catatan_rekomendasi"),
  namaTs: text("nama_ts"),
  statusServis: text("status_servis").notNull().default("OPEN"),
  finalKerusakan: text("final_kerusakan"),
  sphId: text("sph_id"),
  actionLogs: jsonb("action_logs").$type<string[]>().notNull().default([]),
  slaStatus: text("sla_status").notNull().default("START"),
  slaTimeStart: text("sla_time_start"),
  isLocked: boolean("is_locked").notNull().default(false),
  assignee: text("assignee"),
});

// 2. SPH (Offered Quotations) Table
export const sphList = pgTable("sph_list", {
  id: text("id").primaryKey(),
  nomorSurat: text("nomor_surat").notNull(),
  tanggal: text("tanggal").notNull(),
  dinasMana: text("dinas_mana").notNull(),
  statusCharge: text("status_charge").notNull(), // Bayar | Free of Charge | etc
  subtotal: integer("subtotal").notNull().default(0),
  ppn: integer("ppn").notNull().default(0),
  total: integer("total").notNull().default(0),
  serviceId: text("service_id"),
});

// 3. SPH Nested Items Table (One-to-Many with SPH)
export const sphItems = pgTable("sph_items", {
  id: text("id").primaryKey(),
  sphId: text("sph_id").references(() => sphList.id, { onDelete: "cascade" }),
  itemNumber: text("item_number").notNull(),
  partNumber: text("part_number").notNull(),
  namaPart: text("nama_part").notNull(),
  qty: integer("qty").notNull().default(1),
  harga: integer("harga").notNull().default(0),
  jumlah: integer("jumlah").notNull().default(0),
});

// 4. Logistics (Active Shipments) Table
export const barangAktif = pgTable("barang_aktif", {
  id: text("id").primaryKey(),
  noResi: text("no_resi").notNull(),
  barang: text("barang").notNull(),
  berat: real("berat").notNull().default(0.0),
  ukuran: text("ukuran").notNull(),
  pemilik: text("pemilik").notNull(),
  tujuan: text("tujuan").notNull(),
  status: text("status").notNull().default("Menunggu"),
  packingStatus: text("packing_status"), // READY_TO_PACK | PACKED | etc
  scheduleShipping: text("schedule_shipping"),
  serviceId: text("service_id"),
});

// 5. Inventory Spareparts Table
export const spareparts = pgTable("spareparts", {
  id: text("id").primaryKey(),
  kodeItem: text("kode_item").notNull(),
  partNumber: text("part_number").notNull(),
  namaBarang: text("nama_barang").notNull(),
  kategori: text("kategori").notNull(),
  stok: integer("stok").notNull().default(0),
  harga: integer("harga").notNull().default(0),
  status: text("status").notNull().default("Tersedia"),
  untukMesinApa: text("untuk_mesin_apa").notNull(),
});

// 6. Inventory ATK Table
export const atkList = pgTable("atk_list", {
  id: text("id").primaryKey(),
  kode: text("kode").notNull(),
  namaBarang: text("nama_barang").notNull(),
  kategori: text("kategori").notNull(),
  stok: integer("stok").notNull().default(0),
  status: text("status").notNull().default("Tersedia"),
});

// 7. Demo Fleet / Assets Table
export const asetDemo = pgTable("aset_demo", {
  id: text("id").primaryKey(),
  kode: text("kode").notNull(),
  namaBarang: text("nama_barang").notNull(),
  jenis: text("jenis").notNull(),
  kondisi: text("kondisi").notNull(),
  status: text("status").notNull(),
  lokasi: text("lokasi").notNull(),
  keterangan: text("keterangan"),
});

// 8. Downloads / File Repository Table
export const downloads = pgTable("downloads", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  version: text("version").notNull().default("v1.0.0"),
  type: text("type").notNull().default("Driver"), // Driver | Firmware | Utility | Manual | Aplikasi
  device: text("device").notNull().default("Semua"),
  description: text("description").notNull().default(""),
  compatibility: text("compatibility").notNull().default("Windows 10/11"),
  releaseDate: text("release_date").notNull(),
  fileSize: text("file_size").notNull().default("0 MB"),
  fileName: text("file_name").notNull(),      // nama file asli yang diupload
  filePath: text("file_path").notNull(),      // path relatif di server: uploads/downloads/xxx
  status: text("status").notNull().default("Official Release"), // Official Release | Beta | Hotfix
  allowedRoles: text("allowed_roles").array(), // null = semua; atau ["MANAGER","TECHNICIAN"] dll
  uploadedBy: text("uploaded_by").notNull().default("MANAGER"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==========================================
// Better Auth Database Schemas
// ==========================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // RBAC role — MANAGER | DISPATCHER | TECHNICIAN | CUSTOMER
  role: text("role").notNull().default("CUSTOMER"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  providerId: text("provider_id").notNull(),
  accountId: text("account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  expiresAt: timestamp("expires_at"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
