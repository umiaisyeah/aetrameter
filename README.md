# SIMBA-IN (Sistem Informasi Monitoring & Billing Air Industri)
### PT Aetra Air Tangerang — Unit Pelayanan Industri

Aplikasi Web Dashboard Admin Terintegrasi untuk Monitoring Pembacaan Meter Industri, Verifikasi Stand Lapangan, Billing & Invoicing, serta Manajemen Penugasan Siklus Cycle (Cycle 1–15) berbasis **React 19 + TypeScript + Supabase Backend**.

---

## 📌 Ringkasan Arsitektur Sistem

Sistem ini dirancang khusus untuk memfasilitasi integrasi antara **Admin Kantor** dan **Petugas Pembaca Meter Lapangan**:

```
+---------------------------------------------------------------------------------+
|                       PETUGAS LAPANGAN (METER READERS)                          |
|  - Kontraktor (PT Hideco) & Tim Key Account Aetra                               |
|  - Input Stand Meter, Unggah Foto Meteran & Dokumen BPM Fisik                   |
+---------------------------------------------------------------------------------+
                                      │
                                      ▼
                        [ REST API / SDK Supabase ]
                                      │
                                      ▼
+---------------------------------------------------------------------------------+
|                       SUPABASE BACKEND (PostgreSQL + Realtime)                  |
|  - Tabel: industry_customers, meter_readers, cycle_schedules, audit_logs        |
|  - Supabase Realtime Channels (PostgreSQL CDC WebSockets)                       |
+---------------------------------------------------------------------------------+
                                      │
                   Live Subscription (WebSockets)
                                      ▼
+---------------------------------------------------------------------------------+
|                   SIMBA-IN DASHBOARD ADMIN (Aplikasi Ini)                       |
|  - Otoritas Pak Kabul & Pak Solihin (Admin Meter Reading)                       |
|  - Otoritas Pak Yaya (Tim Billing & Invoicing)                                  |
|  - 1-Click Batch Update per Cycle, Matriks Kalender 1 Tahun, Log Audit          |
+---------------------------------------------------------------------------------+
```

---

## 🚀 Fitur Utama Dashboard Admin

1. **Sinkronisasi Realtime dengan Petugas Lapangan (Supabase)**:
   - Saat petugas lapangan memasukkan angka stand meter atau foto dari lapangan, dashboard admin langsung terbarui secara otomatis tanpa refresh.
2. **Matriks Plotting Jadwal Cycle 1 Tahun (Tanggal 1–31)**:
   - Kalender jadwal cycle 1–15 untuk 12 bulan penuh dengan pembagian tim lapangan Kontraktor (PT Hideco) dan Tim Key Account.
3. **Pembaruan Status Massal (1-Click Batch Update per Cycle)**:
   - Fitur 1-klik untuk menandai seluruh industri di siklus terpilih menjadi *'Verified'* atau *'Pending'* dengan cakupan terpisah (*Semua Pembaca*, *Khusus PT Hideco*, atau *Khusus Key Account*).
4. **Verifikasi Reading & Validasi Dokumen BPM**:
   - Inspeksi foto meteran fisik dan dokumen BPM. Status *Belum Dibaca* secara otomatis tidak menampilkan foto sebelum pengisian oleh pencatat meter.
5. **Modul Billing & Invoicing (Pak Yaya)**:
   - Penghitungan otomatis volume pemakaian, tarif industri (Rp 12.500/m³), bea materai, penerbitan invoice resmi PDF, dan pengiriman otomatis via email Outlook.
6. **Log Audit & Rekam Jejak Aktivitas**:
   - Pencatatan seluruh aktivitas operasional oleh **Pak Kabul**, **Pak Solihin**, dan **Pak Yaya** dengan filter tanggal kalender (`<input type="date">`) dan bulan.

---

## 🗄️ Struktur Database Supabase

Seluruh skrip SQL telah disiapkan di folder `supabase/`:
- `supabase/schema.sql`: Pembuatan tabel, indeks, RLS (*Row Level Security*), trigger timestamp, dan publikasi Realtime.
- `supabase/seed.sql`: Data awal industri 15 cycle, petugas pembaca meter, dan rekaman audit.

### Tabel Utama:
1. `public.industry_customers`:
   - `id` (VARCHAR PK): ID Pelanggan (e.g. `IND-1001`)
   - `nama`, `email`, `cycle`, `kelas`
   - `lalu` (NUMERIC): Stand meter bulan lalu
   - `skrg` (NUMERIC): Stand meter bulan berjalan
   - `status`: `'Belum Dibaca'` | `'Pending Verification'` | `'Verified'` | `'Invoiced'`
   - `bulan`: Periode bulan (e.g. `'September 2026'`)
   - `foto_meter`, `foto_bpm`, `petugas_baca`, `kategori_petugas`
2. `public.meter_readers`:
   - `id`, `nama`, `nip`, `no_hp`, `kategori`, `perusahaan`, `assigned_cycles`, `status`
3. `public.cycle_schedules`:
   - `cycle`, `bulan`, `hari_h`, `tgl_pra_baca`, `tgl_verifikasi`, `tgl_billing`, `petugas_utama`
4. `public.audit_logs`:
   - `id`, `time`, `user`, `role`, `desc`, `type`

---

## 📲 Panduan Integrasi untuk Petugas Lapangan

Petugas pembaca meter dapat mengirimkan data hasil bacaan langsung ke Supabase melalui REST API atau SDK:

### 1. Menggunakan cURL (HTTP REST API)
```bash
curl -X PATCH "https://[YOUR_PROJECT_ID].supabase.co/rest/v1/industry_customers?id=eq.IND-1001" \
  -H "apikey: [YOUR_SUPABASE_ANON_KEY]" \
  -H "Authorization: Bearer [YOUR_SUPABASE_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "skrg": 13200,
    "status": "Pending Verification",
    "catatan": "Stand meter dicatat di lapangan oleh Ahmad Fauzi",
    "foto_meter": "https://storage.supabase.co/meter-photos/IND-1001.jpg",
    "foto_bpm": "https://storage.supabase.co/bpm/BPM-1001.jpg",
    "petugas_baca": "Ahmad Fauzi",
    "kategori_petugas": "Kontraktor (PT Hideco)"
  }'
```

### 2. Menggunakan JavaScript / TypeScript (Mobile App / PWA)
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://[YOUR_PROJECT_ID].supabase.co',
  '[YOUR_SUPABASE_ANON_KEY]'
);

export async function kirimBacaanMeter(pelangganId, standSkrg, fotoMeterUrl, fotoBpmUrl, namaPetugas) {
  const { data, error } = await supabase
    .from('industry_customers')
    .update({
      skrg: standSkrg,
      status: 'Pending Verification',
      foto_meter: fotoMeterUrl,
      foto_bpm: fotoBpmUrl,
      petugas_baca: namaPetugas,
      catatan: `Stand meter ${standSkrg} m³ dibaca oleh ${namaPetugas}`
    })
    .eq('id', pelangganId);

  return { data, error };
}
```

---

## ⚙️ Cara Menjalankan Proyek Secara Lokal

### Prasyarat:
- Node.js versi 18 atau lebih baru
- Akun Supabase (gratis di [supabase.com](https://supabase.com))

### Langkah-langkah:
1. **Clone repository dari GitHub**:
   ```bash
   git clone https://github.com/username/simba-in-aetra.git
   cd simba-in-aetra
   ```

2. **Instal dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable**:
   Salin `.env.example` menjadi `.env.local` atau `.env`:
   ```bash
   cp .env.example .env
   ```
   Isi URL dan Anon Key Supabase Anda:
   ```env
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```
   *(Catatan: Anda juga dapat memasukkan konfigurasi langsung melalui tombol "Integrasi Supabase" di header aplikasi).*

4. **Inisialisasi Database di Supabase**:
   - Buka [Supabase Dashboard](https://supabase.com/dashboard) &rarr; Masuk ke proyek Anda.
   - Buka menu **SQL Editor**.
   - Salin dan jalankan isi file `supabase/schema.sql`.
   - Jalankan `supabase/seed.sql` untuk mengisi data awal.

5. **Jalankan server pengembangan**:
   ```bash
   npm run dev
   ```
   Buka peramban di `http://localhost:3000`.

---

## 📦 Deployment ke GitHub & Platform Hosting

Aplikasi ini dapat di-deploy secara instan ke platform modern:

- **Vercel / Netlify**:
  - Hubungkan repository GitHub Anda.
  - Masukkan Environment Variables: `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
  - Build command: `npm run build`
  - Output directory: `dist`
- **Docker / Cloud Run**:
  - Menggunakan Dockerfile standar Node.js dengan perintah `npm run build` dan `npm run preview`.

---

## 🛡️ Lisensi & Hak Cipta
Hak Cipta © 2026 PT Aetra Air Tangerang — Unit Pelayanan Industri. Seluruh hak cipta dilindungi undang-undang.
