import { useState, useMemo, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { 
  Unlock, Lock, Save, Trophy, RotateCcw, CheckCircle, AlertCircle 
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { JuzSelector } from "@/components/JuzSelector";
import { 
  getDrillsForJuz, 
  DrillDefinition, 
  formatDrillDescription 
} from "@/lib/drill-data";

const mockSantri = [
  { id: "1", nama: "Muhammad Faiz", nis: "S001", halaqoh: "Halaqoh Al-Azhary" },
  { id: "2", nama: "Fatimah Zahra", nis: "S003", halaqoh: "Halaqoh Al-Furqon" },
  { id: "3", nama: "Aisyah Nur", nis: "S002", halaqoh: "Halaqoh Al-Azhary" },
];

interface AddDrillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (data: any) => void;
  date: Date | null;
  santriName: string;
  initialSantriId?: string;

  // 🔥 Kirim riwayat drill dari parent
  drillHistory: {
    santri: string;
    juz: number;
    level: number;
    status: string;
  }[];
}

const BATAS_LULUS_DRILL = 88;
const BATAS_KESALAHAN_DRILL = 12;

export const AddDrillModal = ({
  open,
  onOpenChange,
  onSuccess,
  date,
  santriName,
  initialSantriId,
  drillHistory = []
}: AddDrillModalProps) => {

  const [selectedSantri, setSelectedSantri] = useState("");
  const [juz, setJuz] = useState("");
  const [level, setLevel] = useState("");
  const [kesalahan, setKesalahan] = useState("0");
  const [catatan, setCatatan] = useState("");

  const drills: DrillDefinition[] = useMemo(
    () => (juz ? getDrillsForJuz(Number(juz)) : []),
    [juz]
  );

  const nilai = Math.max(0, 100 - parseInt(kesalahan || "0"));

  // 🔥 Reset saat modal dibuka
  useEffect(() => {
    if (open) {
      setSelectedSantri(initialSantriId || "");
      setJuz("");
      setLevel("");
      setKesalahan("0");
      setCatatan("");
    }
  }, [open, initialSantriId]);

  // 🔥 Reset level kalau ganti juz
  useEffect(() => {
    setLevel("");
  }, [juz]);

  // 🔒 FUNCTION PENGUNCI LEVEL
  const isDrillUnlocked = (drillNumber: number) => {
    if (!selectedSantri || !juz) return false;

    // Level 1 selalu terbuka
    if (drillNumber === 1) return true;

    const santri = mockSantri.find(s => s.id === selectedSantri);
    if (!santri) return false;

    // Cek apakah level sebelumnya LULUS
    const previousLevelLulus = (drillHistory ?? []).some(d =>
    d.santri === santri.nama &&
    d.juz === Number(juz) &&
    d.level === drillNumber - 1 &&
    d.status === "Lulus"
  );

    return previousLevelLulus;
  };

  const handleSave = (status: "Lulus" | "Mengulang") => {
    if (!date || !selectedSantri || !juz || !level) {
      toast.error("Lengkapi data wajib (*)");
      return;
    }

    const santri = mockSantri.find(s => s.id === selectedSantri);
    const selectedDrill = drills.find(d => d.drillNumber === Number(level));

    onSuccess({
      tanggal: format(date, "dd/MM/yyyy"),
      santri: santri?.nama,
      juz: Number(juz),
      level: Number(level),
      materi: formatDrillDescription(selectedDrill!),
      nilai,
      status,
      catatan
    });

    onOpenChange(false);
  };

  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Drill Hafalan</DialogTitle>
          <DialogDescription>
            {santriName} •{" "}
            {format(date, "EEEE, d MMMM yyyy", { locale: localeId })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">

          {/* Santri - hidden when opened from calendar */}
          {!initialSantriId && (
            <div className="space-y-2">
              <Label>Pilih Santri *</Label>
              <Select value={selectedSantri} onValueChange={setSelectedSantri}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih santri" />
                </SelectTrigger>
                <SelectContent>
                  {mockSantri.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nama} ({s.nis})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <JuzSelector value={juz} onValueChange={setJuz} required />

          {/* 🔥 LEVEL DENGAN PENGUNCI */}
          <div className="space-y-2">
            <Label>Level Drill</Label>
            <Select value={level} onValueChange={setLevel} disabled={!juz}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih level" />
              </SelectTrigger>
              <SelectContent>
                {drills.map(d => {
                  const unlocked = isDrillUnlocked(d.drillNumber);

                  return (
                    <SelectItem
                      key={d.drillNumber}
                      value={String(d.drillNumber)}
                      disabled={!unlocked}
                    >
                      {unlocked ? (
                        <Unlock className="inline w-3 h-3 mr-1" />
                      ) : (
                        <Lock className="inline w-3 h-3 mr-1" />
                      )}
                      Level {d.drillNumber} — {formatDrillDescription(d)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Penilaian */}
          <div className="pt-4 border-t space-y-4">
            <div className="space-y-2">
              <Label>Jumlah Kesalahan *</Label>
              <Input
                type="number"
                value={kesalahan}
                onChange={(e) => setKesalahan(e.target.value)}
              />
            </div>

            <div className="flex justify-between p-3 bg-muted rounded-lg items-center">
              <Label>Nilai Kelancaran</Label>
              <span className={cn(
                "text-xl font-bold",
                nilai >= BATAS_LULUS_DRILL
                  ? "text-green-600"
                  : "text-destructive"
              )}>
                {nilai}
              </span>
            </div>

            <Card className={cn(
              "p-3 border-2",
              nilai >= BATAS_LULUS_DRILL
                ? "border-green-500 bg-green-50"
                : "border-destructive bg-destructive/10"
            )}>
              <div className="flex gap-3 items-center text-sm">
                {nilai >= BATAS_LULUS_DRILL ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                )}
                <span>
                  Batas lulus: {BATAS_LULUS_DRILL} | Maks kesalahan: {BATAS_KESALAHAN_DRILL}
                </span>
              </div>
            </Card>

            <div className="space-y-2">
              <Label>Catatan Tajwid</Label>
              <Textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              />
            </div>
          </div>

          {/* Action */}
          <div className="grid grid-cols-3 gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => handleSave("Mengulang")}
            >
              <Save className="w-4 h-4 mr-1" />
              Simpan
            </Button>

            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={nilai < BATAS_LULUS_DRILL}
              onClick={() => handleSave("Lulus")}
            >
              <Trophy className="w-4 h-4 mr-1" />
              Lulus
            </Button>

            <Button
              variant="destructive"
              onClick={() => onOpenChange(false)}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Batal
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};