# JIP FSM Portal — Enterprise Folder Structure
## Fase 1: Adopsi Pola & Desain (Layout Skeleton)

---

## Peta Folder Lengkap

```
sistem-manajemen-servis-printer/
│
├── 📁 src/                          # Frontend (Vite + React + TypeScript)
│   │
│   ├── 📁 app/                      # ★ Entry point aplikasi
│   │   └── App.tsx                  # Root component (Provider + Router tab)
│   │
│   ├── 📁 components/               # Komponen yang dipakai lintas fitur
│   │   │
│   │   ├── 📁 layout/               # ★ Shell utama aplikasi
│   │   │   ├── AppShell.tsx         # Wrapper: Header + Dock + main + Footer
│   │   │   ├── Header.tsx           # White bar: logo, nav tabs, controls
│   │   │   ├── RbacDock.tsx         # Dark bar: sesi aktif, role switcher
│   │   │   ├── MobileMenu.tsx       # Hamburger dropdown (lg:hidden)
│   │   │   ├── NotificationPanel.tsx # Bell dropdown dengan simulator
│   │   │   ├── ToastContainer.tsx   # Fixed floating toast queue
│   │   │   └── Footer.tsx           # Copyright bar
│   │   │
│   │   ├── 📁 ui/                   # Atom/primitive components (Phase 2)
│   │   │   ├── Button.tsx           # TODO: variant system
│   │   │   ├── Badge.tsx            # TODO: status badge
│   │   │   ├── Card.tsx             # TODO: card wrapper
│   │   │   ├── Input.tsx            # TODO: controlled input
│   │   │   ├── Modal.tsx            # TODO: dialog/modal
│   │   │   └── Toast.tsx            # TODO: standalone toast
│   │   │
│   │   └── 📁 shared/              # Komponen domain-agnostic (Phase 2)
│   │       ├── DataTable.tsx        # TODO: reusable table dengan sort/filter
│   │       ├── StatusBadge.tsx      # TODO: service status chip
│   │       ├── SearchInput.tsx      # TODO: debounced search
│   │       └── EmptyState.tsx       # TODO: empty state placeholder
│   │
│   ├── 📁 features/                 # ★ Domain-driven feature slices
│   │   │
│   │   ├── 📁 auth/
│   │   │   ├── components/
│   │   │   │   └── LoginPage.tsx    # ★ Halaman login (dipindah dari App.tsx)
│   │   │   └── hooks/
│   │   │       └── useAuth.ts       # TODO: Phase 2 (Prisma auth)
│   │   │
│   │   ├── 📁 dashboard/
│   │   │   ├── components/          # TODO: pindah StatsDashboard ke sini
│   │   │   └── hooks/
│   │   │       └── useDashboardStats.ts
│   │   │
│   │   ├── 📁 service-reception/    # Penerimaan Printer
│   │   │   ├── components/          # TODO: pindah PenerimaanPrinter ke sini
│   │   │   └── hooks/
│   │   │       └── useServiceCrud.ts
│   │   │
│   │   ├── 📁 quotation/            # SPH (Surat Penawaran Harga)
│   │   │   ├── components/          # TODO: pindah AdministrasiSPH ke sini
│   │   │   └── hooks/
│   │   │       └── useSphCrud.ts
│   │   │
│   │   ├── 📁 logistics/
│   │   │   ├── components/          # TODO: pindah LogistikInventori ke sini
│   │   │   └── hooks/
│   │   │       └── useLogisticsCrud.ts
│   │   │
│   │   ├── 📁 inventory/
│   │   │   ├── components/          # Sparepart, ATK, AsetDemo
│   │   │   └── hooks/
│   │   │       └── useInventoryCrud.ts
│   │   │
│   │   ├── 📁 ai-agent/
│   │   │   └── components/          # TODO: pindah AIAgentChat ke sini
│   │   │
│   │   └── 📁 downloads/
│   │       └── components/          # TODO: pindah DownloadCenter ke sini
│   │
│   ├── 📁 store/                    # ★ Global state
│   │   └── AppContext.tsx           # Satu context: auth + UI + data + notif
│   │   # Phase 2: Pisah menjadi:
│   │   # ├── authStore.ts
│   │   # ├── uiStore.ts
│   │   # └── dataStore.ts
│   │   # Atau migrasi ke Zustand
│   │
│   ├── 📁 hooks/                    # Shared custom hooks
│   │   # TODO Phase 2:
│   │   # ├── useNotifications.ts
│   │   # ├── useToast.ts
│   │   # └── useLocalStorage.ts
│   │
│   ├── 📁 lib/                      # Utilities & config
│   │   └── constants.ts             # ★ NAV_ITEMS, MOCK_USERS, DESIGN tokens, API
│   │   # TODO Phase 2:
│   │   # ├── api.ts                 # Axios/fetch wrapper dengan interceptors
│   │   # └── utils.ts               # Format currency, date, dll
│   │
│   ├── 📁 types/                    # ★ Sumber kebenaran semua tipe
│   │   └── index.ts                 # PrinterService, SPH, UserSession, dll
│   │
│   ├── index.css                    # Tailwind v4 + font imports
│   └── main.tsx                     # ReactDOM.createRoot entry
│
├── 📁 server/                       # Backend (Express + Drizzle/Prisma)
│   └── src/
│       ├── 📁 api/
│       │   ├── 📁 routes/           # TODO: pisahkan dari server.ts monolith
│       │   │   ├── printers.routes.ts
│       │   │   ├── sph.routes.ts
│       │   │   ├── logistics.routes.ts
│       │   │   └── inventory.routes.ts
│       │   └── 📁 middleware/
│       │       ├── auth.middleware.ts
│       │       └── rbac.middleware.ts
│       ├── 📁 db/
│       │   ├── schema.ts            # Drizzle schema (sudah ada)
│       │   └── index.ts             # DB connection
│       └── 📁 services/             # Business logic layer (Phase 2)
│           ├── printer.service.ts
│           └── sph.service.ts
│
├── 📁 shared/                       # Tipe shared client ↔ server (Phase 2)
│   └── types/index.ts
│
├── server.ts                        # Express monolith (akan dipecah Phase 2)
├── STRUCTURE.md                     # File ini
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Design Tokens (Referensi Warna & Style)

| Token | Tailwind Class | Dipakai di |
|-------|---------------|-----------|
| Page BG | `bg-[#F8FAFC]` | AppShell |
| Header | `bg-white/95 backdrop-blur-md` | Header |
| RBAC Dock | `bg-slate-900 border-slate-800` | RbacDock |
| Nav Aktif | `bg-blue-600 text-white rounded-xl` | Header, MobileMenu |
| Nav Hover | `hover:bg-blue-50/60 hover:text-blue-600` | Header |
| Card | `bg-white border border-slate-200 rounded-xl shadow-sm` | Semua halaman |
| Input | `bg-slate-50 border-slate-200 focus:border-indigo-600 rounded-xl` | Form |
| CTA Button | `bg-blue-600 hover:bg-blue-700 rounded-xl tracking-wider` | LoginPage |
| Font Sans | `Plus Jakarta Sans` | Body text |
| Font Mono | `JetBrains Mono` | Labels, kode, badge |

---

## Alur Navigasi & State Flow

```
main.tsx
  └── App.tsx (AppProvider)
        ├── [!isAuthenticated] → LoginPage.tsx
        └── [isAuthenticated]  → AppShell.tsx
              ├── Header.tsx         (reads: activeTab, language, isDarkMode)
              │     └── NotificationPanel.tsx
              ├── RbacDock.tsx       (reads: currentUser, role)
              │     └── MobileMenu.tsx (conditional)
              ├── <main>
              │     ├── dashboard    → StatsDashboard (lama, migrasi Phase 2)
              │     ├── penerimaan   → PenerimaanPrinter
              │     ├── sph          → AdministrasiSPH
              │     ├── logistics    → LogistikInventori
              │     ├── downloads    → DownloadCenter
              │     └── ai           → AIAgentChat
              ├── Footer.tsx
              └── ToastContainer.tsx (fixed overlay)
```

---

## Rencana Fase Berikutnya

### Fase 2 — Refactor & Prisma Integration
- [ ] Pisah `server.ts` monolith → `server/src/api/routes/*.ts`
- [ ] Ganti Drizzle dengan Prisma (sesuai permintaan)
- [ ] Pindah komponen lama (`components/StatsDashboard.tsx`, dll) ke `features/*/components/`
- [ ] Buat `lib/api.ts` dengan fetch wrapper + error handling terpusat
- [ ] Implementasi `useAuth.ts` dengan session nyata (better-auth)
- [ ] Pisah AppContext menjadi store-store kecil atau migrasi ke Zustand

### Fase 3 — Polish & Production
- [ ] Buat komponen `ui/` (Button, Badge, Card, Input, Modal)
- [ ] Buat `shared/DataTable.tsx` yang reusable
- [ ] Unit tests untuk hooks dan services
- [ ] CI/CD setup
