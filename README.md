# Database Santri

Sistem manajemen data santri berbasis Supabase dengan fitur lengkap untuk input, monitoring, dan laporan. Deploy saat ini: `https://radurbae.github.io/datasantrig5`.

## Fitur Utama
- **Autentikasi & Role**: Login email/password. Admin bisa CRUD + download; user hanya bisa melihat. Tombol download dan form input otomatis tersembunyi untuk user biasa.
- **Overview**: Ringkasan jumlah santri per status (default hanya santri aktif), ringkasan lanjutan per angkatan/kelas/konsulat (urut alfabet), ulang tahun hari ini, dan ulang tahun selanjutnya (hanya santri aktif, tidak menampilkan yang sudah lewat bulan ini).
- **Manajemen Santri**: Form input/edit santri (status, kelas, konsulat, dll). Daftar santri dengan pagination 50 item per halaman, sorting kelas + no absen, filter default status aktif, pencarian, dan detail biodata.
- **Raport Mental**: 15 kategori penilaian berbobot, input per santri per bulan (dikunci bulan berjalan), bisa dicicil per kategori. Predikat per kategori dan total (Baik/Sedang/Kurang), filter bulan untuk melihat rekap sebelumnya, export Excel per kelas/semua. Hanya santri aktif yang tampil.
- **Prestasi**: Input prestasi (pilih santri searchable, nama kegiatan dari master, kategori, keterangan opsional, tahun ajaran hijriah terkunci). Listing per santri (20 item + search/filter), detail, edit, hapus (admin), export Excel. Hanya santri aktif yang tampil.
- **Catatan**: Input catatan (kategori, sub kategori, keterangan opsional, tahun ajaran hijriah terkunci) dengan sub kategori dinamis per kategori. Listing per santri (20 item + search/filter), detail biodata + catatan, edit, hapus (admin). Hanya santri aktif yang tampil.
- **Master Data (Admin)**: Master Prestasi (kategori, keterangan, nama kegiatan) dan Master Catatan (kategori, sub kategori per jenis, keterangan) dengan CRUD dan konfirmasi simpan.
- **UI/UX**: Sidebar modern (Plus Jakarta Sans), collapsible di mobile, landing setelah login ke overview. Konfirmasi “Apakah data sudah benar?” sebelum simpan, alert hasil simpan, tombol download hijau, header tabel biru, badge predikat total berwarna (merah/kuning/hijau).

## Konfigurasi Supabase
- Set `window.__SUPABASE_URL` dan `window.__SUPABASE_ANON_KEY` di `env.js` (dimuat sebelum `config.js`). `config.js` punya fallback anon key publik agar halaman tidak gagal jika env belum ada, tapi gunakan env saat produksi.
- Jangan pernah mengekspos service role key di front-end. Aktifkan RLS dan policy sesuai role jika dipakai di produksi.

## Halaman & Berkas Utama
- `overview.html` (ringkasan), `list.html` (daftar santri), `form.html` (input/edit), `detail.html` (biodata).
- `raport.html` (raport mental), `prestasi.html`, `catatan.html`.
- `master-prestasi.html`, `master-catatan.html` (CRUD master data admin).
- `env.js` (supabase runtime config), `config.js` (inisialisasi Supabase), `db.js` (service).

## Cara Pakai Singkat
1) Pastikan `env.js` terisi URL dan anon key, dan di-include sebelum `config.js`.  
2) Buka aplikasi (local server atau GitHub Pages).  
3) Login. Admin dapat akses input, master data, download; user hanya baca.  
4) Gunakan filter/pencarian pada daftar santri, raport, prestasi, dan catatan sesuai kebutuhan.
