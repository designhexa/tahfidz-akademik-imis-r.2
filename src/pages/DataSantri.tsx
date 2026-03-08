import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import {
  MOCK_SANTRI,
  MOCK_HALAQOH,
  MOCK_KELAS,
  MOCK_WALI,
  getKelasNama,
  getHalaqohNama,
  getWaliNama,
  MockSantri,
} from "@/lib/mock-data";
import { toast } from "sonner";

const INITIAL_FORM: Omit<MockSantri, "id"> = {
  nis: "",
  nisn: "",
  nama: "",
  idKelas: "",
  idHalaqoh: "",
  idWali: "",
  tanggalMasuk: new Date().toISOString().split("T")[0],
  status: "Aktif",
  jilidSaatIni: 1,
  halamanSaatIni: 1,
  posisiHafalanJuz: 30,
  posisiHafalanSurah: "",
  pencapaianHafalan: "0 Juz",
};

export default function DataSantri() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterHalaqoh, setFilterHalaqoh] = useState("all");
  const [filterKelas, setFilterKelas] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const filteredSantri = MOCK_SANTRI.filter((santri) => {
    const matchSearch = santri.nama.toLowerCase().includes(search.toLowerCase()) ||
      santri.nis.toLowerCase().includes(search.toLowerCase());
    const matchHalaqoh = filterHalaqoh === "all" || santri.idHalaqoh === filterHalaqoh;
    const matchKelas = filterKelas === "all" || santri.idKelas === filterKelas;
    return matchSearch && matchHalaqoh && matchKelas;
  });

  const handleSubmit = () => {
    if (!form.nama || !form.nis || !form.idKelas || !form.idHalaqoh) {
      toast.error("Mohon lengkapi data wajib (NIS, Nama, Kelas, Halaqoh)");
      return;
    }
    const newSantri: MockSantri = {
      ...form,
      id: `s${Date.now()}`,
    };
    MOCK_SANTRI.push(newSantri);
    toast.success(`Santri ${form.nama} berhasil ditambahkan`);
    setForm(INITIAL_FORM);
    setShowModal(false);
  };

  const getTilawahLabel = (santri: MockSantri) => {
    if (santri.jilidSaatIni >= 7) return "Al-Qur'an";
    return `Jilid ${santri.jilidSaatIni}`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Data Santri</h1>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Santri
          </Button>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari santri..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterHalaqoh} onValueChange={setFilterHalaqoh}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Semua Halaqoh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Halaqoh</SelectItem>
                {MOCK_HALAQOH.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterKelas} onValueChange={setFilterKelas}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {MOCK_KELAS.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.nama_kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">NIS</TableHead>
                  <TableHead className="text-muted-foreground">Nama Santri</TableHead>
                  <TableHead className="text-muted-foreground">Halaqoh</TableHead>
                  <TableHead className="text-muted-foreground">Kelas</TableHead>
                  <TableHead className="text-muted-foreground">Posisi Tilawah</TableHead>
                  <TableHead className="text-muted-foreground">Posisi Hafalan</TableHead>
                  <TableHead className="text-muted-foreground">Pencapaian</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSantri.map((santri) => (
                  <TableRow key={santri.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/santri/${santri.id}`)}>
                    <TableCell className="font-medium">{santri.nis}</TableCell>
                    <TableCell className="text-primary font-medium">{santri.nama}</TableCell>
                    <TableCell className="text-primary">{getHalaqohNama(santri.idHalaqoh)}</TableCell>
                    <TableCell>{getKelasNama(santri.idKelas)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getTilawahLabel(santri)} - Hal {santri.halamanSaatIni}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        Juz {santri.posisiHafalanJuz} - {santri.posisiHafalanSurah || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {santri.pencapaianHafalan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                        {santri.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(`/santri/${santri.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Modal Tambah Santri */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Santri Baru</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NIS *</Label>
                <Input value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} placeholder="Masukkan NIS" />
              </div>
              <div className="space-y-2">
                <Label>NISN</Label>
                <Input value={form.nisn} onChange={(e) => setForm({ ...form, nisn: e.target.value })} placeholder="Masukkan NISN" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nama Santri *</Label>
              <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama lengkap santri" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kelas *</Label>
                <Select value={form.idKelas} onValueChange={(v) => setForm({ ...form, idKelas: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                  <SelectContent>
                    {MOCK_KELAS.map((k) => (
                      <SelectItem key={k.id} value={k.id}>{k.nama_kelas}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Halaqoh *</Label>
                <Select value={form.idHalaqoh} onValueChange={(v) => setForm({ ...form, idHalaqoh: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih Halaqoh" /></SelectTrigger>
                  <SelectContent>
                    {MOCK_HALAQOH.map((h) => (
                      <SelectItem key={h.id} value={h.id}>{h.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Wali Santri</Label>
                <Select value={form.idWali} onValueChange={(v) => setForm({ ...form, idWali: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih Wali" /></SelectTrigger>
                  <SelectContent>
                    {MOCK_WALI.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Masuk</Label>
                <Input type="date" value={form.tanggalMasuk} onChange={(e) => setForm({ ...form, tanggalMasuk: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jilid Tilawah Saat Ini</Label>
                <Select value={String(form.jilidSaatIni)} onValueChange={(v) => setForm({ ...form, jilidSaatIni: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <SelectItem key={j} value={String(j)}>Jilid {j}</SelectItem>
                    ))}
                    <SelectItem value="7">Al-Qur'an</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Halaman Saat Ini</Label>
                <Input type="number" min={1} value={form.halamanSaatIni} onChange={(e) => setForm({ ...form, halamanSaatIni: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
            <Button onClick={handleSubmit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
