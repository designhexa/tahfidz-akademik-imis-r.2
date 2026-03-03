
# Perbaikan Build Error dan Implementasi Data Mushaf Madinah (Utsmani)

## 1. Perbaikan Build Error

**File:** `src/pages/SetoranHafalan.tsx` (baris ~628)
- Tambahkan prop `drillHistory` yang hilang pada komponen `AddDrillModal`. Akan dikirimkan array kosong `[]` sebagai default.

---

## 2. Pembuatan Data Pemetaan Mushaf Madinah

**File baru:** `src/lib/mushaf-madinah.ts`

Membuat database pemetaan halaman Mushaf Madinah (Utsmani) dengan pedoman:
- 1 Mushaf = 604 halaman
- 1 Juz = 20 halaman (kecuali Juz 30 = 23 halaman, halaman 582-604)
- 1 halaman = 15 baris

Data utama berupa array `MUSHAF_PAGES` yang memetakan setiap halaman (1-604) ke:
- Nomor juz
- Daftar surah yang ada di halaman tersebut beserta rentang ayat (ayat awal - ayat akhir)

Fungsi-fungsi helper:
- `getPageContent(page: number)` -- mengembalikan info surah dan ayat yang ada di halaman tersebut
- `getJuzForPage(page: number)` -- mengembalikan nomor juz dari halaman
- `getPagesForJuz(juz: number)` -- mengembalikan rentang halaman untuk juz tertentu (misal Juz 1 = hal 1-20, Juz 30 = hal 582-604)
- `getSurahAyatForPage(page: number)` -- mengembalikan detail surah dan ayat untuk halaman tertentu

Catatan: Data pemetaan lengkap 604 halaman akan diisi berdasarkan Mushaf Madinah standar. Untuk akurasi, data ini berupa lookup table statis.

---

## 3. Anti-Duplikasi Setoran

**File:** `src/components/setoran/EntryModal.tsx`

Menambahkan mekanisme pengecekan duplikasi:
- Komponen menerima prop baru `existingRecords` berisi daftar setoran yang sudah ada untuk santri yang dipilih
- Sebelum menyimpan, sistem mengecek apakah rentang surah/ayat atau halaman yang diinput sudah pernah disetor pada jenis yang sama
- Jika duplikat terdeteksi, tampilkan pesan error via `toast.error()` dan tolak penyimpanan
- Pengecekan meliputi overlap rentang ayat (bukan hanya exact match)

**File:** `src/pages/TambahSetoran.tsx`

Pengecekan serupa ditambahkan di form tambah setoran utama.

---

## 4. Integrasi Halaman ke Surah/Ayat Otomatis

**File:** `src/components/setoran/EntryModal.tsx` dan `src/pages/TambahSetoran.tsx`

Ketika user memilih mode "Halaman":
- Setelah memilih Juz dan nomor halaman, sistem otomatis menampilkan informasi surah dan ayat yang ada di halaman tersebut (menggunakan data dari `mushaf-madinah.ts`)
- Info ditampilkan sebagai badge/info box di bawah input halaman
- Data surah/ayat ikut tersimpan bersama data setoran

---

## Detail Teknis

### Struktur data `mushaf-madinah.ts`:

```text
interface MushafPageEntry {
  page: number;         // 1-604
  juz: number;          // 1-30
  lines: 15;            // konstanta
  content: Array<{
    surahNumber: number;
    surahName: string;
    ayatStart: number;
    ayatEnd: number;
  }>;
}
```

### Logika anti-duplikasi:

```text
Untuk setiap record baru (santriId, jenis, surah, ayatDari, ayatSampai):
  Cek semua record existing dengan santriId + jenis yang sama
  Jika ada overlap rentang ayat pada surah yang sama -> TOLAK
  
Overlap terjadi jika:
  existingAyatDari <= newAyatSampai AND existingAyatSampai >= newAyatDari
```

### Perubahan pada halaman per juz:

```text
Juz 1-29: halaman (juz-1)*20 + 1 sampai juz*20
Juz 30: halaman 582 sampai 604 (23 halaman)
Total: 604 halaman
```
