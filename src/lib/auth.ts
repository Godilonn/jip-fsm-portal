/**
 * @file lib/auth.ts
 * @description Konfigurasi Better Auth — email/password + RBAC role.
 *
 * USER TABLE diperluas dengan kolom `role` (MANAGER | DISPATCHER | TECHNICIAN | CUSTOMER).
 * Role disimpan langsung di tabel `user` di database, bukan di JWT/cookie.
 *
 * CARA AKSES SESSION DI SERVER:
 *   const session = await auth.api.getSession({ headers: req.headers as any });
 *   session?.user.role  // => "MANAGER"
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb, isDbConfigured } from "../db";
import * as schema from "../db/schema";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export function getAuth(): ReturnType<typeof betterAuth> | null {
  if (authInstance) return authInstance;

  if (!isDbConfigured()) {
    console.warn(
      "Better Auth: DATABASE_URL tidak diset. App berjalan dalam mode in-memory (dummy)."
    );
    return null;
  }

  try {
    const db = getDb();

    // @ts-ignore — BetterAuth internal CheckPasswordFn type is overly strict in v1.6
    authInstance = betterAuth({
      secret: (() => {
        const s = process.env.BETTER_AUTH_SECRET;
        if (!s) throw new Error("[auth] BETTER_AUTH_SECRET wajib diset di .env! Jangan jalankan production tanpa secret.");
        return s;
      })(),
      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
      trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:5173",
        ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
        ...(process.env.APP_URL ? [process.env.APP_URL] : []),
      ],

      // ── Database adapter ──────────────────────────────────────────────────
      database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
          user: schema.user,
          session: schema.session,
          account: schema.account,
          verification: schema.verification,
        },
      }),

      // ── Email + Password ──────────────────────────────────────────────────
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },

      // ── Custom user fields ────────────────────────────────────────────────
      // Field `role` disimpan di kolom `role` tabel `user` di DB.
      // Better Auth menyertakannya di session.user secara otomatis.
      user: {
        additionalFields: {
          role: {
            type: "string",
            required: false,
            defaultValue: "CUSTOMER",
            input: false, // user biasa tidak bisa set sendiri saat sign-up
          },
        },
      },

      // ── Session config ────────────────────────────────────────────────────
      session: {
        expiresIn: 60 * 60 * 24 * 7,  // 7 hari
        updateAge: 60 * 60 * 24,       // Refresh tiap 24 jam
      },
    });

    return authInstance;
  } catch (error) {
    console.error("[auth] Gagal inisialisasi Better Auth:", error);
    return null;
  }
}
