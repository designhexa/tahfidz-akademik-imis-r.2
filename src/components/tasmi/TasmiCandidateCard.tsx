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
  const [isGenerating, setIsGenerating] = useState(false);

  const [customDate, setCustomDate] = useState(
    format(scheduledDate, "yyyy-MM-dd")
  );

  const [customCaption, setCustomCaption] = useState(
`"Sesungguhnya Allah mengangkat dengan kitab Al-Qur'an ini beberapa kaum dan juga dengan kitab Al-Qur'an ini Allah merendahkan yang lainnya."

(HR. Muslim)`
  );

  const handleDownloadImage = async () => {
    if (!printRef.current) return;

    setIsGenerating(true);

    try {
      await document.fonts.ready;

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        letterRendering: true
      });

      const link = document.createElement("a");
      link.download = `jadwal-tasmi-${format(new Date(customDate),"yyyy-MM-dd")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.success("Gambar berhasil diunduh!");
    } catch (error) {
      toast.error("Gagal generate gambar");
    } finally {
      setIsGenerating(false);
    }
  };

  const formattedDate = format(
    new Date(customDate),
    "EEEE, d MMMM yyyy",
    { locale: id }
  );

  return (
<div className="space-y-4">

<Card>
<CardHeader className="pb-3">
<CardTitle className="text-base flex items-center gap-2">
<Image className="w-4 h-4"/>
Generate Gambar Jadwal Tasmi'
</CardTitle>
</CardHeader>

<CardContent className="space-y-4">

<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

<div className="space-y-2">
<Label>Tanggal Ujian</Label>
<Input
type="date"
value={customDate}
onChange={(e)=>setCustomDate(e.target.value)}
/>
</div>

</div>

<div className="space-y-2">
<Label>Caption</Label>
<Textarea
rows={4}
value={customCaption}
onChange={(e)=>setCustomCaption(e.target.value)}
/>
</div>

<Button
onClick={handleDownloadImage}
disabled={isGenerating || candidates.length===0}
className="w-full"
>
<Download className="w-4 h-4 mr-2"/>
{isGenerating ? "Generating..." : "Download Gambar"}
</Button>

</CardContent>
</Card>


{/* PREVIEW */}

<div className="overflow-auto border rounded-lg bg-muted/50 p-4">

<div
ref={printRef}
className="w-[1080px] min-h-[1080px] mx-auto relative overflow-hidden"
style={{
background:"linear-gradient(135deg,#e8f5e9 0%,#f5f5f5 50%,#e3f2fd 100%)",
fontFamily:"Poppins"
}}
>

<div
className="absolute inset-0"
style={{
backgroundImage:`url(${gedungImis})`,
backgroundSize:"cover",
backgroundPosition:"center",
opacity:0.08
}}
/>


<div className="relative z-10 p-8 flex flex-col items-center">


<img
src={logoImis}
className="w-32 h-32 object-contain mb-4"
/>


<h1
className="text-4xl font-bold text-green-800 mb-2"
style={{fontFamily:"serif"}}
>
Jadwal Sertifikasi Hafalan
</h1>

<div className="text-xl text-gray-700 mb-6">
{formattedDate}
</div>


{/* TABLE */}

<div className="w-full max-w-4xl bg-white/90 rounded-lg overflow-hidden shadow-xl">

<table
className="w-full"
style={{borderCollapse:"collapse"}}
>

<thead>

<tr style={{background:"#16a34a"}}>

<th style={{padding:"14px",color:"white",border:"1px solid #ccc"}}>No</th>
<th style={{padding:"14px",color:"white",border:"1px solid #ccc"}}>Nama Lengkap</th>
<th style={{padding:"14px",color:"white",border:"1px solid #ccc"}}>Kelas</th>
<th style={{padding:"14px",color:"white",border:"1px solid #ccc"}}>Jumlah Hafalan</th>
<th style={{padding:"14px",color:"white",border:"1px solid #ccc"}}>Juz yang Diujikan</th>

</tr>

</thead>


<tbody>

{candidates.map((c,i)=>(
<tr key={c.no} style={{background:i%2?"#f0fdf4":"#dcfce7"}}>

<td style={{padding:"14px",textAlign:"center",border:"1px solid #ccc"}}>
{c.no}
</td>

<td style={{padding:"14px",border:"1px solid #ccc"}}>
{c.nama}
</td>

<td style={{padding:"14px",textAlign:"center",border:"1px solid #ccc"}}>
{c.kelas}
</td>

<td style={{padding:"14px",textAlign:"center",border:"1px solid #ccc"}}>
{c.jumlahHafalan}
</td>

<td style={{padding:"14px",textAlign:"center",border:"1px solid #ccc",fontWeight:600,color:"#15803d"}}>
{c.juzDiujikan}
</td>

</tr>
))}

</tbody>
</table>

</div>


{/* QUOTE */}

<div
style={{
marginTop:"40px",
maxWidth:"760px",
textAlign:"center",
whiteSpace:"pre-wrap",
fontStyle:"italic",
fontSize:"20px",
color:"#374151",
lineHeight:"34px"
}}
>
{customCaption}
</div>


{/* FOOTER STABIL UNTUK HTML2CANVAS */}

<div style={{marginTop:"40px"}}>

<div
style={{
border:"2px solid #6B7280",
borderRadius:"9999px",
padding:"12px 28px",
display:"inline-block",
fontSize:"20px",
fontWeight:600,
color:"#374151"
}}
>

<span style={{verticalAlign:"middle"}}>

<span style={{display:"inline-block",verticalAlign:"middle",marginRight:"8px"}}>
<Globe size={18}/>
</span>

<span style={{verticalAlign:"middle",lineHeight:"32px"}}>
www.imis.sch.id
</span>

<span style={{margin:"0 18px"}}>|</span>

<span style={{display:"inline-block",verticalAlign:"middle",marginRight:"6px"}}>
<Youtube size={18}/>
</span>

<span style={{display:"inline-block",verticalAlign:"middle",marginRight:"6px"}}>
<Instagram size={18}/>
</span>

<span style={{display:"inline-block",verticalAlign:"middle",marginRight:"10px"}}>
<Facebook size={18}/>
</span>

<span style={{verticalAlign:"middle",lineHeight:"32px"}}>
imammuslimislamicschool
</span>

</span>

</div>

</div>


</div>
</div>
</div>
</div>
</div>
);
};

export default TasmiCandidateCard;