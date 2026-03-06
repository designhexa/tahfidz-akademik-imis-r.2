import { CalendarEntry } from "@/components/setoran/CalendarCell";
import { getPagesForJuz } from "./mushaf-madinah";
import { getDrillCountForJuz } from "./drill-data";

export const MANDATORY_JUZ_ORDER = [30, 29, 28, 27, 26];
export const DEFAULT_OPTIONAL_JUZ_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

// Combined order, but Juz after 26 can be dynamic per student if admin assigns them.
// For now we use the default optional order.
export const FULL_PROGRESSION_ORDER = [...MANDATORY_JUZ_ORDER, ...DEFAULT_OPTIONAL_JUZ_ORDER];

export type ProgressStage = 'setoran' | 'drill' | 'tasmi_eligible' | 'tasmi_registered' | 'completed';

export interface SantriProgressStatus {
  currentJuz: number;
  stage: ProgressStage;
  lastHalaman?: number;
  lastDrillLevel?: number;
  isJuzCompleted: boolean;
  completedJuzList: number[];
}

/**
 * Get the latest progress of a santri based on their history.
 */
export function getSantriProgressStatus(
  santriId: string,
  entries: CalendarEntry[],
  assignedJuz: number[] = FULL_PROGRESSION_ORDER
): SantriProgressStatus {
  const santriEntries = (entries || []).filter(e => e.santriId === santriId);
  const completedJuzList: number[] = [];

  for (const juz of assignedJuz) {
    const juzEntries = santriEntries.filter(e => e.juz === juz);

    // Check if Tasmi for this Juz is passed (Final Exam)
    // We strictly check for 'Lulus' or Predikats
    const hasPassedTasmi = juzEntries.some(e =>
      e.jenis === 'tasmi' &&
      e.status &&
      (e.status === 'Lulus' || e.status === 'Lancar' || ['Mumtaz', 'Jayyid'].some(p => e.status?.includes(p)))
    );

    if (hasPassedTasmi) {
      completedJuzList.push(juz);
      continue; // Move to next Juz in sequence
    }

    // Check if registered for Tasmi
    const isRegisteredForTasmi = juzEntries.some(e => e.jenis === 'tasmi' && e.status === 'Registered');

    // Check Drill progress
    const drillEntries = juzEntries.filter(e => e.jenis === 'drill');
    const passedDrills = drillEntries.filter(e => e.status === 'Lulus');
    const maxDrillLevel = passedDrills.length > 0 ? Math.max(...passedDrills.map(d => d.level || 0)) : 0;
    const requiredDrills = getDrillCountForJuz(juz);

    if (maxDrillLevel >= requiredDrills) {
      return {
        currentJuz: juz,
        stage: isRegisteredForTasmi ? 'tasmi_registered' : 'tasmi_eligible',
        lastDrillLevel: maxDrillLevel,
        isJuzCompleted: false,
        completedJuzList
      };
    }

    // Check Setoran progress
    const setoranEntries = juzEntries.filter(e => e.jenis === 'setoran_hafalan' || e.jenis === 'setoran_baru');
    const lancarSetorans = setoranSetoranHalaman(setoranEntries.filter(e => e.status === 'Lancar' || e.status === 'Lulus'));
    const maxHalaman = lancarSetorans.length > 0 ? Math.max(...lancarSetorans) : 0;
    const totalPagesInJuz = getPagesForJuz(juz).count;

    if (maxHalaman >= totalPagesInJuz) {
      return {
        currentJuz: juz,
        stage: 'drill',
        lastHalaman: maxHalaman,
        lastDrillLevel: maxDrillLevel,
        isJuzCompleted: false,
        completedJuzList
      };
    }

    return {
      currentJuz: juz,
      stage: 'setoran',
      lastHalaman: maxHalaman,
      isJuzCompleted: false,
      completedJuzList
    };
  }

  return {
    currentJuz: assignedJuz[assignedJuz.length - 1],
    stage: 'completed',
    isJuzCompleted: true,
    completedJuzList: [...assignedJuz]
  };
}

function setoranSetoranHalaman(entries: CalendarEntry[]): number[] {
  const halamans: number[] = [];
  entries.forEach(e => {
    if (e.halaman) {
      const parts = e.halaman.split(/[–-]/);
      parts.forEach(p => {
        const val = parseInt(p.trim());
        if (!isNaN(val)) halamans.push(val);
      });
    }
  });
  return halamans;
}

export function isEntryBackward(
  newEntry: Partial<CalendarEntry>,
  currentStatus: SantriProgressStatus
): { backward: boolean; message?: string } {
  if (!newEntry.juz) return { backward: false };

  const juzIdx = FULL_PROGRESSION_ORDER.indexOf(newEntry.juz);
  const currentJuzIdx = FULL_PROGRESSION_ORDER.indexOf(currentStatus.currentJuz);

  if (juzIdx < currentJuzIdx) {
    return { backward: true, message: `Juz ${newEntry.juz} sudah diselesaikan.` };
  }

  if (juzIdx > currentJuzIdx) {
    return { backward: true, message: `Harus menyelesaikan Juz ${currentStatus.currentJuz} terlebih dahulu.` };
  }

  // Same Juz
  if (newEntry.jenis === 'setoran_hafalan' || newEntry.jenis === 'setoran_baru') {
    if (currentStatus.stage !== 'setoran') {
      return { backward: true, message: `Setoran untuk Juz ${newEntry.juz} sudah selesai. Lanjut ke Drill.` };
    }

    // Check halaman
    if (newEntry.halaman) {
      const parts = newEntry.halaman.split(/[–-]/);
      const startHal = parseInt(parts[0]);
      if (startHal <= (currentStatus.lastHalaman || 0)) {
        return { backward: true, message: `Halaman ${startHal} sudah disetorkan sebelumnya.` };
      }
    }
  }

  if (newEntry.jenis === 'drill') {
    if (currentStatus.stage === 'setoran') {
      return { backward: true, message: `Selesaikan setoran Juz ${newEntry.juz} sebelum memulai Drill.` };
    }
    if (newEntry.level && newEntry.level <= (currentStatus.lastDrillLevel || 0)) {
      return { backward: true, message: `Drill Level ${newEntry.level} sudah lulus.` };
    }
    if (newEntry.level && newEntry.level > (currentStatus.lastDrillLevel || 0) + 1) {
      return { backward: true, message: `Harus lulus Drill Level ${(currentStatus.lastDrillLevel || 0) + 1} terlebih dahulu.` };
    }
  }

  return { backward: false };
}
