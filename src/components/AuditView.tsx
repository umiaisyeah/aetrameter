import React, { useState } from 'react';
import { AuditLog } from '../types';
import { History, Trash2, Search, Filter } from 'lucide-react';

interface AuditViewProps {
  logs: AuditLog[];
  onClearLogs: () => void;
}

export const AuditView: React.FC<AuditViewProps> = ({ logs, onClearLogs }) => {
  const [searchTxt, setSearchTxt] = useState('');
  const [userFilter, setUserFilter] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      log.desc.toLowerCase().includes(searchTxt.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTxt.toLowerCase());
    const matchUser = userFilter === 'ALL' || log.user === userFilter;
    return matchSearch && matchUser;
  });

  const uniqueUsers = Array.from(new Set(logs.map((l) => l.user)));

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <h2 className="font-extrabold text-[#0055A5] dark:text-blue-400 text-base flex items-center gap-2">
              <History className="w-5 h-5" />
              <span>Log Audit & Rekam Jejak Aktivitas Sistem</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Seluruh rekaman pembacaan stand meter, verifikasi supervisor, dan penerbitan faktur invoice tercatat secara akuntabel.
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm('Yakin ingin membersihkan seluruh rekaman log audit sistem?')) {
                onClearLogs();
              }
            }}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan Log</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchTxt}
              onChange={(e) => setSearchTxt(e.target.value)}
              placeholder="Cari deskripsi aktivitas atau pengguna..."
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">Semua Pengguna</option>
              {uniqueUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Log table */}
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-700 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 uppercase font-extrabold text-[10px]">
                <th className="p-3">Waktu Transaksi</th>
                <th className="p-3">Pengguna</th>
                <th className="p-3">Peran Operasional</th>
                <th className="p-3">Deskripsi Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">
                    Belum ada riwayat aktivitas yang tercatat.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums text-[11px]">
                      {log.time}
                    </td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{log.user}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-[#0055A5] dark:text-blue-300 rounded text-[10px] font-bold">
                        {log.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{log.desc}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
