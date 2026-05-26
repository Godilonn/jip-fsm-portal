# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --include=optional

# Copy source
COPY . .

# Build frontend (Vite) + backend (esbuild)
RUN npm run build

# ── Stage 2: Production runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --include=optional && npm cache clean --force

# Copy built artifacts dari stage 1
COPY --from=builder /app/dist ./dist

# Copy file yang dibutuhkan saat runtime
COPY --from=builder /app/template-sph.docx ./template-sph.docx
COPY --from=builder /app/uploads ./uploads

# Copy drizzle migration files
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/db ./src/db

# Buat folder uploads kalau belum ada
RUN mkdir -p uploads/downloads

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Port default (bisa di-override via PORT env var di Coolify)
EXPOSE 3000

# Health check untuk Coolify/Docker
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start via script (migrate dulu, lalu server)
CMD ["sh", "./start.sh"]
