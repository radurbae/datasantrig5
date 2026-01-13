# Database Santri - Sistem Manajemen Data Santri

Sistem manajemen data santri untuk pondok pesantren dengan menggunakan Supabase sebagai database backend.

## 🚀 Fitur

- ✅ Input/Edit data santri
- ✅ Daftar santri dengan tampilan ringkasan (Nama, Kelas, Daerah, Status)
- ✅ Halaman detail lengkap untuk setiap santri
- ✅ Pencarian dan filter data
- ✅ Database Supabase (PostgreSQL)

## 📋 Struktur Data

Data santri memiliki field berikut:
- **Nomor Stambuk** (wajib)
- **Nama** (wajib)
- **Ayah** (wajib)
- **Tempat dan Tanggal Lahir**
- **Daerah** (wajib)
- **Status** (wajib: Aktif, Mutasi Keluar, Istirahat, Skorsing, Pindah Kampus, Dikeluarkan)
- **Kelas** (wajib)
- **No Absen**
- **Asrama**
- **Konsulat**

## 🛠️ Setup Supabase

### 1. Buat Project di Supabase

1. Buka [https://app.supabase.com](https://app.supabase.com)
2. Buat akun atau login
3. Klik "New Project"
4. Isi informasi project:
   - **Name**: Database Santri (atau nama sesuai keinginan)
   - **Database Password**: Buat password yang kuat
   - **Region**: Pilih region terdekat (misalnya: Southeast Asia (Singapore))
5. Klik "Create new project" dan tunggu proses setup selesai (sekitar 2 menit)

### 2. Buat Table di Supabase

1. Setelah project dibuat, buka **SQL Editor** di sidebar kiri
2. Klik "New Query"
3. Copy dan paste SQL berikut:

```sql
-- Buat table santri
CREATE TABLE IF NOT EXISTS santri (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nomor_stambuk TEXT,
    nama TEXT NOT NULL,
    ayah TEXT NOT NULL,
    tempat_lahir TEXT,
    tanggal_lahir DATE,
    daerah TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aktif',
    kelas TEXT NOT NULL,
    no_absen INTEGER,
    asrama TEXT,
    konsulat TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat index untuk pencarian yang lebih cepat
CREATE INDEX IF NOT EXISTS idx_santri_nama ON santri(nama);
CREATE INDEX IF NOT EXISTS idx_santri_kelas ON santri(kelas);
CREATE INDEX IF NOT EXISTS idx_santri_daerah ON santri(daerah);
CREATE INDEX IF NOT EXISTS idx_santri_status ON santri(status);

-- Buat function untuk update updated_at otomatis
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Buat trigger untuk update updated_at
CREATE TRIGGER update_santri_updated_at
    BEFORE UPDATE ON santri
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - opsional, sesuaikan dengan kebutuhan
-- ALTER TABLE santri ENABLE ROW LEVEL SECURITY;

-- Buat policy untuk allow all operations (untuk development)
-- Sesuaikan dengan kebutuhan security Anda
-- CREATE POLICY "Allow all operations" ON santri
--     FOR ALL
--     USING (true)
--     WITH CHECK (true);
```

4. Klik "Run" untuk menjalankan query
5. Pastikan tidak ada error

### 3. Dapatkan API Keys

1. Buka **Settings** (ikon gear) di sidebar kiri
2. Pilih **API**
3. Di bagian **Project API keys**, copy:
   - **Project URL** (Contoh: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (Contoh: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 4. Konfigurasi di Aplikasi

1. Buka file `config.js`
2. Jangan commit key ke repo. Setel di runtime, misalnya pada halaman HTML sebelum `config.js`:

```html
<script>
  window.__SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
  window.__SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';
</script>
```

Jika perlu, pakai `.env` dan injeksikan saat build/deploy (Vite, Netlify env, dsb). Untuk GitHub Pages (`https://radurbae.github.io/datasantrig5`), simpan snippet di file terpisah (mis. `env.js` yang tidak di-commit) dan load sebelum `config.js`.

Contoh:
```javascript
const SUPABASE_CONFIG = {
    url: window.__SUPABASE_URL,
    anonKey: window.__SUPABASE_ANON_KEY
};
```

### 5. Setup Login (Email + Password) dan Role

1. Buat tabel `profiles` di Supabase:

```sql
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

2. Aktifkan RLS di `profiles` dan `santri`, lalu tambahkan policy berikut:

```sql
-- Profiles: user boleh melihat profil sendiri
CREATE POLICY "Profiles are viewable by owner"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Profiles: admin boleh update role (opsional)
CREATE POLICY "Admins can update roles"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Santri: semua user login boleh lihat
CREATE POLICY "Santri are viewable by authenticated users"
ON santri FOR SELECT
USING (auth.role() = 'authenticated');

-- Santri: hanya admin boleh insert/update/delete
CREATE POLICY "Admins can insert santri"
ON santri FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can update santri"
ON santri FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can delete santri"
ON santri FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
```

3. Setelah membuat user di Supabase Auth, isi tabel `profiles` dengan role `admin` atau `user`.

### 6. Setup Row Level Security (Opsional)

## 🧠 Raport Mental Santri

Tambahkan tabel raport mental dengan SQL berikut:

```sql
CREATE TABLE IF NOT EXISTS raport_mental (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  santri_id UUID REFERENCES santri(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  kepondokmodernan_score INTEGER,
  kepondokmodernan_note TEXT,
  dedikasi_score INTEGER,
  dedikasi_note TEXT,
  kedewasaan_score INTEGER,
  kedewasaan_note TEXT,
  inisiatif_score INTEGER,
  inisiatif_note TEXT,
  komunikasi_score INTEGER,
  komunikasi_note TEXT,
  daya_tanggap_score INTEGER,
  daya_tanggap_note TEXT,
  ketaatan_score INTEGER,
  ketaatan_note TEXT,
  bacaan_quran_score INTEGER,
  bacaan_quran_note TEXT,
  kepemimpinan_score INTEGER,
  kepemimpinan_note TEXT,
  motivasi_score INTEGER,
  motivasi_note TEXT,
  kesehatan_score INTEGER,
  kesehatan_note TEXT,
  disiplin_score INTEGER,
  disiplin_note TEXT,
  ibadah_score INTEGER,
  ibadah_note TEXT,
  sopan_santun_score INTEGER,
  sopan_santun_note TEXT,
  kesegeraan_score INTEGER,
  kesegeraan_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS raport_mental_unique
ON raport_mental (santri_id, month);
```

## 🏆 Prestasi Santri

Tambahkan tabel prestasi dengan SQL berikut:

```sql
CREATE TABLE IF NOT EXISTS prestasi_santri (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  santri_id UUID REFERENCES santri(id) ON DELETE CASCADE NOT NULL,
  nama_kegiatan TEXT NOT NULL,
  keterangan TEXT NOT NULL,
  kategori_kegiatan TEXT NOT NULL,
  tahun_ajaran TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Tambahkan policy RLS untuk tabel `prestasi_santri`:

```sql
ALTER TABLE prestasi_santri ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prestasi viewable by authenticated users"
ON prestasi_santri FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert prestasi"
ON prestasi_santri FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can update prestasi"
ON prestasi_santri FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can delete prestasi"
ON prestasi_santri FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
```

## 🗒️ Catatan Santri

Tambahkan tabel catatan dengan SQL berikut:

```sql
CREATE TABLE IF NOT EXISTS catatan_santri (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  santri_id UUID REFERENCES santri(id) ON DELETE CASCADE NOT NULL,
  kategori TEXT NOT NULL,
  sub_kategori TEXT NOT NULL,
  keterangan TEXT NOT NULL,
  tahun_ajaran TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Tambahkan policy RLS untuk tabel `catatan_santri`:

```sql
ALTER TABLE catatan_santri ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catatan viewable by authenticated users"
ON catatan_santri FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert catatan"
ON catatan_santri FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can update catatan"
ON catatan_santri FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can delete catatan"
ON catatan_santri FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
```

## ⚙️ Master Data Catatan & Prestasi

Tambahkan tabel master data berikut:

```sql
CREATE TABLE IF NOT EXISTS catatan_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catatan_subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES catatan_categories(id) ON DELETE CASCADE NOT NULL,
  group_name TEXT,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catatan_keterangan_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES catatan_categories(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prestasi_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prestasi_keterangan_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prestasi_kegiatan_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Tambahkan policy RLS untuk master data:

```sql
ALTER TABLE catatan_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE catatan_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE catatan_keterangan_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestasi_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestasi_keterangan_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestasi_kegiatan_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catatan categories viewable by authenticated users"
ON catatan_categories FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Catatan subcategories viewable by authenticated users"
ON catatan_subcategories FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Catatan keterangan viewable by authenticated users"
ON catatan_keterangan_options FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Prestasi categories viewable by authenticated users"
ON prestasi_categories FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Prestasi keterangan viewable by authenticated users"
ON prestasi_keterangan_options FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Prestasi kegiatan viewable by authenticated users"
ON prestasi_kegiatan_options FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage catatan categories"
ON catatan_categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins manage catatan subcategories"
ON catatan_subcategories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins manage catatan keterangan"
ON catatan_keterangan_options FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins manage prestasi categories"
ON prestasi_categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins manage prestasi keterangan"
ON prestasi_keterangan_options FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins manage prestasi kegiatan"
ON prestasi_kegiatan_options FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
```

Seed awal (opsional):

```sql
INSERT INTO catatan_categories (name) VALUES
('OPPM'), ('KGGP'), ('Instansi'), ('KMI'), ('Kepanitiaan')
ON CONFLICT DO NOTHING;

INSERT INTO prestasi_categories (name) VALUES
('OPPM'), ('KGGP'), ('Instansi'), ('KMI'), ('Antar Kampus')
ON CONFLICT DO NOTHING;

INSERT INTO prestasi_keterangan_options (label) VALUES
('Juara 1'), ('Juara 2'), ('Juara 3'), ('Harapan 1'), ('Harapan 2'), ('Harapan 3'), ('Pengikut')
ON CONFLICT DO NOTHING;

INSERT INTO prestasi_kegiatan_options (label) VALUES
('Lomba Pidato'), ('Lomba Kaligrafi'), ('Olimpiade Bahasa')
ON CONFLICT DO NOTHING;
```
Tambahkan policy RLS untuk tabel `raport_mental`:

```sql
ALTER TABLE raport_mental ENABLE ROW LEVEL SECURITY;

-- Semua user login boleh lihat
CREATE POLICY "Raport viewable by authenticated users"
ON raport_mental FOR SELECT
USING (auth.role() = 'authenticated');

-- Hanya admin boleh insert/update/delete
CREATE POLICY "Admins can insert raport"
ON raport_mental FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can update raport"
ON raport_mental FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins can delete raport"
ON raport_mental FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
```

Jika Anda ingin mengaktifkan Row Level Security (RLS) untuk keamanan:

1. Di SQL Editor, uncomment bagian policy di SQL query di atas
2. Atau buat policy khusus sesuai kebutuhan Anda

Untuk development/testing, Anda bisa disable RLS terlebih dahulu:
```sql
ALTER TABLE santri DISABLE ROW LEVEL SECURITY;
```

## 📁 Struktur File

```
belajar/
├── index.html          # Halaman utama
├── form.html           # Form input/edit santri
├── form.js             # Logic form
├── list.html           # Daftar santri
├── list.js             # Logic list & filter
├── detail.html         # Halaman detail santri
├── detail.js           # Logic detail page
├── config.js           # Konfigurasi Supabase
├── db.js               # Database service layer
├── style.css           # Styling
└── README.md           # Dokumentasi ini
```

## 🔧 Cara Menggunakan

### 1. Setup Supabase
Ikuti langkah-langkah di atas untuk setup Supabase

### 2. Buka Aplikasi
- Buka file `index.html` di browser
- Atau gunakan local server (misalnya: `python -m http.server` atau `npx serve`)

### 3. Input Data
- Klik "Input Data" di menu navigasi
- Isi form dengan data santri
- Klik "Tambah Data" untuk menyimpan

### 4. Lihat Daftar
- Klik "List Data" di menu navigasi
- Gunakan search box untuk mencari santri
- Gunakan filter untuk memfilter berdasarkan Kelas, Daerah, atau Status
- Klik "Detail" untuk melihat biodata lengkap

### 5. Edit/Hapus Data
- Dari list, klik "Edit" untuk mengubah data
- Dari list atau detail, klik "Hapus" untuk menghapus data

## 🔒 Keamanan

- **Anon Key**: Key ini aman digunakan di client-side, namun tidak memiliki akses langsung ke data tanpa policy
- **Row Level Security**: Aktifkan RLS dan buat policy sesuai kebutuhan untuk keamanan data
- **Service Role Key**: JANGAN pernah expose service role key di client-side, gunakan hanya di backend

## 🔐 Login

- Buka `login.html` untuk masuk.
- Role `admin` dapat menambah, edit, dan hapus data.
- Role `user` hanya bisa melihat data.
- Setelah login, halaman awal diarahkan ke `overview.html`.

## 📝 Catatan

- Pastikan Anda sudah mengisi `config.js` dengan benar sebelum menggunakan aplikasi
- Jika terjadi error "Supabase belum dikonfigurasi", pastikan URL dan API Key sudah diisi di `config.js`
- Data akan tersimpan di Supabase database dan bisa diakses dari mana saja selama terhubung internet

## 🐛 Troubleshooting

### Error: "Supabase belum dikonfigurasi"
- Pastikan Anda sudah mengisi `SUPABASE_CONFIG` di `config.js`
- Pastikan URL dan API Key benar (copy dari Supabase dashboard)

### Error: "relation 'santri' does not exist"
- Pastikan Anda sudah membuat table dengan SQL query yang disediakan
- Pastikan nama table adalah `santri` (lowercase)

### Error: "new row violates row-level security policy"
- Disable RLS untuk testing: `ALTER TABLE santri DISABLE ROW LEVEL SECURITY;`
- Atau buat policy yang sesuai untuk allow operations

### Data tidak muncul setelah diinput
- Cek browser console untuk melihat error
- Pastikan koneksi internet stabil
- Cek di Supabase dashboard apakah data sudah masuk ke table

## 📚 Referensi

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 📄 License

Project ini untuk keperluan edukasi dan penggunaan internal.
