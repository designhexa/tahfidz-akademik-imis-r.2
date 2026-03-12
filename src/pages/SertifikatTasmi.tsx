import { useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import logoImis from "@/assets/logo-imis.png";
import kopSurat from "@/assets/kop-surat-imis.png";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Image, Award, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

interface CertificateData {
  nama: string;
  kelas: string;
  nis: string;
  jumlahHafalan: string;
  juzLulus: string;
  predikat: string;
}

const predikatOptions = ["Mumtaz (Istimewa)", "Jayyid Jiddan (Sangat Baik)", "Jayyid (Baik)", "Maqbul (Cukup)"];

export default function SertifikatTasmi() {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [tanggalUjian, setTanggalUjian] = useState(format(new Date(), "yyyy-MM-dd"));
  const [nomorSertifikat, setNomorSertifikat] = useState("001/IMIS/TASMI/2026");
  const [namaKepalaSekolah, setNamaKepalaSekolah] = useState("Ustadz Ahmad Fauzi, S.Pd.I");
  const [namaKoordinator, setNamaKoordinator] = useState("Ustadz Muhammad Rizki, S.Q.");

  const [data, setData] = useState<CertificateData>({
    nama: "",
    kelas: "",
    nis: "",
    jumlahHafalan: "",
    juzLulus: "",
    predikat: predikatOptions[0],
  });

  const formattedDate = format(new Date(tanggalUjian), "d MMMM yyyy", { locale: idLocale });

  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    if (!data.nama) {
      toast.error("Nama santri harus diisi");
      return;
    }

    setIsGenerating(true);
    try {
      const fonts = (document as any).fonts as FontFaceSet | undefined;
      if (fonts?.ready) await fonts.ready;
      await new Promise((r) => setTimeout(r, 150));

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `sertifikat-tasmi-${data.nama.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.success("Sertifikat berhasil diunduh!");
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.error("Gagal generate sertifikat");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Sertifikat Lulus Ujian Tasmi'
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate sertifikat kelulusan sertifikasi hafalan Al-Qur'an
          </p>
        </div>

        {/* Form Input */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="w-4 h-4" />
              Data Sertifikat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Santri</Label>
                <Input
                  value={data.nama}
                  onChange={(e) => setData({ ...data, nama: e.target.value })}
                  placeholder="Masukkan nama santri"
                />
              </div>
              <div className="space-y-2">
                <Label>NIS</Label>
                <Input
                  value={data.nis}
                  onChange={(e) => setData({ ...data, nis: e.target.value })}
                  placeholder="Nomor Induk Santri"
                />
              </div>
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Input
                  value={data.kelas}
                  onChange={(e) => setData({ ...data, kelas: e.target.value })}
                  placeholder="Contoh: 7A"
                />
              </div>
              <div className="space-y-2">
                <Label>Jumlah Hafalan</Label>
                <Input
                  value={data.jumlahHafalan}
                  onChange={(e) => setData({ ...data, jumlahHafalan: e.target.value })}
                  placeholder="Contoh: 5 Juz"
                />
              </div>
              <div className="space-y-2">
                <Label>Juz yang Lulus Diujikan</Label>
                <Input
                  value={data.juzLulus}
                  onChange={(e) => setData({ ...data, juzLulus: e.target.value })}
                  placeholder="Contoh: Juz 1 - 5"
                />
              </div>
              <div className="space-y-2">
                <Label>Predikat</Label>
                <Select value={data.predikat} onValueChange={(v) => setData({ ...data, predikat: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {predikatOptions.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Informasi Tambahan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nomor Sertifikat</Label>
                  <Input
                    value={nomorSertifikat}
                    onChange={(e) => setNomorSertifikat(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Ujian</Label>
                  <Input
                    type="date"
                    value={tanggalUjian}
                    onChange={(e) => setTanggalUjian(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nama Kepala Sekolah</Label>
                  <Input
                    value={namaKepalaSekolah}
                    onChange={(e) => setNamaKepalaSekolah(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nama Koordinator Tahfidz</Label>
                  <Input
                    value={namaKoordinator}
                    onChange={(e) => setNamaKoordinator(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleDownloadImage}
              disabled={isGenerating || !data.nama}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Download Sertifikat"}
            </Button>
          </CardContent>
        </Card>

        {/* Certificate Preview */}
        <div className="overflow-auto border rounded-lg bg-muted/50 p-4">
          <div
            ref={printRef}
            style={{
              width: "1120px",
              minHeight: "800px",
              backgroundColor: "#ffffff",
              fontFamily: "'Times New Roman', serif",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative border */}
            <div style={{
              position: "absolute",
              inset: "12px",
              border: "3px solid #15803d",
              borderRadius: "4px",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute",
              inset: "18px",
              border: "1px solid #15803d",
              borderRadius: "2px",
              pointerEvents: "none",
            }} />

            {/* Content */}
            <div style={{ padding: "40px 60px", position: "relative", zIndex: 1 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "8px" }}>
                <img src={logoImis} alt="Logo IMIS" style={{ width: "90px", height: "90px", objectFit: "contain" }} />
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: "13px", color: "#374151", letterSpacing: "1px" }}>YAYASAN IMAM MUSLIM</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "#15803d", letterSpacing: "2px", marginTop: "2px" }}>
                    PKBM IMAM MUSLIM ISLAMIC SCHOOL
                  </div>
                  <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>
                    Jl. Raya Cibeureum No. 222, Kota Tasikmalaya, Jawa Barat 46196
                  </div>
                  <div style={{ fontSize: "11px", color: "#6B7280" }}>
                    Telp: (0265) 123456 | Email: info@imis.sch.id | www.imis.sch.id
                  </div>
                </div>
                <div style={{ width: "90px" }} />
              </div>

              {/* Divider */}
              <div style={{ borderBottom: "3px double #15803d", marginBottom: "24px" }} />

              {/* Title */}
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#15803d",
                  letterSpacing: "4px",
                  textTransform: "uppercase",
                }}>
                  SERTIFIKAT
                </div>
                <div style={{ fontSize: "16px", color: "#374151", marginTop: "4px", letterSpacing: "2px" }}>
                  KELULUSAN SERTIFIKASI HAFALAN AL-QUR'AN
                </div>
                <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "8px" }}>
                  No: {nomorSertifikat}
                </div>
              </div>

              {/* Body */}
              <div style={{ fontSize: "15px", color: "#1F2937", lineHeight: "2", maxWidth: "900px", margin: "0 auto" }}>
                <p style={{ textAlign: "center", marginBottom: "16px" }}>
                  Diberikan kepada:
                </p>

                {/* Name highlight */}
                <div style={{
                  textAlign: "center",
                  margin: "16px 0",
                  padding: "12px 0",
                  borderBottom: "2px solid #15803d",
                }}>
                  <div style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    color: "#15803d",
                    fontFamily: "'Times New Roman', serif",
                  }}>
                    {data.nama || "Nama Santri"}
                  </div>
                </div>

                {/* Details table */}
                <table style={{ margin: "16px auto", borderCollapse: "collapse", fontSize: "15px" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "4px 16px 4px 0", color: "#374151" }}>NIS</td>
                      <td style={{ padding: "4px 8px" }}>:</td>
                      <td style={{ padding: "4px 0", fontWeight: 600 }}>{data.nis || "-"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 16px 4px 0", color: "#374151" }}>Kelas</td>
                      <td style={{ padding: "4px 8px" }}>:</td>
                      <td style={{ padding: "4px 0", fontWeight: 600 }}>{data.kelas || "-"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 16px 4px 0", color: "#374151" }}>Jumlah Hafalan</td>
                      <td style={{ padding: "4px 8px" }}>:</td>
                      <td style={{ padding: "4px 0", fontWeight: 600 }}>{data.jumlahHafalan || "-"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 16px 4px 0", color: "#374151" }}>Juz yang Diujikan</td>
                      <td style={{ padding: "4px 8px" }}>:</td>
                      <td style={{ padding: "4px 0", fontWeight: 600 }}>{data.juzLulus || "-"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 16px 4px 0", color: "#374151" }}>Predikat</td>
                      <td style={{ padding: "4px 8px" }}>:</td>
                      <td style={{ padding: "4px 0", fontWeight: "bold", color: "#15803d" }}>{data.predikat}</td>
                    </tr>
                  </tbody>
                </table>

                <p style={{ textAlign: "center", marginTop: "16px", fontSize: "14px", color: "#374151" }}>
                  Telah dinyatakan <strong style={{ color: "#15803d" }}>LULUS</strong> dalam Ujian Sertifikasi Hafalan Al-Qur'an (Tasmi')
                  <br />yang diselenggarakan pada tanggal <strong>{formattedDate}</strong>
                </p>
              </div>

              {/* Signatures */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "40px",
                padding: "0 40px",
              }}>
                <div style={{ textAlign: "center", width: "260px" }}>
                  <div style={{ fontSize: "13px", color: "#374151" }}>Koordinator Tahfidz</div>
                  <div style={{ height: "70px" }} />
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1F2937", borderBottom: "1px solid #374151", paddingBottom: "4px" }}>
                    {namaKoordinator}
                  </div>
                </div>
                <div style={{ textAlign: "center", width: "260px" }}>
                  <div style={{ fontSize: "13px", color: "#374151" }}>Kepala Sekolah</div>
                  <div style={{ height: "70px" }} />
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1F2937", borderBottom: "1px solid #374151", paddingBottom: "4px" }}>
                    {namaKepalaSekolah}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ textAlign: "center", marginTop: "24px", fontSize: "11px", color: "#9CA3AF" }}>
                Tasikmalaya, {formattedDate}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
