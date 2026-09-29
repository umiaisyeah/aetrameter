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
  Send
} from 'lucide-react';

interface FieldReaderAppProps {
  currentUser: UserProfile;
  customers: IndustryCustomer[];
  meterReaders: MeterReader[];
  cycleSchedules?: CycleSchedule[];
  onSaveReading: (updatedCustomer: IndustryCustomer) => void;
  onSwitchToAdmin: () => void;
  onLogout: () => void;
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
  onLogout
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Belum Dibaca' | 'Pending Verification' | 'Verified'>('ALL');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<'ALL' | 'Kontraktor' | 'Key Account'>('ALL');
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
    (r) => r.id === currentUser.readerId || r.nama.toLowerCase() === currentUser.name.toLowerCase()
  );

  // Synchronize assigned cycles strictly with Database of Industrial Customers & Admin Schedules
  const readerAssignedCycles = useMemo(() => {
    const cycleSet = new Set<string>();
    const rName = (currentReader?.nama || currentUser.name || '').trim().toLowerCase();

    // 1. Dapatkan cycle langsung dari database industri yang telah diinputkan petugasnya
    customers.forEach((c) => {
      const pic = c.petugasBaca?.trim().toLowerCase();
      if (pic && rName && (pic === rName || pic.includes(rName) || rName.includes(pic))) {
        if (c.cycle && c.cycle.trim()) {
          cycleSet.add(c.cycle.trim());
        }
      }
    });

    // 2. Jika database industri memiliki cycle yang diplot lewat jadwal cycle admin
    if (cycleSchedules && Array.isArray(cycleSchedules)) {
      cycleSchedules.forEach((sch) => {
        const pic = sch.petugasUtama?.trim().toLowerCase();
        if (pic && rName && (pic === rName || pic.includes(rName) || rName.includes(pic))) {
          // Hanya masukkan jika cycle tersebut memang memiliki pelanggan yang diinput di database
          const hasCustomers = customers.some((c) => c.cycle.toLowerCase() === sch.cycle.toLowerCase());
          if (hasCustomers && sch.cycle && sch.cycle.trim()) {
            cycleSet.add(sch.cycle.trim());
          }
        }
      });
    }

    // 3. Sinkronkan dengan master data pembaca meter jika cycle tersebut ada industrinya di database
    if (currentReader?.assignedCycles && Array.isArray(currentReader.assignedCycles)) {
      currentReader.assignedCycles.forEach((c) => {
        const hasCustomers = customers.some((cust) => cust.cycle.toLowerCase() === c.toLowerCase());
        if (hasCustomers && c && c.trim()) {
          cycleSet.add(c.trim());
        }
      });
    }

    return sortCycles(Array.from(cycleSet));
  }, [currentReader, cycleSchedules, customers, currentUser.name]);

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

  // Filter customers assigned to this reader strictly based on Admin assignment
  const myAssignedCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Ditugaskan langsung per akun industri
      if (
        c.petugasBaca &&
        (c.petugasBaca.toLowerCase() === currentUser.name.toLowerCase() ||
          (currentReader && c.petugasBaca.toLowerCase() === currentReader.nama.toLowerCase()))
      ) {
        return true;
      }

      // Berada di dalam cycle yang telah ditugaskan oleh admin ke akun ini
      if (readerAssignedCycles.length > 0) {
        return readerAssignedCycles.some((ac) => ac.toLowerCase() === c.cycle.toLowerCase());
      }

      return false;
    });
  }, [customers, readerAssignedCycles, currentUser.name, currentReader]);

  // Detail jadwal penugasan dari admin untuk siklus-siklus pembaca meter ini (sorted)
  const assignedCycleSchedules = useMemo(() => {
    if (!cycleSchedules || cycleSchedules.length === 0 || readerAssignedCycles.length === 0) return [];
    return readerAssignedCycles.map((cName) => {
      const sch = cycleSchedules.find((s) => s.cycle.toLowerCase() === cName.toLowerCase());
      const count = customers.filter((c) => c.cycle.toLowerCase() === cName.toLowerCase()).length;
      return {
        cycle: cName,
        totalPelanggan: count,
        schedule: sch || null
      };
    });
  }, [cycleSchedules, readerAssignedCycles, customers]);

  // Filtered dataset for reader view with Key Account vs Kontraktor division
  const displayedCustomers = useMemo(() => {
    return myAssignedCustomers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.nama.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.lokasi && c.lokasi.toLowerCase().includes(q)) ||
        c.cycle.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchCycle = selectedCycleFilter === 'ALL' || c.cycle.toLowerCase() === selectedCycleFilter.toLowerCase();

      // Division: Key Account vs Kontraktor
      if (taskCategoryFilter === 'Kontraktor') {
        const isKont =
          c.kategoriPetugas === 'Kontraktor (PT Hideco)' ||
          c.kategoriPetugas === 'Kontraktor' ||
          (!c.kategoriPetugas && c.kelas !== 'Premium');
        if (!isKont) return false;
      } else if (taskCategoryFilter === 'Key Account') {
        const isKA =
          c.kategoriPetugas === 'Key Account' ||
          (!c.kategoriPetugas && c.kelas === 'Premium');
        if (!isKA) return false;
      }

      return matchSearch && matchStatus && matchCycle;
    });
  }, [myAssignedCustomers, searchQuery, statusFilter, selectedCycleFilter, taskCategoryFilter]);

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

      let assignedPic = sch?.petugasUtama;
      if (!assignedPic || assignedPic === 'Belum Ditugaskan') {
        const found = meterReaders.find((r) =>
          r.assignedCycles.some((ac) => ac.toLowerCase() === cName.toLowerCase())
        );
        if (found) assignedPic = found.nama;
        else assignedPic = 'Belum Ditugaskan';
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

  // READER PROGRESS CALCULATION
  const readerProgressStats = useMemo(() => {
    return meterReaders.map((rdr) => {
      const assignedCusts = customers.filter((c) => {
        if (c.petugasBaca && c.petugasBaca.toLowerCase() === rdr.nama.toLowerCase()) {
          return true;
        }
        return rdr.assignedCycles.some((ac) => ac.toLowerCase() === c.cycle.toLowerCase());
      });

      const total = assignedCusts.length;
      const completed = assignedCusts.filter((c) => c.status === 'Verified' || c.status === 'Invoiced').length;
      const pending = assignedCusts.filter((c) => c.status === 'Pending Verification').length;
      const unread = assignedCusts.filter((c) => c.status === 'Belum Dibaca').length;
      const percent = total > 0 ? Math.round(((completed + pending) / total) * 100) : 0;

      return {
        reader: rdr,
        sortedCycles: sortCycles(rdr.assignedCycles),
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
    setInputSkrg(cust.skrg > 0 ? String(cust.skrg) : '');
    setFotoMeterPreview(cust.fotoMeter || null);
    setFotoBPMPreview(cust.fotoBPM || null);
    setCatatan(cust.catatan || '');
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
        if (type === 'meter') {
          setFotoMeterPreview(dataUrl);
          runAutoRecognition(dataUrl);
        } else {
          setFotoBPMPreview(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit reading to admin
  const handleSubmitReading = (cust: IndustryCustomer) => {
    const skrgNum = Number(inputSkrg);
    if (!skrgNum || skrgNum <= 0) {
      alert('Silakan masukkan nilai Stand Sekarang yang valid.');
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
      lokasiGps: gpsLocation || 'Lat: -6.187214, Long: 106.541290',
      waktuBaca: waktuStr,
      petugasBaca: currentUser.name,
      kategoriPetugas: currentUser.kategori || 'Kontraktor (PT Hideco)',
      catatan:
        catatan.trim() ||
        `Stand ${skrgNum.toLocaleString()} m³ (Pemakaian: ${calculatedUsage.toLocaleString()} m³) dicatat oleh ${currentUser.name} (${waktuStr})`
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
            SIMBA-IN Mobile App
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

        {/* ===================== APP TOP HEADER ===================== */}
        <div className={`px-4 py-3.5 border-b flex flex-col gap-2 ${
          isFieldDarkMode
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/60 border-slate-800'
            : 'bg-gradient-to-r from-white via-blue-50/40 to-orange-50/30 border-slate-200'
        }`}>
          {/* Row 1: Logo, App Title, Role Badge, and Real-time Clock */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="p-1 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                <AetraLogo variant="icon" className="w-8 h-8 shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="font-black text-sm tracking-tight text-[#0055A5] dark:text-blue-400 leading-none">
                    SIMBA-IN MOBILE
                  </h1>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide shrink-0 ${
                    currentUser.kategori?.includes('Key Account')
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                      : 'bg-orange-100 text-[#E86216] dark:bg-orange-950/80 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                  }`}>
                    {currentUser.kategori?.includes('Key Account') ? 'Key Account' : 'Kontraktor'}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Pencatatan Meter Industri
                </p>
              </div>
            </div>

            {/* Quick Real-Time Digital Clock */}
            <div className="shrink-0 text-right bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
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
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
              Sinkron Real-Time
            </span>
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
              {/* Petugas Banner Card */}
              <div className={`p-3.5 rounded-2xl border relative overflow-hidden ${
                isFieldDarkMode ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 border-slate-800' : 'bg-gradient-to-br from-[#0055A5]/5 via-white to-orange-50/30 border-slate-200'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0055A5] to-[#E86216] text-white flex items-center justify-center font-black text-sm shadow-md shrink-0">
                      {currentUser.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h2 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug break-words">
                        {currentUser.name}
                      </h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug break-words">
                        {currentReader?.nip ? `NIP: ${currentReader.nip} · ` : ''}{currentReader?.perusahaan || currentUser.perusahaan || 'PT Aetra Air Tangerang'}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase break-words shrink-0 ${
                          currentUser.kategori?.includes('Key Account')
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                        }`}>
                          {currentUser.kategori || 'Kontraktor (PT Hideco)'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 break-words leading-tight">
                          {readerAssignedCycles.length > 0
                            ? `Plotting: ${readerAssignedCycles.join(', ')}`
                            : '⚠️ Belum Ada Plotting Cycle'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress summary bar */}
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80">
                  <div className="flex justify-between items-center gap-2 text-xs mb-1.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 break-words">
                      Progress Tugas Lapangan:
                    </span>
                    <span className="font-mono font-extrabold text-xs text-[#0055A5] dark:text-blue-400 shrink-0 whitespace-nowrap">
                      {verifiedCount + pendingCount} / {totalMyCust} ({myPercentComplete}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0055A5] to-[#E86216] rounded-full transition-all duration-500"
                      style={{ width: `${myPercentComplete}%` }}
                    ></div>
                  </div>

                  {/* Summary Mini Cards */}
                  <div className="grid grid-cols-3 gap-2 mt-2.5 text-center text-xs">
                    <div className={`p-2 rounded-xl border min-w-0 ${
                      isFieldDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <span className="text-[10px] font-bold text-slate-400 block truncate">Belum</span>
                      <span className="font-mono font-extrabold text-amber-500 text-sm break-words">{unreadCount}</span>
                    </div>
                    <div className={`p-2 rounded-xl border min-w-0 ${
                      isFieldDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <span className="text-[10px] font-bold text-slate-400 block truncate">Pending</span>
                      <span className="font-mono font-extrabold text-blue-500 text-sm break-words">{pendingCount}</span>
                    </div>
                    <div className={`p-2 rounded-xl border min-w-0 ${
                      isFieldDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <span className="text-[10px] font-bold text-slate-400 block truncate">Terverifikasi</span>
                      <span className="font-mono font-extrabold text-emerald-500 text-sm break-words">{verifiedCount}</span>
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
                        className={`w-full pl-8 pr-8 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-[#0055A5] ${
                          isFieldDarkMode
                            ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                        }`}
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* PEMBAGIAN KATEGORI: SEMUA vs KONTRAKTOR vs KEY ACCOUNT */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                      <button
                        type="button"
                        onClick={() => setTaskCategoryFilter('ALL')}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer break-words ${
                          taskCategoryFilter === 'ALL'
                            ? 'bg-[#0055A5] text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                        }`}
                      >
                        Semua ({myAssignedCustomers.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskCategoryFilter('Kontraktor')}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer break-words ${
                          taskCategoryFilter === 'Kontraktor'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                        }`}
                      >
                        <span>Kontraktor</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskCategoryFilter('Key Account')}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer break-words ${
                          taskCategoryFilter === 'Key Account'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                        }`}
                      >
                        <span>Key Account</span>
                      </button>
                    </div>

                    {/* Cycle Filter Pills (Terurut) */}
                    {readerAssignedCycles.length > 1 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                        <span className="text-[10px] font-bold text-slate-400 shrink-0">Filter Cycle:</span>
                        <button
                          type="button"
                          onClick={() => setSelectedCycleFilter('ALL')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                            selectedCycleFilter === 'ALL'
                              ? 'bg-[#E86216] text-white shadow-xs'
                              : isFieldDarkMode
                              ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Semua Cycle ({totalMyCust})
                        </button>
                        {readerAssignedCycles.map((cyc) => {
                          const count = myAssignedCustomers.filter((c) => c.cycle.toLowerCase() === cyc.toLowerCase()).length;
                          const isSel = selectedCycleFilter.toLowerCase() === cyc.toLowerCase();
                          return (
                            <button
                              key={cyc}
                              type="button"
                              onClick={() => setSelectedCycleFilter(cyc)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                                isSel
                                  ? 'bg-[#E86216] text-white shadow-xs'
                                  : isFieldDarkMode
                                  ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {cyc} ({count})
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Status Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      {(['ALL', 'Belum Dibaca', 'Pending Verification', 'Verified'] as const).map((st) => {
                        const isSel = statusFilter === st;
                        const label =
                          st === 'ALL'
                            ? 'Semua Status'
                            : st === 'Belum Dibaca'
                            ? 'Belum Catat'
                            : st === 'Pending Verification'
                            ? 'Pending Admin'
                            : 'Terverifikasi';
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setStatusFilter(st)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                              isSel
                                ? 'bg-[#0055A5] text-white shadow-xs'
                                : isFieldDarkMode
                                ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

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
                        const isKA =
                          cust.kategoriPetugas === 'Key Account' ||
                          (!cust.kategoriPetugas && cust.kelas === 'Premium');
                        const waterUsage = cust.skrg > 0 ? Math.max(0, cust.skrg - cust.lalu) : 0;

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

                            <div className="flex items-start justify-between gap-3 pl-1 [word-break:break-word]">
                              <div className="flex flex-col gap-1.5 min-w-0 flex-1 [word-break:break-word]">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-slate-700">
                                    {cust.id}
                                  </span>
                                  <span className="font-bold text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-[#0055A5] dark:text-blue-300 shrink-0 border border-blue-200 dark:border-blue-800">
                                    {cust.cycle}
                                  </span>
                                  {/* Kategori Badge */}
                                  <span
                                    className={`font-black text-[9px] px-2 py-0.5 rounded-md uppercase shrink-0 ${
                                      isKA
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                    }`}
                                  >
                                    {isKA ? 'Key Account' : 'Kontraktor'}
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

                                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-400 min-w-0 [word-break:break-word]">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="break-words [word-break:break-word] leading-tight truncate">{cust.lokasi || 'Kabupaten Tangerang'}</span>
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div className="shrink-0 text-right">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase whitespace-nowrap shadow-2xs ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                    : isPending
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                }`}>
                                  {isDone ? 'Verified' : isPending ? 'Pending' : 'Belum Baca'}
                                </span>
                              </div>
                            </div>

                            {/* Stand Lalu vs Stand Sekarang vs Pemakaian Air - Colorful Palette */}
                            <div className="grid grid-cols-3 gap-2 text-center text-xs pl-1 [word-break:break-word]">
                              <div className="flex flex-col gap-1 min-w-0 p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 [word-break:break-word]">
                                <span className="text-[9px] text-emerald-700 dark:text-emerald-400 block font-bold uppercase truncate">Stand Lalu</span>
                                <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm break-words [word-break:break-word] block leading-tight">
                                  {cust.lalu.toLocaleString()} m³
                                </span>
                              </div>

                              <div className="flex flex-col gap-1 min-w-0 p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60 [word-break:break-word]">
                                <span className="text-[9px] text-[#0055A5] dark:text-blue-400 block font-bold uppercase truncate">Stand Kini</span>
                                <span className="font-mono font-extrabold text-[#0055A5] dark:text-blue-300 text-xs sm:text-sm break-words [word-break:break-word] block leading-tight">
                                  {cust.skrg > 0 ? `${cust.skrg.toLocaleString()} m³` : '—'}
                                </span>
                              </div>

                              <div className="flex flex-col gap-1 min-w-0 p-2 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/70 dark:border-orange-800/60 [word-break:break-word]">
                                <span className="text-[9px] text-[#E86216] dark:text-orange-400 block font-bold uppercase truncate">Pemakaian</span>
                                <span className="font-mono font-black text-[#E86216] dark:text-orange-300 text-xs sm:text-sm break-words [word-break:break-word] block leading-tight">
                                  {cust.skrg > 0 ? `${waterUsage.toLocaleString()} m³` : '—'}
                                </span>
                              </div>
                            </div>

                            {/* Timestamp and action hint */}
                            <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 gap-3 pl-1 [word-break:break-word]">
                              <span className="break-words [word-break:break-word] leading-tight min-w-0 flex-1 truncate">
                                {cust.waktuBaca ? `🕒 ${cust.waktuBaca}` : '⚡ Ketuk untuk mulai mencatat stand'}
                              </span>
                              <span className="text-[#0055A5] dark:text-blue-400 font-bold flex items-center gap-1 shrink-0 whitespace-nowrap bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg">
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

          {/* ======================= TAB 2: MONITORING KESELURUHAN ======================= */}
          {mobileTab === 'monitoring' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className={`p-3.5 rounded-2xl border ${
                isFieldDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h2 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                  <BarChart3 className="w-4 h-4 text-[#E86216] shrink-0" />
                  <span className="break-words">Monitoring Progress Catat Meter Lapangan</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5 break-words leading-relaxed">
                  Status keterbacaan seluruh siklus cycle dan tim petugas lapangan.
                </p>
              </div>

              {/* Monitoring per Cycle (1 - 15) */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 px-1 break-words">
                  Progress Seluruh Cycle (Cycle 1 s/d 15)
                </h3>

                {cycleProgressStats.map((st) => (
                  <div
                    key={st.cycle}
                    className={`p-3 rounded-2xl border transition ${
                      st.isMyCycle
                        ? isFieldDarkMode
                          ? 'bg-blue-950/30 border-blue-800/80'
                          : 'bg-blue-50/70 border-blue-200'
                        : isFieldDarkMode
                        ? 'bg-slate-900 border-slate-800'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                        <span className="font-black text-slate-900 dark:text-white text-xs break-words">
                          {st.cycle}
                        </span>
                        {st.isMyCycle && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#E86216] text-white shrink-0">
                            Tugas Saya
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 break-words leading-tight">
                          · {st.petugasUtama}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-xs text-[#0055A5] dark:text-blue-400 shrink-0 whitespace-nowrap">
                        {st.percent}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          st.percent === 100
                            ? 'bg-emerald-500'
                            : st.percent >= 50
                            ? 'bg-[#0055A5]'
                            : 'bg-[#E86216]'
                        }`}
                        style={{ width: `${st.percent}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 gap-2 flex-wrap">
                      <span className="break-words">Total: {st.total} Industri</span>
                      <span className="break-words">Selesai: {st.verified + st.pending} / {st.total}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress per Tim Petugas */}
              <div className="space-y-2 pt-2">
                <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 px-1 break-words">
                  Progress Tim Pembaca Meter
                </h3>

                {readerProgressStats.map((rp) => (
                  <div
                    key={rp.reader.id}
                    className={`p-3 rounded-2xl border ${
                      rp.reader.id === currentUser.readerId
                        ? isFieldDarkMode
                          ? 'bg-orange-950/20 border-orange-800/80'
                          : 'bg-orange-50/60 border-orange-200'
                        : isFieldDarkMode
                        ? 'bg-slate-900 border-slate-800'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1 gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 dark:text-white break-words">
                            {rp.reader.nama}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase shrink-0 ${
                            rp.reader.kategori === 'Key Account'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {rp.reader.kategori}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 break-words leading-tight">
                          {rp.sortedCycles.length > 0 ? `Cycle: ${rp.sortedCycles.join(', ')}` : 'Belum Ada Plotting'}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-xs text-[#0055A5] dark:text-blue-400 shrink-0 whitespace-nowrap">
                        {rp.percent}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-gradient-to-r from-[#0055A5] to-[#E86216] rounded-full"
                        style={{ width: `${rp.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
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
                  <span className="text-slate-400 shrink-0">Plotting Cycle:</span>
                  <span className="font-bold text-[#0055A5] dark:text-blue-400 text-right break-words flex-1">
                    {readerAssignedCycles.length > 0 ? readerAssignedCycles.join(', ') : 'Belum Ditugaskan'}
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

              {/* Photo Capture Inputs (Meter & BPM) */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {/* Foto Stand Meter */}
                <div className={`p-2.5 rounded-2xl border space-y-1.5 min-w-0 ${
                  isFieldDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-bold gap-1">
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 truncate">
                      <Camera className="w-3 h-3 text-blue-500 shrink-0" /> Foto Meter
                    </span>
                    {fotoMeterPreview && <span className="text-emerald-500 shrink-0">✓ OK</span>}
                  </div>

                  {fotoMeterPreview ? (
                    <div className="relative h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                      <img src={fotoMeterPreview} alt="Meter" className="w-full h-full object-cover" />
                      
                      {/* OCR Scanning Laser Animation */}
                      {isOcrScanning && (
                        <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                          <div className="w-full h-1 bg-cyan-400 shadow-[0_0_12px_cyan] animate-pulse absolute top-1/2 -translate-y-1/2"></div>
                          <Scan className="w-6 h-6 animate-spin text-cyan-300 mb-1" />
                          <span className="text-[9px] font-black uppercase tracking-wider bg-black/60 px-1.5 py-0.5 rounded">
                            OCR AI Scanning...
                          </span>
                        </div>
                      )}

                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white font-bold text-[10px] transition">
                        <span>Ganti Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handlePhotoUpload(e, 'meter')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="h-28 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 rounded-xl flex flex-col items-center justify-center p-2 text-center cursor-pointer transition bg-white/50 dark:bg-slate-900/50">
                      <Camera className="w-6 h-6 text-blue-500 mb-1 shrink-0" />
                      <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300 break-words leading-tight">Ambil Foto Meter</span>
                      <span className="text-[8px] text-slate-400 mt-0.5 break-words">Auto-OCR Stand Meter</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePhotoUpload(e, 'meter')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Foto Lembar BPM Fisik */}
                <div className={`p-2.5 rounded-2xl border space-y-1.5 min-w-0 ${
                  isFieldDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-bold gap-1">
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 truncate">
                      <FileCheck className="w-3 h-3 text-[#E86216] shrink-0" /> Foto BPM
                    </span>
                    {fotoBPMPreview && <span className="text-emerald-500 shrink-0">✓ OK</span>}
                  </div>

                  {fotoBPMPreview ? (
                    <div className="relative h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                      <img src={fotoBPMPreview} alt="BPM" className="w-full h-full object-cover" />
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white font-bold text-[10px] transition">
                        <span>Ganti Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handlePhotoUpload(e, 'bpm')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="h-28 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-400 rounded-xl flex flex-col items-center justify-center p-2 text-center cursor-pointer transition bg-white/50 dark:bg-slate-900/50">
                      <FileCheck className="w-6 h-6 text-orange-500 mb-1 shrink-0" />
                      <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300 break-words leading-tight">Ambil Foto BPM</span>
                      <span className="text-[8px] text-slate-400 mt-0.5 break-words">Bukti Fisik Tertulis</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePhotoUpload(e, 'bpm')}
                        className="hidden"
                      />
                    </label>
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
                    <label className="block text-[10px] font-bold uppercase text-slate-400 truncate">
                      Stand Lalu (m³)
                    </label>
                    <span className="text-[8px] font-bold px-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                      Master
                    </span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-700 dark:text-slate-300 font-black text-sm break-words">
                    {activeCustomer.lalu.toLocaleString()}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 block break-words">
                    ✓ Sinkron Excel Admin
                  </span>
                </div>

                {/* Stand Sekarang (Auto OCR / Manual) */}
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <label className="block text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 truncate">
                      Stand Sekarang (m³) *
                    </label>
                    {ocrConfidence && (
                      <span className="text-[8px] font-bold px-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 shrink-0">
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
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-xl font-mono text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-[9px] text-blue-500 mt-0.5 block font-medium break-words leading-tight">
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
                    <span className="text-[10px] font-bold uppercase text-slate-400 block leading-tight truncate">
                      Pemakaian Air Bulan Ini
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 break-words leading-tight">
                      Volume Pemakaian
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`font-mono font-black text-base break-words ${
                    isNegativeUsage ? 'text-rose-600' : 'text-[#E86216]'
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

            {/* Field Notes */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 break-words">
                Catatan Lapangan (Opsional):
              </label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Misal: Segel utuh, disaksikan staf pabrik..."
                className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
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
    </div>
  );
};
