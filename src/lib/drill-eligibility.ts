// Engine validasi kelulusan Drill berdasarkan riwayat Setoran Hafalan.
//
// Aturan:
// - Drill dianggap "passed" jika seluruh cakupan (halaman atau surah/ayat)
//   sudah pernah disetorkan oleh santri pada juz terkait dengan
//   status setoran "Lancar" (atau "Lulus" untuk kompatibilitas).
// - Drill harus berurutan: drill ke-N hanya bisa diakses bila drill ke-(N-1)
//   sudah lulus (kecuali drill pertama).
//
// Catatan parsing:
// - CalendarEntry menyimpan `halaman` & `ayat` sebagai string range (contoh
//   "1-5" atau "6"). Helper parseRange menanganinya.
// - Untuk setoran berbasis surah, kita mencocokkan via `surahNumber` bila ada,
//   atau via nama surah (case-insensitive) sebagai fallback.

import { type CalendarEntry } from "@/components/setoran/CalendarCell";
import {
  DrillDefinition,
  getDrillsForJuz,
} from "@/lib/drill-data";

const PASSED_SETORAN_STATUS = new Set(["Lancar", "Lulus"]);

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

function isSurahRangeCovered(
  setoran: CalendarEntry[],
  range: NonNullable<DrillDefinition["surahRanges"]>[number]
): boolean {
  // Kumpulkan ayat yang sudah disetor untuk surah ini
  const coveredAyat = new Set<number>();
  let fullySetor = false;

  setoran.forEach((s) => {
    const matchByNumber =
      s.surahNumber !== undefined && s.surahNumber === range.surahNumber;
    const matchByName =
      !matchByNumber &&
      s.surah !== undefined &&
      s.surah.trim().toLowerCase() === range.surahName.trim().toLowerCase();
    if (!matchByNumber && !matchByName) return;

    // Range ayat dari ayatDari/ayatSampai numerik atau dari string `ayat`
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
    } else {
      // Tidak ada info ayat → anggap full surah disetorkan
      fullySetor = true;
    }
  });

  if (range.fullSurah) {
    return fullySetor; // butuh setoran full surah eksplisit
  }

  const start = range.ayatStart ?? 1;
  const end = range.ayatEnd ?? start;
  if (fullySetor) return true;
  for (let a = start; a <= end; a++) {
    if (!coveredAyat.has(a)) return false;
  }
  return true;
}

export function checkDrillEligibility(
  entries: CalendarEntry[],
  santriId: string,
  juz: number,
  drillNumber: number
): boolean {
  if (!santriId || !juz || !drillNumber) return false;
  const drills = getDrillsForJuz(juz);
  const drill = drills.find((d) => d.drillNumber === drillNumber);
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

export interface DrillProgressItem extends DrillDefinition {
  passed: boolean;
  unlocked: boolean; // drill sebelumnya sudah lulus (atau ini drill pertama)
}

export function getDrillProgressForJuz(
  entries: CalendarEntry[],
  santriId: string,
  juz: number
): DrillProgressItem[] {
  const drills = getDrillsForJuz(juz);
  let prevPassed = true; // drill pertama selalu unlocked
  return drills.map((d) => {
    const passed = checkDrillEligibility(entries, santriId, juz, d.drillNumber);
    const unlocked = prevPassed;
    prevPassed = passed;
    return { ...d, passed, unlocked };
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
