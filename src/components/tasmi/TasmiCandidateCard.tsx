import { useRef, useState } from "react";
import logoImis from "@/assets/logo-imis.png";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Image, Globe, Youtube, Instagram, Facebook } from "lucide-react";
import gedungImis from "@/assets/gedung-imis.jpeg";
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
  scheduledDate?: Date;
}

export const TasmiCandidateCard = ({
  candidates,
  schoolName = "PKBM Imam Muslim Islamic School",
  scheduledDate = new Date(),
}: TasmiCandidateCardProps) => {

  const printRef = useRef<HTMLDivElement>(null);

  const [customDate, setCustomDate] = useState(format(scheduledDate, "yyyy-MM-dd"));
  const [customCaption, setCustomCaption] = useState(
    `"Sesungguhnya Allah mengangkat dengan kitab Al-Qur'an ini beberapa kaum dan juga dengan kitab Al-Qur'an ini Allah merendahkan yang lainnya."

(HR. Muslim)`
  );

  const [isGenerating, setIsGenerating] = useState(false);

  const colorSchemes: Record<string, { rows: [string, string]; header: string }> = {
    hijau: {
      rows: ["#DCFCE7", "#F0FDF4"],
      header: "linear-gradient(to right, #15803d, #16a34a)"
    },
    biru: {
      rows: ["#DBEAFE", "#EFF6FF"],
      header: "linear-gradient(to right, #1d4ed8, #2563eb)"
    },
    kuning: {
      rows: ["#FEF3C7", "#FFFBEB"],
      header: "linear-gradient(to right, #a16207, #ca8a04)"
    }
  };

  const [selectedColor, setSelectedColor] = useState("hijau");

  const scheme = colorSchemes[selectedColor];

  const getRowColor = (i: number) => scheme.rows[i % 2];

  const formattedDate = format(new Date(customDate), "EEEE, d MMMM yyyy", { locale: id });

  const handleDownloadImage = async () => {

    if (!printRef.current) return;

    setIsGenerating(true);

    try {

      await document.fonts.ready;

      const canvas = await html2canvas(printRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });

      const link = document.createElement("a");

      link.download = `jadwal-tasmi-${customDate}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.success("Gambar berhasil diunduh");

    } catch (err) {

      toast.error("Gagal generate gambar");
      console.error(err);

    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">

      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center text-base">
            <Image className="w-4 h-4"/>
            Generate Gambar Jadwal
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          <div className="grid grid-cols-2 gap-4">

            <div>
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={customDate}
                onChange={(e)=>setCustomDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Warna</Label>

              <Select value={selectedColor} onValueChange={setSelectedColor}>
                <SelectTrigger>
                  <SelectValue/>
                </SelectTrigger>

                <SelectContent>
                  {Object.keys(colorSchemes).map((key)=>(
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>

          </div>

          <div>
            <Label>Caption</Label>

            <Textarea
              rows={4}
              value={customCaption}
              onChange={(e)=>setCustomCaption(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleDownloadImage}
            disabled={isGenerating}
          >
            <Download className="w-4 h-4 mr-2"/>
            {isGenerating ? "Generating..." : "Download PNG"}
          </Button>

        </CardContent>
      </Card>

      {/* PREVIEW */}

      <div className="border rounded-lg p-4 bg-muted/40 overflow-auto">

        <div
          ref={printRef}
          className="w-[1080px] min-h-[1080px] relative overflow-hidden"
          style={{
            fontFamily: "Poppins, sans-serif",
            background: "linear-gradient(135deg,#e8f5e9,#f5f5f5,#e3f2fd)"
          }}
        >

          {/* Background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:`url(${gedungImis})`,
              backgroundSize:"cover",
              opacity:0.08
            }}
          />

          <div className="relative z-10 p-10 flex flex-col items-center">

            <img src={logoImis} className="w-28 mb-4"/>

            <h1 className="text-4xl font-bold text-green-800 mb-2" style={{fontFamily:"serif"}}>
              Jadwal Sertifikasi Hafalan
            </h1>

            <div className="text-xl mb-6 text-gray-700">{formattedDate}</div>


            {/* FLEX TABLE */}

            <div className="w-full max-w-4xl rounded-xl overflow-hidden shadow-xl border border-gray-700">

              {/* header */}

              <div
                className="grid items-center text-white font-semibold text-center"
                style={{
                  gridTemplateColumns:"80px 1fr 100px 150px 180px",
                  background:scheme.header
                }}
              >
                <div className="py-3 border-r border-gray-500">No</div>
                <div className="py-3 border-r border-gray-500">Nama Lengkap</div>
                <div className="py-3 border-r border-gray-500">Kelas</div>
                <div className="py-3 border-r border-gray-500">Jumlah Hafalan</div>
                <div className="py-3">Juz yang Diujikan</div>
              </div>


              {/* rows */}

              {candidates.map((c,i)=>(
                <div
                  key={c.no}
                  className="grid items-center text-center text-gray-800"
                  style={{
                    gridTemplateColumns:"80px 1fr 100px 150px 180px",
                    background:getRowColor(i)
                  }}
                >

                  <div className="py-3 border-r border-gray-400">{c.no}</div>

                  <div className="py-3 border-r border-gray-400 text-left px-4 font-medium">
                    {c.nama}
                  </div>

                  <div className="py-3 border-r border-gray-400">{c.kelas}</div>

                  <div className="py-3 border-r border-gray-400">{c.jumlahHafalan}</div>

                  <div className="py-3 text-green-700 font-semibold">
                    {c.juzDiujikan}
                  </div>

                </div>
              ))}

            </div>


            {/* Quote */}

            <div className="mt-10 max-w-3xl text-center whitespace-pre-wrap">

              <p className="italic text-lg text-gray-700 leading-relaxed">
                {customCaption}
              </p>

            </div>


            {/* Footer */}

            <div className="mt-8 flex gap-6 flex-wrap justify-center">

              <div className="flex items-center gap-2 px-5 py-2 bg-white rounded-xl shadow border">
                <Globe className="w-5 h-5 text-green-700"/>
                <span className="text-sm font-semibold text-gray-700">
                  www.imis.sch.id
                </span>
              </div>

              <div className="flex items-center gap-3 px-5 py-2 bg-white rounded-xl shadow border">

                <Youtube className="w-5 h-5 text-red-600"/>
                <Instagram className="w-5 h-5 text-pink-600"/>
                <Facebook className="w-5 h-5 text-blue-600"/>

                <span className="text-sm font-semibold text-gray-700">
                  imammuslimislamicschool
                </span>

              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default TasmiCandidateCard;