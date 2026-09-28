# Versi Standalone HTML & CSS — SIMBA-IN (PT Aetra Air Tangerang)

Folder ini berisi kode program dashboard admin dalam format **HTML murni, CSS, dan JavaScript** yang siap dibaca oleh GitHub dan langsung dapat diaktifkan menggunakan **GitHub Pages**.

---

## 📁 Struktur File

1. **`index.html`**:
   - Struktur antarmuka web (HTML5) lengkap dengan header, sidebar navigasi, kartu KPI, panel 1-Click Batch Update, tabel monitoring stand meter industri, modal inspeksi foto lapangan, modal cetak faktur tagihan (PDF), serta modal konfigurasi Supabase.
   - Menggunakan CDN resmi Tailwind CSS dan Supabase JS Client v2 sehingga tidak memerlukan build tools (seperti Node.js / Vite).
2. **`style.css`**:
   - Styling warna korporat PT Aetra Air Tangerang (`#0055A5` & `#E86216`), animasi modal, animasi indikator *Realtime Pulse*, scrollbar khusus, dan aturan cetak dokumen (*print stylesheet*).
3. **`app.js`**:
   - Logika aplikasi dalam JavaScript murni (*vanilla JS*), mencakup:
     - Koneksi & subscription *Supabase Realtime* (data dari petugas lapangan langsung masuk ke tabel).
     - Pembaruan status massal (*Batch Approval Verified / Pending*).
     - Pencarian dan filter dinamis (Cycle 1–15, Kelas Industri, Bulan).
     - Perhitungan otomatis volume pemakaian air dan tarif resmi (Rp 12.500/m³).
     - Ekspor data pelanggan ke format CSV / Excel.

---

## 🌐 Cara Mengaktifkan di GitHub Pages (Hosting Gratis)

1. Upload seluruh isi folder `github-pages/` (atau seluruh repository) ke repository GitHub Anda.
2. Di halaman repository GitHub Anda, klik tab **Settings**.
3. Pada menu sebelah kiri, pilih **Pages**.
4. Di bagian **Build and deployment**:
   - **Source**: Pilih `Deploy from a branch`.
   - **Branch**: Pilih `main` (atau `master`), lalu pilih folder `/ (root)` atau `/github-pages`.
   - Klik **Save**.
5. Tunggu sekitar 1 menit. GitHub Pages akan memberikan link website aktif yang dapat langsung diakses oleh tim Anda!
