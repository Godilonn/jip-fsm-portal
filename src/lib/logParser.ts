/**
 * @file src/lib/logParser.ts
 * @description Parser file log printer untuk berbagai brand/format.
 *
 * FORMAT YANG DIDUKUNG:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. EVOLIS (CR805, CR8xx, Primacy, Zenius)
 *    Format: "2026-01-15 09:32:05 [ERROR] E05 - Ribbon sensor timeout"
 *    Export: Evolis Print Center → Tools → Export Log
 *
 * 2. ZEBRA (ZXP3, ZXP7, ZC300)
 *    Format: "ERROR | 2026-01-15 09:31:05 | Error 105: Ribbon Out"
 *    Export: ZXP Toolbox → Diagnostics → Save Log
 *
 * 3. CITIZEN (CX-02, CX-30, CLP-521)
 *    Format: "ERR:0x0A Media sensor error" atau "WARN:LowRibbon"
 *    Export: Citizen Card Printer Utility → Event Log
 *
 * 4. DATACARD (SR200, SD357, SD157)
 *    Format: "15/01/2026 09:32 ERROR: 2105 - Hopper empty"
 *    Export: ID Works / CardWizard diagnostic export
 *
 * 5. GENERIC / PLAIN TEXT
 *    Fallback — cari kata kunci ERROR, WARN, err, fail, jam, dll.
 *
 * HASIL PARSE:
 *   LogParseResult {
 *     format: string,             // brand yang terdeteksi
 *     totalLines: number,
 *     errorCount: number,
 *     warningCount: number,
 *     errors: LogEntry[],         // max 20 entry error/warning teratas
 *     metrics: PrinterMetrics,    // suhu, card count, ribbon level, dll
 *     summary: string,            // teks ringkasan siap masuk prompt Gemini
 *   }
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface LogEntry {
  level: "ERROR" | "WARN" | "INFO";
  timestamp?: string;
  code?: string;
  message: string;
  raw: string;
}

export interface PrinterMetrics {
  cardCount?: number;
  printHeadTemp?: number;       // °C
  ribbonRemainingPct?: number;  // 0–100
  laminatorTemp?: number;       // °C
  jamCount?: number;
  errorCodeList: string[];      // unik, deduplicated
}

export interface LogParseResult {
  format: string;
  totalLines: number;
  errorCount: number;
  warningCount: number;
  entries: LogEntry[];          // max 25 paling relevan
  metrics: PrinterMetrics;
  summary: string;              // siap inject ke Gemini prompt
}

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

// Evolis: "2026-01-15 09:32:05 [ERROR] E05 - Ribbon sensor timeout"
const EVOLIS_LINE = /^(\d{4}-\d{2}-\d{2}\s[\d:]+)\s+\[(ERROR|WARN(?:ING)?|INFO)\]\s+(E\d+\s*-\s*)?(.+)$/i;

// Zebra: "ERROR | 2026-01-15 09:31:05 | Error 105: Ribbon Out"
const ZEBRA_LINE  = /^(ERROR|WARN(?:ING)?|INFO)\s*\|\s*([\d\-:\s]+)\|\s*(Error\s*\d+[:\s])?(.+)$/i;

// Datacard: "15/01/2026 09:32 ERROR: 2105 - Hopper empty"
const DATACARD_LINE = /^(\d{2}\/\d{2}\/\d{4}\s[\d:]+)\s+(ERROR|WARN(?:ING)?|INFO):\s*(\d+\s*-\s*)?(.+)$/i;

// Citizen: "ERR:0x0A Media sensor error" or "WARN:LowRibbon count=200"
const CITIZEN_LINE = /^(ERR(?:OR)?|WARN(?:ING)?|INFO|CNT|TEMP|STAT)[:=](.+)$/i;

// Generic catch-all: any line with ERROR/WARN keywords
const GENERIC_ERROR = /\b(error|fail|fault|jam|timeout|sensor|overflow|overtemp|overload)\b/i;
const GENERIC_WARN  = /\b(warn(?:ing)?|low|empty|near|caution|attention)\b/i;

// Metric patterns (work across all formats)
const METRIC_CARD_COUNT  = /(?:card\s*count|print\s*count|CardCount|cnt)[=:\s]+(\d+)/i;
const METRIC_HEAD_TEMP   = /(?:head\s*temp(?:erature)?|printhead\s*temp)[=:\s]+(\d+)/i;
const METRIC_LAMINATOR   = /(?:laminator\s*temp(?:erature)?)[=:\s]+(\d+)/i;
const METRIC_RIBBON_PCT  = /(?:ribbon\s*(?:remain|level|left|pct|%)|RibbonRemaining)[=:\s]+(\d+)\s*%?/i;
const METRIC_JAM_COUNT   = /(?:jam\s*count|paper\s*jam|CardJam|jam)[=:\s]+(\d+)/i;

// Error code patterns
const ERROR_CODE_EVOLIS   = /\bE(\d{2,3})\b/g;
const ERROR_CODE_ZEBRA    = /\bError\s*(\d{3,4})\b/gi;
const ERROR_CODE_DATACARD = /\b(\d{4})\s*-\s*\w/g;
const ERROR_CODE_CITIZEN  = /\b0x([0-9A-Fa-f]{2,4})\b/g;

// ─────────────────────────────────────────────────────────────────────────────
// DETECT FORMAT
// ─────────────────────────────────────────────────────────────────────────────

function detectFormat(lines: string[]): string {
  const sample = lines.slice(0, 30).join("\n");
  if (/\[ERROR\]|\[WARN\]|\[INFO\]/i.test(sample) && /E\d{2,3}\s*-/.test(sample)) return "Evolis";
  if (/ERROR\s*\|.*\|/i.test(sample) || /ZXP|ZC\d{3}/i.test(sample)) return "Zebra";
  if (/\d{2}\/\d{2}\/\d{4}.*ERROR:/i.test(sample) || /Datacard|SD\d{3}|SR\d{3}/i.test(sample)) return "Datacard";
  if (/^ERR:|^WARN:|^CNT:/im.test(sample) || /CX-\d{2}|CLP-/i.test(sample)) return "Citizen";
  return "Generic";
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSE LINE BY FORMAT
// ─────────────────────────────────────────────────────────────────────────────

function parseLine(line: string, format: string): LogEntry | null {
  line = line.trim();
  if (!line || line.startsWith("#") || line.startsWith("//")) return null;

  switch (format) {
    case "Evolis": {
      const m = EVOLIS_LINE.exec(line);
      if (m) {
        const lvlRaw = m[2].toUpperCase();
        return {
          level: lvlRaw.startsWith("WARN") ? "WARN" : lvlRaw === "INFO" ? "INFO" : "ERROR",
          timestamp: m[1],
          code: m[3]?.trim() || undefined,
          message: m[4].trim(),
          raw: line,
        };
      }
      break;
    }
    case "Zebra": {
      const m = ZEBRA_LINE.exec(line);
      if (m) {
        const lvlRaw = m[1].toUpperCase();
        return {
          level: lvlRaw.startsWith("WARN") ? "WARN" : lvlRaw === "INFO" ? "INFO" : "ERROR",
          timestamp: m[2]?.trim() || undefined,
          code: m[3]?.trim() || undefined,
          message: m[4].trim(),
          raw: line,
        };
      }
      break;
    }
    case "Datacard": {
      const m = DATACARD_LINE.exec(line);
      if (m) {
        const lvlRaw = m[2].toUpperCase();
        return {
          level: lvlRaw.startsWith("WARN") ? "WARN" : lvlRaw === "INFO" ? "INFO" : "ERROR",
          timestamp: m[1]?.trim() || undefined,
          code: m[3]?.trim() || undefined,
          message: m[4].trim(),
          raw: line,
        };
      }
      break;
    }
    case "Citizen": {
      const m = CITIZEN_LINE.exec(line);
      if (m) {
        const tag = m[1].toUpperCase();
        if (tag === "ERR" || tag === "ERROR") {
          return { level: "ERROR", message: m[2].trim(), raw: line };
        }
        if (tag.startsWith("WARN")) {
          return { level: "WARN", message: m[2].trim(), raw: line };
        }
        if (tag === "INFO" || tag === "STAT" || tag === "CNT" || tag === "TEMP") {
          return { level: "INFO", message: `${tag}: ${m[2].trim()}`, raw: line };
        }
      }
      break;
    }
    default: {
      // Generic fallback — keyword scan
      if (GENERIC_ERROR.test(line)) return { level: "ERROR", message: line, raw: line };
      if (GENERIC_WARN.test(line))  return { level: "WARN",  message: line, raw: line };
      break;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACT METRICS FROM RAW TEXT
// ─────────────────────────────────────────────────────────────────────────────

function extractMetrics(raw: string): PrinterMetrics {
  const metrics: PrinterMetrics = { errorCodeList: [] };

  const cardM = METRIC_CARD_COUNT.exec(raw);
  if (cardM) metrics.cardCount = parseInt(cardM[1], 10);

  const headM = METRIC_HEAD_TEMP.exec(raw);
  if (headM) metrics.printHeadTemp = parseInt(headM[1], 10);

  const lamM = METRIC_LAMINATOR.exec(raw);
  if (lamM) metrics.laminatorTemp = parseInt(lamM[1], 10);

  const ribM = METRIC_RIBBON_PCT.exec(raw);
  if (ribM) metrics.ribbonRemainingPct = parseInt(ribM[1], 10);

  const jamM = METRIC_JAM_COUNT.exec(raw);
  if (jamM) metrics.jamCount = parseInt(jamM[1], 10);

  // Collect all unique error codes
  const codes = new Set<string>();
  for (const m of raw.matchAll(ERROR_CODE_EVOLIS))   codes.add(`E${m[1]}`);
  for (const m of raw.matchAll(ERROR_CODE_ZEBRA))    codes.add(`ERR-${m[1]}`);
  for (const m of raw.matchAll(ERROR_CODE_CITIZEN))  codes.add(`0x${m[1].toUpperCase()}`);
  // Datacard 4-digit codes
  const dcRe = /\b(\d{4})\s*-\s*\w/g;
  for (const m of raw.matchAll(dcRe)) {
    const n = parseInt(m[1], 10);
    if (n > 1000 && n < 9999) codes.add(`DC-${m[1]}`);
  }
  metrics.errorCodeList = [...codes].slice(0, 15);

  return metrics;
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD GEMINI-READY SUMMARY TEXT
// ─────────────────────────────────────────────────────────────────────────────

function buildSummary(result: Omit<LogParseResult, "summary">): string {
  const lines: string[] = [];

  lines.push(`=== DATA LOG PRINTER (Format: ${result.format}) ===`);
  lines.push(`Total baris log: ${result.totalLines} | Error: ${result.errorCount} | Warning: ${result.warningCount}`);

  const { metrics } = result;
  if (metrics.cardCount !== undefined)
    lines.push(`• Jumlah cetak total: ${metrics.cardCount.toLocaleString("id-ID")} kartu`);
  if (metrics.printHeadTemp !== undefined)
    lines.push(`• Suhu Printhead: ${metrics.printHeadTemp}°C${metrics.printHeadTemp > 60 ? " ⚠️ OVERTEMP" : ""}`);
  if (metrics.laminatorTemp !== undefined)
    lines.push(`• Suhu Laminator: ${metrics.laminatorTemp}°C`);
  if (metrics.ribbonRemainingPct !== undefined)
    lines.push(`• Ribbon tersisa: ${metrics.ribbonRemainingPct}%${metrics.ribbonRemainingPct < 15 ? " ⚠️ HAMPIR HABIS" : ""}`);
  if (metrics.jamCount !== undefined)
    lines.push(`• Jam count: ${metrics.jamCount}x`);
  if (metrics.errorCodeList.length > 0)
    lines.push(`• Kode error ditemukan: ${metrics.errorCodeList.join(", ")}`);

  lines.push("\nEVENT ERROR/WARNING TERBARU:");
  const topEntries = result.entries
    .filter(e => e.level === "ERROR" || e.level === "WARN")
    .slice(0, 15);

  if (topEntries.length === 0) {
    lines.push("(tidak ada event error/warning spesifik terdeteksi)");
  } else {
    topEntries.forEach((e, i) => {
      const prefix = e.level === "ERROR" ? "❌" : "⚠️";
      const ts = e.timestamp ? `[${e.timestamp}] ` : "";
      const code = e.code ? `${e.code} ` : "";
      lines.push(`${i + 1}. ${prefix} ${ts}${code}${e.message}`);
    });
  }

  lines.push("=== AKHIR DATA LOG ===");
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — parseLogFile
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse raw text content dari file log printer.
 * @param content  Isi file log sebagai string (dari FileReader atau fs.readFileSync)
 * @param maxLines Batas baris yang diproses (default 5000) untuk file sangat besar
 */
export function parseLogFile(content: string, maxLines = 5000): LogParseResult {
  const allLines = content
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const lines = allLines.slice(0, maxLines);
  const format = detectFormat(lines);

  const entries: LogEntry[] = [];
  let errorCount = 0;
  let warningCount = 0;

  for (const line of lines) {
    const entry = parseLine(line, format);
    if (!entry) continue;
    entries.push(entry);
    if (entry.level === "ERROR") errorCount++;
    if (entry.level === "WARN") warningCount++;
  }

  // Keep max 25 most relevant (errors first, then warnings, then info)
  const sorted = [
    ...entries.filter(e => e.level === "ERROR"),
    ...entries.filter(e => e.level === "WARN"),
    ...entries.filter(e => e.level === "INFO"),
  ].slice(0, 25);

  const metrics = extractMetrics(content);

  const partial: Omit<LogParseResult, "summary"> = {
    format,
    totalLines: allLines.length,
    errorCount,
    warningCount,
    entries: sorted,
    metrics,
  };

  return {
    ...partial,
    summary: buildSummary(partial),
  };
}
