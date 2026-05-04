// Aturan placement & target hafalan IMIS
// ---------------------------------------
// Urutan target hafalan: 30 -> 29 -> 28 -> 27 -> 26 -> surat pilihan.
//
// Saat santri masuk IMIS pertama kali:
// - Belum pernah ujian tasmi & belum punya hafalan -> juzAktif = 30, status "belum".
// - Klaim sudah hafal Juz 30                       -> daftar ujian placement Juz 30.
//   - Lulus -> juzAktif = 29.
//   - Tidak lulus / belum diuji -> juzAktif tetap 30.
// - Klaim sudah hafal juz selain 30 (mis. juz 5)   -> tidak perlu ujian placement;
//   juzAktif tetap 30 (mengikuti urutan target IMIS).
//
// Catatan: untuk juz 29..26, alur lulus berikutnya juga menurunkan juzAktif satu
// langkah (29->28, 28->27, 27->26). Lulus juz 26 menandai fase surat pilihan.

import type { MockSantri } from "@/lib/mock-data";

export type PlacementStatus = NonNullable<MockSantri["placementStatus"]>;

export interface PlacementInput {
  /** juz yang diklaim sudah dihafal santri saat masuk; undefined = belum hafal apa pun */
  hafalanAwalJuz?: number;
}

export interface PlacementDecision {
  juzAktif: number;
  placementStatus: PlacementStatus;
  /** Jika true, sistem otomatis mendaftarkan santri ke ujian tasmi placement juz 30 */
  daftarUjianPlacement: boolean;
  /** Juz yang akan diuji placement-nya (jika daftarUjianPlacement = true) */
  ujianJuz?: number;
  reason: string;
}

/**
 * Tentukan placement awal saat santri baru ditambahkan.
 */
export function decideInitialPlacement(input: PlacementInput): PlacementDecision {
  const { hafalanAwalJuz } = input;

  if (
    hafalanAwalJuz === undefined ||
    hafalanAwalJuz === null ||
    hafalanAwalJuz === 0
  ) {
    if (hafalanAwalJuz === 0) {
      // sentinel "juz lain di luar 26-30"
      return {
        juzAktif: 30,
        placementStatus: "tidak_perlu",
        daftarUjianPlacement: false,
        reason:
          "Hafalan awal di luar urutan target IMIS (30→26) — mulai dari Juz 30 tanpa ujian placement.",
      };
    }
    return {
      juzAktif: 30,
      placementStatus: "belum",
      daftarUjianPlacement: false,
      reason: "Santri baru tanpa hafalan awal — mulai dari Juz 30.",
    };
  }

  if (hafalanAwalJuz === 30) {
    return {
      juzAktif: 30,
      placementStatus: "terdaftar",
      daftarUjianPlacement: true,
      ujianJuz: 30,
      reason:
        "Mengaku sudah hafal Juz 30 — didaftarkan ke ujian tasmi placement Juz 30.",
    };
  }

  // Hafal juz selain 30 (5, 10, dst.) → ikut alur normal mulai Juz 30, tanpa ujian placement.
  return {
    juzAktif: 30,
    placementStatus: "tidak_perlu",
    daftarUjianPlacement: false,
    reason:
      "Hafalan awal di luar urutan target IMIS (30→26) — mulai dari Juz 30 tanpa ujian placement.",
  };
}

/**
 * Setelah santri lulus ujian placement / tasmi pada juz tertentu,
 * tentukan juzAktif berikutnya.
 *
 * - Lulus Juz 30 -> 29
 * - Lulus Juz 29 -> 28
 * - Lulus Juz 28 -> 27
 * - Lulus Juz 27 -> 26
 * - Lulus Juz 26 -> tetap 26, tandai suratPilihan = true
 */
export function nextJuzAfterLulus(juzLulus: number): {
  juzAktif: number;
  suratPilihan: boolean;
} {
  if (juzLulus === 26) return { juzAktif: 26, suratPilihan: true };
  if (juzLulus >= 27 && juzLulus <= 30) {
    return { juzAktif: juzLulus - 1, suratPilihan: false };
  }
  // juz selain 26..30 tidak menggeser target IMIS.
  return { juzAktif: 30, suratPilihan: false };
}

/**
 * Validasi: apakah entry setoran untuk `juz` diperbolehkan untuk santri ini?
 * Aturan: setoran hanya boleh pada juzAktif santri.
 */
export function canEntrySetoranForJuz(
  santri: Pick<MockSantri, "juzAktif">,
  juz: number
): { allowed: boolean; reason?: string; juzAktif: number } {
  const juzAktif = santri.juzAktif ?? 30;
  if (juz === juzAktif) return { allowed: true, juzAktif };
  return {
    allowed: false,
    juzAktif,
    reason: `Setoran hanya boleh untuk Juz ${juzAktif} (juz aktif santri). Juz ${juz} tidak diizinkan.`,
  };
}
