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
  getPageCountForJuz,
  checkDuplicateSetoran,
  getHalamanByAyat,
  getPageDataByJuz,
  getAbsolutePage,
  type SetoranRecord,
} from "@/lib/mushaf-madinah";
import { Info } from "lucide-react";

interface EntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  santriName: string;
  activeTab: any;
  subType?: any;
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
  const [status, setStatus] = useState("Lancar");
  const [catatan, setCatatan] = useState("");
  const [inputMode, setInputMode] = useState<"halaman" | "surah">("surah");

  const surahByJuz: Surah[] = useMemo(() => {
    if (!juz) return [];
    return getSurahsByJuz(Number(juz));
  }, [juz]);

  const selectedSurah = useMemo(() => {
    return surahByJuz.find((s) => s.number === Number(surah));
  }, [surah, surahByJuz]);

  // ==========================================
  // 🔒 LOGIKA OTOMATIS (SINKRONISASI)
  // ==========================================

  // A. Jika Halaman berubah -> Update Surah & Ayat
  useEffect(() => {
    if (inputMode === "halaman" && juz && halamanDari) {
      const pageData = getPageDataByJuz(Number(juz), Number(halamanDari));
      if (pageData) {
        setSurah(String(pageData.surahNumber));
        setAyatDari(String(pageData.ayatStart));
        // Jika halaman sampai kosong, samakan ayatnya
        if (!halamanSampai) setAyatSampai(String(pageData.ayatEnd));
      }
      
      if (halamanSampai) {
        const pageEndData = getPageDataByJuz(Number(juz), Number(halamanSampai));
        if (pageEndData) setAyatSampai(String(pageEndData.ayatEnd));
      }
    }
  }, [halamanDari, halamanSampai, juz, inputMode]);

  // B. Jika Surah/Ayat berubah -> Update Halaman
  useEffect(() => {
    if (inputMode === "surah" && juz && surah && ayatDari) {
      const absStart = getHalamanByAyat(Number(surah), Number(ayatDari));
      if (absStart) {
        const { start: juzStartPage } = require("@/lib/mushaf-madinah").getPagesForJuz(Number(juz));
        setHalamanDari(String(absStart - juzStartPage + 1));
      }

      if (ayatSampai) {
        const absEnd = getHalamanByAyat(Number(surah), Number(ayatSampai));
        if (absEnd) {
          const { start: juzStartPage } = require("@/lib/mushaf-madinah").getPagesForJuz(Number(juz));
          setHalamanSampai(String(absEnd - juzStartPage + 1));
        }
      }
    }
  }, [surah, ayatDari, ayatSampai, juz, inputMode]);

  const handleSave = () => {
    if (!date || !juz || !surah || !status) {
      toast.error("Mohon lengkapi data");
      return;
    }

    const payload = {
      tanggal: date,
      jenis: activeTab === "murojaah" ? "murojaah" : subType || activeTab,
      juz: Number(juz),
      surah: selectedSurah?.name || "",
      surahNumber: Number(surah),
      halaman: `${halamanDari}${halamanSampai ? '-' + halamanSampai : ''}`,
      ayatDari: Number(ayatDari),
      ayatSampai: Number(ayatSampai),
      status,
      catatan
    };

    // Cek Duplikat menggunakan library
    const overlap = checkDuplicateSetoran(payload, existingRecords, santriId, payload.jenis);
    if (overlap) {
      toast.error(`Data tumpang tindih dengan setoran: ${overlap.surahNumber} ayat ${overlap.ayatDari}-${overlap.ayatSampai}`);
      return;
    }

    onSave(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Catatan</DialogTitle>
          <DialogDescription>{santriName} • {date && format(date, "dd MMMM yyyy", { locale: localeId })}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <JuzSelector value={juz} onValueChange={(v) => { setJuz(v); setSurah(""); }} />

          {juz && (
            <div className="flex bg-muted p-1 rounded-md">
              <Button 
                variant={inputMode === "surah" ? "secondary" : "ghost"} 
                className="flex-1 h-8 text-xs" 
                onClick={() => setInputMode("surah")}
              >Input Surah & Ayat</Button>
              <Button 
                variant={inputMode === "halaman" ? "secondary" : "ghost"} 
                className="flex-1 h-8 text-xs" 
                onClick={() => setInputMode("halaman")}
              >Input Halaman</Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Halaman Dari</Label>
              <Input 
                type="number" 
                value={halamanDari} 
                onChange={(e) => setHalamanDari(e.target.value)}
                disabled={inputMode === "surah"} 
                placeholder="1-20"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sampai (Opsional)</Label>
              <Input 
                type="number" 
                value={halamanSampai} 
                onChange={(e) => setHalamanSampai(e.target.value)}
                disabled={inputMode === "surah"} 
                placeholder="20"
              />
            </div>
          </div>

          <div className="p-3 border rounded-lg bg-slate-50/50 space-y-3">
            <div className="space-y-1.5">
              <Label>Surah</Label>
              <Select value={surah} onValueChange={setSurah} disabled={inputMode === "halaman"}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Pilih Surah" /></SelectTrigger>
                <SelectContent>
                  {surahByJuz.map(s => <SelectItem key={s.number} value={String(s.number)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ayat Dari</Label>
                <Input 
                  type="number" 
                  value={ayatDari} 
                  onChange={(e) => setAyatDari(e.target.value)}
                  disabled={inputMode === "halaman"}
                  className="bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ayat Sampai</Label>
                <Input 
                  type="number" 
                  value={ayatSampai} 
                  onChange={(e) => setAyatSampai(e.target.value)}
                  disabled={inputMode === "halaman"}
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Lancar", "Ulangi", "Sakit", "Izin"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Catatan</Label>
            <Textarea 
              value={catatan} 
              onChange={(e) => setCatatan(e.target.value)} 
              placeholder="Tambahkan catatan jika perlu..." 
              className="h-20"
            />
          </div>

          <Button onClick={handleSave} className="w-full">Simpan Data</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}