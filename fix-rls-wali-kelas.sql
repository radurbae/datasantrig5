-- FIX: Update RLS Policy untuk Role Wali Kelas
-- Jalankan SQL ini di Supabase SQL Editor

-- STEP 1: Cek dulu detail policy yang ada (jalankan ini dulu)
SELECT 
    tablename, 
    policyname, 
    cmd,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename IN ('raport_mental', 'prestasi_santri', 'catatan_santri');


-- STEP 2: DROP policy lama dan CREATE policy baru
-- Uncomment dan jalankan setelah melihat hasil STEP 1

-- RAPORT_MENTAL

DROP POLICY IF EXISTS "raport_insert" ON raport_mental;
DROP POLICY IF EXISTS "raport_update" ON raport_mental;
DROP POLICY IF EXISTS "raport_delete" ON raport_mental;
DROP POLICY IF EXISTS "raport_select" ON raport_mental;

-- INSERT: Admin dan Wali Kelas bisa insert
CREATE POLICY "raport_insert" ON raport_mental
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'wali_kelas')
  )
);

-- UPDATE: Admin dan Wali Kelas bisa update
CREATE POLICY "raport_update" ON raport_mental
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'wali_kelas')
  )
);

-- DELETE: Hanya Admin yang bisa delete
CREATE POLICY "raport_delete" ON raport_mental
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- SELECT: Semua user authenticated bisa select
CREATE POLICY "raport_select" ON raport_mental
FOR SELECT
USING (auth.uid() IS NOT NULL);


-- PRESTASI_SANTRI

DROP POLICY IF EXISTS "prestasi_insert" ON prestasi_santri;
DROP POLICY IF EXISTS "prestasi_update" ON prestasi_santri;
DROP POLICY IF EXISTS "prestasi_delete" ON prestasi_santri;
DROP POLICY IF EXISTS "prestasi_select" ON prestasi_santri;

-- INSERT: Admin dan Wali Kelas bisa insert
CREATE POLICY "prestasi_insert" ON prestasi_santri
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'wali_kelas')
  )
);

-- UPDATE: Admin dan Wali Kelas bisa update
CREATE POLICY "prestasi_update" ON prestasi_santri
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'wali_kelas')
  )
);

-- DELETE: Admin dan Wali Kelas bisa delete
CREATE POLICY "prestasi_delete" ON prestasi_santri
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'wali_kelas')
  )
);

-- SELECT: Semua user authenticated bisa select
CREATE POLICY "prestasi_select" ON prestasi_santri
FOR SELECT
USING (auth.uid() IS NOT NULL);


-- CATATAN_SANTRI

DROP POLICY IF EXISTS "catatan_insert" ON catatan_santri;
DROP POLICY IF EXISTS "catatan_update" ON catatan_santri;
DROP POLICY IF EXISTS "catatan_delete" ON catatan_santri;
DROP POLICY IF EXISTS "catatan_select" ON catatan_santri;

-- INSERT: Admin dan Wali Kelas bisa insert
CREATE POLICY "catatan_insert" ON catatan_santri
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'wali_kelas')
  )
);

-- UPDATE: Admin dan Wali Kelas bisa update
CREATE POLICY "catatan_update" ON catatan_santri
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'wali_kelas')
  )
);

-- DELETE: Admin dan Wali Kelas bisa delete
CREATE POLICY "catatan_delete" ON catatan_santri
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'wali_kelas')
  )
);

-- SELECT: Semua user authenticated bisa select
CREATE POLICY "catatan_select" ON catatan_santri
FOR SELECT
USING (auth.uid() IS NOT NULL);


-- STEP 3: Verifikasi policy baru sudah benar
SELECT 
    tablename, 
    policyname, 
    cmd,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename IN ('raport_mental', 'prestasi_santri', 'catatan_santri')
ORDER BY tablename, cmd;
