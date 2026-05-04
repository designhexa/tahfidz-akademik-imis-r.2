-- 1. Add placement fields to santri
ALTER TABLE public.santri
  ADD COLUMN IF NOT EXISTS juz_aktif integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS hafalan_awal_juz integer,
  ADD COLUMN IF NOT EXISTS placement_status text NOT NULL DEFAULT 'belum'
    CHECK (placement_status IN ('belum','terdaftar','lulus','tidak_lulus','tidak_perlu')),
  ADD COLUMN IF NOT EXISTS placement_tanggal date,
  ADD COLUMN IF NOT EXISTS surat_pilihan boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_santri_juz_aktif ON public.santri(juz_aktif);
CREATE INDEX IF NOT EXISTS idx_santri_placement_status ON public.santri(placement_status);

-- 2. Placement / Ujian Tasmi placement log
CREATE TABLE IF NOT EXISTS public.placement_ujian (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_santri uuid NOT NULL,
  juz integer NOT NULL,
  tanggal_daftar date NOT NULL DEFAULT CURRENT_DATE,
  tanggal_ujian date,
  status text NOT NULL DEFAULT 'terdaftar'
    CHECK (status IN ('terdaftar','lulus','tidak_lulus','dibatalkan')),
  catatan text,
  id_penguji uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.placement_ujian ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view placement_ujian"
  ON public.placement_ujian FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Asatidz/Admin/Koordinator can manage placement_ujian"
  ON public.placement_ujian FOR ALL
  USING (
    has_role(auth.uid(), 'Asatidz'::app_role)
    OR has_role(auth.uid(), 'Admin'::app_role)
    OR has_role(auth.uid(), 'Koordinator'::app_role)
  );

CREATE TRIGGER update_placement_ujian_updated_at
  BEFORE UPDATE ON public.placement_ujian
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_placement_ujian_santri ON public.placement_ujian(id_santri);
CREATE INDEX IF NOT EXISTS idx_placement_ujian_status ON public.placement_ujian(status);

-- 3. Trigger: ketika placement_ujian.status -> 'lulus', turunkan juz_aktif santri
--    Aturan: Juz 30 lulus -> 29; Juz 29 -> 28; Juz 28 -> 27; Juz 27 -> 26; Juz 26 -> surat_pilihan = true
CREATE OR REPLACE FUNCTION public.handle_placement_lulus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'lulus')
     OR (TG_OP = 'UPDATE' AND NEW.status = 'lulus' AND OLD.status IS DISTINCT FROM 'lulus') THEN

    IF NEW.juz = 26 THEN
      UPDATE public.santri
        SET surat_pilihan = true,
            placement_status = 'lulus',
            placement_tanggal = COALESCE(NEW.tanggal_ujian, CURRENT_DATE)
      WHERE id = NEW.id_santri;
    ELSIF NEW.juz BETWEEN 27 AND 30 THEN
      UPDATE public.santri
        SET juz_aktif = NEW.juz - 1,
            placement_status = 'lulus',
            placement_tanggal = COALESCE(NEW.tanggal_ujian, CURRENT_DATE)
      WHERE id = NEW.id_santri;
    END IF;

  ELSIF (TG_OP = 'UPDATE' AND NEW.status = 'tidak_lulus' AND OLD.status IS DISTINCT FROM 'tidak_lulus')
        OR (TG_OP = 'INSERT' AND NEW.status = 'tidak_lulus') THEN
    UPDATE public.santri
      SET placement_status = 'tidak_lulus'
    WHERE id = NEW.id_santri;
  ELSIF (TG_OP = 'INSERT' AND NEW.status = 'terdaftar') THEN
    UPDATE public.santri
      SET placement_status = 'terdaftar'
    WHERE id = NEW.id_santri;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_placement_lulus ON public.placement_ujian;
CREATE TRIGGER trg_placement_lulus
  AFTER INSERT OR UPDATE ON public.placement_ujian
  FOR EACH ROW EXECUTE FUNCTION public.handle_placement_lulus();

-- 4. Validasi: setoran hanya boleh untuk juz_aktif santri (atau juz_aktif - permitted history)
--    Kita gunakan trigger BEFORE INSERT / UPDATE pada setoran.
--    Kebijakan: juz setoran HARUS == santri.juz_aktif. Admin bypass dengan role check.
CREATE OR REPLACE FUNCTION public.validate_setoran_juz()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_juz_aktif integer;
BEGIN
  SELECT juz_aktif INTO v_juz_aktif FROM public.santri WHERE id = NEW.id_santri;
  IF v_juz_aktif IS NULL THEN
    RETURN NEW; -- santri belum punya placement, biarkan
  END IF;
  IF NEW.juz <> v_juz_aktif AND NOT has_role(auth.uid(), 'Admin'::app_role) THEN
    RAISE EXCEPTION 'Setoran juz % tidak diizinkan. Santri sedang menempuh juz %.', NEW.juz, v_juz_aktif
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_setoran_juz ON public.setoran;
CREATE TRIGGER trg_validate_setoran_juz
  BEFORE INSERT OR UPDATE ON public.setoran
  FOR EACH ROW EXECUTE FUNCTION public.validate_setoran_juz();