import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Image, Calendar } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

interface TasmiCandidate {
  no: number;
  nama: string;
  kelas: string;
  jumlahHafalan: string;
  juzDiujikan: string;
}

interface TasmiCandidateCardProps {
  candidates: TasmiCandidate[];
  schoolName?: string;
  schoolLogo?: string;
  scheduledDate?: Date;
  onGenerate?: () => void;
}

export const TasmiCandidateCard = ({
  candidates,
  schoolName = "PKBM Imam Muslim Islamic School",
  scheduledDate = new Date(),
}: TasmiCandidateCardProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customDate, setCustomDate] = useState<string>(format(scheduledDate, "yyyy-MM-dd"));
  const [customSchoolName, setCustomSchoolName] = useState(schoolName);
  const [customCaption, setCustomCaption] = useState(
    "\"Sesungguhnya Allah mengangkat dengan kitab Al-Qur'an ini beberapa kaum dan juga dengan kitab Al-Qur'an ini Allah merendahkan yang lainnya.\"\n\n(HR. Muslim)"
  );

  const colorSchemes: Record<string, { rows: [string, string]; header: string; headerBorder: string }> = {
    "hijau": { rows: ["#DCFCE7", "#F0FDF4"], header: "linear-gradient(to right, #15803d, #16a34a)", headerBorder: "rgba(34,197,94,0.5)" },
    "biru": { rows: ["#DBEAFE", "#EFF6FF"], header: "linear-gradient(to right, #1d4ed8, #2563eb)", headerBorder: "rgba(59,130,246,0.5)" },
    "kuning": { rows: ["#FEF3C7", "#FFFBEB"], header: "linear-gradient(to right, #a16207, #ca8a04)", headerBorder: "rgba(234,179,8,0.5)" },
    "ungu": { rows: ["#E9D5FF", "#FAF5FF"], header: "linear-gradient(to right, #7e22ce, #9333ea)", headerBorder: "rgba(168,85,247,0.5)" },
    "merah-muda": { rows: ["#FBCFE8", "#FDF2F8"], header: "linear-gradient(to right, #be185d, #db2777)", headerBorder: "rgba(236,72,153,0.5)" },
    "oranye": { rows: ["#FED7AA", "#FFF7ED"], header: "linear-gradient(to right, #c2410c, #ea580c)", headerBorder: "rgba(249,115,22,0.5)" },
    "abu-abu": { rows: ["#E5E7EB", "#F3F4F6"], header: "linear-gradient(to right, #374151, #4b5563)", headerBorder: "rgba(107,114,128,0.5)" },
  };

  const [selectedColor, setSelectedColor] = useState("hijau");

  const getRowColor = (index: number) => {
    const scheme = colorSchemes[selectedColor] || colorSchemes["hijau"];
    return scheme.rows[index % 2];
  };

  const currentScheme = colorSchemes[selectedColor] || colorSchemes["hijau"];

  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      
      const link = document.createElement("a");
      link.download = `jadwal-tasmi-${format(new Date(customDate), "yyyy-MM-dd")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("Gambar berhasil diunduh!");
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Gagal generate gambar");
    } finally {
      setIsGenerating(false);
    }
  };

  const formattedDate = format(new Date(customDate), "EEEE, d MMMM yyyy", { locale: id });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="w-4 h-4" />
            Generate Gambar Jadwal Tasmi'
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Sekolah</Label>
              <Input
                value={customSchoolName}
                onChange={(e) => setCustomSchoolName(e.target.value)}
                placeholder="Nama sekolah"
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Ujian</Label>
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Caption / Quote (Bawah Tabel)</Label>
            <Textarea
              value={customCaption}
              onChange={(e) => setCustomCaption(e.target.value)}
              placeholder="Masukkan caption atau quote hafalan..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Warna Baris Tabel</Label>
            <Select value={selectedColor} onValueChange={setSelectedColor}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih warna" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(colorSchemes).map((key) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border" style={{ backgroundColor: colorSchemes[key][1] }} />
                      <span className="capitalize">{key.replace("-", " ")}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleDownloadImage}
            disabled={isGenerating || candidates.length === 0}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "Download Gambar"}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <div className="overflow-auto border rounded-lg bg-muted/50 p-4">
        <div
          ref={printRef}
          className="w-[1080px] min-h-[1080px] mx-auto relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #e8f5e9 0%, #f5f5f5 50%, #e3f2fd 100%)",
          }}
        >
          {/* Background Pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23166534' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Content Container */}
          <div className="relative z-10 p-8 flex flex-col items-center">
            {/* Logo */}
            <div className="mb-4">
              <img 
                src="/assets/logo-imis.png" 
                alt="Logo IMIS" 
                className="w-32 h-32 object-contain"
                onError={(e) => {
                  // Fallback if image not found
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-green-800 mb-2" style={{ fontFamily: "serif" }}>
              Jadwal Sertifikasi Hafalan
            </h1>
            <div className="flex items-center gap-2 text-xl text-gray-700 mb-6">
              <Calendar className="w-5 h-5" />
              {formattedDate}
            </div>

            {/* Table */}
            <div className="w-full max-w-4xl bg-white/80 rounded-lg overflow-hidden shadow-xl border-2 border-green-600/30">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-green-700 to-green-600 text-white">
                    <th className="py-3 px-4 text-center font-semibold border-r border-green-500/50 w-16">No.</th>
                    <th className="py-3 px-4 text-center font-semibold border-r border-green-500/50">Nama Lengkap</th>
                    <th className="py-3 px-4 text-center font-semibold border-r border-green-500/50 w-20">Kelas</th>
                    <th className="py-3 px-4 text-center font-semibold border-r border-green-500/50 w-28">Jumlah Hafalan</th>
                    <th className="py-3 px-4 text-center font-semibold w-44">Juz yang Diujikan</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate, index) => (
                    <tr
                      key={candidate.no}
                      style={{ backgroundColor: getRowColor(index) }}
                    >
                      <td className="py-3 px-4 text-center border-r border-gray-200 font-medium">
                        {candidate.no}
                      </td>
                      <td className="py-3 px-4 border-r border-gray-200 font-medium text-gray-800">
                        {candidate.nama}
                      </td>
                      <td className="py-3 px-4 text-center border-r border-gray-200">
                        {candidate.kelas}
                      </td>
                      <td className="py-3 px-4 text-center border-r border-gray-200">
                        {candidate.jumlahHafalan}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-green-700">
                        {candidate.juzDiujikan}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quote */}
            <div className="mt-8 max-w-3xl text-center whitespace-pre-wrap">
              <p className="text-gray-700 italic text-lg leading-relaxed font-medium">
                {customCaption}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 flex items-center justify-center gap-8 text-gray-600">
              <div className="flex items-center gap-2 px-6 py-2 bg-white/80 rounded-full shadow">
                <span className="text-xl">🌐</span>
                <span className="font-medium">www.imis.sch.id</span>
              </div>
              <div className="flex items-center gap-2 px-6 py-2 bg-white/80 rounded-full shadow">
                <span className="text-xl">📱</span>
                <span className="font-medium">@imammuslimislamicschool</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasmiCandidateCard;
