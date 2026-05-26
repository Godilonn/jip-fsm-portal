/**
 * @file features/settings/components/SettingsPage.tsx
 * @description Halaman Pengaturan — manajemen user & keamanan.
 * Hanya dapat diakses oleh role MANAGER.
 *
 * USER CRUD:
 *  - Real DB: panggil /api/admin/users via AppContext (addUser, updateUser, deleteUser)
 *  - In-memory: operasi state lokal di AppContext
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, UserPlus, Edit3, Trash2, Shield, Key,
  Eye, EyeOff, CheckCircle, X, AlertTriangle, Loader2,
  Database, Mail,
} from "lucide-react";
import { useApp } from "../../../store/AppContext";
import type { UserRole, UserSession } from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const ROLES: UserRole[] = ["MANAGER", "DISPATCHER", "TECHNICIAN", "CUSTOMER"];

const ROLE_COLORS: Record<UserRole, string> = {
  MANAGER:    "bg-amber-100 text-amber-800 border-amber-200",
  DISPATCHER: "bg-sky-100 text-sky-800 border-sky-200",
  TECHNICIAN: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CUSTOMER:   "bg-purple-100 text-purple-800 border-purple-200",
};

const ROLE_LABELS: Record<UserRole, string> = {
  MANAGER:    "Manager",
  DISPATCHER: "Dispatcher",
  TECHNICIAN: "Teknisi",
  CUSTOMER:   "Customer",
};

// ─────────────────────────────────────────────────────────────────────────────
// USER FORM (Create / Edit)
// ─────────────────────────────────────────────────────────────────────────────

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface UserFormProps {
  initial?: UserSession;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  mode: "create" | "edit";
  isSelf: boolean;
}

function UserForm({ initial, onSubmit, onCancel, mode, isSelf }: UserFormProps) {
  const [name, setName]           = useState(initial?.fullName ?? "");
  const [email, setEmail]         = useState(initial?.email ?? "");
  const [role, setRole]           = useState<UserRole>(initial?.role ?? "TECHNICIAN");
  const [password, setPassword]   = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [error, setError]         = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Nama lengkap wajib diisi."); return; }
    if (mode === "create") {
      if (!email.trim()) { setError("Email wajib diisi."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Format email tidak valid."); return; }
      if (!password) { setError("Password wajib diisi untuk user baru."); return; }
      if (password.length < 8) { setError("Password minimal 8 karakter."); return; }
      if (password !== confirmPwd) { setError("Konfirmasi password tidak cocok."); return; }
    }
    if (mode === "edit" && password) {
      if (password.length < 8) { setError("Password minimal 8 karakter."); return; }
      if (password !== confirmPwd) { setError("Konfirmasi password tidak cocok."); return; }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), email: email.trim().toLowerCase(), password, role });
    } catch (err: any) {
      setError(err.message ?? "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
          {mode === "create" ? <UserPlus size={18} className="text-indigo-600" /> : <Edit3 size={18} className="text-indigo-600" />}
          {mode === "create" ? "Tambah User Baru" : "Edit User"}
        </h3>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
          <X size={16} />
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-rose-700 text-sm">
          <AlertTriangle size={15} className="shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Lengkap *</label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="contoh: Budi Santoso"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Email (hanya saat create) */}
        {mode === "create" && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Email * <span className="text-slate-400 font-normal">(dipakai untuk login)</span>
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="budi@jasuindo.id"
                className="w-full pl-9 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
          </div>
        )}

        {/* Role */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Role / Jabatan *</label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(r => (
              <button
                key={r} type="button"
                onClick={() => !isSelf && setRole(r)}
                disabled={isSelf}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  role === r
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
          {isSelf && <p className="text-[10px] text-slate-400 mt-1.5">Tidak bisa mengubah role akun sendiri.</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Password {mode === "edit" && <span className="text-slate-400 font-normal">(kosongkan jika tidak diubah)</span>}
          </label>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === "create" ? "Min. 8 karakter" : "Kosongkan jika tidak diubah"}
              className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
            />
            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {(mode === "create" || password) && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Konfirmasi Password *</label>
            <input
              type={showPwd ? "text" : "password"} value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              placeholder="Ulangi password"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting
              ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</>
              : <><CheckCircle size={15} /> {mode === "create" ? "Buat User" : "Simpan Perubahan"}</>
            }
          </button>
          <button
            type="button" onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-sm transition-colors"
          >
            Batal
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM DELETE DIALOG
// ─────────────────────────────────────────────────────────────────────────────

function ConfirmDeleteDialog({
  user, onConfirm, onCancel,
}: { user: UserSession; onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white border border-rose-100 rounded-2xl shadow-xl p-6 max-w-sm w-full"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-rose-100 p-2.5 rounded-xl"><Trash2 size={18} className="text-rose-600" /></div>
        <h3 className="font-bold text-slate-800">Hapus User?</h3>
      </div>
      <p className="text-sm text-slate-600 mb-5">
        User <strong>{user.fullName}</strong> ({user.email ?? user.username}) akan dihapus permanen dari sistem dan database.
        Aksi ini tidak dapat dibatalkan.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          Ya, Hapus
        </button>
        <button
          onClick={onCancel}
          className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          Batal
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { users, addUser, updateUser, deleteUser, currentUser, addToast } = useApp();

  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editTarget, setEditTarget] = useState<UserSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserSession | null>(null);

  // Guard: hanya Manager
  if (currentUser.role !== "MANAGER") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
        <Shield size={48} className="text-slate-300" />
        <p className="font-semibold text-base">Akses Ditolak</p>
        <p className="text-sm">Halaman ini hanya dapat diakses oleh Manager.</p>
      </div>
    );
  }

  const handleCreate = async (data: UserFormData) => {
    const result = await addUser({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
    });
    if (!result.ok) {
      throw new Error(result.error ?? "Gagal membuat user.");
    }
    addToast("✅ USER DIBUAT", `${data.name} berhasil ditambahkan sebagai ${ROLE_LABELS[data.role]}.`, "success");
    setMode("list");
  };

  const handleUpdate = async (data: UserFormData) => {
    if (!editTarget?.id) return;
    await updateUser(editTarget.id, { name: data.name, role: data.role });
    addToast("✅ USER DIPERBARUI", `Data ${data.name} berhasil disimpan.`, "success");
    setMode("list");
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await deleteUser(deleteTarget.id);
    addToast("🗑️ USER DIHAPUS", `${deleteTarget.fullName} dihapus dari sistem.`, "info");
    setDeleteTarget(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2.5">
            <Shield size={22} className="text-indigo-600" />
            Pengaturan Sistem
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 ml-8">Manajemen user & kontrol akses — hanya Manager</p>
        </div>
        {mode === "list" && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setMode("create")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <UserPlus size={15} /> Tambah User
          </motion.button>
        )}
      </div>

      {/* ── Form (Create / Edit) ────────────────────────────────────── */}
      <AnimatePresence>
        {(mode === "create" || mode === "edit") && (
          <UserForm
            key={mode}
            mode={mode}
            initial={editTarget ?? undefined}
            isSelf={editTarget?.id === currentUser.id}
            onSubmit={mode === "create" ? handleCreate : handleUpdate}
            onCancel={() => { setMode("list"); setEditTarget(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Overlay ─────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          >
            <ConfirmDeleteDialog
              user={deleteTarget}
              onConfirm={handleDelete}
              onCancel={() => setDeleteTarget(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── User List ───────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <Users size={16} className="text-indigo-600" />
            Daftar User Aktif
          </h2>
          <span className="text-[11px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
            {users.length} User
          </span>
        </div>

        {users.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm space-y-2">
            <Database size={32} className="mx-auto text-slate-300" />
            <p>Belum ada user tersimpan.</p>
            <p className="text-xs text-slate-300">
              Jalankan <code className="bg-slate-100 px-1 rounded text-slate-500">npm run db:seed</code> untuk membuat akun awal.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((user, i) => {
              const isSelf = user.id === currentUser.id || user.username === currentUser.username;
              return (
                <motion.div
                  key={user.id ?? user.username}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.04 }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors group"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-800">{user.fullName}</span>
                      {isSelf && (
                        <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full border border-indigo-200">
                          ANDA
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-slate-400 font-mono">{user.email ?? user.username}</span>
                      {user.email && (
                        <>
                          <span className="text-slate-300 hidden sm:inline">·</span>
                          <Key size={10} className="text-slate-300 hidden sm:block" />
                          <span className="text-[11px] text-slate-400 font-mono tracking-widest hidden sm:block">••••••••</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Role badge */}
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide shrink-0 ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => { setEditTarget(user); setMode("edit"); }}
                      title="Edit user"
                      className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(user)}
                      disabled={isSelf}
                      title={isSelf ? "Tidak bisa hapus akun sendiri" : "Hapus user"}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Info Box ────────────────────────────────────────────────── */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3">
        <Database size={16} className="text-indigo-500 mt-0.5 shrink-0" />
        <div className="text-xs text-indigo-800 space-y-1">
          <p className="font-semibold">Database Real (PostgreSQL)</p>
          <p>User yang dibuat di sini tersimpan langsung di tabel <code className="bg-indigo-100 px-1 rounded">user</code> PostgreSQL via Better Auth.</p>
          <p>Untuk membuat akun awal: jalankan <code className="bg-indigo-100 px-1 rounded">npm run db:seed</code> di terminal (server harus aktif).</p>
        </div>
      </div>

    </div>
  );
}
