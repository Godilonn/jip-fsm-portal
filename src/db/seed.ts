/**
 * @file src/db/seed.ts
 * @description Seed initial users langsung ke PostgreSQL via Better Auth internal API.
 *
 * CARA PAKAI (TANPA perlu server running):
 *   npm run db:seed
 *
 * User yang dibuat:
 *   - bambang@jasuindo.id (MANAGER)     password: Manager@2026!
 *   - rendra@jasuindo.id (DISPATCHER)   password: Dispatch@2026!
 *   - eko@jasuindo.id    (TECHNICIAN)   password: Technic@2026!
 *   - andi@jasuindo.id   (CUSTOMER)     password: Customer@2026!
 */

import dotenv from "dotenv";
dotenv.config();

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import { getAuth } from "../lib/auth";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL belum diset di .env");
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// USER DATA AWAL
// ─────────────────────────────────────────────────────────────────────────────

const SEED_USERS = [
  { name: "Bambang Widodo",  email: "bambang@jasuindo.id", password: "Manager@2026!",  role: "MANAGER"     },
  { name: "Rendra Kusuma",   email: "rendra@jasuindo.id",  password: "Dispatch@2026!", role: "DISPATCHER"  },
  { name: "Eko Prasetyo",    email: "eko@jasuindo.id",     password: "Technic@2026!",  role: "TECHNICIAN"  },
  { name: "Andi Wijaya",     email: "andi@jasuindo.id",    password: "Customer@2026!", role: "CUSTOMER"    },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Memulai seed database...\n");

  const auth = getAuth();
  if (!auth) {
    console.error("❌ Better Auth tidak bisa diinisialisasi. Pastikan DATABASE_URL sudah benar di .env");
    process.exit(1);
  }

  const sql = postgres(DATABASE_URL!, { max: 1 });
  const db = drizzle(sql, { schema });

  let successCount = 0;

  for (const userData of SEED_USERS) {
    process.stdout.write(`→ ${userData.name} (${userData.email}) [${userData.role}]... `);

    try {
      // Cek apakah user sudah ada
      const existing = await db
        .select({ id: schema.user.id })
        .from(schema.user)
        .where(eq(schema.user.email, userData.email))
        .limit(1);

      if (existing.length > 0) {
        // Update role saja kalau sudah ada
        await db
          .update(schema.user)
          .set({ role: userData.role, updatedAt: new Date() })
          .where(eq(schema.user.email, userData.email));
        console.log(`⏭️  sudah ada, role diupdate → ${userData.role}`);
        successCount++;
        continue;
      }

      // Daftarkan via Better Auth internal API (tanpa HTTP, tanpa server)
      const result = await auth.api.signUpEmail({
        body: {
          name: userData.name,
          email: userData.email,
          password: userData.password,
        },
      });

      const userId = (result as any)?.user?.id;
      if (!userId) {
        console.log("❌ User ID tidak ditemukan di response");
        continue;
      }

      // Set role (Better Auth sign-up tidak bisa set role lewat input)
      await db
        .update(schema.user)
        .set({ role: userData.role, updatedAt: new Date() })
        .where(eq(schema.user.id, userId));

      console.log(`✅ OK (id: ${userId})`);
      successCount++;

    } catch (err: any) {
      const msg = err?.message || String(err);
      const cause = err?.cause?.message || err?.cause || "";
      if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
        console.log("⏭️  sudah ada, skip");
        successCount++;
      } else {
        console.log(`❌ Error: ${msg}${cause ? ` | Cause: ${cause}` : ""}`);
      }
    }
  }

  await sql.end();

  console.log(`\n✨ Selesai! ${successCount}/${SEED_USERS.length} user berhasil dibuat/diverifikasi.`);
  console.log("\n📋 KREDENSIAL LOGIN:");
  console.log("─".repeat(60));
  SEED_USERS.forEach(u => {
    console.log(`  [${u.role.padEnd(10)}] ${u.email.padEnd(25)} → ${u.password}`);
  });
  console.log("─".repeat(60));
  console.log("\nJalankan server: npm run dev  lalu buka http://localhost:3000\n");
}

main().catch(err => {
  console.error("\n❌ Fatal error:", err.message || err);
  process.exit(1);
});
