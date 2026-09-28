-- ==============================================================================
-- SIMBA-IN: Starter Seed Data for Supabase
-- Run this in Supabase SQL Editor after running schema.sql
-- ==============================================================================

-- 1. Table: meter_readers (Kosong secara default, siap diinput oleh pengguna)
-- Pengguna dapat mendaftarkan nama petugas dan perusahaannya langsung via dashboard.

-- 2. Insert Initial Industrial Customers
INSERT INTO public.industry_customers (id, nama, email, cycle, kelas, lalu, skrg, status, bulan, catatan, history, foto_meter, foto_bpm, lokasi, diameter_pipa, petugas_baca, kategori_petugas)
VALUES
('IND-1001', 'PT Krakatau Steel Industry', 'billing@krakatau.co.id', 'Cycle 1', 'Gold', 12500, 13200, 'Verified', 'September 2026', 'Pembacaan normal sesuai jadwal. Verifikasi fisik telah selesai.', ARRAY[11800, 12100, 12300, 12500, 13200], 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800', 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800', 'Kawasan Industri Manis, Jl. Manis Raya No. 12', '100 mm (4 inch)', NULL, NULL),
('IND-1002', 'PT Indah Kiat Pulp & Paper', 'finance@indahkiat.co.id', 'Cycle 1', 'Premium', 45000, 47500, 'Invoiced', 'September 2026', 'Akun prioritas industri. Invoice terkirim ke finance@indahkiat.co.id.', ARRAY[41000, 42500, 43800, 45000, 47500], 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800', 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800', 'Jl. Raya Serang Km. 18, Cikupa', '150 mm (6 inch)', NULL, NULL),
('IND-1003', 'PT Gajah Tunggal Tbk', 'acc@gajahtunggal.co.id', 'Cycle 2', 'Platinum', 21000, 21800, 'Pending Verification', 'September 2026', 'Menunggu konfirmasi visual lapangan dan tandatangan BPM.', ARRAY[19500, 20000, 20500, 21000, 21800], 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800', 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800', 'Kawasan Industri Jatake, Blok A No. 3', '100 mm (4 inch)', NULL, NULL),
('IND-1004', 'PT Torabika Eka Semesta (Mayora Group)', 'utility.finance@mayora.co.id', 'Cycle 2', 'Premium', 38200, 41200, 'Verified', 'September 2026', 'Pelanggan strategis industri. Fluktuasi konsumsi produksi kopi terkonfirmasi.', ARRAY[35000, 36200, 37100, 38200, 41200], 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800', 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800', 'Jl. Raya Serang Km 12.5, Bitung', '150 mm (6 inch)', NULL, NULL),
('IND-1005', 'PT Ching Luh Indonesia', 'tax.billing@chingluh.co.id', 'Cycle 3', 'Gold', 18400, 19150, 'Pending Verification', 'September 2026', 'Stand meter telah dicatat di lapangan.', ARRAY[16900, 17400, 17900, 18400, 19150], 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800', 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800', 'Jl. Raya Serang Km 16, Pasar Kemis', '80 mm (3 inch)', NULL, NULL),
('IND-1006', 'PT Surya Toto Indonesia Tbk', 'finance.utility@toto.co.id', 'Cycle 3', 'Premium', 29400, 29850, 'Invoiced', 'September 2026', 'Verifikasi selesai dan invoice resmi telah terbit.', ARRAY[28500, 28800, 29100, 29400, 29850], 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800', 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800', 'Kawasan Industri Pasar Kemis Blok B', '100 mm (4 inch)', NULL, NULL),
('IND-1007', 'PT Charoen Pokphand Indonesia', 'ap.water@cp.co.id', 'Cycle 4', 'Platinum', 28900, 28900, 'Belum Dibaca', 'September 2026', 'Jadwal pembacaan periode berjalan.', ARRAY[26000, 27100, 28000, 28900], '', '', 'Kawasan Industri Balaraja Industrial Estate', '100 mm (4 inch)', NULL, NULL),
('IND-1008', 'PT Astra Otoparts Tbk - Divisi Winteq', 'purchasing@winteq-astra.co.id', 'Cycle 4', 'Gold', 15300, 15300, 'Belum Dibaca', 'September 2026', 'Menunggu jadwal pembacaan di lokasi.', ARRAY[13800, 14200, 14750, 15300], '', '', 'Jl. Raya Jakarta-Serang Km. 28, Balaraja', '80 mm (3 inch)', NULL, NULL),
('IND-1009', 'PT Multi Bintang Indonesia Tbk', 'accounting@multibintang.co.id', 'Cycle 5', 'Premium', 52000, 56300, 'Pending Verification', 'September 2026', 'Pemeriksaan lanjutan: Lonjakan pemakaian terdeteksi (>4.000 m³).', ARRAY[46000, 48000, 50100, 52000, 56300], 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800', 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800', 'Jl. Daan Mogot Km. 19, Tangerang', '200 mm (8 inch)', NULL, NULL),
('IND-1010', 'PT Japfa Comfeed Indonesia Tbk', 'finance@japfacomfeed.co.id', 'Cycle 5', 'Bronze', 6400, 6720, 'Verified', 'September 2026', 'Pembacaan meteran fisik telah divalidasi.', ARRAY[5800, 6000, 6200, 6400, 6720], 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800', 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800', 'Kawasan Industri Cikupa Mas Blok C', '50 mm (2 inch)', NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
    lalu = EXCLUDED.lalu,
    skrg = EXCLUDED.skrg,
    status = EXCLUDED.status,
    catatan = EXCLUDED.catatan,
    foto_meter = EXCLUDED.foto_meter,
    foto_bpm = EXCLUDED.foto_bpm;

-- 3. Insert Initial Audit Logs
INSERT INTO public.audit_logs (id, time, "user", role, "desc", type)
VALUES
('log-1', '24 Sep 2026 08:30:12', 'Pak Yaya', 'Tim Billing & Invoicing', 'Sistem SIMBA-IN diinisialisasi untuk periode Cycle September 2026.', 'info'),
('log-2', '24 Sep 2026 09:14:05', 'Pak Solihin', 'Tim Meter Reading', 'Verifikasi pembacaan fisik meteran PT Krakatau Steel (IND-1001) Stand 13.200 m³.', 'update'),
('log-3', '24 Sep 2026 10:02:40', 'Pak Yaya', 'Tim Billing & Invoicing', 'Invoice terbit & email terkirim untuk PT Indah Kiat Pulp & Paper (IND-1002).', 'invoice'),
('log-4', '24 Sep 2026 11:15:20', 'Pak Kabul', 'Admin Meter Reading', 'Memvalidasi plotting jadwal cycle 1–15 dan master data industri.', 'info'),
('log-5', '24 Sep 2026 14:30:10', 'Pak Kabul', 'Admin Meter Reading', 'Rekapitulasi stand meter industri kawasan Cikupa dan koordinasi pembacaan.', 'update'),
('log-6', '25 Sep 2026 08:20:45', 'Pak Kabul', 'Admin Meter Reading', 'Sinkronisasi hasil pembacaan lapangan Cycle 1 dan Cycle 2 bersama Pak Solihin.', 'update'),
('log-7', '25 Sep 2026 09:45:00', 'Pak Kabul', 'Admin Meter Reading', 'Audit investigasi anomali volume industri pada akun prioritas PT Multi Bintang.', 'info')
ON CONFLICT (id) DO NOTHING;
