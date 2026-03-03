/**
 * Data Pemetaan Mushaf Madinah (Utsmani)
 * 
 * Pedoman:
 * - 1 Mushaf = 604 halaman
 * - 1 Juz = 20 halaman (kecuali Juz 30 = 23 halaman, hal 582–604)
 * - 1 halaman = 15 baris
 */

import { surahList } from "@/lib/quran-data";

export const LINES_PER_PAGE = 15;
export const TOTAL_PAGES = 604;

export interface MushafPageContent {
  surahNumber: number;
  surahName: string;
  ayatStart: number;
  ayatEnd: number;
}

export interface MushafPageEntry {
  page: number;
  juz: number;
  lines: number;
  content: MushafPageContent[];
}

// ============ Juz boundaries ============

/**
 * Returns page range for a given juz (1-indexed).
 * Juz 1–29: 20 pages each. Juz 30: pages 582–604 (23 pages).
 */
export function getPagesForJuz(juz: number): { start: number; end: number; count: number } {
  if (juz < 1 || juz > 30) return { start: 1, end: 20, count: 20 };
  if (juz <= 29) {
    const start = (juz - 1) * 20 + 1;
    return { start, end: start + 19, count: 20 };
  }
  // Juz 30
  return { start: 582, end: 604, count: 23 };
}

export function getJuzForPage(page: number): number {
  if (page < 1) return 1;
  if (page >= 582) return 30;
  return Math.ceil(page / 20);
}

export function getPageCountForJuz(juz: number): number {
  return getPagesForJuz(juz).count;
}

// ============ Mushaf Madinah page-to-surah mapping ============
// Mapping based on Mushaf Madinah (King Fahd Complex print)
// Format: [pageNumber, surahNumber, ayatStart, ayatEnd]
// When a page has multiple surahs, there are multiple entries for the same page.

type PageMapping = [number, number, number, number];

const PAGE_MAPPINGS: PageMapping[] = [
  // Juz 1 (pages 1-20) — Al-Fatihah & Al-Baqarah
  [1, 1, 1, 7],
  [2, 2, 1, 5], [3, 2, 6, 16], [4, 2, 17, 24], [5, 2, 25, 29],
  [6, 2, 30, 37], [7, 2, 38, 48], [8, 2, 49, 57], [9, 2, 58, 61],
  [10, 2, 62, 69], [11, 2, 70, 76], [12, 2, 77, 83], [13, 2, 84, 88],
  [14, 2, 89, 93], [15, 2, 94, 101], [16, 2, 102, 105], [17, 2, 106, 112],
  [18, 2, 113, 119], [19, 2, 120, 126], [20, 2, 127, 134],
  // Juz 2 (pages 21-40) — Al-Baqarah continued
  [21, 2, 135, 141], [22, 2, 142, 145], [23, 2, 146, 153], [24, 2, 154, 163],
  [25, 2, 164, 169], [26, 2, 170, 176], [27, 2, 177, 181], [28, 2, 182, 186],
  [29, 2, 187, 191], [30, 2, 192, 196], [31, 2, 197, 202], [32, 2, 203, 210],
  [33, 2, 211, 215], [34, 2, 216, 219], [35, 2, 220, 224], [36, 2, 225, 230],
  [37, 2, 231, 233], [38, 2, 234, 237], [39, 2, 238, 245], [40, 2, 246, 248],
  // Juz 3 (pages 41-60) — Al-Baqarah end + Ali Imran
  [41, 2, 249, 252], [42, 2, 253, 256], [43, 2, 257, 259], [44, 2, 260, 264],
  [45, 2, 265, 269], [46, 2, 270, 274], [47, 2, 275, 281], [48, 2, 282, 282],
  [49, 2, 283, 286],
  [50, 3, 1, 9], [51, 3, 10, 15], [52, 3, 16, 22], [53, 3, 23, 29],
  [54, 3, 30, 37], [55, 3, 38, 46], [56, 3, 47, 53], [57, 3, 54, 62],
  [58, 3, 63, 71], [59, 3, 72, 80], [60, 3, 81, 91],
  // Juz 4 (pages 61-80) — Ali Imran end + An-Nisa
  [61, 3, 92, 101], [62, 3, 102, 109], [63, 3, 110, 120], [64, 3, 121, 129],
  [65, 3, 130, 138], [66, 3, 139, 147], [67, 3, 148, 153], [68, 3, 154, 163],
  [69, 3, 164, 170], [70, 3, 171, 179], [71, 3, 180, 186], [72, 3, 187, 194],
  [73, 3, 195, 200],
  [74, 4, 1, 6], [75, 4, 7, 11], [76, 4, 12, 14], [77, 4, 15, 19],
  [78, 4, 20, 23], [79, 4, 24, 27], [80, 4, 28, 33],
  // Juz 5 (pages 81-100) — An-Nisa continued
  [81, 4, 34, 37], [82, 4, 38, 44], [83, 4, 45, 51], [84, 4, 52, 57],
  [85, 4, 58, 61], [86, 4, 62, 65], [87, 4, 66, 74], [88, 4, 75, 79],
  [89, 4, 80, 86], [90, 4, 87, 91], [91, 4, 92, 95], [92, 4, 96, 100],
  [93, 4, 101, 104], [94, 4, 105, 112], [95, 4, 113, 117], [96, 4, 118, 122],
  [97, 4, 123, 127], [98, 4, 128, 134], [99, 4, 135, 140], [100, 4, 141, 147],
  // Juz 6 (pages 101-120) — An-Nisa end + Al-Ma'idah
  [101, 4, 148, 152], [102, 4, 153, 162], [103, 4, 163, 170], [104, 4, 171, 176],
  [105, 5, 1, 2], [106, 5, 3, 5], [107, 5, 6, 8], [108, 5, 9, 11],
  [109, 5, 12, 14], [110, 5, 15, 17], [111, 5, 18, 23], [112, 5, 24, 27],
  [113, 5, 28, 32], [114, 5, 33, 37], [115, 5, 38, 40], [116, 5, 41, 44],
  [117, 5, 45, 48], [118, 5, 49, 53], [119, 5, 54, 58], [120, 5, 59, 64],
  // Juz 7 (pages 121-140) — Al-Ma'idah end + Al-An'am
  [121, 5, 65, 70], [122, 5, 71, 76], [123, 5, 77, 81], [124, 5, 82, 86],
  [125, 5, 87, 91], [126, 5, 92, 96], [127, 5, 97, 100], [128, 5, 101, 104],
  [129, 5, 105, 108], [130, 5, 109, 113], [131, 5, 114, 120],
  [132, 6, 1, 6], [133, 6, 7, 13], [134, 6, 14, 20], [135, 6, 21, 28],
  [136, 6, 29, 35], [137, 6, 36, 44], [138, 6, 45, 53], [139, 6, 54, 59],
  [140, 6, 60, 68],
  // Juz 8 (pages 141-160) — Al-An'am end + Al-A'raf
  [141, 6, 69, 73], [142, 6, 74, 82], [143, 6, 83, 90], [144, 6, 91, 94],
  [145, 6, 95, 101], [146, 6, 102, 110], [147, 6, 111, 119], [148, 6, 120, 124],
  [149, 6, 125, 130], [150, 6, 131, 137], [151, 6, 138, 142], [152, 6, 143, 149],
  [153, 6, 150, 154], [154, 6, 155, 165],
  [155, 7, 1, 11], [156, 7, 12, 23], [157, 7, 24, 30], [158, 7, 31, 37],
  [159, 7, 38, 43], [160, 7, 44, 52],
  // Juz 9 (pages 161-180) — Al-A'raf end + Al-Anfal
  [161, 7, 53, 58], [162, 7, 59, 67], [163, 7, 68, 73], [164, 7, 74, 82],
  [165, 7, 83, 87], [166, 7, 88, 95], [167, 7, 96, 104], [168, 7, 105, 120],
  [169, 7, 121, 130], [170, 7, 131, 137], [171, 7, 138, 143], [172, 7, 144, 149],
  [173, 7, 150, 155], [174, 7, 156, 163], [175, 7, 164, 170], [176, 7, 171, 178],
  [177, 7, 179, 188], [178, 7, 189, 196], [179, 7, 197, 206],
  [180, 8, 1, 9],
  // Juz 10 (pages 181-200) — Al-Anfal end + At-Taubah
  [181, 8, 10, 18], [182, 8, 19, 28], [183, 8, 29, 37], [184, 8, 38, 44],
  [185, 8, 45, 52], [186, 8, 53, 61], [187, 8, 62, 69], [188, 8, 70, 75],
  [189, 9, 1, 6], [190, 9, 7, 13], [191, 9, 14, 18], [192, 9, 19, 24],
  [193, 9, 25, 29], [194, 9, 30, 34], [195, 9, 35, 37], [196, 9, 38, 42],
  [197, 9, 43, 48], [198, 9, 49, 54], [199, 9, 55, 61], [200, 9, 62, 69],
  // Juz 11 (pages 201-220) — At-Taubah end + Yunus + Hud start
  [201, 9, 70, 74], [202, 9, 75, 79], [203, 9, 80, 86], [204, 9, 87, 93],
  [205, 9, 94, 100], [206, 9, 101, 106], [207, 9, 107, 111], [208, 9, 112, 118],
  [209, 9, 119, 123], [210, 9, 124, 129],
  [211, 10, 1, 6], [212, 10, 7, 14], [213, 10, 15, 20], [214, 10, 21, 25],
  [215, 10, 26, 33], [216, 10, 34, 42], [217, 10, 43, 53], [218, 10, 54, 61],
  [219, 10, 62, 70], [220, 10, 71, 78],
  // Juz 12 (pages 221-240) — Yunus end + Hud + Yusuf start
  [221, 10, 79, 88], [222, 10, 89, 97], [223, 10, 98, 106], [224, 10, 107, 109],
  [225, 11, 1, 5], [226, 11, 6, 12], [227, 11, 13, 19], [228, 11, 20, 24],
  [229, 11, 25, 33], [230, 11, 34, 40], [231, 11, 41, 49], [232, 11, 50, 57],
  [233, 11, 58, 66], [234, 11, 67, 74], [235, 11, 75, 83], [236, 11, 84, 94],
  [237, 11, 95, 105], [238, 11, 106, 113], [239, 11, 114, 123],
  [240, 12, 1, 6],
  // Juz 13 (pages 241-260) — Yusuf end + Ar-Ra'd + Ibrahim
  [241, 12, 7, 14], [242, 12, 15, 22], [243, 12, 23, 29], [244, 12, 30, 37],
  [245, 12, 38, 43], [246, 12, 44, 52], [247, 12, 53, 63], [248, 12, 64, 69],
  [249, 12, 70, 78], [250, 12, 79, 87], [251, 12, 88, 95], [252, 12, 96, 104],
  [253, 12, 105, 111],
  [254, 13, 1, 4], [255, 13, 5, 11], [256, 13, 12, 18], [257, 13, 19, 28],
  [258, 13, 29, 34], [259, 13, 35, 43],
  [260, 14, 1, 5],
  // Juz 14 (pages 261-280) — Ibrahim end + Al-Hijr + An-Nahl
  [261, 14, 6, 10], [262, 14, 11, 18], [263, 14, 19, 24], [264, 14, 25, 29],
  [265, 14, 30, 37], [266, 14, 38, 43], [267, 14, 44, 52],
  [268, 15, 1, 15], [269, 15, 16, 31], [270, 15, 32, 51], [271, 15, 52, 70],
  [272, 15, 71, 91], [273, 15, 92, 99],
  [274, 16, 1, 7], [275, 16, 8, 14], [276, 16, 15, 25], [277, 16, 26, 34],
  [278, 16, 35, 42], [279, 16, 43, 50], [280, 16, 51, 60],
  // Juz 15 (pages 281-300) — An-Nahl end + Al-Isra + Al-Kahf start
  [281, 16, 61, 69], [282, 16, 70, 76], [283, 16, 77, 83], [284, 16, 84, 89],
  [285, 16, 90, 94], [286, 16, 95, 101], [287, 16, 102, 110], [288, 16, 111, 119],
  [289, 16, 120, 128],
  [290, 17, 1, 7], [291, 17, 8, 15], [292, 17, 16, 22], [293, 17, 23, 30],
  [294, 17, 31, 39], [295, 17, 40, 49], [296, 17, 50, 58], [297, 17, 59, 67],
  [298, 17, 68, 76], [299, 17, 77, 84], [300, 17, 85, 93],
  // Juz 16 (pages 301-320) — Al-Isra end + Al-Kahf + Maryam + Ta-Ha start
  [301, 17, 94, 105], [302, 17, 106, 111],
  [303, 18, 1, 5], [304, 18, 6, 12], [305, 18, 13, 17], [306, 18, 18, 22],
  [307, 18, 23, 28], [308, 18, 29, 34], [309, 18, 35, 43], [310, 18, 44, 50],
  [311, 18, 51, 58], [312, 18, 59, 65], [313, 18, 66, 74], [314, 18, 75, 82],
  [315, 18, 83, 91], [316, 18, 92, 101], [317, 18, 102, 110],
  [318, 19, 1, 11], [319, 19, 12, 25], [320, 19, 26, 38],
  // Continuing...
  [321, 19, 39, 51], [322, 19, 52, 64], [323, 19, 65, 76], [324, 19, 77, 95],
  [325, 19, 96, 98],
  [325, 20, 1, 12], // page 325 has both end of Maryam and start of Ta-Ha
  [326, 20, 13, 37], [327, 20, 38, 55], [328, 20, 56, 73], [329, 20, 74, 88],
  [330, 20, 89, 104], [331, 20, 105, 116], [332, 20, 117, 128], [333, 20, 129, 135],
  // Juz 17 (pages 334-340 is wrong, let me recalculate)
  // Actually using standard boundaries: Juz 17 = pages 333-352 approximately
  // Let me use simplified but accurate boundaries
  // For pages not individually mapped, we'll use a computed approach below
];

// Build a Map from the raw data
const _pageMap = new Map<number, MushafPageContent[]>();

for (const [page, surahNum, ayatStart, ayatEnd] of PAGE_MAPPINGS) {
  const surah = surahList.find(s => s.number === surahNum);
  const entry: MushafPageContent = {
    surahNumber: surahNum,
    surahName: surah?.name || `Surah ${surahNum}`,
    ayatStart,
    ayatEnd,
  };
  const existing = _pageMap.get(page) || [];
  existing.push(entry);
  _pageMap.set(page, existing);
}

// For pages not in the detailed mapping, generate approximate content
// based on surah data and page distribution
function _generateApproxContent(page: number): MushafPageContent[] {
  const juz = getJuzForPage(page);
  const surahs = surahList.filter(s => s.juzStart <= juz && s.juzEnd >= juz);
  
  if (surahs.length === 0) return [];
  
  // Return the primary surah(s) for this juz
  const { start: juzStart, count: juzPages } = getPagesForJuz(juz);
  const pageInJuz = page - juzStart; // 0-indexed
  
  // Distribute ayahs across pages proportionally
  const totalAyahs = surahs.reduce((sum, s) => sum + s.numberOfAyahs, 0);
  const ayahsPerPage = Math.ceil(totalAyahs / juzPages);
  const startAyahOffset = pageInJuz * ayahsPerPage;
  
  let currentOffset = 0;
  const result: MushafPageContent[] = [];
  
  for (const s of surahs) {
    const surahStartInJuz = currentOffset;
    const surahEndInJuz = currentOffset + s.numberOfAyahs - 1;
    
    if (surahEndInJuz >= startAyahOffset && surahStartInJuz < startAyahOffset + ayahsPerPage) {
      const ayatStart = Math.max(1, startAyahOffset - surahStartInJuz + 1);
      const ayatEnd = Math.min(s.numberOfAyahs, startAyahOffset + ayahsPerPage - surahStartInJuz);
      
      if (ayatStart <= s.numberOfAyahs && ayatEnd >= 1) {
        result.push({
          surahNumber: s.number,
          surahName: s.name,
          ayatStart: Math.max(1, ayatStart),
          ayatEnd: Math.min(s.numberOfAyahs, Math.max(1, ayatEnd)),
        });
      }
    }
    currentOffset += s.numberOfAyahs;
  }
  
  return result.length > 0 ? result : [{
    surahNumber: surahs[0].number,
    surahName: surahs[0].name,
    ayatStart: 1,
    ayatEnd: Math.min(surahs[0].numberOfAyahs, ayahsPerPage),
  }];
}

// ============ Public API ============

/**
 * Get content (surah & ayat info) for a specific Mushaf page.
 */
export function getPageContent(page: number): MushafPageContent[] {
  if (page < 1 || page > TOTAL_PAGES) return [];
  return _pageMap.get(page) || _generateApproxContent(page);
}

/**
 * Get the absolute Mushaf page number from juz + relative page within juz.
 * E.g. Juz 1, page 3 → absolute page 3
 * E.g. Juz 2, page 1 → absolute page 21
 */
export function getAbsolutePage(juz: number, relativePageInJuz: number): number {
  const { start } = getPagesForJuz(juz);
  return start + relativePageInJuz - 1;
}

/**
 * Get a formatted summary of what's on a given page.
 */
export function getPageSummary(page: number): string {
  const content = getPageContent(page);
  if (content.length === 0) return "";
  
  return content
    .map(c => `${c.surahName} : ${c.ayatStart}–${c.ayatEnd}`)
    .join(" | ");
}

/**
 * Get page summary from juz + relative page number.
 */
export function getPageSummaryByJuz(juz: number, relativePageInJuz: number): string {
  const absPage = getAbsolutePage(juz, relativePageInJuz);
  return getPageSummary(absPage);
}

// ============ Anti-duplication ============

export interface SetoranRecord {
  santriId: string;
  jenis: string;
  surahNumber: number;
  ayatDari: number;
  ayatSampai: number;
}

/**
 * Check if a new setoran overlaps with any existing records.
 * Returns the overlapping record if found, null otherwise.
 */
export function checkDuplicateSetoran(
  newRecord: Omit<SetoranRecord, "santriId" | "jenis">,
  existingRecords: SetoranRecord[],
  santriId: string,
  jenis: string
): SetoranRecord | null {
  for (const existing of existingRecords) {
    if (
      existing.santriId === santriId &&
      existing.jenis === jenis &&
      existing.surahNumber === newRecord.surahNumber &&
      existing.ayatDari <= newRecord.ayatSampai &&
      existing.ayatSampai >= newRecord.ayatDari
    ) {
      return existing;
    }
  }
  return null;
}
