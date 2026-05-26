/**
 * @file features/auth/components/LoginPage.tsx
 * @description Halaman login JIP Service Portal.
 *
 * AUTH MODE:
 *  - REAL DB: POST /api/auth/sign-in/email → cookie session
 *  - IN-MEMORY: cek dari MOCK_USERS di AppContext
 *
 * Login menggunakan EMAIL (bukan username) setelah koneksi ke DB real.
 * Untuk mode demo (tanpa DB), bisa tetap pakai username pendek.
 */

import React, { useState } from "react";
import {
  Bot, Shield, User, Lock, Eye, EyeOff,
  AlertTriangle, Globe, Moon, Sun, Loader2,
} from "lucide-react";

import { useApp } from "../../../store/AppContext";
import { MOCK_USERS, APP_META } from "../../../lib/constants";

// Akun demo yang ditampilkan di accordion (setelah DB real)
const DEMO_ACCOUNTS = [
  { email: "bambang@jasuindo.id", password: "Manager@2026!",  role: "MANAGER",    short: "bambang" },
  { email: "rendra@jasuindo.id",  password: "Dispatch@2026!", role: "DISPATCHER", short: "rendra"  },
  { email: "eko@jasuindo.id",     password: "Technic@2026!",  role: "TECHNICIAN", short: "eko"     },
  { email: "andi@jasuindo.id",    password: "Customer@2026!", role: "CUSTOMER",   short: "andi"    },
];

export default function LoginPage() {
  const { login, users, language, toggleLanguage, isDarkMode, toggleDarkMode } = useApp();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [passwordWarning, setPasswordWarning] = useState("");
  const [showDemoTip, setShowDemoTip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const t = (id: string, en: string) => (language === "EN" ? en : id);

  // ── Email validation ─────────────────────────────────────────────────────
  const handleEmailChange = (rawVal: string) => {
    const sanitized = rawVal.replace(/\s/g, "");
    if (sanitized.length > 0 && sanitized.length < 3) {
      setEmailWarning(t("⚠️ Terlalu pendek.", "⚠️ Too short."));
    } else {
      setEmailWarning("");
    }
    setLoginEmail(sanitized);
    if (loginError) setLoginError("");
  };

  // ── Password validation ──────────────────────────────────────────────────
  const handlePasswordChange = (rawVal: string) => {
    const sanitized = rawVal.replace(/\s/g, "");
    if (rawVal !== sanitized) {
      setPasswordWarning(t("⚠️ Spasi diblokir!", "⚠️ Spaces blocked!"));
    } else if (sanitized.length > 0 && sanitized.length < 6) {
      setPasswordWarning(t("⚠️ Minimal 6 karakter.", "⚠️ Min 6 characters."));
    } else {
      setPasswordWarning("");
    }
    setLoginPassword(sanitized);
    if (loginError) setLoginError("");
  };

  // ── Submit handler ───────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportMessage("");
    setLoginError("");

    const emailOrUsername = loginEmail.trim();
    if (!emailOrUsername) {
      setLoginError(t("Silakan masukkan Email Anda.", "Please enter your email."));
      return;
    }
    if (!loginPassword) {
      setLoginError(t("Silakan masukkan kata sandi.", "Please enter your password."));
      return;
    }

    setIsLoading(true);

    try {
      // ── Coba Real Auth (Better Auth) ──────────────────────────────────────
      // Jika input bukan email (tidak ada @), coba cari email dari DEMO_ACCOUNTS
      let emailToUse = emailOrUsername;
      if (!emailOrUsername.includes("@")) {
        const match = DEMO_ACCOUNTS.find(a => a.short === emailOrUsername.toLowerCase());
        if (match) emailToUse = match.email;
        else {
          // Fallback: cari di MOCK_USERS (mode in-memory)
          const mockUser = users.find(
            u => u.username === emailOrUsername ||
                 u.username.split("_")[0] === emailOrUsername.toLowerCase() ||
                 u.fullName.toLowerCase().split(" ")[0] === emailOrUsername.toLowerCase()
          );
          if (mockUser) {
            const expectedPwd = mockUser.password ?? "jasuindo123";
            if (loginPassword !== expectedPwd) {
              setLoginError("❌ Sandi salah!");
              setIsLoading(false);
              return;
            }
            login(mockUser);
            setIsLoading(false);
            return;
          }
          setLoginError("❌ Identitas tidak dikenali. Gunakan email atau username yang terdaftar.");
          setIsLoading(false);
          return;
        }
      }

      // Panggil Better Auth sign-in
      const signInRes = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: emailToUse, password: loginPassword }),
      });

      if (!signInRes.ok) {
        // Better Auth tidak bisa sign in — coba fallback in-memory
        const errBody = await signInRes.json() as any;
        if (signInRes.status === 503) {
          // DB tidak dikonfigurasi → fallback ke mock
          const uLower = emailOrUsername.toLowerCase();
          const mockUser = users.find(
            u => u.username === emailOrUsername ||
                 u.email === emailOrUsername ||
                 u.username.split("_")[0] === uLower ||
                 u.fullName.toLowerCase().split(" ")[0] === uLower
          );
          if (!mockUser) {
            setLoginError("❌ Identitas tidak dikenali.");
            setIsLoading(false);
            return;
          }
          if (loginPassword !== (mockUser.password ?? "jasuindo123")) {
            setLoginError("❌ Sandi salah!");
            setIsLoading(false);
            return;
          }
          login(mockUser);
          setIsLoading(false);
          return;
        }
        // Auth error dari server
        setLoginError(
          errBody?.message === "Invalid email or password"
            ? "❌ Email atau sandi salah. Periksa kembali kredensial Anda."
            : errBody?.message ?? "❌ Login gagal. Coba lagi."
        );
        setIsLoading(false);
        return;
      }

      // Login sukses — ambil session untuk dapatkan data user lengkap
      const sessionRes = await fetch("/api/auth/get-session", { credentials: "include" });
      if (!sessionRes.ok) {
        setLoginError("❌ Gagal membaca session. Coba refresh halaman.");
        setIsLoading(false);
        return;
      }
      const sessionData = await sessionRes.json() as any;
      const su = sessionData?.user;
      if (!su) {
        setLoginError("❌ Session tidak ditemukan setelah login.");
        setIsLoading(false);
        return;
      }

      // Map ke UserSession
      const email: string = su.email ?? "";
      const username = email.split("@")[0] ?? su.name ?? "user";
      login({
        id: su.id,
        username,
        fullName: su.name ?? username,
        email,
        role: su.role ?? "CUSTOMER",
        avatar: su.image ?? undefined,
      });

    } catch {
      setLoginError("❌ Tidak dapat terhubung ke server. Pastikan server berjalan di port 3000.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupportClick = (type: "FORGOT" | "HELP") => {
    setSupportMessage(
      type === "FORGOT"
        ? "🔒 RECOVERY LOCK:\nFitur pemulihan kata sandi mandiri dinonaktifkan sesuai standar ISO 27001 JIP. Hubungi Helpdesk IT JIP (ext. 204) untuk verifikasi identitas fisik."
        : "🛠️ IT HELP DESK PT. JIP:\n• WhatsApp: +62 812-3255-7799\n• Email: support.fsm@jasuindo.com\n• Lantai 3 Gedung Operasional IT KP Sidoarjo."
    );
    setLoginError("");
  };

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-slate-900 selection:text-white font-sans relative">

      {/* ── Theme & Language Toggles ──────────────────────────────────── */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={toggleLanguage}
          className="p-2.5 rounded-xl bg-white shadow-sm border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition duration-150 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Globe size={16} />
          <span className="text-[10px] font-bold font-mono">{language}</span>
        </button>
        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-xl bg-white shadow-sm border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition duration-150 cursor-pointer"
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* ── Login Card ────────────────────────────────────────────────── */}
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-[24px] overflow-hidden shadow-xl shadow-slate-100/40">
        <div className="p-8 sm:p-10 space-y-7">

          {/* Logo + Brand */}
          <div className="text-center space-y-2.5">
            <div className="relative inline-flex">
              <div className="relative bg-slate-100 text-slate-800 p-3.5 rounded-2xl border border-slate-200">
                <Bot size={28} className="text-slate-700" />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 uppercase">
                {APP_META.name}
              </h2>
              <div className="h-0.5 w-12 bg-slate-800 mx-auto my-1.5" />
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase font-mono">
                {APP_META.company}
              </p>
              <div className="flex justify-center items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[9px] bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                  {APP_META.build} {APP_META.version}
                </span>
                <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100/50 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                  RBAC SECURE
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">
                {t("EMAIL / USERNAME", "EMAIL / USERNAME")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder={t("bambang@jasuindo.id atau bambang", "bambang@jasuindo.id or bambang")}
                  className="w-full bg-slate-50 text-slate-900 font-sans placeholder:text-slate-400 text-xs sm:text-sm border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100/50 rounded-xl pl-10 pr-4 py-3 outline-none transition-all"
                />
              </div>
              {emailWarning && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <AlertTriangle size={11} className="shrink-0 text-amber-500 animate-pulse" />
                  <span>{emailWarning}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">
                {t("KATA SANDI", "PASSWORD")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder={t("Masukkan kata sandi...", "Enter password...")}
                  className="w-full bg-slate-50 text-slate-900 font-mono placeholder:text-slate-400 text-xs sm:text-sm border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 rounded-xl pl-10 pr-11 py-3.5 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passwordWarning && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <AlertTriangle size={11} className="shrink-0 text-amber-500 animate-pulse" />
                  <span>{passwordWarning}</span>
                </div>
              )}
            </div>

            {/* Error */}
            {loginError && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-medium leading-relaxed">
                {loginError}
              </div>
            )}

            {/* Support Info */}
            {supportMessage && (
              <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-800 font-medium leading-relaxed">
                <div className="flex items-start justify-between">
                  <span className="block whitespace-pre-line leading-relaxed">{supportMessage}</span>
                  <button type="button" onClick={() => setSupportMessage("")} className="text-indigo-600 hover:text-indigo-800 font-bold ml-1.5 text-[11px]">✕</button>
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button type="button" onClick={() => handleSupportClick("FORGOT")} className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold transition-colors focus:outline-none cursor-pointer">
                {t("Lupa Password?", "Forgot Password?")}
              </button>
              <div className="h-3 w-[1px] bg-slate-200" />
              <button type="button" onClick={() => handleSupportClick("HELP")} className="text-[10px] text-slate-600 hover:text-indigo-600 font-semibold transition-colors focus:outline-none cursor-pointer">
                {t("Hubungi IT Support", "Contact IT Support")}
              </button>
            </div>

            {/* Demo Tip Accordion */}
            <div className="border border-slate-200 rounded-xl bg-slate-50/60 p-3.5 space-y-2">
              <button
                type="button"
                onClick={() => setShowDemoTip(!showDemoTip)}
                className="w-full flex items-center justify-between text-left text-[9px] font-bold tracking-widest text-slate-700 uppercase font-mono focus:outline-none cursor-pointer"
              >
                <span>💡 AKUN DEMO (SETELAH SEED DATABASE)</span>
                <span className="text-indigo-600 font-bold font-mono text-[9px]">
                  {showDemoTip ? "TUTUP [✕]" : "BUKA [▼]"}
                </span>
              </button>
              {showDemoTip && (
                <div className="text-[10px] text-slate-600 space-y-2 pt-2 border-t border-slate-200 leading-relaxed">
                  <p className="font-medium text-slate-700">
                    Jalankan <code className="bg-slate-100 px-1 rounded text-slate-800">npm run db:seed</code> untuk membuat akun ini:
                  </p>
                  <div className="space-y-1.5 font-mono text-[9px]">
                    {DEMO_ACCOUNTS.map(a => (
                      <div key={a.email} className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-indigo-600 font-bold block">{a.email}</span>
                          <span className="text-slate-500">Role: {a.role}</span>
                        </div>
                        <span className="text-slate-400 shrink-0">{a.password}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400 italic">
                    Mode in-memory (tanpa DB): pakai username pendek (bambang, rendra, eko, andi) + password lama dari constants.
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs tracking-wider uppercase py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer focus:ring-1 focus:ring-blue-300"
            >
              {isLoading
                ? <><Loader2 size={14} className="animate-spin" /><span>Memverifikasi...</span></>
                : <><Shield size={14} className="text-white group-hover:rotate-6 transition-transform" /><span>{t("Masuk ke Portal Sistem", "Sign In to System Portal")}</span></>
              }
            </button>
          </form>

          {/* Card Footer */}
          <div className="border-t border-slate-100 pt-4 text-center space-y-1">
            <span className="text-[9.5px] text-slate-400 font-medium leading-relaxed block max-w-sm mx-auto">
              {APP_META.company} Secure Network.{" "}
              {t("Autentikasi Berbasis Peran (RBAC) Aktif.", "Role-Based Access Control (RBAC) Active.")}
            </span>
            <span className="text-[8px] text-slate-400 font-mono block tracking-tight">
              ISO/IEC 27001 Certified Cybersecurity • PT. JIP Sec-Ops Portal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
