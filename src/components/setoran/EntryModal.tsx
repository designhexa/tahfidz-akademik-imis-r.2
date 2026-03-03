import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { JuzSelector } from "@/components/JuzSelector";
import { getSurahsByJuz, type Surah } from "@/lib/quran-data";
import {
  getPageSummaryByJuz,
  getPageCountForJuz,
  checkDuplicateSetoran,
  getHalamanByAyat, // Pastikan fungsi ini ada di lib Anda
  type SetoranRecord,
} from "@/lib/mushaf-madinah";
import { Plus, Info, RefreshCw } from "lucide-react";

type TabType = "setoran_hafalan" | "murojaah" | "tilawah" | "murojaah_rumah";
type SubType = "setoran_hafalan" | "drill" | "tasmi" | "tilawah_harian" | "ujian_jilid";

interface EntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  santriName: string;
  activeTab: TabType;
  subType?: SubType;
  onSave: (data: any) => void;
  existingRecords?: SetoranRecord[];
  santriId?: string;
}

export function EntryModal({
  open,
  onOpenChange,
  date,
  santriName,
  activeTab,
  subType,
  onSave,
  existingRecords = [],
  santriId = "",
}: EntryModalProps) {
  const [juz, setJuz] = useState("");
  const [surah, setSurah] = useState("");
  const [halamanDari, setHalamanDari] = useState("");
  const [halamanSampai, setHalamanSampai] = useState("");
  const [ayatDari, setAyatDari] = useState("1");
  const [ayatSampai, setAyatSampai] = useState("");
  const [status, setStatus] = useState("");
  const [catatan, setCatatan] = useState("");
  const [jilid, setJilid] = useState("");
  const [inputMode, setInputMode] = useState<"halaman" | "surah">("surah");

  const surahByJuz: Surah[] = useMemo(() => {
    if (!juz) return [];
    return getSurahsByJuz(Number(juz));
  }, [juz]);

  const selectedSurah = useMemo(() => {
    return surahByJuz.find((s) => s.number === Number(surah));
  }, [surah, surahByJuz]);

  // ==========================================
  // 🔒 LOGIKA PENGUNCI (AUTO-SYNC)
  // ==========================================

  // Efek 1: Jika Halaman berubah -> Update Surah & Ayat
  useEffect(() => {
    if (inputMode === "halaman" && juz && halamanDari) {
      const startInfo = getPageSummaryByJuz(Number(juz), Number(halamanDari));
      const endInfo = halamanSampai 
        ? getPageSummaryByJuz(Number(juz), Number(halamanSampai))
        : startInfo;

      if (startInfo) {
        setSurah(String(startInfo.surahNumber));
        setAyatDari(String(startInfo.startAyat));
        if (endInfo) setAyatSampai(String(endInfo.endAyat));
      }
    }
  }, [halamanDari, halamanSampai, juz, inputMode]);

  // Efek 2: Jika Surah/Ayat berubah -> Update Halaman
  useEffect(() => {
    if (inputMode === "surah" && juz && surah && ayatDari) {
      const hDari = getHalamanByAyat(Number(juz), Number(surah), Number(ayatDari));
      const hSampai = ayatSampai 
        ? getHalamanByAyat(Number(juz), Number(surah), Number(ayatSampai))
        : hDari;

      if (hDari) setHalamanDari(String(hDari));
      if (hSampai) setHalamanSampai(String(hSampai));
    }
  }, [surah, ayatDari, ayatSampai, juz, inputMode]);

  const pageInfoText = useMemo(() => {
    if (!juz || !halamanDari) return "";
    return getPageSummaryByJuz(Number(juz), Number(halamanDari))?.surahName || "";
  }, [juz, halamanDari]);

  // ==========================================
  // LOGIK SIMPAN & VALIDASI
  // ==========================================

  const handleSave = () => {
    if (!date || !santriId) return;
    if (!juz && !isTilawahTab) { toast.error("Pilih Juz"); return; }
    if (!status) { toast.error("Pilih status"); return; }

    const finalSurah = Number(surah);
    const finalAyatDari = Number(ayatDari);
    const finalAyatSampai = Number(ayatSampai);

    // Validasi range dasar
    if (finalAyatSampai < finalAyatDari) {
      toast.error("Ayat sampai tidak boleh lebih kecil dari ayat dari");
      return;
    }

    const range = {
      surahNumber: finalSurah,
      ayatDari: finalAyatDari,
      ayatSampai: finalAyatSampai,
    };

    const jenisKey = activeTab === "murojaah" ? "murojaah" : activeTab === "murojaah_rumah" ? "murojaah_rumah" : subType || "setoran_hafalan";

    // Cek Duplikat
    if (checkDuplicateSetoran(range, existingRecords, santriId, jenisKey)) {
      toast.error("Hafalan ini sudah pernah disetor/overlap");
      return;
    }

    onSave({
      tanggal: date,
      jenis: jenisKey,
      juz: Number(juz),
      surah: selectedSurah?.name || "",
      surahNumber: finalSurah,
      halaman: `${halamanDari}${halamanSampai ? '–'+halamanSampai : ''}`,
      ayat: `${finalAyatDari}-${finalAyatSampai}`,
      ayatDari: finalAyatDari,
      ayatSampai: finalAyatSampai,
      status,
      catatan,
      jilid: jilid || undefined,
    });

    onOpenChange(false);
    toast.success("Data berhasil disimpan!");
  };

  const isTilawahTab = activeTab === "tilawah";
  const isTilawahQuran = isTilawahTab && jilid === "quran";
  const maxHalaman = juz ? getPageCountForJuz(Number(juz)) : 20;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{activeTab.replace('_', ' ').toUpperCase()}</DialogTitle>
          <DialogDescription>{santriName} • {format(date, "d MMMM yyyy", { locale: localeId })}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <JuzSelector value={juz} onValueChange={(v) => { setJuz(v); setSurah(""); }} />

          {juz && (
            <div className="flex bg-muted p-1 rounded-lg">
              <Button 
                variant={inputMode === "surah" ? "secondary" : "ghost"} 
                className="flex-1 text-xs h-8" 
                onClick={() => setInputMode("surah")}
              >Input Surah</Button>
              <Button 
                variant={inputMode === "halaman" ? "secondary" : "ghost"} 
                className="flex-1 text-xs h-8" 
                onClick={() => setInputMode("halaman")}
              >Input Halaman</Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Halaman Dari</Label>
              <Input 
                type="number" 
                value={halamanDari} 
                onChange={(e) => setHalamanDari(e.target.value)}
                disabled={inputMode === "surah"} 
                placeholder="Hal"
              />
            </div>
            <div className="space-y-2">
              <Label>Halaman Sampai</Label>
              <Input 
                type="number" 
                value={halamanSampai} 
                onChange={(e) => setHalamanSampai(e.target.value)}
                disabled={inputMode === "surah"}
                placeholder="Hal"
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Surah</Label>
              <Select value={surah} onValueChange={setSurah} disabled={inputMode === "halaman"}>
                <SelectTrigger><SelectValue placeholder="Pilih Surah" /></SelectTrigger>
                <SelectContent>
                  {surahByJuz.map(s => <SelectItem key={s.number} value={String(s.number)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ayat Dari</Label>
                <Input 
                  type="number" 
                  value={ayatDari} 
                  onChange={(e) => setAyatDari(e.target.value)}
                  disabled={inputMode === "halaman"}
                />
              </div>
              <div className="space-y-2">
                <Label>Ayat Sampai</Label>
                <Input 
                  type="number" 
                  value={ayatSampai} 
                  onChange={(e) => setAyatSampai(e.target.value)}
                  disabled={inputMode === "halaman"}
                />
              </div>
            </div>
          </div>

          {inputMode === "halaman" && pageInfoText && (
            <div className="flex items-center gap-2 text-xs bg-blue-50 text-blue-700 p-2 rounded">
              <Info className="w-4 h-4" />
              Auto-detect: Surah {pageInfoText}
            </div>
          )}

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger>
              <SelectContent>
                {["Lancar", "Ulangi", "Sakit", "Izin"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan perkembangan..." />
          </div>

          <Button onClick={handleSave} className="w-full">Simpan Setoran</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}