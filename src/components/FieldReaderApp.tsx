import React, { useState, useEffect, useMemo } from 'react';
import { IndustryCustomer, UserProfile, MeterReader, WorkflowStatus, CycleSchedule } from '../types';
import { AetraLogo } from './AetraLogo';
import {
  MapPin,
  Camera,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  Search,
  Building2,
  Sparkles,
  Scan,
  Droplets,
  Calendar,
  Clock,
  Smartphone,
  Maximize2,
  Sun,
  Moon,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Navigation,
  ChevronRight,
  Wifi,
  Battery,
  ListTodo,
  BarChart3,
  User,
  Send,
  Image as ImageIcon
} from 'lucide-react';
import { showColorfulAlert } from '../utils/notificationSystem';
import {
  getAssignedCustomersForReader,
  getAssignedCyclesForReader,
  sortCyclesNaturally,
  normalizeReaderName
} from '../utils/readerAssignmentHelper';
import { RealtimeLocationMap } from './RealtimeLocationMap';
import { PhotoGeotagStamp } from './PhotoGeotagStamp';
import { LiveCameraModal } from './LiveCameraModal';

interface FieldReaderAppProps {
  currentUser: UserProfile;
  customers: IndustryCustomer[];
  meterReaders: MeterReader[];
  cycleSchedules?: CycleSchedule[];
  onSaveReading: (updatedCustomer: IndustryCustomer) => void;
  onSwitchToAdmin: () => void;
  onLogout: () => void;
  onSyncNow?: () => void;
}

// Helper to sort cycles naturally (Cycle 1, Cycle 2, ..., Cycle 15)
const sortCycles = (cycles: string[]): string[] => {
  return [...cycles].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });
};

export const FieldReaderApp: React.FC<FieldReaderAppProps> = ({
  currentUser,
  customers,
  meterReaders,
  cycleSchedules = [],
  onSaveReading,
  onSwitchToAdmin,
  onLogout,
  onSyncNow
}) => {
  // Mobile UI Tabs
  const [mobileTab, setMobileTab] = useState<'tasks' | 'monitoring' | 'profile'>('tasks');

  // Device view mode
  const [isPhoneFrameMode, setIsPhoneFrameMode] = useState<boolean>(true);

  // Dark/Light Theme for Field App
  const [isFieldDarkMode, setIsFieldDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('aetra_field_reader_dark_mode') === 'true';
  });

  // Active modal reading state
  const [activeCustId, setActiveCustId] = useState<string | null>(null);
  const [inputSkrg, setInputSkrg] = useState<string>('');
  const [fotoMeterPreview, setFotoMeterPreview] = useState<string | null>(null);
  const [fotoBPMPreview, setFotoBPMPreview] = useState<string | null>(null);
  const [liveCameraTarget, setLiveCameraTarget] = useState<'meter' | 'bpm' | null>(null);
  const [meterPhotoTime, setMeterPhotoTime] = useState<string | null>(null);
  const [bpmPhotoTime, setBpmPhotoTime] = useState<string | null>(null);
  const [catatan, setCatatan] = useState<string>('');
  const [gpsLocation, setGpsLocation] = useState<string>('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number }>({ lat: -6.187214, lng: 106.541290 });
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);

  // OCR and Auto-Recognition Simulation State
  const [isOcrScanning, setIsOcrScanning] = useState<boolean>(false);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [ocrSuccessNotice, setOcrSuccessNotice] = useState<string | null>(null);

  // Search, Cycle Filter, and Status Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCycleFilter, setSelectedCycleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Belum Dibaca' | 'Pending Verification' | 'Verified' | 'Bergeser'>('ALL');
  const [isScheduleDetailsOpen, setIsScheduleDetailsOpen] = useState<boolean>(false);

  // Notification Toast
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Real-time Clock State
  const [realTimeClock, setRealTimeClock] = useState<{
    timeStr: string;
    secondsStr: string;
    fullDateStr: string;
    dayName: string;
  }>({
    timeStr: '00:00',
    secondsStr: '00',
    fullDateStr: '',
    dayName: ''
  });

  useEffect(() => {
    localStorage.setItem('aetra_field_reader_dark_mode', String(isFieldDarkMode));
  }, [isFieldDarkMode]);

  // Real-time clock timer updates every second
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');

      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];

      const dayName = dayNames[now.getDay()];
      const dayNum = now.getDate();
      const monthName = monthNames[now.getMonth()];
      const year = now.getFullYear();

      setRealTimeClock({
        timeStr: `${hours}:${mins}`,
        secondsStr: secs,
        fullDateStr: `${dayName}, ${dayNum} ${monthName} ${year}`,
        dayName
      });
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Find reader details from master data
  const currentReader = meterReaders.find(
    (r) =>
      (currentUser.readerId && r.id.toLowerCase() === currentUser.readerId.toLowerCase()) ||
      normalizeReaderName(r.nama) === normalizeReaderName(currentUser.name)
  );

  const readerTargetObj = useMemo(() => {
    if (currentReader) return currentReader;
    return {
      id: currentUser.readerId,
      nama: currentUser.name
    };
  }, [currentReader, currentUser]);

  // Synchronize assigned cycles strictly with inputted customer data (ZERO OVERLAP)
  const readerAssignedCycles = useMemo(() => {
    return getAssignedCyclesForReader(readerTargetObj, customers);
  }, [readerTargetObj, customers]);

  // Automatically fetch GPS based on Google Maps decimal degrees standard
  const fetchCurrentGPS = () => {
    if (!navigator.geolocation) {
      setGpsLocation('Lat: -6.187214, Long: 106.541290');
      setGpsCoords({ lat: -6.187214, lng: 106.541290 });
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setGpsCoords({ lat, lng });
        setGpsLocation(`Lat: ${lat.toFixed(6)}, Long: ${lng.toFixed(6)}`);
        setGpsLoading(false);
      },
      (err) => {
        console.warn('GPS Error:', err);
        setGpsLocation('Lat: -6.187214, Long: 106.541290');
        setGpsCoords({ lat: -6.187214, lng: 106.541290 });
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    fetchCurrentGPS();
  }, []);

  // Filter customers assigned strictly to this reader (cuma ditampilkan industri bagian si pencatat meter saja)
  const myAssignedCustomers = useMemo(() => {
    return getAssignedCustomersForReader(readerTargetObj, customers);
  }, [readerTargetObj, customers]);

  // Industry reading date shift tracking for field reader
  const myShiftedCustomers = useMemo(() => {
    return myAssignedCustomers.filter((c) => {
      if (c.adaPergeseran) return true;
      const sch = cycleSchedules?.find((s) => s.cycle.toLowerCase() === c.cycle.toLowerCase());
      if (sch?.adaPergeseran) {
        if (!sch.shiftedCustomerIds || sch.shiftedCustomerIds.length === 0) return true;
        return sch.shiftedCustomerIds.includes(c.id);
      }
      return false;
    });
  }, [myAssignedCustomers, cycleSchedules]);

  // Detail jadwal penugasan dari admin untuk siklus-siklus pembaca meter ini (sorted & non-overlapping)
  const assignedCycleSchedules = useMemo(() => {
    if (!cycleSchedules || cycleSchedules.length === 0 || readerAssignedCycles.length === 0) return [];
    return readerAssignedCycles.map((cName) => {
      const sch = cycleSchedules.find((s) => s.cycle.toLowerCase() === cName.toLowerCase());
      const count = myAssignedCustomers.filter((c) => c.cycle.toLowerCase() === cName.toLowerCase()).length;
      return {
        cycle: cName,
        totalPelanggan: count,
        schedule: sch || null
      };
    });
  }, [cycleSchedules, readerAssignedCycles, myAssignedCustomers]);

  // Filtered dataset for reader view - ONLY industries assigned to this reader
  const displayedCustomers = useMemo(() => {
    return myAssignedCustomers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.nama.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.lokasi && c.lokasi.toLowerCase().includes(q)) ||
        c.cycle.toLowerCase().includes(q);

      const scheduleForCust = cycleSchedules?.find((s) => s.cycle.toLowerCase() === c.cycle.toLowerCase());
      const isShifted = c.adaPergeseran || (scheduleForCust?.adaPergeseran && (!scheduleForCust.shiftedCustomerIds || scheduleForCust.shiftedCustomerIds.length === 0 || scheduleForCust.shiftedCustomerIds.includes(c.id)));

      let matchStatus = true;
      if (statusFilter === 'Bergeser') {
        matchStatus = Boolean(isShifted);
      } else if (statusFilter !== 'ALL') {
        matchStatus = c.status === statusFilter;
      }

      const matchCycle =
        selectedCycleFilter === 'ALL' ||
        c.cycle.toLowerCase() === selectedCycleFilter.toLowerCase();

      return matchSearch && matchStatus && matchCycle;
    });
  }, [myAssignedCustomers, searchQuery, statusFilter, selectedCycleFilter, cycleSchedules]);

  // Statistics
  const totalMyCust = myAssignedCustomers.length;
  const verifiedCount = myAssignedCustomers.filter((c) => c.status === 'Verified' || c.status === 'Invoiced').length;
  const pendingCount = myAssignedCustomers.filter((c) => c.status === 'Pending Verification').length;
  const unreadCount = myAssignedCustomers.filter((c) => c.status === 'Belum Dibaca').length;
  const myPercentComplete = totalMyCust > 0 ? Math.round(((verifiedCount + pendingCount) / totalMyCust) * 100) : 0;

  // ALL CYCLES PROGRESS CALCULATION (1 to 15)
  const cycleProgressStats = useMemo(() => {
    const allCyclesList = Array.from({ length: 15 }, (_, i) => `Cycle ${i + 1}`);
    return allCyclesList.map((cName) => {
      const sch = cycleSchedules?.find((s) => s.cycle.toLowerCase() === cName.toLowerCase());
      const cycleCusts = customers.filter((c) => c.cycle.toLowerCase() === cName.toLowerCase());
      const total = cycleCusts.length;
      const readCount = cycleCusts.filter((c) => c.status !== 'Belum Dibaca').length;
      const unread = cycleCusts.filter((c) => c.status === 'Belum Dibaca').length;
      const verified = cycleCusts.filter((c) => c.status === 'Verified' || c.status === 'Invoiced').length;
      const pending = cycleCusts.filter((c) => c.status === 'Pending Verification').length;
      const percent = total > 0 ? Math.round((readCount / total) * 100) : 0;
      const isMyCycle = readerAssignedCycles.some((ac) => ac.toLowerCase() === cName.toLowerCase());

      // Sinkronisasi nama petugas pencatat meter sesuai akun dan pembagian data
      const readersForThisCycle = meterReaders.filter((r) => {
        const rCycles = getAssignedCyclesForReader(r, customers);
        return rCycles.some((ac) => ac.toLowerCase() === cName.toLowerCase());
      });

      let assignedPic = '';
      if (readersForThisCycle.length > 0) {
        assignedPic = readersForThisCycle.map((r) => r.nama).join(', ');
      } else {
        const directCustReaders = Array.from(
          new Set(cycleCusts.map((c) => c.petugasBaca?.trim()).filter(Boolean))
        );
        if (directCustReaders.length > 0) {
          assignedPic = directCustReaders.join(', ');
        } else if (sch?.petugasUtama && sch.petugasUtama !== 'Belum Ditugaskan') {
          assignedPic = sch.petugasUtama;
        } else {
          assignedPic = 'Belum Ditugaskan';
        }
      }

      return {
        cycle: cName,
        total,
        readCount,
        unread,
        verified,
        pending,
        percent,
        isMyCycle,
        petugasUtama: assignedPic,
        tanggalMulai: sch?.tanggalMulai,
        tanggalSelesai: sch?.tanggalSelesai,
        hariH: sch?.hariH
      };
    });
  }, [customers, readerAssignedCycles, cycleSchedules, meterReaders]);

  // READER PROGRESS CALCULATION (ZERO OVERLAP)
  const readerProgressStats = useMemo(() => {
    return meterReaders.map((rdr) => {
      const assignedCusts = getAssignedCustomersForReader(rdr, customers);
      const sortedCycles = getAssignedCyclesForReader(rdr, customers);

      const total = assignedCusts.length;
      const completed = assignedCusts.filter((c) => c.status === 'Verified' || c.status === 'Invoiced').length;
      const pending = assignedCusts.filter((c) => c.status === 'Pending Verification').length;
      const unread = assignedCusts.filter((c) => c.status === 'Belum Dibaca').length;
      const percent = total > 0 ? Math.round(((completed + pending) / total) * 100) : 0;

      return {
        reader: rdr,
        sortedCycles,
        total,
        completed,
        pending,
        unread,
        percent
      };
    });
  }, [meterReaders, customers]);

  // Open Reading Modal
  const handleOpenReadingForm = (cust: IndustryCustomer) => {
    setActiveCustId(cust.id);
    // Stand kini HANYA terisi jika meteran sudah pernah dicatat oleh pembaca meter (bukan 'Belum Dibaca')
    const hasBeenRead = cust.status !== 'Belum Dibaca' && cust.skrg > 0 && cust.skrg !== cust.lalu;
    setInputSkrg(hasBeenRead ? String(cust.skrg) : '');
    setFotoMeterPreview(cust.fotoMeter || null);
    setFotoBPMPreview(cust.fotoBPM || null);
    setMeterPhotoTime(cust.meterWaktuFoto || null);
    setBpmPhotoTime(cust.bpmWaktuFoto || null);

    // Catatan lapangan HANYA terisi apabila pencatat/pembaca meter melakukan pengisian
    const isAutoNote =
      !cust.catatan ||
      cust.catatan.includes('Diimpor') ||
      cust.catatan.includes('Belum dibaca') ||
      cust.catatan.startsWith('Stand ');
    setCatatan(isAutoNote ? '' : cust.catatan.trim());
    setOcrConfidence(null);
    setOcrSuccessNotice(null);

    // Auto-fetch fresh GPS coordinates
    fetchCurrentGPS();
  };

  // AI OCR Auto-Recognition Simulation
  const runAutoRecognition = (imageDataUrl: string) => {
    setIsOcrScanning(true);
    setOcrSuccessNotice(null);

    const targetCustomer = customers.find((c) => c.id === activeCustId);
    if (!targetCustomer) {
      setIsOcrScanning(false);
      return;
    }

    setTimeout(() => {
      let predictedStand: number;
      if (targetCustomer.skrg > 0) {
        predictedStand = targetCustomer.skrg;
      } else {
        const estUsage = targetCustomer.kelas === 'Premium' ? Math.floor(1200 + Math.random() * 800) : Math.floor(350 + Math.random() * 400);
        predictedStand = targetCustomer.lalu + estUsage;
      }

      const confidence = Math.floor(96 + Math.random() * 4);
      setInputSkrg(String(predictedStand));
      setOcrConfidence(confidence);
      setOcrSuccessNotice(`✓ Auto-Recognize berhasil! Stand Sekarang ${predictedStand.toLocaleString()} m³ terdeteksi dari foto (Akurasi ${confidence}%).`);
      setIsOcrScanning(false);
    }, 1200);
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'meter' | 'bpm') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const now = new Date();
        const datePart = now.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        const hours = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        const waktuStr = `${datePart} ${hours}:${mins}:${secs} WIB`;

        if (type === 'meter') {
          setFotoMeterPreview(dataUrl);
          setMeterPhotoTime(waktuStr);
          runAutoRecognition(dataUrl);
        } else {
          setFotoBPMPreview(dataUrl);
          setBpmPhotoTime(waktuStr);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit reading to admin
  const handleSubmitReading = (cust: IndustryCustomer) => {
    const skrgNum = Number(inputSkrg);
    if (!skrgNum || skrgNum <= 0) {
      showColorfulAlert({
        title: 'Stand Meter Belum Valid',
        message: 'Silakan masukkan nilai Stand Sekarang yang valid (harus lebih besar dari 0) sebelum mengirim laporan.',
        type: 'warning',
        badge: 'VALIDASI NILAI'
      });
      return;
    }

    const calculatedUsage = Math.max(0, skrgNum - cust.lalu);
    const now = new Date();
    const waktuStr = `${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    const updatedCust: IndustryCustomer = {
      ...cust,
      skrg: skrgNum,
      status: 'Pending Verification',
      fotoMeter: fotoMeterPreview || '',
      fotoBPM: fotoBPMPreview || '',
      lokasiGps: gpsLocation || `Lat: ${gpsCoords.lat.toFixed(6)}, Long: ${gpsCoords.lng.toFixed(6)}`,
      latitude: gpsCoords.lat,
      longitude: gpsCoords.lng,
      gpsAkurasiMeter: 3.5,
      altitudeMeter: 26.0,
      meterLatitude: gpsCoords.lat,
      meterLongitude: gpsCoords.lng,
      bpmLatitude: Number((gpsCoords.lat + 0.00008).toFixed(6)),
      bpmLongitude: Number((gpsCoords.lng + 0.00010).toFixed(6)),
      meterWaktuFoto: meterPhotoTime || waktuStr,
      bpmWaktuFoto: bpmPhotoTime || waktuStr,
      waktuBaca: waktuStr,
      waktuBacaTimestamp: now.getTime(),
      petugasBaca: currentUser.name,
      kategoriPetugas: currentUser.kategori || 'Kontraktor (PT Hideco)',
      catatan: catatan.trim() // Terisi HANYA apabila pencatat/pembaca meter melakukan pengisian
    };

    onSaveReading(updatedCust);
    setSubmitSuccessMsg(`✓ Berhasil mengirim bacaan meter ${cust.nama}! Stand Sekarang: ${skrgNum.toLocaleString()} m³, Pemakaian: ${calculatedUsage.toLocaleString()} m³.`);
    setActiveCustId(null);
    setTimeout(() => setSubmitSuccessMsg(null), 6000);
  };

  const activeCustomer = customers.find((c) => c.id === activeCustId);
  const currentCalculatedUsage = activeCustomer
    ? Math.max(0, (Number(inputSkrg) || 0) - activeCustomer.lalu)
    : 0;
  const isNegativeUsage = activeCustomer && Number(inputSkrg) > 0 && Number(inputSkrg) < activeCustomer.lalu;

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isFieldDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'
    } flex flex-col items-center justify-start p-0 sm:p-4 md:p-6 font-sans selection:bg-orange-500 selection:text-white`}>
      
      {/* Top Desktop Controls Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-2 px-3.5 py-2.5 mb-2 sm:mb-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
          <span className="font-extrabold text-[#0055A5] dark:text-blue-400 truncate">
            SIMBA Mobile App
          </span>
          <span className="hidden sm:inline text-slate-400 shrink-0">· Akun Petugas Lapangan</span>
        </div>

        {/* Real-time Clock on Desktop Bar */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-[11px] shrink-0">
          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">{realTimeClock.fullDateStr}</span>
          <span className="font-mono font-bold text-[#0055A5] dark:text-blue-400">{realTimeClock.timeStr}:{realTimeClock.secondsStr} WIB</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Toggle Phone Frame vs Full Screen */}
          <button
            type="button"
            onClick={() => setIsPhoneFrameMode((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer text-xs"
            title="Ganti Mode Frame HP / Layar Penuh"
          >
            {isPhoneFrameMode ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline">Layar Penuh</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-orange-500" />
                <span className="hidden sm:inline">Frame HP</span>
              </>
            )}
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={() => setIsFieldDarkMode((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs text-xs"
            title="Ganti Mode Gelap / Terang"
          >
            {isFieldDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Mode Terang</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Mode Gelap</span>
              </>
            )}
          </button>

          {/* Switch back to Admin Dashboard */}
          <button
            type="button"
            onClick={onSwitchToAdmin}
            className="px-3 py-1.5 rounded-xl bg-[#0055A5] hover:bg-[#003E78] text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Dashboard Admin</span>
          </button>
        </div>
      </div>

      {/* ===================== NATURAL RESPONSIVE APP CONTAINER ===================== */}
      <div
        className={`w-full max-w-4xl mx-auto rounded-2xl border shadow-xl ${
          isFieldDarkMode ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-white text-slate-800 border-slate-200'
        } flex flex-col h-[88vh] max-h-[880px] overflow-hidden`}
      >
        {/* ===================== SYNCHRONIZED RUNNING TEXT (HP TAILORED) ===================== */}
        <div className="bg-gradient-to-r from-[#001738] via-[#004b93] via-[#0284c7] via-[#059669] via-[#d97706] to-[#E86216] text-white py-1 px-2.5 text-[10px] font-extrabold flex items-center gap-1.5 overflow-hidden border-b border-white/15 shadow-sm">
          <span className="bg-gradient-to-r from-amber-300 to-orange-400 text-slate-950 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-xs">
            <Sparkles className="w-2.5 h-2.5 text-slate-950 animate-spin" />
            <span>SIMBA HP</span>
          </span>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
            <div className="inline-block animate-marquee font-extrabold tracking-wide text-white drop-shadow-xs">
              📱 SIMBA (SISTEM INTEGRASI METERING &amp; BILLING AETRA AIR TANGERANG) • SINKRONISASI REALTIME PETUGAS LAPANGAN • PETUGAS: {currentUser.name.toUpperCase()} ({currentUser.kategori || 'PEMBACA METER'}) • {myAssignedCustomers.length} INDUSTRI DITUGASKAN • STATUS: ONLINE TERHUBUNG KE SISTEM • PT AETRA AIR TANGERANG
            </div>
          </div>
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold bg-white/20 px-1.5 py-0.2 rounded-full border border-white/20 text-white shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SYNC</span>
          </span>
        </div>

        {/* Micro Rainbow Accent Stripe */}
        <div className="h-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 via-emerald-400 via-amber-400 to-[#E86216]" />

        {/* ===================== APP TOP HEADER ===================== */}
        <div className={`px-4 py-3.5 border-b flex flex-col gap-2 ${
          isFieldDarkMode
            ? 'bg-gradient-to-r from-slate-950 via-[#071933] to-blue-950/80 border-slate-800'
            : 'bg-gradient-to-r from-white via-blue-50/60 to-orange-50/50 border-slate-200'
        }`}>
          {/* Row 1: Logo, App Title, Role Badge, and Real-time Clock */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="p-1.5 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                <AetraLogo variant="icon" className="w-8 h-8 shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="font-black text-sm tracking-tight text-[#0055A5] dark:text-blue-400 leading-none">
                    SIMBA MOBILE
                  </h1>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide shrink-0 shadow-2xs ${
                    currentUser.kategori?.includes('Key Account')
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                      : 'bg-orange-100 text-[#E86216] dark:bg-orange-950/80 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                  }`}>
                    {currentUser.kategori?.includes('Key Account') ? 'Key Account' : 'Kontraktor'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-wide bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Live
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Sistem Integrasi Metering &amp; Billing — Dokumentasi BPM Lapangan
                </p>
              </div>
            </div>

            {/* Quick Real-Time Digital Clock */}
            <div className="shrink-0 text-right bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-end gap-1 font-mono font-black text-xs text-[#0055A5] dark:text-blue-400 leading-none">
                <Clock className="w-3 h-3 text-emerald-500 animate-pulse shrink-0" />
                <span>{realTimeClock.timeStr}:{realTimeClock.secondsStr}</span>
              </div>
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 block mt-0.5 leading-none">
                {realTimeClock.dayName}
              </span>
            </div>
          </div>
        </div>

        {/* ===================== REAL-TIME DATE & SYNC BANNER ===================== */}
        <div className={`px-4 py-1.5 flex items-center justify-between gap-2 border-b text-xs ${
          isFieldDarkMode
            ? 'bg-slate-950/80 border-slate-800/80 text-slate-300'
            : 'bg-gradient-to-r from-blue-50/80 to-emerald-50/40 border-blue-100 text-slate-700'
        }`}>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Calendar className="w-3.5 h-3.5 text-[#0055A5] dark:text-blue-400 shrink-0" />
            <span className="text-[10px] font-bold truncate">{realTimeClock.fullDateStr}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (onSyncNow) {
                  onSyncNow();
                } else {
                  showColorfulAlert({
                    title: 'Sinkronisasi Berhasil! 🔄',
                    message: 'Data perangkat berhasil disinkronkan secara real-time.',
                    type: 'success',
                    badge: 'REALTIME SYNC'
                  });
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-0.5 rounded-lg text-[9px] font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
            >
              <span>🔄 Sinkronkan</span>
            </button>
            <div className="flex items-center gap-1.5 whitespace-nowrap bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                Real-Time
              </span>
            </div>
          </div>
        </div>

        {/* Global Success Notification Toast */}
        {submitSuccessMsg && (
          <div className="mx-3 mt-2 p-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 z-40">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1 break-words leading-snug">{submitSuccessMsg}</span>
          </div>
        )}

        {/* ===================== SCROLLABLE CONTENT BODY ===================== */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
          
          {/* ======================= TAB 1: DAFTAR TUGAS CATAT METER ======================= */}
          {mobileTab === 'tasks' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Petugas Banner Card - Colorful & Vibrant Gradient */}
              <div className={`p-4 rounded-2xl border relative overflow-hidden shadow-lg transition-all duration-300 ${
                isFieldDarkMode
                  ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 border-blue-500/30 text-white'
                  : 'bg-gradient-to-br from-[#0055A5] via-[#0062B8] to-[#E86216] border-transparent text-white'
              }`}>
                {/* Ambient Decorative Glows */}
                <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/15 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-orange-400/20 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 text-white flex items-center justify-center font-black text-base shadow-md shrink-0">
                      {currentUser.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h2 className="font-black text-base text-white leading-tight break-words drop-shadow-xs">
                        {currentUser.name}
                      </h2>
                      <p className="text-[11px] text-white/85 font-medium leading-snug break-words">
                        {currentReader?.nip ? `NIP: ${currentReader.nip} · ` : ''}{currentReader?.perusahaan || currentUser.perusahaan || 'PT Aetra Air Tangerang'}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/25 text-white backdrop-blur-md border border-white/30 shadow-2xs">
                          {currentUser.kategori || 'Kontraktor (PT Hideco)'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/20 text-white/90 backdrop-blur-sm border border-white/10">
                          {readerAssignedCycles.length} Cycle Ditugaskan
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress summary bar */}
                <div className="mt-3.5 pt-3 border-t border-white/20 relative z-10">
                  <div className="flex justify-between items-center gap-2 text-xs mb-1.5">
                    <span className="text-[11px] font-bold text-white/90 break-words flex items-center gap-1">
                      <span>Progress Tugas Lapangan:</span>
                    </span>
                    <span className="font-mono font-black text-xs text-white bg-black/25 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/15 shrink-0 whitespace-nowrap">
                      {verifiedCount + pendingCount} / {totalMyCust} ({myPercentComplete}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-black/25 backdrop-blur-sm rounded-full overflow-hidden p-0.5 border border-white/15">
                    <div
                      className="h-full bg-gradient-to-r from-amber-300 via-orange-300 to-emerald-300 rounded-full transition-all duration-500 shadow-xs"
                      style={{ width: `${myPercentComplete}%` }}
                    ></div>
                  </div>

                  {/* Summary Mini Cards */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 min-w-0 transition hover:bg-white/20">
                      <span className="text-[10px] font-bold text-white/80 block truncate">Belum</span>
                      <span className="font-mono font-black text-amber-200 text-sm break-words drop-shadow-xs">{unreadCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 min-w-0 transition hover:bg-white/20">
                      <span className="text-[10px] font-bold text-white/80 block truncate">Pending</span>
                      <span className="font-mono font-black text-sky-200 text-sm break-words drop-shadow-xs">{pendingCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 min-w-0 transition hover:bg-white/20">
                      <span className="text-[10px] font-bold text-white/80 block truncate">Terverifikasi</span>
                      <span className="font-mono font-black text-emerald-200 text-sm break-words drop-shadow-xs">{verifiedCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* JIKA PETUGAS BELUM MEMILIKI PLOTTING CYCLE DARI ADMIN */}
              {myAssignedCustomers.length === 0 ? (
                <div className={`p-6 rounded-3xl border text-center space-y-3 ${
                  isFieldDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white break-words">
                      {readerAssignedCycles.length === 0
                        ? 'Belum Ada Plotting Cycle dari Dashboard Admin'
                        : 'Belum Ada Data Industri di Siklus Penugasan'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto break-words">
                      {readerAssignedCycles.length === 0
                        ? `Akun petugas ${currentUser.name} belum memiliki plotting cycle dari admin dashboard. Cycle tidak ditampilkan sampai admin memplot cycle di dashboard.`
                        : `Cycle ${readerAssignedCycles.join(', ')} telah diplot, namun belum ada daftar industri yang diinput admin di menu Database & Input Cycle.`}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 text-left border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                      <Calendar className="w-3.5 h-3.5 text-[#0055A5] dark:text-blue-400 shrink-0" />
                      <span>Integrasi Sinkronisasi Admin &amp; Lapangan:</span>
                    </p>
                    <p className="break-words leading-relaxed">• Pembagian cycle bagi tiap pencatat meter diatur langsung dari Dashboard Admin (Master Data / Jadwal Cycle).</p>
                    <p className="break-words leading-relaxed">• Siklus penugasan &amp; daftar industri akan langsung muncul otomatis di aplikasi petugas lapangan saat admin melakukan plotting.</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onSwitchToAdmin}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#0055A5] hover:bg-[#003E78] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm break-words"
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Beralih ke Dashboard Admin (Plotting Cycle)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* JADWAL PENUGASAN CYCLE DARI ADMIN (HANYA DITAMPILKAN JIKA TELAH DIPLOT & TERURUT) */}
                  {assignedCycleSchedules.length > 0 && (
                    <div className={`p-3 rounded-2xl border text-xs ${
                      isFieldDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-blue-50/50 border-blue-200'
                    }`}>
                      <div
                        onClick={() => setIsScheduleDetailsOpen((prev) => !prev)}
                        className="flex items-center justify-between gap-2 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Calendar className="w-4 h-4 text-[#0055A5] dark:text-blue-400 shrink-0" />
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs break-words leading-snug">
                            Plotting Siklus dari Admin ({assignedCycleSchedules.length} Cycle Terurut)
                          </span>
                        </div>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold shrink-0 whitespace-nowrap">
                          {isScheduleDetailsOpen ? 'Sembunyikan' : 'Tampilkan'}
                        </span>
                      </div>

                      {isScheduleDetailsOpen && (
                        <div className="mt-2.5 space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                          {assignedCycleSchedules.map((item) => (
                            <div
                              key={item.cycle}
                              className={`p-2 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${
                                isFieldDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                                  <span className="break-words">{item.cycle}</span>
                                  {item.schedule?.hariH && (
                                    <span className="px-1.5 py-0.2 rounded bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 font-mono text-[9px] font-bold shrink-0">
                                      Hari-H: {item.schedule.hariH}
                                    </span>
                                  )}
                                  {item.schedule?.adaPergeseran && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white font-mono text-[9px] font-black shrink-0">
                                      Shift ({item.schedule.selisihHariPergeseran && item.schedule.selisihHariPergeseran > 0 ? `+${item.schedule.selisihHariPergeseran}` : item.schedule.selisihHariPergeseran} Hari)
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 break-words leading-tight mt-0.5">
                                  {item.schedule?.tanggalMulai ? `${item.schedule.tanggalMulai} s/d ${item.schedule.tanggalSelesai}` : 'Jadwal belum ditentukan'}
                                  {item.schedule?.catatan ? ` · ${item.schedule.catatan}` : ''}
                                </p>
                              </div>
                              <span className="font-mono font-bold text-[10px] text-blue-600 dark:text-blue-300 shrink-0 whitespace-nowrap">
                                {item.totalPelanggan} Industri
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SEARCH & FILTERING INDUSTRI SEKALIGUS CYCLE */}
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama industri, ID pelanggan, cycle, lokasi..."
                        className={`w-full pl-8 pr-8 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                          isFieldDarkMode
                            ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-400'
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                        }`}
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300 absolute left-2.5 top-2.5" />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Cycle Filter Dropdown (Menggunakan Dropdown Praktis Tanpa Digeser) */}
                    {readerAssignedCycles.length > 0 && (
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                        <label
                          htmlFor="reader-cycle-dropdown"
                          className="text-[11px] font-bold text-slate-600 dark:text-slate-200 shrink-0 flex items-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5 text-[#0055A5] dark:text-blue-400" />
                          <span>Pilih Cycle:</span>
                        </label>
                        <select
                          id="reader-cycle-dropdown"
                          value={selectedCycleFilter}
                          onChange={(e) => setSelectedCycleFilter(e.target.value)}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                            isFieldDarkMode
                              ? 'bg-slate-800 border-slate-700 text-white'
                              : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                          }`}
                        >
                          <option value="ALL">Semua Cycle ({totalMyCust} Industri)</option>
                          {readerAssignedCycles.map((cyc) => {
                            const count = myAssignedCustomers.filter(
                              (c) => c.cycle.toLowerCase() === cyc.toLowerCase()
                            ).length;
                            return (
                              <option key={cyc} value={cyc}>
                                {cyc} ({count} Industri)
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}

                    {/* Status Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      {(['ALL', 'Belum Dibaca', 'Pending Verification', 'Verified', 'Bergeser'] as const).map((st) => {
                        const isSel = statusFilter === st;
                        const label =
                          st === 'ALL'
                            ? 'Semua Status'
                            : st === 'Belum Dibaca'
                            ? 'Belum Catat'
                            : st === 'Pending Verification'
                            ? 'Pending Admin'
                            : st === 'Verified'
                            ? 'Terverifikasi'
                            : `📅 Bergeser (${myShiftedCustomers.length})`;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setStatusFilter(st)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer border ${
                              isSel
                                ? 'bg-[#0055A5] dark:bg-blue-600 text-white shadow-xs border-blue-400 font-black'
                                : st === 'Bergeser' && myShiftedCustomers.length > 0
                                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700 font-extrabold'
                                : isFieldDarkMode
                                ? 'bg-slate-800 text-slate-200 hover:text-white border-slate-700/80 hover:bg-slate-750'
                                : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* SECTION DEDIKASI: INDUSTRI BERGESER HARI BACA */}
                  {myShiftedCustomers.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/60 to-amber-100/50 dark:from-amber-950/80 dark:via-slate-900 dark:to-orange-950/60 border-2 border-amber-400 dark:border-amber-600 space-y-2.5 shadow-md">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-black text-xs text-amber-950 dark:text-amber-100 uppercase tracking-wide flex items-center gap-2">
                              <span>SECTION INDUSTRI BERGESER HARI BACA</span>
                              <span className="px-2 py-0.2 rounded-full bg-amber-600 text-white font-mono text-[9px] font-black shadow-2xs">
                                {myShiftedCustomers.length} Industri
                              </span>
                            </h4>
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-tight mt-0.5">
                              Tersinkronisasi otomatis dari Jadwal Cycle Admin SIMBA
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setStatusFilter(statusFilter === 'Bergeser' ? 'ALL' : 'Bergeser')}
                          className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] transition shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <span>{statusFilter === 'Bergeser' ? 'Tampilkan Semua' : 'Filter Section Ini'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Mini list of shifted industries for quick preview */}
                      <div className="grid grid-cols-1 gap-1.5 pt-1">
                        {myShiftedCustomers.slice(0, 3).map((cust) => {
                          const scheduleForCust = cycleSchedules?.find((s) => s.cycle.toLowerCase() === cust.cycle.toLowerCase());
                          const shiftHariHBaru = cust.hariHPergeseran || scheduleForCust?.hariH;
                          const shiftTglBaru = cust.tanggalPergeseranBaru || scheduleForCust?.tanggalPergeseranBaru || (shiftHariHBaru ? `${String(shiftHariHBaru).padStart(2, '0')} Sep 2026` : '');
                          const shiftAlasanStr = cust.alasanPergeseran || scheduleForCust?.alasanPergeseran || 'Penyesuaian Jadwal';

                          return (
                            <div
                              key={cust.id}
                              onClick={() => handleOpenReadingForm(cust)}
                              className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-amber-300 dark:border-amber-800 flex items-center justify-between text-xs gap-2 cursor-pointer hover:border-amber-500 transition shadow-2xs"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-extrabold text-slate-900 dark:text-white truncate block text-[11px]">
                                  {cust.nama}
                                </span>
                                <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                                  {cust.id} · {cust.cycle} · Alasan: {shiftAlasanStr}
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-mono font-black text-[10px] border border-amber-300 dark:border-amber-700">
                                  Tgl {shiftHariHBaru || '—'} ({shiftTglBaru})
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {myShiftedCustomers.length > 3 && (
                          <p className="text-[10px] text-amber-800 dark:text-amber-300 font-bold text-center italic pt-0.5">
                            + {myShiftedCustomers.length - 3} industri bergeser lainnya (Klik tombol filter di atas untuk melihat seluruhnya)
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Customer Cards List */}
                  <div className="flex flex-col gap-4 pt-1">
                    {displayedCustomers.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 border border-dashed rounded-2xl border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center gap-4 [word-break:break-word]">
                        <Building2 className="w-9 h-9 mx-auto opacity-40 shrink-0" />
                        <div className="space-y-1">
                          <p className="font-bold text-xs break-words [word-break:break-word]">Tidak ada industri yang cocok dengan pencarian / filter</p>
                          <p className="text-[11px] break-words [word-break:break-word]">Coba sesuaikan kata kunci pencarian atau reset filter cycle.</p>
                        </div>
                      </div>
                    ) : (
                      displayedCustomers.map((cust) => {
                        const isDone = cust.status === 'Verified' || cust.status === 'Invoiced';
                        const isPending = cust.status === 'Pending Verification';
                        const isUnread = cust.status === 'Belum Dibaca';
                        const waterUsage = !isUnread && cust.skrg > 0 ? Math.max(0, cust.skrg - cust.lalu) : 0;

                        const scheduleForCust = cycleSchedules?.find((s) => s.cycle.toLowerCase() === cust.cycle.toLowerCase());
                        const isShifted = cust.adaPergeseran || (scheduleForCust?.adaPergeseran && (!scheduleForCust.shiftedCustomerIds || scheduleForCust.shiftedCustomerIds.length === 0 || scheduleForCust.shiftedCustomerIds.includes(cust.id)));
                        const shiftHariHBaru = cust.hariHPergeseran || scheduleForCust?.hariH;
                        const shiftTglBaru = cust.tanggalPergeseranBaru || scheduleForCust?.tanggalPergeseranBaru || (shiftHariHBaru ? `${String(shiftHariHBaru).padStart(2, '0')} Sep 2026` : '');
                        const shiftAlasanStr = cust.alasanPergeseran || scheduleForCust?.alasanPergeseran || 'Penyesuaian Jadwal';

                        return (
                          <div
                            key={cust.id}
                            onClick={() => handleOpenReadingForm(cust)}
                            className={`p-4 rounded-2xl border transition duration-150 cursor-pointer hover:shadow-md flex flex-col gap-3.5 [word-break:break-word] relative overflow-hidden ${
                              isFieldDarkMode
                                ? 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-blue-700/60'
                                : 'bg-white hover:bg-slate-50/90 border-slate-200 hover:border-blue-300'
                            }`}
                          >
                            {/* Left colored border accent strip */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                              isDone ? 'bg-emerald-500' : isPending ? 'bg-blue-500' : 'bg-amber-500'
                            }`} />

                            {/* Alert Badge for Industry Reading Shift */}
                            {isShifted && (
                              <div className="p-2.5 rounded-xl bg-amber-100/90 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-xs font-semibold text-amber-950 dark:text-amber-100 flex items-start gap-2 shadow-2xs">
                                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <p className="font-black text-[10px] text-amber-900 dark:text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
                                    <span>⚠️ PERGESERAN HARI BACA</span>
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white font-mono text-[9px] font-extrabold">
                                      Jadwal Baru
                                    </span>
                                  </p>
                                  <p className="text-[11px] text-amber-900 dark:text-amber-200 font-extrabold">
                                    Hari H Asli: Tgl {cust.hariHOriginal || scheduleForCust?.hariHOriginal || 8} ➔ <strong className="underline text-amber-800 dark:text-amber-100 font-mono">Hari H Aktual: Tgl {shiftHariHBaru} ({shiftTglBaru})</strong>
                                  </p>
                                  <p className="text-[10px] text-amber-700 dark:text-amber-300 italic">
                                    Alasan: {shiftAlasanStr}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="flex items-start justify-between gap-3 pl-1 [word-break:break-word]">
                              <div className="flex flex-col gap-1.5 min-w-0 flex-1 [word-break:break-word]">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-slate-700">
                                    {cust.id}
                                  </span>
                                  <span className="font-bold text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-[#0055A5] dark:text-blue-300 shrink-0 border border-blue-200 dark:border-blue-800">
                                    {cust.cycle}
                                  </span>
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${
                                    cust.kelas === 'Premium'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                  }`}>
                                    {cust.kelas}
                                  </span>
                                </div>

                                <h3 className="font-black text-sm text-slate-900 dark:text-white leading-snug break-words [word-break:break-word]">
                                  {cust.nama}
                                </h3>

                                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-300 min-w-0 [word-break:break-word]">
                                  <MapPin className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                                  <span className="break-words [word-break:break-word] leading-tight truncate">{cust.lokasi || 'Kabupaten Tangerang'}</span>
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div className="shrink-0 text-right">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase whitespace-nowrap shadow-2xs ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                                    : isPending
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                                }`}>
                                  {isDone ? 'Verified' : isPending ? 'Pending' : 'Belum Baca'}
                                </span>
                              </div>
                            </div>

                            {/* Stand Lalu vs Stand Sekarang vs Pemakaian Air - Colorful Palette */}
                            <div className="grid grid-cols-3 gap-2 text-center text-xs pl-1 [word-break:break-word]">
                              <div className="flex flex-col gap-1 min-w-0 p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-700/60 [word-break:break-word]">
                                <span className="text-[9px] text-emerald-800 dark:text-emerald-300 block font-bold uppercase truncate">Stand Lalu</span>
                                <span className="font-mono font-bold text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm break-words [word-break:break-word] block leading-tight">
                                  {cust.lalu.toLocaleString()} m³
                                </span>
                              </div>

                              <div className="flex flex-col gap-1 min-w-0 p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-700/60 [word-break:break-word]">
                                <span className="text-[9px] text-[#0055A5] dark:text-blue-300 block font-bold uppercase truncate">Stand Kini</span>
                                <span className="font-mono font-extrabold text-[#0055A5] dark:text-blue-200 text-xs sm:text-sm break-words [word-break:break-word] block leading-tight">
                                  {!isUnread && cust.skrg > 0 ? `${cust.skrg.toLocaleString()} m³` : '—'}
                                </span>
                              </div>

                              <div className="flex flex-col gap-1 min-w-0 p-2 rounded-xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-700/60 [word-break:break-word]">
                                <span className="text-[9px] text-[#E86216] dark:text-orange-300 block font-bold uppercase truncate">Pemakaian</span>
                                <span className="font-mono font-black text-[#E86216] dark:text-orange-200 text-xs sm:text-sm break-words [word-break:break-word] block leading-tight">
                                  {!isUnread && cust.skrg > 0 ? `${waterUsage.toLocaleString()} m³` : '—'}
                                </span>
                              </div>
                            </div>

                            {/* Timestamp and action hint */}
                            <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 dark:text-slate-300 gap-3 pl-1 [word-break:break-word]">
                              <span className="break-words [word-break:break-word] leading-tight min-w-0 flex-1 truncate">
                                {cust.waktuBaca ? `🕒 ${cust.waktuBaca}` : '⚡ Ketuk untuk mulai mencatat stand'}
                              </span>
                              <span className="text-[#0055A5] dark:text-blue-300 font-bold flex items-center gap-1 shrink-0 whitespace-nowrap bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                                {isUnread ? 'Catat Stand' : 'Edit Stand'} <ChevronRight className="w-3 h-3 shrink-0" />
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ======================= TAB 2: MONITORING PRIBADI PETUGAS ======================= */}
          {mobileTab === 'monitoring' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className={`p-3.5 rounded-2xl border ${
                isFieldDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                    <BarChart3 className="w-4 h-4 text-[#E86216] shrink-0" />
                    <span>Monitoring Capaian Saya</span>
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-100 text-[#0055A5] dark:bg-blue-950 dark:text-blue-300">
                    {currentUser.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 break-words leading-relaxed">
                  Status dan progres pembacaan stand meter industri yang ditugaskan khusus ke akun Anda.
                </p>
              </div>

              {/* Personal Overall Performance Summary */}
              <div className={`p-4 rounded-3xl border shadow-sm ${
                isFieldDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gradient-to-br from-white to-blue-50/50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Capaian Pencatatan
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block">
                      {myPercentComplete}% Selesai
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold text-[#0055A5] dark:text-blue-400 block">
                      {verifiedCount + pendingCount} dari {totalMyCust} Industri
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      Sisa: {unreadCount} Belum Dibaca
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 shadow-xs ${
                      myPercentComplete === 100
                        ? 'bg-emerald-500'
                        : myPercentComplete >= 50
                        ? 'bg-[#0055A5]'
                        : 'bg-[#E86216]'
                    }`}
                    style={{ width: `${myPercentComplete}%` }}
                  />
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Total Tugas</span>
                    <span className="font-mono font-black text-sm text-slate-800 dark:text-slate-100 mt-0.5 block">
                      {totalMyCust}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60">
                    <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase">Sudah Dibaca</span>
                    <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                      {verifiedCount + pendingCount}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60">
                    <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 block uppercase">Belum Dibaca</span>
                    <span className="font-mono font-black text-sm text-amber-700 dark:text-amber-300 mt-0.5 block">
                      {unreadCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Monitoring per Assigned Cycle HANYA milik pembaca meter ini */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 px-1 break-words">
                  Rincian Penugasan Siklus Cycle Anda ({assignedCycleSchedules.length} Cycle)
                </h3>

                {assignedCycleSchedules.length === 0 ? (
                  <div className={`p-4 rounded-2xl border text-center text-xs text-slate-400 ${
                    isFieldDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    Belum ada siklus cycle yang ditugaskan ke akun Anda.
                  </div>
                ) : (
                  assignedCycleSchedules.map((cs) => {
                    const cycleCusts = myAssignedCustomers.filter(
                      (c) => c.cycle.toLowerCase() === cs.cycle.toLowerCase()
                    );
                    const total = cycleCusts.length;
                    const done = cycleCusts.filter((c) => c.status !== 'Belum Dibaca').length;
                    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

                    return (
                      <div
                        key={cs.cycle}
                        className={`p-3 rounded-2xl border transition ${
                          isFieldDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="font-black text-slate-900 dark:text-white text-xs">
                              {cs.cycle}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-100 text-[#0055A5] dark:bg-blue-950 dark:text-blue-300">
                              {total} Industri
                            </span>
                          </div>
                          <span className="font-mono font-extrabold text-xs text-[#0055A5] dark:text-cyan-400">
                            {done}/{total} ({percent}%)
                          </span>
                        </div>

                        {/* Mini progress bar */}
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              percent === 100
                                ? 'bg-emerald-500'
                                : percent >= 50
                                ? 'bg-[#0055A5]'
                                : 'bg-[#E86216]'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Jadwal: {cs.schedule?.tanggalMulai || 'Bulan Ini'} - {cs.schedule?.tanggalSelesai || 'Akhir Bulan'}</span>
                          <span className={percent === 100 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                            {percent === 100 ? '✓ Selesai Terbaca' : `Sisa ${total - done} Industri`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ======================= TAB 3: PROFIL AKUN ======================= */}
          {mobileTab === 'profile' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className={`p-4 rounded-3xl border text-center space-y-2 ${
                isFieldDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#0055A5] to-[#E86216] text-white flex items-center justify-center font-black text-xl shadow-lg mx-auto shrink-0">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="font-black text-base text-slate-900 dark:text-white break-words">
                    {currentUser.name}
                  </h2>
                  <p className="text-xs text-slate-400 break-words mt-0.5">{currentUser.title || 'Petugas Pembaca Meter'}</p>
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 text-[#E86216] dark:bg-orange-950 dark:text-orange-300 break-words">
                  {currentUser.kategori || 'Kontraktor (PT Hideco)'}
                </div>
                <p className="text-xs text-slate-400 break-words">
                  {currentUser.perusahaan || currentReader?.perusahaan || 'PT Aetra Air Tangerang'}
                </p>
              </div>

              {/* Detailed Info Card */}
              <div className={`p-3.5 rounded-2xl border space-y-2.5 text-xs ${
                isFieldDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-xs border-b pb-1.5 border-slate-200 dark:border-slate-800 break-words">
                  Informasi Akun &amp; Penugasan
                </h3>

                <div className="flex justify-between items-center py-1 gap-2">
                  <span className="text-slate-400 shrink-0">ID Petugas:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 break-words text-right">
                    {currentReader?.id || currentUser.readerId || 'KA-001'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 gap-2">
                  <span className="text-slate-400 shrink-0">NIP Petugas:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 break-words text-right">
                    {currentReader?.nip || 'AET-2026-001'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 gap-2">
                  <span className="text-slate-400 shrink-0">Total Cycle Ditugaskan:</span>
                  <span className="font-bold text-[#0055A5] dark:text-blue-400 text-right break-words flex-1">
                    {readerAssignedCycles.length > 0 ? `${readerAssignedCycles.length} Cycle Aktif` : 'Belum Ditugaskan'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 gap-2">
                  <span className="text-slate-400 shrink-0">Waktu &amp; Tanggal:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px] text-right whitespace-nowrap">
                    {realTimeClock.timeStr}:{realTimeClock.secondsStr} WIB
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 gap-2">
                  <span className="text-slate-400 shrink-0">Mode Tampilan:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 break-words text-right">
                    {isFieldDarkMode ? '🌙 Mode Gelap' : '☀️ Mode Terang'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setIsFieldDarkMode((prev) => !prev)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border cursor-pointer break-words ${
                    isFieldDarkMode
                      ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isFieldDarkMode ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
                  <span>Ganti ke {isFieldDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
                </button>

                <button
                  type="button"
                  onClick={onSwitchToAdmin}
                  className="w-full py-2.5 rounded-xl bg-[#0055A5] hover:bg-[#003E78] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs break-words"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Beralih ke Dashboard Admin</span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs break-words"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Keluar / Ganti Akun Petugas</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===================== MOBILE BOTTOM TAB NAVIGATION BAR ===================== */}
        <nav className={`px-4 py-2 border-t flex items-center justify-around text-[10px] font-bold sticky bottom-0 z-30 ${
          isFieldDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => setMobileTab('tasks')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer relative ${
              mobileTab === 'tasks'
                ? 'text-[#0055A5] dark:text-blue-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <ListTodo className="w-5 h-5" />
            <span>Tugas Catat</span>
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-amber-500"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('monitoring')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
              mobileTab === 'monitoring'
                ? 'text-[#E86216] font-extrabold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Monitoring</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('profile')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
              mobileTab === 'profile'
                ? 'text-[#0055A5] dark:text-blue-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <User className="w-5 h-5" />
            <span>Profil Akun</span>
          </button>
        </nav>
      </div>

      {/* ===================== MODAL: INPUT STAND METER, FOTO & GPS ===================== */}
      {activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
          <div className={`max-w-md w-full p-4 sm:p-5 rounded-3xl border shadow-2xl space-y-3.5 my-auto max-h-[92vh] overflow-y-auto ${
            isFieldDarkMode ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-white text-slate-900 border-slate-200'
          }`}>
            {/* Modal Header with Real-time Clock */}
            <div className="flex justify-between items-start border-b pb-2.5 border-slate-200 dark:border-slate-800 gap-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-[#0055A5] dark:text-blue-300 font-mono shrink-0">
                    {activeCustomer.id} · {activeCustomer.cycle}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 shrink-0 whitespace-nowrap">
                    <Clock className="w-3 h-3 text-emerald-500" />
                    {realTimeClock.timeStr}:{realTimeClock.secondsStr} WIB
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1 leading-snug break-words">
                  {activeCustomer.nama}
                </h3>
                <p className="text-[11px] text-slate-400 break-words leading-tight mt-0.5">{activeCustomer.lokasi || 'Kabupaten Tangerang'}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCustId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white font-mono cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* GPS Live Fetch Banner based on Google Maps standard */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs gap-2.5 ${
              isFieldDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Navigation className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none">
                    Koordinat GPS (Google Maps):
                  </span>
                  <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-300 break-words block mt-0.5 leading-tight">
                    {gpsLoading ? 'Mencari satelit GPS...' : gpsLocation || 'Lat: -6.187214, Long: 106.541290'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <a
                  href={`https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 hover:bg-blue-100 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shrink-0"
                >
                  <span>Maps ↗</span>
                </a>
                <button
                  type="button"
                  onClick={fetchCurrentGPS}
                  className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>Sync</span>
                </button>
              </div>
            </div>

            {/* Photo Capture & AI Auto Recognition Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 min-w-0 flex-1">
                  <Camera className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="break-words">Foto Bukti Fisik Lapangan</span>
                </label>
                {fotoMeterPreview && (
                  <button
                    type="button"
                    onClick={() => runAutoRecognition(fotoMeterPreview)}
                    disabled={isOcrScanning}
                    className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:bg-purple-200 shrink-0 whitespace-nowrap"
                  >
                    <Sparkles className="w-3 h-3 shrink-0" />
                    <span>{isOcrScanning ? 'Memindai...' : 'Re-Scan OCR'}</span>
                  </button>
                )}
              </div>

              {/* Photo Capture Inputs (Meter & BPM - Dual Options: Auto Kamera vs Galeri) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Foto Stand Meter */}
                <div className={`p-2.5 rounded-2xl border space-y-2 min-w-0 ${
                  isFieldDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-bold gap-1">
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 truncate font-extrabold">
                      <Camera className="w-3.5 h-3.5 text-blue-500 shrink-0" /> Foto Stand Meter
                    </span>
                    {fotoMeterPreview && <span className="text-emerald-500 font-extrabold shrink-0">✓ Tersimpan</span>}
                  </div>

                  {fotoMeterPreview ? (
                    <div className="relative h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                      <img src={fotoMeterPreview} alt="Meter" className="w-full h-full object-cover" />
                      
                      {/* OCR Scanning Laser Animation */}
                      {isOcrScanning && (
                        <div className="absolute inset-0 bg-blue-900/50 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2 z-20">
                          <div className="w-full h-1 bg-cyan-400 shadow-[0_0_12px_cyan] animate-pulse absolute top-1/2 -translate-y-1/2"></div>
                          <Scan className="w-6 h-6 animate-spin text-cyan-300 mb-1" />
                          <span className="text-[9px] font-black uppercase tracking-wider bg-black/70 px-2 py-0.5 rounded-full">
                            OCR AI Scanning...
                          </span>
                        </div>
                      )}

                      {/* Realtime GPS Geotag Stamp */}
                      {!isOcrScanning && (
                        <PhotoGeotagStamp
                          customer={{
                            ...activeCustomer,
                            fotoMeter: fotoMeterPreview,
                            meterWaktuFoto: meterPhotoTime || activeCustomer.meterWaktuFoto
                          }}
                          photoType="meter"
                        />
                      )}

                      <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 p-2 transition z-30">
                        <span className="text-white font-extrabold text-[10px] mb-0.5">Ubah Foto Meter:</span>
                        <div className="flex items-center gap-1.5 w-full">
                          <button
                            type="button"
                            onClick={() => setLiveCameraTarget('meter')}
                            className="flex-1 py-1.5 px-1.5 bg-[#0055A5] hover:bg-[#003E78] text-white font-extrabold text-[9px] rounded-lg text-center cursor-pointer transition flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Camera className="w-3 h-3 shrink-0" />
                            <span>Kamera</span>
                          </button>
                          <label className="flex-1 py-1.5 px-1.5 bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-[9px] rounded-lg text-center cursor-pointer transition flex items-center justify-center gap-1 shadow-xs">
                            <ImageIcon className="w-3 h-3 shrink-0" />
                            <span>Galeri</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(e, 'meter')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 rounded-xl flex flex-col items-center justify-center text-center bg-white/60 dark:bg-slate-900/60 space-y-2">
                      <div className="text-center">
                        <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 block leading-tight">Input Foto Stand Meter</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">Pilih salah satu metode unggah:</span>
                      </div>

                      <div className="flex items-center gap-1.5 w-full">
                        <button
                          type="button"
                          onClick={() => setLiveCameraTarget('meter')}
                          className="flex-1 py-2 px-1 bg-[#0055A5] hover:bg-[#003E78] active:scale-95 text-white font-black text-[10px] rounded-xl text-center cursor-pointer transition flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Camera className="w-3.5 h-3.5 shrink-0 text-cyan-300" />
                          <span>Kamera</span>
                        </button>
                        <label className="flex-1 py-2 px-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-100 font-black text-[10px] rounded-xl text-center cursor-pointer transition flex items-center justify-center gap-1 border border-slate-300 dark:border-slate-700 shadow-2xs">
                          <ImageIcon className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                          <span>Galeri</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, 'meter')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Foto Lembar BPM Fisik */}
                <div className={`p-2.5 rounded-2xl border space-y-2 min-w-0 ${
                  isFieldDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-bold gap-1">
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 truncate font-extrabold">
                      <FileCheck className="w-3.5 h-3.5 text-[#E86216] shrink-0" /> Foto BPM Fisik
                    </span>
                    {fotoBPMPreview && <span className="text-emerald-500 font-extrabold shrink-0">✓ Tersimpan</span>}
                  </div>

                  {fotoBPMPreview ? (
                    <div className="relative h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                      <img src={fotoBPMPreview} alt="BPM" className="w-full h-full object-cover" />
                      {/* Realtime GPS Geotag Stamp */}
                      <PhotoGeotagStamp
                        customer={{
                          ...activeCustomer,
                          fotoBPM: fotoBPMPreview,
                          bpmWaktuFoto: bpmPhotoTime || activeCustomer.bpmWaktuFoto
                        }}
                        photoType="bpm"
                      />
                      
                      <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 p-2 transition z-30">
                        <span className="text-white font-extrabold text-[10px] mb-0.5">Ubah Foto BPM:</span>
                        <div className="flex items-center gap-1.5 w-full">
                          <button
                            type="button"
                            onClick={() => setLiveCameraTarget('bpm')}
                            className="flex-1 py-1.5 px-1.5 bg-[#E86216] hover:bg-orange-600 text-white font-extrabold text-[9px] rounded-lg text-center cursor-pointer transition flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Camera className="w-3 h-3 shrink-0" />
                            <span>Kamera</span>
                          </button>
                          <label className="flex-1 py-1.5 px-1.5 bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-[9px] rounded-lg text-center cursor-pointer transition flex items-center justify-center gap-1 shadow-xs">
                            <ImageIcon className="w-3 h-3 shrink-0" />
                            <span>Galeri</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(e, 'bpm')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-400 rounded-xl flex flex-col items-center justify-center text-center bg-white/60 dark:bg-slate-900/60 space-y-2">
                      <div className="text-center">
                        <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 block leading-tight">Input Foto Dokumen BPM</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">Pilih salah satu metode unggah:</span>
                      </div>

                      <div className="flex items-center gap-1.5 w-full">
                        <button
                          type="button"
                          onClick={() => setLiveCameraTarget('bpm')}
                          className="flex-1 py-2 px-1 bg-[#E86216] hover:bg-orange-600 active:scale-95 text-white font-black text-[10px] rounded-xl text-center cursor-pointer transition flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Camera className="w-3.5 h-3.5 shrink-0 text-amber-200" />
                          <span>Kamera</span>
                        </button>
                        <label className="flex-1 py-2 px-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-100 font-black text-[10px] rounded-xl text-center cursor-pointer transition flex items-center justify-center gap-1 border border-slate-300 dark:border-slate-700 shadow-2xs">
                          <ImageIcon className="w-3.5 h-3.5 shrink-0 text-orange-600 dark:text-orange-400" />
                          <span>Galeri</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, 'bpm')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* OCR Auto-Recognition Notice */}
              {ocrSuccessNotice && (
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-700 dark:text-purple-300 font-bold flex items-center gap-1.5 animate-in fade-in duration-200">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span className="flex-1 break-words leading-snug">{ocrSuccessNotice}</span>
                </div>
              )}
            </div>

            {/* Stand Meter Inputs & Direct Water Consumption Volume */}
            <div className={`p-3.5 rounded-2xl border space-y-3 text-xs ${
              isFieldDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Stand Bulan Lalu (Sinkron Master Data Admin Excel) */}
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 truncate">
                      Stand Lalu (m³)
                    </label>
                    <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0">
                      Master
                    </span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-slate-100 font-black text-sm break-words">
                    {activeCustomer.lalu.toLocaleString()}
                  </div>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 block break-words font-medium">
                    ✓ Sinkron Excel Admin
                  </span>
                </div>

                {/* Stand Sekarang (Auto OCR / Manual) */}
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <label className="block text-[10px] font-bold uppercase text-blue-600 dark:text-blue-300 truncate">
                      Stand Sekarang (m³) *
                    </label>
                    {ocrConfidence && (
                      <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                        OCR {ocrConfidence}%
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    autoFocus
                    value={inputSkrg}
                    onChange={(e) => setInputSkrg(e.target.value)}
                    placeholder="Contoh: 14500"
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border-2 border-blue-500 dark:border-blue-400 rounded-xl font-mono text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-[9px] text-blue-600 dark:text-blue-300 mt-0.5 block font-semibold break-words leading-tight">
                    Diisi otomatis oleh OCR / edit
                  </span>
                </div>
              </div>

              {/* DIRECT WATER USAGE VOLUME (LANGSUNG TAMPILKAN VOLUMENYA TANPA RUMUS) */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-[#E86216] flex items-center justify-center shrink-0">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block leading-tight truncate">
                      Pemakaian Air Bulan Ini
                    </span>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 break-words leading-tight">
                      Volume Pemakaian
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`font-mono font-black text-base break-words ${
                    isNegativeUsage ? 'text-rose-600 dark:text-rose-400' : 'text-[#E86216] dark:text-orange-400'
                  }`}>
                    {isNegativeUsage ? '⚠️ Stand Minus' : `${currentCalculatedUsage.toLocaleString()} m³`}
                  </span>
                </div>
              </div>

              {isNegativeUsage && (
                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold px-1 break-words leading-relaxed">
                  ⚠️ Peringatan: Stand sekarang lebih kecil dari stand lalu ({activeCustomer.lalu.toLocaleString()} m³). Periksa kembali angka meter!
                </p>
              )}
            </div>

            {/* Integrated Realtime Location Map */}
            <div className="space-y-1">
              <RealtimeLocationMap customer={activeCustomer} height="h-44 sm:h-52" />
            </div>

            {/* Field Notes */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1 break-words">
                Catatan Lapangan (Opsional):
              </label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Misal: Segel utuh, disaksikan staf pabrik..."
                className={`w-full p-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldDarkMode ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveCustId(null)}
                className="px-3.5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold rounded-xl text-xs transition cursor-pointer break-words"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSubmitReading(activeCustomer)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer break-words"
              >
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span>Kirim Bacaan &amp; Sinkron Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Viewfinder Modal for Stand Meter & BPM Photo Capture */}
      {liveCameraTarget && activeCustomer && (
        <LiveCameraModal
          isOpen={Boolean(liveCameraTarget)}
          onClose={() => setLiveCameraTarget(null)}
          onCapture={(dataUrl, capturedTimestamp) => {
            if (liveCameraTarget === 'meter') {
              setFotoMeterPreview(dataUrl);
              setMeterPhotoTime(capturedTimestamp);
              runAutoRecognition(dataUrl);
            } else {
              setFotoBPMPreview(dataUrl);
              setBpmPhotoTime(capturedTimestamp);
            }
          }}
          title={
            liveCameraTarget === 'meter'
              ? 'Ambil Foto Stand Meter Fisik'
              : 'Ambil Foto Dokumen Lembar BPM'
          }
          customerName={activeCustomer.nama}
          customerId={activeCustomer.id}
          readerName={currentUser.name}
          gpsLocation={gpsLocation || `Lat: ${gpsCoords.lat.toFixed(6)}, Long: ${gpsCoords.lng.toFixed(6)}`}
          photoType={liveCameraTarget}
        />
      )}
    </div>
  );
};
