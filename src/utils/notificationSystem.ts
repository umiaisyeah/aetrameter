// Interactive Colorful Notification & Alert System for SIMBA PT Aetra Air Tangerang

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

export interface ColorfulModalOptions {
  id?: string;
  title: string;
  subtitle?: string;
  message: string;
  type?: NotificationType;
  badge?: string;
  count?: number;
  tags?: string[];
  details?: string[];
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  autoCloseMs?: number;
  playSound?: boolean;
}

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  type?: NotificationType;
  durationMs?: number;
  actionText?: string;
  onAction?: () => void;
}

type ModalListener = (modal: ColorfulModalOptions | null) => void;
type ToastListener = (toasts: (ToastOptions & { id: string; createdAt: number })[]) => void;

class NotificationManager {
  private modalListener: ModalListener | null = null;
  private toastListeners: Set<ToastListener> = new Set();
  private activeToasts: (ToastOptions & { id: string; createdAt: number })[] = [];
  private currentModal: ColorfulModalOptions | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Intercept standard window.alert to provide colorful interactive popups
    if (typeof window !== 'undefined') {
      const originalAlert = window.alert;
      window.alert = (msg: any) => {
        const text = String(msg ?? '');
        const isSuccess = text.includes('✓') || text.toLowerCase().includes('berhasil') || text.toLowerCase().includes('sukses');
        const isError = text.toLowerCase().includes('gagal') || text.toLowerCase().includes('error') || text.toLowerCase().includes('tidak boleh');
        const isWarning = text.toLowerCase().includes('mohon') || text.toLowerCase().includes('peringatan') || text.toLowerCase().includes('perhatian');

        const type: NotificationType = isSuccess ? 'success' : isError ? 'error' : isWarning ? 'warning' : 'info';
        
        let title = 'Pemberitahuan Sistem';
        if (isSuccess) title = 'Operasi Berhasil!';
        else if (isError) title = 'Perhatian / Terjadi Kesalahan';
        else if (isWarning) title = 'Konfirmasi Data';

        // Extract count if any (e.g. 250 data)
        const countMatch = text.match(/(\d+)\s+data/i);
        const count = countMatch ? parseInt(countMatch[1], 10) : undefined;

        this.showModal({
          title,
          message: text.replace(/^✓\s*/, ''),
          type,
          count,
          confirmText: 'Oke, Mengerti'
        });
      };
    }
  }

  // Melodic Web Audio API synthesizer for positive, colorful auditory feedback
  public playSound(type: NotificationType = 'success') {
    if (!this.soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);

      if (type === 'success') {
        // Melodic 3-tone chime (E5 -> G#5 -> B5) - cheerful & satisfying
        const notes = [659.25, 830.61, 987.77];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0, now + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.4);
        });
      } else if (type === 'warning') {
        // Double soft chime
        [523.25, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.1, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.35);
        });
      } else if (type === 'error') {
        // Gentle descending tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.28);
      } else {
        // Soft bubble ping
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(784, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  public registerModalListener(listener: ModalListener) {
    this.modalListener = listener;
    // Emit initial
    listener(this.currentModal);
    return () => {
      if (this.modalListener === listener) {
        this.modalListener = null;
      }
    };
  }

  public registerToastListener(listener: ToastListener) {
    this.toastListeners.add(listener);
    listener([...this.activeToasts]);
    return () => {
      this.toastListeners.delete(listener);
    };
  }

  public showModal(options: ColorfulModalOptions) {
    const id = options.id || `modal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullOptions: ColorfulModalOptions = {
      ...options,
      id,
      type: options.type || 'info',
      confirmText: options.confirmText || 'Oke, Mengerti',
      playSound: options.playSound !== false
    };

    if (fullOptions.playSound) {
      this.playSound(fullOptions.type);
    }

    this.currentModal = fullOptions;
    if (this.modalListener) {
      this.modalListener(this.currentModal);
    }
  }

  public closeModal() {
    this.currentModal = null;
    if (this.modalListener) {
      this.modalListener(null);
    }
  }

  public showToast(options: ToastOptions) {
    const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast = {
      ...options,
      id,
      type: options.type || 'info',
      createdAt: Date.now()
    };

    this.playSound(newToast.type);

    this.activeToasts = [newToast, ...this.activeToasts].slice(0, 5);
    this.notifyToastListeners();

    const duration = options.durationMs || 4500;
    setTimeout(() => {
      this.removeToast(id);
    }, duration);
  }

  public removeToast(id: string) {
    this.activeToasts = this.activeToasts.filter((t) => t.id !== id);
    this.notifyToastListeners();
  }

  private notifyToastListeners() {
    this.toastListeners.forEach((listener) => listener([...this.activeToasts]));
  }
}

export const notificationManager = new NotificationManager();

// Convenience shortcuts
export const showColorfulAlert = (options: ColorfulModalOptions) => {
  notificationManager.showModal(options);
};

export const showToast = (options: ToastOptions) => {
  notificationManager.showToast(options);
};
