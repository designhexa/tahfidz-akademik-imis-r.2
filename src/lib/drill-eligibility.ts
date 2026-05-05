// Engine validasi Drill Hafalan.
//
// Tiga konsep terpisah:
// 1. setoranReady  → cakupan halaman / surah-ayat target drill sudah pernah
//                    disetorkan (status "Lancar"/"Lulus") di setoran_hafalan.
//                    => Syarat agar santri BOLEH mengikuti drill tsb.
// 2. passed        → ada entry jenis "drill" pada juz & level yang sama
//                    dengan status "Lulus".
//                    => Tandanya santri sudah LULUS drill tsb.
// 3. unlocked      → drill ke-(N-1) sudah passed (atau N == 1).
//                    => Tandanya level drill ini boleh dipilih (kunci terbuka).
//
// Aturan progresi: setelah Drill N lulus, secara otomatis Drill (N+1) menjadi
// unlocked. Untuk benar-benar mencatat hasil Drill (N+1) santri juga butuh
// setoranReady = true (cakupan setoran sudah cukup).
//
// Catatan parsing:
// - CalendarEntry menyimpan `halaman` & `ayat` sebagai string range
//   (contoh "1-5" / "6"). Helper parseRange menanganinya.
// - Untuk setoran berbasis surah, kita mencocokkan via `surahNumber` bila ada,
//   atau via nama surah (case-insensitive) sebagai fallback.

import { type CalendarEntry } from "@/components/setoran/CalendarCell";
import {
  DrillDefinition,
  getDrillsForJuz,
} from "@/lib/drill-data";
import { surahList } from "@/lib/quran-data";
import { getAyatRangeForSurahInJuz } from "@/lib/mushaf-madinah";

const PASSED_SETORAN_STATUS = new Set(["Lancar", "Lulus"]);
const PASSED_DRILL_STATUS = new Set(["Lulus"]);

function parseRange(value?: string | number): [number, number] | null {
  if (value === undefined || value === null || value === "") return null;
  const str = String(value).replace(/[–—]/g, "-").trim();
  if (str.includes("-")) {
    const [a, b] = str.split("-").map((s) => parseInt(s.trim(), 10));
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return [Math.min(a, b), Math.max(a, b)];
  }
  const n = parseInt(str, 10);
  if (Number.isNaN(n)) return null;
  return [n, n];
}

function getSantriSetoranForJuz(
  entries: CalendarEntry[],
  santriId: string,
  juz: number
): CalendarEntry[] {
  return entries.filter(
    (e) =>
      e.santriId === santriId &&
      e.jenis === "setoran_hafalan" &&
      e.juz === juz &&
      (e.status ? PASSED_SETORAN_STATUS.has(e.status) : true)
  );
}

function isPageRangeCovered(
  setoran: CalendarEntry[],
  startPage: number,
  endPage: number
): boolean {
  const covered = new Set<number>();
  setoran.forEach((s) => {
    const range = parseRange(s.halaman);
    if (!range) return;
    for (let p = range[0]; p <= range[1]; p++) covered.add(p);
  });
  for (let p = startPage; p <= endPage; p++) {
    if (!covered.has(p)) return false;
  }
  return true;
}

function normalizeSurahName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’`ʿʾ\-_\s\.]/g, "");
}

function isSurahRangeCovered(
  setoran: CalendarEntry[],
  range: NonNullable<DrillDefinition["surahRanges"]>[number]
): boolean {
  const coveredAyat = new Set<number>();
  let surahTouched = false;
  const targetName = normalizeSurahName(range.surahName);

  setoran.forEach((s) => {
    const matchByNumber =
      s.surahNumber !== undefined && s.surahNumber === range.surahNumber;
    const matchByName =
      !matchByNumber &&
      s.surah !== undefined &&
      normalizeSurahName(s.surah) === targetName;
    if (!matchByNumber && !matchByName) return;

    surahTouched = true;

    let ayatRange: [number, number] | null = null;
    if (s.ayatDari !== undefined && s.ayatSampai !== undefined) {
      ayatRange = [
        Math.min(s.ayatDari, s.ayatSampai),
        Math.max(s.ayatDari, s.ayatSampai),
      ];
    } else if (s.ayat) {
      ayatRange = parseRange(s.ayat);
    }

    if (ayatRange) {
      for (let a = ayatRange[0]; a <= ayatRange[1]; a++) coveredAyat.add(a);
    }
  });

  if (range.fullSurah) {
    // Panjang akhir tiap surah tidak tersedia di sini, jadi cukup
    // dianggap memenuhi target full-surah bila surah sudah pernah
    // disetorkan (cocok by number atau by name).
    return surahTouched;
  }

  const start = range.ayatStart ?? 1;
  const end = range.ayatEnd ?? start;
  if (!surahTouched) return false;
  for (let a = start; a <= end; a++) {
    if (!coveredAyat.has(a)) return false;
  }
  return true;
}

/** Apakah cakupan SETORAN sudah cukup untuk mengikuti drill ini. */
export function isSetoranReadyForDrill(
  entries: CalendarEntry[],
  santriId: string,
  juz: number,
  drillNumber: number
): boolean {
  if (!santriId || !juz || !drillNumber) return false;
  const drill = getDrillsForJuz(juz).find((d) => d.drillNumber === drillNumber);
  if (!drill) return false;

  const setoran = getSantriSetoranForJuz(entries, santriId, juz);
  if (setoran.length === 0) return false;

  if (drill.type === "page") {
    if (drill.pageStart === undefined || drill.pageEnd === undefined) return false;
    return isPageRangeCovered(setoran, drill.pageStart, drill.pageEnd);
  }
  if (drill.type === "surah" && drill.surahRanges) {
    return drill.surahRanges.every((r) => isSurahRangeCovered(setoran, r));
  }
  return false;
}

/** Apakah santri SUDAH LULUS drill ini (ada entry drill status "Lulus"). */
export function isDrillPassed(
  entries: CalendarEntry[],
  santriId: string,
  juz: number,
  drillNumber: number
): boolean {
  return entries.some(
    (e) =>
      e.santriId === santriId &&
      e.jenis === "drill" &&
      e.juz === juz &&
      (e as any).level === drillNumber &&
      e.status !== undefined &&
      PASSED_DRILL_STATUS.has(e.status)
  );
}

/**
 * Backward-compat: dipakai sebagai alias "lulus".
 * Sekarang HANYA TRUE jika ada entry drill berstatus "Lulus".
 */
export function checkDrillEligibility(
  entries: CalendarEntry[],
  santriId: string,
  juz: number,
  drillNumber: number
): boolean {
  return isDrillPassed(entries, santriId, juz, drillNumber);
}

export interface DrillProgressItem extends DrillDefinition {
  passed: boolean;        // sudah lulus drill (entry drill "Lulus")
  unlocked: boolean;      // drill sebelumnya sudah lulus (atau N == 1)
  setoranReady: boolean;  // cakupan setoran sudah cukup untuk mengikuti drill
}

export function getDrillProgressForJuz(
  entries: CalendarEntry[],
  santriId: string,
  juz: number
): DrillProgressItem[] {
  const drills = getDrillsForJuz(juz);
  let prevPassed = true; // drill pertama selalu unlocked
  return drills.map((d) => {
    const passed = isDrillPassed(entries, santriId, juz, d.drillNumber);
    const setoranReady = isSetoranReadyForDrill(entries, santriId, juz, d.drillNumber);
    const unlocked = prevPassed;
    prevPassed = passed; // hanya kelulusan drill yang membuka level berikutnya
    return { ...d, passed, unlocked, setoranReady };
  });
}

export function getAllDrillProgress(
  entries: CalendarEntry[],
  santriId: string
): Record<number, DrillProgressItem[]> {
  const result: Record<number, DrillProgressItem[]> = {};
  for (let juz = 1; juz <= 30; juz++) {
    result[juz] = getDrillProgressForJuz(entries, santriId, juz);
  }
  return result;
}

/** Cari drill berikutnya yang belum lulus pada juz tertentu. null jika semua lulus. */
export function getNextDrillForJuz(
  entries: CalendarEntry[],
  santriId: string,
  juz: number
): DrillProgressItem | null {
  const progress = getDrillProgressForJuz(entries, santriId, juz);
  return progress.find((d) => !d.passed) ?? null;
}
