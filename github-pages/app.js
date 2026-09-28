// ==============================================================================
// SIMBA-IN (Sistem Informasi Monitoring & Billing Air Industri)
// PT Aetra Air Tangerang
// Vanilla JavaScript + Supabase Realtime Client for GitHub Pages
// ==============================================================================

// Initial fallback dataset (Cycle 1 - 15)
const INITIAL_CUSTOMERS = [
  {
    id: 'IND-1001',
    nama: 'PT Krakatau Steel Industry',
    email: 'billing@krakatau.co.id',
    cycle: 'Cycle 1',
    kelas: 'Gold',
    lalu: 12500,
    skrg: 13200,
    status: 'Verified',
    bulan: 'September 2026',
    catatan: 'Pembacaan normal sesuai jadwal. Verifikasi fisik telah selesai.',
    fotoMeter: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
    fotoBPM: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800',
    lokasi: 'Kawasan Industri Manis, Jl. Manis Raya No. 12',
    diameterPipa: '100 mm (4 inch)'
  },
  {
    id: 'IND-1002',
    nama: 'PT Indah Kiat Pulp & Paper',
    email: 'finance@indahkiat.co.id',
    cycle: 'Cycle 1',
    kelas: 'Premium',
    lalu: 45000,
    skrg: 47500,
    status: 'Invoiced',
    bulan: 'September 2026',
    catatan: 'Akun prioritas industri. Invoice terkirim ke finance@indahkiat.co.id.',
    fotoMeter: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
    fotoBPM: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800',
    lokasi: 'Jl. Raya Serang Km. 18, Cikupa',
    diameterPipa: '150 mm (6 inch)'
  },
  {
    id: 'IND-1003',
    nama: 'PT Gajah Tunggal Tbk',
    email: 'acc@gajahtunggal.co.id',
    cycle: 'Cycle 2',
    kelas: 'Platinum',
    lalu: 21000,
    skrg: 21800,
    status: 'Pending Verification',
    bulan: 'September 2026',
    catatan: 'Menunggu konfirmasi visual lapangan dan tandatangan BPM.',
    fotoMeter: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
    fotoBPM: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800',
    lokasi: 'Kawasan Industri Jatake, Blok A No. 3',
    diameterPipa: '100 mm (4 inch)'
  },
  {
    id: 'IND-1004',
    nama: 'PT Torabika Eka Semesta (Mayora Group)',
    email: 'utility.finance@mayora.co.id',
    cycle: 'Cycle 2',
    kelas: 'Premium',
    lalu: 38200,
    skrg: 41200,
    status: 'Verified',
    bulan: 'September 2026',
    catatan: 'Pelanggan strategis. Fluktuasi konsumsi produksi kopi terkonfirmasi.',
    fotoMeter: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
    fotoBPM: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800',
    lokasi: 'Jl. Raya Serang Km 12.5, Bitung',
    diameterPipa: '150 mm (6 inch)'
  },
  {
    id: 'IND-1005',
    nama: 'PT Ching Luh Indonesia',
    email: 'tax.billing@chingluh.co.id',
    cycle: 'Cycle 3',
    kelas: 'Gold',
    lalu: 18400,
    skrg: 19150,
    status: 'Pending Verification',
    bulan: 'September 2026',
    catatan: 'Stand meter telah dicatat di lapangan.',
    fotoMeter: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
    fotoBPM: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800',
    lokasi: 'Jl. Raya Serang Km 16, Pasar Kemis',
    diameterPipa: '80 mm (3 inch)'
  },
  {
    id: 'IND-1006',
    nama: 'PT Surya Toto Indonesia Tbk',
    email: 'finance.utility@toto.co.id',
    cycle: 'Cycle 3',
    kelas: 'Premium',
    lalu: 29400,
    skrg: 29850,
    status: 'Invoiced',
    bulan: 'September 2026',
    catatan: 'Verifikasi selesai dan invoice resmi telah terbit.',
    fotoMeter: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
    fotoBPM: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800',
    lokasi: 'Kawasan Industri Pasar Kemis Blok B',
    diameterPipa: '100 mm (4 inch)'
  },
  {
    id: 'IND-1007',
    nama: 'PT Charoen Pokphand Indonesia',
    email: 'ap.water@cp.co.id',
    cycle: 'Cycle 4',
    kelas: 'Platinum',
    lalu: 28900,
    skrg: 28900,
    status: 'Belum Dibaca',
    bulan: 'September 2026',
    catatan: 'Jadwal pembacaan periode berjalan.',
    fotoMeter: '',
    fotoBPM: '',
    lokasi: 'Kawasan Industri Balaraja Industrial Estate',
    diameterPipa: '100 mm (4 inch)'
  },
  {
    id: 'IND-1008',
    nama: 'PT Astra Otoparts Tbk - Divisi Winteq',
    email: 'purchasing@winteq-astra.co.id',
    cycle: 'Cycle 4',
    kelas: 'Gold',
    lalu: 15300,
    skrg: 15300,
    status: 'Belum Dibaca',
    bulan: 'September 2026',
    catatan: 'Menunggu jadwal pembacaan di lokasi.',
    fotoMeter: '',
    fotoBPM: '',
    lokasi: 'Jl. Raya Jakarta-Serang Km. 28, Balaraja',
    diameterPipa: '80 mm (3 inch)'
  },
  {
    id: 'IND-1009',
    nama: 'PT Multi Bintang Indonesia Tbk',
    email: 'accounting@multibintang.co.id',
    cycle: 'Cycle 5',
    kelas: 'Premium',
    lalu: 52000,
    skrg: 56300,
    status: 'Pending Verification',
    bulan: 'September 2026',
    catatan: 'Pemeriksaan lanjutan: Lonjakan pemakaian terdeteksi (>4.000 m³).',
    fotoMeter: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
    fotoBPM: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800',
    lokasi: 'Jl. Daan Mogot Km. 19, Tangerang',
    diameterPipa: '200 mm (8 inch)'
  },
  {
    id: 'IND-1010',
    nama: 'PT Japfa Comfeed Indonesia Tbk',
    email: 'finance@japfacomfeed.co.id',
    cycle: 'Cycle 5',
    kelas: 'Bronze',
    lalu: 6400,
    skrg: 6720,
    status: 'Verified',
    bulan: 'September 2026',
    catatan: 'Pembacaan meteran fisik telah divalidasi.',
    fotoMeter: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
    fotoBPM: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800',
    lokasi: 'Kawasan Industri Cikupa Mas Blok C',
    diameterPipa: '50 mm (2 inch)'
  }
];

// App State
let customers = (() => {
  const raw = localStorage.getItem('simba_customers');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(c => ({
          ...c,
          petugasBaca: undefined,
          kategoriPetugas: undefined,
          catatan: c.catatan
            ? c.catatan.replace(/Ahmad Fauzi|Bambang Sutrisno|Rudi Hartono|Dani Permana|Budi Santoso|Dewi Lestari|PT Hideco|Kontraktor \(PT Hideco\)/gi, '').trim()
            : ''
        }));
      }
    } catch {}
  }
  return INITIAL_CUSTOMERS;
})();
let currentFilterCycle = 'ALL';
let currentFilterClass = 'ALL';
let currentFilterMonth = 'ALL';
let currentFilterWorkflow = 'ALL';
let currentBatchScope = 'ALL';
let searchQuery = '';
let selectedCustomer = null;

// Supabase Client state
let supabaseClient = null;
let isSupabaseConnected = false;

// Initialize Supabase from LocalStorage or Default
function initSupabase() {
  const url = localStorage.getItem('supabase_url') || '';
  const key = localStorage.getItem('supabase_key') || '';

  if (url && key && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(url, key);
      testSupabaseConn();
      subscribeRealtime();
    } catch (e) {
      console.warn('Supabase init failed:', e);
      updateSupabaseUI(false);
    }
  } else {
    updateSupabaseUI(false);
  }
}

async function testSupabaseConn() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.from('industry_customers').select('id').limit(1);
    if (!error) {
      isSupabaseConnected = true;
      updateSupabaseUI(true);
      fetchSupabaseCustomers();
    } else {
      updateSupabaseUI(false, error.message);
    }
  } catch (err) {
    updateSupabaseUI(false, err.message);
  }
}

async function fetchSupabaseCustomers() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.from('industry_customers').select('*').order('id');
    if (!error && data && data.length > 0) {
      customers = data.map(row => ({
        id: row.id,
        nama: row.nama,
        email: row.email,
        cycle: row.cycle,
        kelas: row.kelas,
        lalu: Number(row.lalu) || 0,
        skrg: Number(row.skrg) || 0,
        status: row.status,
        bulan: row.bulan || 'September 2026',
        catatan: row.catatan || '',
        fotoMeter: row.foto_meter || '',
        fotoBPM: row.foto_bpm || '',
        lokasi: row.lokasi,
        diameterPipa: row.diameter_pipa,
        petugasBaca: row.petugas_baca,
        kategoriPetugas: row.kategori_petugas
      }));
      saveLocal();
      renderApp();
    }
  } catch (e) {
    console.error(e);
  }
}

// Realtime WebSocket Subscription (Updates as field readers submit)
function subscribeRealtime() {
  if (!supabaseClient) return;
  supabaseClient
    .channel('simba-html-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'industry_customers' }, payload => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const row = payload.new;
        const mapped = {
          id: row.id,
          nama: row.nama,
          email: row.email,
          cycle: row.cycle,
          kelas: row.kelas,
          lalu: Number(row.lalu) || 0,
          skrg: Number(row.skrg) || 0,
          status: row.status,
          bulan: row.bulan || 'September 2026',
          catatan: row.catatan || '',
          fotoMeter: row.foto_meter || '',
          fotoBPM: row.foto_bpm || '',
          lokasi: row.lokasi,
          diameterPipa: row.diameter_pipa,
          petugasBaca: row.petugas_baca,
          kategoriPetugas: row.kategori_petugas
        };
        const idx = customers.findIndex(c => c.id === mapped.id);
        if (idx >= 0) {
          customers[idx] = mapped;
        } else {
          customers.unshift(mapped);
        }
        saveLocal();
        renderApp();
        showNotification(`Pembaruan lapangan diterima untuk ${mapped.nama} (${mapped.status})`);
      }
    })
    .subscribe();
}

function updateSupabaseUI(connected, errorMsg = '') {
  isSupabaseConnected = connected;
  const badge = document.getElementById('supabase-badge');
  const dot = document.getElementById('supabase-dot');
  const label = document.getElementById('supabase-status-label');
  if (badge && dot && label) {
    if (connected) {
      badge.className = 'px-3 py-1.5 text-xs font-bold border rounded-xl flex items-center gap-1.5 cursor-pointer bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300';
      dot.className = 'w-2 h-2 rounded-full bg-emerald-500 live-dot';
      label.textContent = 'Supabase: Live';
    } else {
      badge.className = 'px-3 py-1.5 text-xs font-bold border rounded-xl flex items-center gap-1.5 cursor-pointer bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300';
      dot.className = 'w-2 h-2 rounded-full bg-amber-500';
      label.textContent = 'Supabase: Setup';
    }
  }
}

function saveLocal() {
  localStorage.setItem('simba_customers', JSON.stringify(customers));
}

// Notification Toast
function showNotification(msg) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-5 right-5 z-50 bg-[#0055A5] text-white px-4 py-3 rounded-xl shadow-xl border border-blue-400 text-xs font-bold flex items-center gap-2 modal-enter';
  toast.innerHTML = `<span>⚡</span> <span>${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// Filter logic
function getFilteredCustomers() {
  const query = searchQuery.toLowerCase().trim();
  return customers.filter(c => {
    if (currentFilterCycle !== 'ALL' && c.cycle !== currentFilterCycle) return false;
    if (currentFilterClass !== 'ALL' && c.kelas !== currentFilterClass) return false;
    if (currentFilterMonth !== 'ALL' && c.bulan !== currentFilterMonth) return false;
    if (currentFilterWorkflow !== 'ALL' && c.status !== currentFilterWorkflow) return false;

    // Batch scope filter sync
    if (currentBatchScope === 'KONTRAKTOR') {
      const isContractor = (c.kategoriPetugas && c.kategoriPetugas !== 'Key Account') || (!c.kategoriPetugas && c.kelas !== 'Premium');
      if (!isContractor) return false;
    } else if (currentBatchScope === 'KEY_ACCOUNT') {
      const isKA = c.kategoriPetugas === 'Key Account' || (!c.kategoriPetugas && c.kelas === 'Premium');
      if (!isKA) return false;
    }

    if (query) {
      return (
        c.nama.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query)
      );
    }
    return true;
  });
}

// Render Table & Counters
function renderApp() {
  const filtered = getFilteredCustomers();
  const tableBody = document.getElementById('customer-table-body');
  if (!tableBody) return;

  // Update counters
  const total = customers.length;
  const verified = customers.filter(c => c.status === 'Verified').length;
  const invoiced = customers.filter(c => c.status === 'Invoiced').length;
  const pending = customers.filter(c => c.status === 'Pending Verification').length;
  const unread = customers.filter(c => c.status === 'Belum Dibaca').length;

  document.getElementById('stat-total')?.replaceChildren(document.createTextNode(total.toString()));
  document.getElementById('stat-verified')?.replaceChildren(document.createTextNode(verified.toString()));
  document.getElementById('stat-invoiced')?.replaceChildren(document.createTextNode(invoiced.toString()));
  document.getElementById('stat-pending')?.replaceChildren(document.createTextNode(pending.toString()));
  document.getElementById('stat-unread')?.replaceChildren(document.createTextNode(unread.toString()));

  // Render Table Rows
  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400 font-semibold text-xs">Tidak ada data industri yang sesuai filter pencarian.</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered.map(c => {
    const pemakaian = Math.max(0, c.skrg - c.lalu);
    const tagihan = pemakaian * 12500 + 10000;

    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
    if (c.status === 'Verified') badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (c.status === 'Invoiced') badgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
    if (c.status === 'Pending Verification') badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
    if (c.status === 'Belum Dibaca') badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';

    const hasPhoto = c.status !== 'Belum Dibaca' && c.fotoMeter;

    return `
      <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition text-xs">
        <td class="p-3.5">
          <div class="font-extrabold text-slate-900">${c.nama}</div>
          <div class="text-[11px] text-slate-400 font-mono">${c.id} &bull; ${c.email}</div>
        </td>
        <td class="p-3.5">
          <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#0055A5] font-mono border border-blue-200">${c.cycle}</span>
          <div class="text-[10px] text-slate-500 font-semibold mt-0.5">${c.kelas}</div>
        </td>
        <td class="p-3.5 font-mono text-right">
          <div class="text-slate-400">${c.lalu.toLocaleString()}</div>
          <div class="font-extrabold text-slate-900">${c.skrg.toLocaleString()} m³</div>
        </td>
        <td class="p-3.5 font-mono text-right font-extrabold text-blue-900">
          <div>${pemakaian.toLocaleString()} m³</div>
          <div class="text-[10px] text-slate-400 font-normal">Rp ${tagihan.toLocaleString()}</div>
        </td>
        <td class="p-3.5">
          <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeClass}">
            ${c.status}
          </span>
          <div class="text-[10px] mt-1 text-slate-500">
            ${hasPhoto ? '📷 Foto & BPM Ada' : '⏳ Foto: Menunggu Petugas'}
          </div>
        </td>
        <td class="p-3.5 text-slate-600">
          <div class="font-bold text-[11px]">${c.petugasBaca || 'Belum Diplot'}</div>
          <div class="text-[10px] text-slate-400">${c.kategoriPetugas || '-'}</div>
        </td>
        <td class="p-3.5 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="openDetailModal('${c.id}')" class="px-2.5 py-1 bg-[#0055A5] hover:bg-[#003E78] text-white rounded-lg font-bold text-[11px] transition shadow-xs">
              Verifikasi
            </button>
            <button onclick="openInvoiceModal('${c.id}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition shadow-xs">
              Faktur
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// 1-Click Batch Update for Target Cycle
function executeBatchUpdate(targetStatus) {
  const targetCycle = document.getElementById('batch-cycle-select').value;
  const note = `Status diperbarui massal via dashboard ke ${targetStatus}`;

  let affectedCount = 0;
  customers = customers.map(c => {
    if (c.cycle === targetCycle) {
      if (currentBatchScope === 'KONTRAKTOR') {
        const isContractor = (c.kategoriPetugas && c.kategoriPetugas !== 'Key Account') || (!c.kategoriPetugas && c.kelas !== 'Premium');
        if (!isContractor) return c;
      } else if (currentBatchScope === 'KEY_ACCOUNT') {
        const isKA = c.kategoriPetugas === 'Key Account' || (!c.kategoriPetugas && c.kelas === 'Premium');
        if (!isKA) return c;
      }

      affectedCount++;
      return {
        ...c,
        status: targetStatus,
        catatan: note
      };
    }
    return c;
  });

  saveLocal();
  renderApp();

  // Push to Supabase if connected
  if (supabaseClient) {
    const ids = customers.filter(c => c.cycle === targetCycle).map(c => c.id);
    supabaseClient.from('industry_customers').update({ status: targetStatus, catatan: note }).in('id', ids).then(() => {});
  }

  showNotification(`Berhasil memperbarui ${affectedCount} industri pada ${targetCycle} menjadi '${targetStatus}'!`);
}

// Open Detail & Verification Modal
window.openDetailModal = function(id) {
  selectedCustomer = customers.find(c => c.id === id);
  if (!selectedCustomer) return;

  document.getElementById('modal-cust-name').textContent = selectedCustomer.nama;
  document.getElementById('modal-cust-id').textContent = `${selectedCustomer.id} • ${selectedCustomer.cycle}`;
  document.getElementById('modal-input-lalu').value = selectedCustomer.lalu;
  document.getElementById('modal-input-skrg').value = selectedCustomer.skrg;
  document.getElementById('modal-input-status').value = selectedCustomer.status;
  document.getElementById('modal-input-catatan').value = selectedCustomer.catatan;
  document.getElementById('modal-petugas').textContent = `${selectedCustomer.petugasBaca || '-'} (${selectedCustomer.kategoriPetugas || '-'})`;
  document.getElementById('modal-lokasi').textContent = selectedCustomer.lokasi || '-';

  // Photo preview
  const imgBox = document.getElementById('modal-foto-box');
  if (selectedCustomer.status === 'Belum Dibaca' || !selectedCustomer.fotoMeter) {
    imgBox.innerHTML = `
      <div class="h-44 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center">
        <span class="text-3xl mb-1">📷</span>
        <span class="font-bold text-slate-700 text-xs">Belum Ada Foto Meteran Lapangan</span>
        <span class="text-[10px] text-slate-400 mt-0.5">Menunggu petugas mencatat stand & mengambil foto fisik di lokasi</span>
      </div>
    `;
  } else {
    imgBox.innerHTML = `
      <div class="space-y-1">
        <img src="${selectedCustomer.fotoMeter}" class="w-full h-44 object-cover rounded-xl border border-slate-200 shadow-xs" alt="Foto Meter" />
        <div class="text-[10px] text-emerald-700 font-bold text-center">✓ Foto Meter Terlampir & Terverifikasi</div>
      </div>
    `;
  }

  document.getElementById('detail-modal').classList.remove('hidden');
};

function saveCustomerDetail() {
  if (!selectedCustomer) return;
  const skrgVal = Number(document.getElementById('modal-input-skrg').value) || selectedCustomer.skrg;
  const statusVal = document.getElementById('modal-input-status').value;
  const catatanVal = document.getElementById('modal-input-catatan').value;

  selectedCustomer.skrg = skrgVal;
  selectedCustomer.status = statusVal;
  selectedCustomer.catatan = catatanVal;

  saveLocal();
  renderApp();

  if (supabaseClient) {
    supabaseClient.from('industry_customers').update({
      skrg: skrgVal,
      status: statusVal,
      catatan: catatanVal
    }).eq('id', selectedCustomer.id).then(() => {});
  }

  closeModal('detail-modal');
  showNotification(`Data ${selectedCustomer.nama} berhasil diperbarui.`);
}

// Open Printable Invoice Modal
window.openInvoiceModal = function(id) {
  const c = customers.find(cust => cust.id === id);
  if (!c) return;

  const pemakaian = Math.max(0, c.skrg - c.lalu);
  const tagihanAir = pemakaian * 12500;
  const beaMaterai = 10000;
  const totalTagihan = tagihanAir + beaMaterai;

  document.getElementById('inv-no').textContent = `INV/AETRA/IND/${new Date().getFullYear()}/${c.id}`;
  document.getElementById('inv-cust-name').textContent = c.nama;
  document.getElementById('inv-cust-id').textContent = c.id;
  document.getElementById('inv-cust-email').textContent = c.email;
  document.getElementById('inv-cycle').textContent = c.cycle;
  document.getElementById('inv-period').textContent = c.bulan;
  document.getElementById('inv-lalu').textContent = `${c.lalu.toLocaleString()} m³`;
  document.getElementById('inv-skrg').textContent = `${c.skrg.toLocaleString()} m³`;
  document.getElementById('inv-pakai').textContent = `${pemakaian.toLocaleString()} m³`;
  document.getElementById('inv-air').textContent = `Rp ${tagihanAir.toLocaleString()}`;
  document.getElementById('inv-total').textContent = `Rp ${totalTagihan.toLocaleString()}`;

  document.getElementById('invoice-modal').classList.remove('hidden');
};

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// Supabase Settings Modal
function openSupabaseModal() {
  document.getElementById('supa-url-input').value = localStorage.getItem('supabase_url') || '';
  document.getElementById('supa-key-input').value = localStorage.getItem('supabase_key') || '';
  document.getElementById('supabase-modal').classList.remove('hidden');
}

function saveSupabaseSettings() {
  const url = document.getElementById('supa-url-input').value.trim();
  const key = document.getElementById('supa-key-input').value.trim();

  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_key', key);

  closeModal('supabase-modal');
  initSupabase();
  showNotification('Pengaturan Supabase disimpan. Menghubungkan...');
}

async function pushLocalToSupabase() {
  if (!supabaseClient) {
    alert('Hubungkan Supabase URL dan Anon Key terlebih dahulu.');
    return;
  }
  const btn = document.getElementById('btn-push-supa');
  btn.textContent = 'Mengunggah...';
  btn.disabled = true;

  try {
    const rows = customers.map(c => ({
      id: c.id,
      nama: c.nama,
      email: c.email,
      cycle: c.cycle,
      kelas: c.kelas,
      lalu: c.lalu,
      skrg: c.skrg,
      status: c.status,
      bulan: c.bulan,
      catatan: c.catatan,
      foto_meter: c.fotoMeter || '',
      foto_bpm: c.fotoBPM || '',
      lokasi: c.lokasi || null,
      diameter_pipa: c.diameterPipa || null,
      petugas_baca: c.petugasBaca || null,
      kategori_petugas: c.kategoriPetugas || null
    }));

    const { error } = await supabaseClient.from('industry_customers').upsert(rows, { onConflict: 'id' });
    if (error) throw error;

    showNotification(`Berhasil mengunggah ${customers.length} data industri ke Supabase!`);
  } catch (err) {
    alert(`Gagal push ke Supabase: ${err.message}`);
  } finally {
    btn.textContent = 'Push Data Lokal ke Supabase';
    btn.disabled = false;
  }
}

// Export CSV
function exportCSV() {
  const filtered = getFilteredCustomers();
  let csv = 'ID,Nama Pelanggan,Email,Cycle,Kelas,Stand Lalu,Stand Skrg,Pemakaian (m3),Status,Bulan,Petugas,Kategori\n';
  filtered.forEach(c => {
    const pakai = Math.max(0, c.skrg - c.lalu);
    csv += `"${c.id}","${c.nama}","${c.email}","${c.cycle}","${c.kelas}",${c.lalu},${c.skrg},${pakai},"${c.status}","${c.bulan}","${c.petugasBaca || ''}","${c.kategoriPetugas || ''}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `SIMBA_AETRA_EXPORT_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Event Listeners setup
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  renderApp();

  // Search input
  document.getElementById('search-input')?.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderApp();
  });

  // Cycle filter select
  document.getElementById('filter-cycle')?.addEventListener('change', e => {
    currentFilterCycle = e.target.value;
    document.getElementById('batch-cycle-select').value = e.target.value === 'ALL' ? 'Cycle 1' : e.target.value;
    renderApp();
  });

  // Month filter select
  document.getElementById('filter-month')?.addEventListener('change', e => {
    currentFilterMonth = e.target.value;
    renderApp();
  });

  // Batch scope radio buttons
  document.querySelectorAll('input[name="batch_scope"]').forEach(radio => {
    radio.addEventListener('change', e => {
      currentBatchScope = e.target.value;
      renderApp();
    });
  });

  // Clock
  setInterval(() => {
    const el = document.getElementById('live-clock');
    if (el) {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('id-ID', { hour12: false });
    }
  }, 1000);
});
