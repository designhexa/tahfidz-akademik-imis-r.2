// Konfigurasi target hafalan per kelas
// Target diatur sesuai kurikulum sekolah

export interface ClassTarget {
  kelasName: string;
  targetJuz: number | null; // null untuk "surat pilihan" (Kelas 6)
  targetSurahPilihan?: string[]; // Untuk Kelas 6
  description: string;
}

import { MOCK_SANTRI, getKelasNama, getHalaqohNama } from "./mock-data";

// Target default - bisa dikonfigurasi admin nanti
export const CLASS_TARGETS: Record<string, ClassTarget> = {
  "1": {
    kelasName: "Kelas 1",
    targetJuz: 30,
    description: "Target Juz 30 (Juz 'Amma)"
  },
  "2": {
    kelasName: "Kelas 2",
    targetJuz: 29,
    description: "Target Juz 29"
  },
  "3": {
    kelasName: "Kelas 3",
    targetJuz: 28,
    description: "Target Juz 28"
  },
  "4": {
    kelasName: "Kelas 4",
    targetJuz: 27,
    description: "Target Juz 27"
  },
  "5": {
    kelasName: "Kelas 5",
    targetJuz: 25,
    description: "Target Juz 25"
  },
  "6": {
    kelasName: "Kelas 6",
    targetJuz: null,
    targetSurahPilihan: ["Yasin", "Al-Mulk", "Al-Waqi'ah", "Ar-Rahman"],
    description: "Target Surat Pilihan (konfigurasi admin)"
  }
};

export interface StudentProgress {
  id: string;
  nama: string;
  nis: string;
  kelas: string;
  kelasNumber: string;
  halaqoh: string;
  jumlahJuzHafal: number;
  juzSelesai: number[]; // Array of completed juz numbers
  drillSelesai: boolean; // Apakah sudah menyelesaikan drill terakhir (drill satu juz)
  eligibleForTasmi: boolean;
}

export interface TargetStatus {
  meetsTarget: boolean;
  currentProgress: number;
  targetProgress: number;
  progressPercentage: number;
  description: string;
}

// Fungsi untuk mengekstrak nomor kelas dari nama kelas
export const extractKelasNumber = (kelasName: string): string | null => {
  // Mencoba ekstrak angka dari nama kelas
  // Contoh: "Paket A Kelas 6" -> "6", "Kelas 1" -> "1", "KBTK A" -> null
  const match = kelasName.match(/kelas\s*(\d+)/i);
  if (match) return match[1];
  
  // Jika tidak ada "Kelas X", cek pattern lain
  const digitMatch = kelasName.match(/(\d+)/);
  if (digitMatch) return digitMatch[1];
  
  return null;
};

// Fungsi untuk cek apakah santri memenuhi target kelas
export const checkTargetStatus = (
  kelasNumber: string,
  juzSelesai: number[]
): TargetStatus => {
  const target = CLASS_TARGETS[kelasNumber];
  
  if (!target) {
    return {
      meetsTarget: false,
      currentProgress: juzSelesai.length,
      targetProgress: 0,
      progressPercentage: 0,
      description: "Kelas tidak terdaftar dalam target"
    };
  }
  
  // Kelas 6 - surat pilihan (khusus)
  if (target.targetJuz === null) {
    return {
      meetsTarget: true, // Akan dicek lebih detail saat admin konfigurasi
      currentProgress: juzSelesai.length,
      targetProgress: 0,
      progressPercentage: 100,
      description: target.description
    };
  }
  
  // Untuk kelas 1-5, cek apakah juz target sudah selesai
  const hasTargetJuz = juzSelesai.includes(target.targetJuz);
  
  return {
    meetsTarget: hasTargetJuz,
    currentProgress: juzSelesai.length,
    targetProgress: 1,
    progressPercentage: hasTargetJuz ? 100 : 0,
    description: hasTargetJuz 
      ? `✓ Sudah hafal ${target.description}`
      : `✗ Belum hafal ${target.description}`
  };
};

// Fungsi untuk cek eligibility tasmi' (sudah lulus drill satu juz)
export const checkTasmiEligibility = (
  juzSelesai: number[],
  drillSelesai: boolean
): boolean => {
  // Santri eligible untuk tasmi' jika:
  // 1. Sudah menyelesaikan minimal 1 juz hafalan (drill sampai tahap akhir)
  // 2. Sudah lulus drill untuk juz tersebut
  return juzSelesai.length > 0 && drillSelesai;
};

// Fungsi untuk mendapatkan juz berikutnya yang harus diujikan
export const getNextTasmiJuz = (juzSelesai: number[]): number | null => {
  // Urutan tasmi: 30, 29, 28, 27, 26, lalu 1, 2, 3, dst
  const JUZ_ORDER = [30, 29, 28, 27, 26, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  
  for (const juz of JUZ_ORDER) {
    if (!juzSelesai.includes(juz)) {
      return juz;
    }
  }
  
  return null; // Semua juz sudah selesai
};

// Data mock untuk santri dengan progres - derived from centralized MOCK_SANTRI
export const mockSantriProgress: StudentProgress[] = MOCK_SANTRI.map(s => {
  const kelasNama = getKelasNama(s.idKelas);
  const kNum = extractKelasNumber(kelasNama) || "1";
  return {
    id: s.id,
    nama: s.nama,
    nis: s.nis,
    kelas: kelasNama,
    kelasNumber: kNum,
    halaqoh: getHalaqohNama(s.idHalaqoh),
    jumlahJuzHafal: s.juzSelesai.length,
    juzSelesai: s.juzSelesai,
    drillSelesai: s.drillSelesai,
    eligibleForTasmi: checkTasmiEligibility(s.juzSelesai, s.drillSelesai)
  };
});

// Fungsi untuk menghitung statistik target
export const calculateTargetStats = (students: StudentProgress[]) => {
  const meetsTarget = students.filter(s => {
    const status = checkTargetStatus(s.kelasNumber, s.juzSelesai);
    return status.meetsTarget;
  });
  
  const notMeetsTarget = students.filter(s => {
    const status = checkTargetStatus(s.kelasNumber, s.juzSelesai);
    return !status.meetsTarget;
  });
  
  const eligibleForTasmi = students.filter(s => s.eligibleForTasmi);
  
  return {
    total: students.length,
    meetsTarget: meetsTarget.length,
    notMeetsTarget: notMeetsTarget.length,
    eligibleForTasmi: eligibleForTasmi.length,
    meetsTargetPercentage: students.length > 0 
      ? Math.round((meetsTarget.length / students.length) * 100) 
      : 0
  };
};
