import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MOCK_SANTRI_TILAWAH, 
  TILAWATI_JILID,
  HALAMAN_PER_JILID,
  getAspekPenilaianByJilid 
} from "@/lib/tilawah-data";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TilawahSetoranFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newData: any) => void;
  initialSantriId?: string;
  date: Date | null;
  santriName: string;
}

export const TilawahSetoranForm = ({ 
  open, 
  onOpenChange, 
  onSuccess,
  initialSantriId,
  date, 
  santriName
}: TilawahSetoranFormProps) => {
  
  // --- Form States ---
  const [selectedSantri, setSelectedSantri] = useState("");
  const [selectedJilid, setSelectedJilid] = useState("");
  const [selectedJuz, setSelectedJuz] = useState("");
  const [alquranMode, setAlquranMode] = useState<"juz" | "surah">("juz");
  const [selectedSurah, setSelectedSurah] = useState("");
  const [ayatDari, setAyatDari] = useState("");
  const [ayatSampai, setAyatSampai] = useState("");
  const [halamanDari, setHalamanDari] = useState("");
  const [halamanSampai, setHalamanSampai] = useState("");
  const [scores, setScores] = useState({
    tartil: "",
    fashohah: "",
    tajwid: "",
    ghorib: ""
  });
  const [status, setStatus] = useState<"selesai" | "lanjut" | "ulang">("lanjut");
  const [catatan, setCatatan] = useState("");

  // Auto-fill jika dibuka dari halaman profil santri tertentu
  useEffect(() => {
    if (open) {
      if (initialSantriId) {
        setSelectedSantri(initialSantriId);
        // Cari jilid terakhir santri tersebut secara otomatis jika perlu
        const santri = MOCK_SANTRI_TILAWAH.find(s => s.id === initialSantriId);
        if (santri) setSelectedJilid(santri.jilidSaatIni.toString());
      } else {
        resetForm();
      }
    }
  }, [open, initialSantriId]);

  const resetForm = () => {
    setSelectedSantri("");
    setSelectedJilid("");
    setHalamanDari("");
    setHalamanSampai("");
    setScores({ tartil: "", fashohah: "", tajwid: "", ghorib: "" });
    setStatus("lanjut");
    setCatatan("");
  };

  const aspekPenilaian = selectedJilid ? getAspekPenilaianByJilid(parseInt(selectedJilid)) : [];

  const handleProcessSubmit = () => {
    if (
      !selectedSantri ||
      !selectedJilid ||
      (selectedJilid === "7" && !selectedJuz) ||
      !halamanDari ||
      !halamanSampai
    ) {
      toast.error("Mohon lengkapi data setoran utama (Santri, Jilid, & Halaman)");
      return;
    }

    // Hitung rata-rata nilai yang diisi
    const activeScores = Object.values(scores).filter(v => v !== "").map(v => parseFloat(v));
    const rataRata = activeScores.length > 0 
      ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
      : 0;

    const finalData = {
      id: `set-${Date.now()}`,
      idSantri: selectedSantri,
      jilid: parseInt(selectedJilid),
      juz: selectedJilid === "7" ? parseInt(selectedJuz) : null,
      halamanDari: parseInt(halamanDari),
      halamanSampai: parseInt(halamanSampai),
      status,
      nilaiRataRata: rataRata,
      catatan,
      tanggal: new Date().toISOString()
    };

    onSuccess(finalData);
    toast.success("Setoran tilawah berhasil disimpan");
    onOpenChange(false);
  };

  if (!date) return null;
<<<<<<< HEAD
    
=======

>>>>>>> c11e06d13fb81acd1bc22d611ab60d46404da77a
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Tambah Setoran Tilawah
          </DialogTitle>
          <DialogDescription>
            {santriName} •{" "}
            {format(date, "EEEE, d MMMM yyyy", { locale: localeId })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Baris 1: Santri */}
          <div className="space-y-2 hidden">
            <Label>Pilih Santri</Label>
            <Select value={selectedSantri} onValueChange={setSelectedSantri} disabled={!!initialSantriId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih santri..." />
              </SelectTrigger>
              <SelectContent>
                {MOCK_SANTRI_TILAWAH.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nama} - {s.kelas} (Jilid {s.jilidSaatIni})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">

          {/* JILID */}
          <div className="space-y-2">
            <Label>Jilid</Label>
            <Select
              value={selectedJilid}
              onValueChange={(value) => {
                setSelectedJilid(value);
                setSelectedJuz("");
                setSelectedSurah("");
                setHalamanDari("");
                setHalamanSampai("");
                setAyatDari("");
                setAyatSampai("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Jilid..." />
              </SelectTrigger>
              <SelectContent>
                {TILAWATI_JILID.map((j) => (
                  <SelectItem key={j.jilid} value={j.jilid.toString()}>
                    Jilid {j.jilid}
                  </SelectItem>
                ))}
                <SelectItem value="7">Al-Qur'an</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ===================== */}
          {/* JILID 1-6 */}
          {/* ===================== */}
          {selectedJilid !== "7" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Halaman Dari</Label>
                <Input
                  type="number"
                  value={halamanDari}
                  onChange={(e) => setHalamanDari(e.target.value)}
                />
              </div>
              <div>
                <Label>Sampai</Label>
                <Input
                  type="number"
                  value={halamanSampai}
                  onChange={(e) => setHalamanSampai(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ===================== */}
          {/* AL-QUR'AN */}
          {/* ===================== */}
          {selectedJilid === "7" && (
            <div className="space-y-4">

              {/* ================= TAB MODE ================= */}
              <Tabs value={alquranMode} onValueChange={(v: any) => setAlquranMode(v)}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="juz">Per Juz</TabsTrigger>
                  <TabsTrigger value="surah">Per Surah</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* ================= MODE JUZ ================= */}
              {alquranMode === "juz" && (
                <>
                  <div className="space-y-2">
                    <Label>Pilih Juz</Label>

                    <div className="grid grid-cols-6 gap-2">
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                        <Button
                          key={juz}
                          type="button"
                          variant={selectedJuz === String(juz) ? "default" : "outline"}
                          className="h-10 text-sm"
                          onClick={() => setSelectedJuz(String(juz))}
                        >
                          {juz}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {selectedJuz && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label>Halaman Dari</Label>
                        <Input
                          type="number"
                          value={halamanDari}
                          onChange={(e) => setHalamanDari(e.target.value)}
                          min={1}
                          max={20}
                        />
                      </div>

                      <div>
                        <Label>Sampai</Label>
                        <Input
                          type="number"
                          value={halamanSampai}
                          onChange={(e) => setHalamanSampai(e.target.value)}
                          min={1}
                          max={20}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ================= MODE SURAH ================= */}
              {alquranMode === "surah" && (
                <>
                  <div className="space-y-2">
                    <Label>Pilih Surah</Label>

                    <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                      {Array.from({ length: 114 }, (_, i) => i + 1).map((surah) => (
                        <Button
                          key={surah}
                          type="button"
                          variant={selectedSurah === String(surah) ? "default" : "outline"}
                          className="h-10 text-xs"
                          onClick={() => setSelectedSurah(String(surah))}
                        >
                          {surah}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {selectedSurah && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label>Ayat Dari</Label>
                        <Input
                          type="number"
                          value={ayatDari}
                          onChange={(e) => setAyatDari(e.target.value)}
                          min={1}
                        />
                      </div>

                      <div>
                        <Label>Sampai</Label>
                        <Input
                          type="number"
                          value={ayatSampai}
                          onChange={(e) => setAyatSampai(e.target.value)}
                          min={1}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

<<<<<<< HEAD
                {/* Info halaman otomatis */}
                {pageInfo && (
                  <div className="flex items-start gap-2 p-2 mt-2 bg-primary/10 rounded text-xs">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                    <span>
                      Isi halaman: <strong>{pageInfo}</strong>
                    </span>
                  </div>
                )}
              </>
            )}
          </>
        )}
        </div>

          {/* Card Penilaian Adaptif */}
          <Card className="bg-muted/30">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Penilaian Jilid {selectedJilid || '...'}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Tartil (0-100)</Label>
                <Input type="number" value={scores.tartil} onChange={(e) => setScores({...scores, tartil: e.target.value})} placeholder="85" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fashohah (0-100)</Label>
                <Input type="number" value={scores.fashohah} onChange={(e) => setScores({...scores, fashohah: e.target.value})} placeholder="85" />
              </div>
              {aspekPenilaian.includes("tajwid_dasar") && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Tajwid (0-100)</Label>
                  <Input type="number" value={scores.tajwid} onChange={(e) => setScores({...scores, tajwid: e.target.value})} placeholder="80" />
                </div>
              )}
              {aspekPenilaian.includes("ghorib") && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Ghorib (0-100)</Label>
                  <Input type="number" value={scores.ghorib} onChange={(e) => setScores({...scores, ghorib: e.target.value})} placeholder="75" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status & Catatan */}
          <div className="space-y-2">
            <Label>Status Progres</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lanjut">Lanjut ke Halaman Berikutnya</SelectItem>
                <SelectItem value="ulang">Ulang Materi Ini</SelectItem>
                <SelectItem value="selesai">Selesai Jilid (Siap Ujian)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Catatan Ustadz/ah</Label>
            <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Contoh: Perbaiki dengung di hukum Nun Mati..." rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button onClick={handleProcessSubmit} className="px-6">Simpan Setoran</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};