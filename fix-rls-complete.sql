-- FIX LENGKAP: RLS Policy untuk Role Wali Kelas
-- Jalankan SQL ini di Supabase SQL Editor
-- PASTIKAN JALANKAN STEP BY STEP!


-- STEP 0: DEBUG - Cek apakah wali_kelas sudah ada di profiles
-- Jalankan ini DULU untuk memastikan role tersimpan benar!

-- Cek semua user beserta role nya
SELECT id, role, wali_kelas, created_at 
FROM profiles 
ORDER BY created_at DESC;

-- Jika wali_kelas tidak terlihat, mungkin ada masalah dengan trigger atau data


-- STEP 1: Cek RLS sudah diaktifkan

SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('raport_mental', 'prestasi_santri', 'catatan_santri', 'profiles');


-- STEP 2: Cek policy yang ada saat ini

SELECT 
    tablename, 
    policyname, 
    cmd,
    permissive,
    roles,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename IN ('raport_mental', 'prestasi_santri', 'catatan_santri', 'profiles')
ORDER BY tablename, cmd;


-- STEP 3: Pastikan RLS Enabled

ALTER TABLE raport_mental ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestasi_santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE catatan_santri ENABLE ROW LEVEL SECURITY;


-- STEP 4: DROP semua policy lama

-- RAPORT_MENTAL
DROP POLICY IF EXISTS "raport_insert" ON raport_mental;
DROP POLICY IF EXISTS "raport_update" ON raport_mental;
DROP POLICY IF EXISTS "raport_delete" ON raport_mental;
DROP POLICY IF EXISTS "raport_select" ON raport_mental;
DROP POLICY IF EXISTS "raport_mental_insert" ON raport_mental;
DROP POLICY IF EXISTS "raport_mental_update" ON raport_mental;
DROP POLICY IF EXISTS "raport_mental_delete" ON raport_mental;
DROP POLICY IF EXISTS "raport_mental_select" ON raport_mental;
DROP POLICY IF EXISTS "Allow admin insert" ON raport_mental;
DROP POLICY IF EXISTS "Allow admin update" ON raport_mental;
DROP POLICY IF EXISTS "Allow admin delete" ON raport_mental;
DROP POLICY IF EXISTS "Allow authenticated select" ON raport_mental;

-- PRESTASI_SANTRI
DROP POLICY IF EXISTS "prestasi_insert" ON prestasi_santri;
DROP POLICY IF EXISTS "prestasi_update" ON prestasi_santri;
DROP POLICY IF EXISTS "prestasi_delete" ON prestasi_santri;
DROP POLICY IF EXISTS "prestasi_select" ON prestasi_santri;
DROP POLICY IF EXISTS "prestasi_santri_insert" ON prestasi_santri;
DROP POLICY IF EXISTS "prestasi_santri_update" ON prestasi_santri;
DROP POLICY IF EXISTS "prestasi_santri_delete" ON prestasi_santri;
DROP POLICY IF EXISTS "prestasi_santri_select" ON prestasi_santri;
DROP POLICY IF EXISTS "Allow admin insert" ON prestasi_santri;
DROP POLICY IF EXISTS "Allow admin update" ON prestasi_santri;
DROP POLICY IF EXISTS "Allow admin delete" ON prestasi_santri;
DROP POLICY IF EXISTS "Allow authenticated select" ON prestasi_santri;

-- CATATAN_SANTRI
DROP POLICY IF EXISTS "catatan_insert" ON catatan_santri;
DROP POLICY IF EXISTS "catatan_update" ON catatan_santri;
DROP POLICY IF EXISTS "catatan_delete" ON catatan_santri;
DROP POLICY IF EXISTS "catatan_select" ON catatan_santri;
DROP POLICY IF EXISTS "catatan_santri_insert" ON catatan_santri;
DROP POLICY IF EXISTS "catatan_santri_update" ON catatan_santri;
DROP POLICY IF EXISTS "catatan_santri_delete" ON catatan_santri;
DROP POLICY IF EXISTS "catatan_santri_select" ON catatan_santri;
DROP POLICY IF EXISTS "Allow admin insert" ON catatan_santri;
DROP POLICY IF EXISTS "Allow admin update" ON catatan_santri;
DROP POLICY IF EXISTS "Allow admin delete" ON catatan_santri;
DROP POLICY IF EXISTS "Allow authenticated select" ON catatan_santri;


-- STEP 5: CREATE policy baru dengan role yang benar
-- KUNCINYA: Role 'wali_kelas' harus EXACT MATCH!

-- RAPORT_MENTAL

-- INSERT: Admin dan Wali Kelas bisa insert
CREATE POLICY "raport_mental_insert" ON raport_mental
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'wali_kelas')
  )
);

-- UPDATE: Admin dan Wali Kelas bisa update
CREATE POLICY "raport_mental_update" ON raport_mental
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'wali_kelas')
  )
);

-- DELETE: Hanya Admin yang bisa delete
CREATE POLICY "raport_mental_delete" ON raport_mental
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- SELECT: Semua authenticated user bisa select
CREATE POLICY "raport_mental_select" ON raport_mental
FOR SELECT TO authenticated
USING (true);


-- PRESTASI_SANTRI

-- INSERT: Admin dan Wali Kelas bisa insert
CREATE POLICY "prestasi_santri_insert" ON prestasi_santri
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'wali_kelas')
  )
);

-- UPDATE: Admin dan Wali Kelas bisa update
CREATE POLICY "prestasi_santri_update" ON prestasi_santri
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'wali_kelas')
  )
);

-- DELETE: Admin dan Wali Kelas bisa delete
CREATE POLICY "prestasi_santri_delete" ON prestasi_santri
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'wali_kelas')
  )
);

-- SELECT: Semua authenticated user bisa select
CREATE POLICY "prestasi_santri_select" ON prestasi_santri
FOR SELECT TO authenticated
USING (true);


-- CATATAN_SANTRI

-- INSERT: Admin dan Wali Kelas bisa insert
CREATE POLICY "catatan_santri_insert" ON catatan_santri
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'wali_kelas')
  )
);

-- UPDATE: Admin dan Wali Kelas bisa update
CREATE POLICY "catatan_santri_update" ON catatan_santri
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'wali_kelas')
  )
);

-- DELETE: Admin dan Wali Kelas bisa delete
CREATE POLICY "catatan_santri_delete" ON catatan_santri
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'wali_kelas')
  )
);

-- SELECT: Semua authenticated user bisa select
CREATE POLICY "catatan_santri_select" ON catatan_santri
FOR SELECT TO authenticated
USING (true);


-- STEP 6: PENTING! Pastikan profiles table punya policy SELECT
-- Jika profiles tidak bisa di-select, policy di atas tidak akan bekerja!

-- DROP existing policies jika ada
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;

-- Enable RLS pada profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles SELECT: User bisa melihat profile sendiri ATAU semua profile bisa dilihat untuk check role
CREATE POLICY "profiles_select" ON profiles
FOR SELECT TO authenticated
USING (true);

-- Profiles INSERT: User bisa insert profile sendiri
CREATE POLICY "profiles_insert" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Profiles UPDATE: User hanya bisa update profile sendiri
CREATE POLICY "profiles_update" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);


-- STEP 7: Verifikasi policy baru

SELECT 
    tablename, 
    policyname, 
    cmd,
    permissive,
    roles,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename IN ('raport_mental', 'prestasi_santri', 'catatan_santri', 'profiles')
ORDER BY tablename, cmd;


-- STEP 8: TEST dengan user wali_kelas (ganti ID sesuai user!)

-- Test: Cek apakah user tertentu punya role wali_kelas
-- SELECT id, role, wali_kelas FROM profiles WHERE role = 'wali_kelas';

-- Jika masih tidak bisa, coba test dengan RPC function:
-- Buat function untuk test
CREATE OR REPLACE FUNCTION test_can_insert_raport()
RETURNS TABLE(user_id uuid, user_role text, can_insert boolean) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_id,
    (SELECT role FROM profiles WHERE id = auth.uid()) as user_role,
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'wali_kelas')
    ) as can_insert;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Panggil function ini dari client untuk test
-- SELECT * FROM test_can_insert_raport();
