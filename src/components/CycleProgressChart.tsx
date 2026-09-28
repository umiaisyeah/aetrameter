import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { IndustryCustomer, MeterReader, CycleSchedule, ReaderCategory } from '../types';
import {
  BarChart3,
  TrendingUp,
  Building2,
  Shield,
  Layers,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  Calendar,
  Filter,
  Users
} from 'lucide-react';

interface CycleProgressChartProps {
  customers: IndustryCustomer[];
  meterReaders: MeterReader[];
  cycleSchedules: CycleSchedule[];
  onSelectCycle: (cycle: string) => void;
}

interface CycleChartData {
  cycle: string;
  cycleNum: number;
  hariH: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  total: number;
  completed: number;
  pending: number;
  percentage: number;
  // Kontraktor breakdown in this cycle
  hidecoTotal: number;
  hidecoCompleted: number;
  hidecoPending: number;
  hidecoReader: string;
  // Key Account breakdown in this cycle
  keyAccountTotal: number;
  keyAccountCompleted: number;
  keyAccountPending: number;
  keyAccountReader: string;
  totalVolume: number;
}

export const CycleProgressChart: React.FC<CycleProgressChartProps> = ({
  customers,
  meterReaders,
  cycleSchedules,
  onSelectCycle
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // View state
  const [metricMode, setMetricMode] = useState<'percentage' | 'count'>('percentage');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'Kontraktor' | 'Key Account'>('ALL');
  const [selectedCycleName, setSelectedCycleName] = useState<string | null>(null);

  // Prepare chart dataset where each cycle can have BOTH Kontraktor and Key Account
  const chartData: CycleChartData[] = useMemo(() => {
    const allCycles = Array.from({ length: 15 }, (_, i) => `Cycle ${i + 1}`);

    return allCycles.map((cName, idx) => {
      const cycleNum = idx + 1;
      const cycleCusts = customers.filter((c) => c.cycle.toLowerCase() === cName.toLowerCase());

      // Customers assigned to Kontraktor in this cycle
      const hidecoCusts = cycleCusts.filter((c) => {
        if (c.kategoriPetugas) return c.kategoriPetugas !== 'Key Account';
        return c.kelas !== 'Premium';
      });

      // Customers assigned to Key Account in this cycle
      const kaCusts = cycleCusts.filter((c) => {
        if (c.kategoriPetugas) return c.kategoriPetugas === 'Key Account';
        return c.kelas === 'Premium';
      });

      const total = cycleCusts.length;
      const completed = cycleCusts.filter(
        (c) => c.status === 'Verified' || c.status === 'Invoiced'
      ).length;
      const pending = cycleCusts.filter(
        (c) => c.status === 'Pending Verification' || c.status === 'Belum Dibaca'
      ).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      const totalVolume = cycleCusts.reduce((acc, curr) => acc + Math.max(0, curr.skrg - curr.lalu), 0);

      // Contractor counts
      const hidecoCompleted = hidecoCusts.filter(
        (c) => c.status === 'Verified' || c.status === 'Invoiced'
      ).length;
      const hidecoPending = hidecoCusts.length - hidecoCompleted;

      // Key Account counts
      const kaCompleted = kaCusts.filter(
        (c) => c.status === 'Verified' || c.status === 'Invoiced'
      ).length;
      const kaPending = kaCusts.length - kaCompleted;

      // Find schedule info
      const sch = cycleSchedules.find((s) => s.cycle.toLowerCase() === cName.toLowerCase());

      // Reader names
      const hidecoReaderObj = meterReaders.find(
        (m) => m.kategori !== 'Key Account' && m.assignedCycles.includes(cName)
      ) || meterReaders.find((m) => m.kategori !== 'Key Account');

      const kaReaderObj = meterReaders.find(
        (m) => m.kategori === 'Key Account' && m.assignedCycles.includes(cName)
      ) || meterReaders.find((m) => m.kategori === 'Key Account');

      return {
        cycle: cName,
        cycleNum,
        hariH: sch?.hariH || idx + 1,
        tanggalMulai: `Hari H: Tgl ${sch?.hariH || idx + 1}`,
        tanggalSelesai: `Tgl ${(sch?.hariH || idx + 1) + 1}`,
        total,
        completed,
        pending,
        percentage,
        hidecoTotal: hidecoCusts.length,
        hidecoCompleted,
        hidecoPending,
        hidecoReader: hidecoReaderObj?.nama || 'Belum Ditugaskan',
        keyAccountTotal: kaCusts.length,
        keyAccountCompleted: kaCompleted,
        keyAccountPending: kaPending,
        keyAccountReader: kaReaderObj?.nama || 'Belum Ditugaskan',
        totalVolume
      };
    });
  }, [customers, meterReaders, cycleSchedules]);

  // Filtered dataset according to category filter
  const activeData = useMemo(() => {
    return chartData.map((d) => {
      if (categoryFilter === 'Kontraktor') {
        const perc = d.hidecoTotal > 0 ? Math.round((d.hidecoCompleted / d.hidecoTotal) * 100) : 0;
        return {
          ...d,
          total: d.hidecoTotal,
          completed: d.hidecoCompleted,
          pending: d.hidecoPending,
          percentage: perc
        };
      } else if (categoryFilter === 'Key Account') {
        const perc = d.keyAccountTotal > 0 ? Math.round((d.keyAccountCompleted / d.keyAccountTotal) * 100) : 0;
        return {
          ...d,
          total: d.keyAccountTotal,
          completed: d.keyAccountCompleted,
          pending: d.keyAccountPending,
          percentage: perc
        };
      }
      return d;
    });
  }, [chartData, categoryFilter]);

  // Aggregate stats
  const overallAvgRate = useMemo(() => {
    const totalCust = activeData.reduce((acc, c) => acc + c.total, 0);
    const totalComp = activeData.reduce((acc, c) => acc + c.completed, 0);
    return totalCust > 0 ? Math.round((totalComp / totalCust) * 100) : 0;
  }, [activeData]);

  // Hideco aggregate
  const hidecoStats = useMemo(() => {
    const total = chartData.reduce((acc, c) => acc + c.hidecoTotal, 0);
    const comp = chartData.reduce((acc, c) => acc + c.hidecoCompleted, 0);
    const perc = total > 0 ? Math.round((comp / total) * 100) : 0;
    return { total, comp, perc };
  }, [chartData]);

  // Key account aggregate
  const keyAccountStats = useMemo(() => {
    const total = chartData.reduce((acc, c) => acc + c.keyAccountTotal, 0);
    const comp = chartData.reduce((acc, c) => acc + c.keyAccountCompleted, 0);
    const perc = total > 0 ? Math.round((comp / total) * 100) : 0;
    return { total, comp, perc };
  }, [chartData]);

  // D3 Render Effect
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 25, right: 25, bottom: 45, left: 45 };
    const width = 850;
    const height = 280;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('class', 'w-full h-auto overflow-visible');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale
    const xScale = d3
      .scaleBand()
      .domain(activeData.map((d) => d.cycle))
      .range([0, innerWidth])
      .padding(0.24);

    // Y Scale
    const maxVal = metricMode === 'percentage' ? 100 : Math.max(5, d3.max(activeData, (d) => d.total) || 5);
    const yScale = d3.scaleLinear().domain([0, maxVal]).nice().range([innerHeight, 0]);

    // Grid lines
    const yGrid = d3
      .axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'grid-lines opacity-20 dark:opacity-10 stroke-slate-300 dark:stroke-slate-600')
      .call(yGrid);

    // Average Benchmark Line
    if (metricMode === 'percentage' && overallAvgRate > 0) {
      const avgY = yScale(overallAvgRate);
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', avgY)
        .attr('y2', avgY)
        .attr('stroke', '#0055A5')
        .attr('stroke-dasharray', '4,4')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.7);

      g.append('text')
        .attr('x', innerWidth - 5)
        .attr('y', avgY - 6)
        .attr('text-anchor', 'end')
        .attr('fill', '#0055A5')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .text(`Rata-rata: ${overallAvgRate}%`);
    }

    // Tooltip reference
    const tooltip = d3.select('#d3-cycle-tooltip');

    // Render Bars
    const barGroups = g
      .selectAll('.bar-group')
      .data(activeData)
      .enter()
      .append('g')
      .attr('class', 'bar-group cursor-pointer');

    // Background Bar Track
    barGroups
      .append('rect')
      .attr('x', (d) => xScale(d.cycle) || 0)
      .attr('y', 0)
      .attr('width', xScale.bandwidth())
      .attr('height', innerHeight)
      .attr('rx', 6)
      .attr('fill', '#f1f5f9')
      .attr('class', 'dark:fill-slate-700/40')
      .attr('opacity', 0.5);

    // Foreground Progress Bar
    barGroups
      .append('rect')
      .attr('x', (d) => xScale(d.cycle) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('rx', 6)
      .attr('fill', (d) => {
        if (selectedCycleName === d.cycle) return '#E86216'; // Active orange
        if (d.percentage === 100) return '#10b981'; // Completed emerald
        if (d.percentage >= 50) return '#0055A5'; // Corporate Aetra Blue
        if (d.percentage > 0) return '#0284c7'; // Light Blue
        return '#cbd5e1'; // Untouched slate
      })
      .attr('stroke', (d) => (selectedCycleName === d.cycle ? '#c2410c' : 'none'))
      .attr('stroke-width', (d) => (selectedCycleName === d.cycle ? 2 : 0))
      .transition()
      .duration(700)
      .delay((_, i) => i * 35)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => yScale(metricMode === 'percentage' ? d.percentage : d.completed))
      .attr(
        'height',
        (d) => innerHeight - yScale(metricMode === 'percentage' ? d.percentage : d.completed)
      );

    // Interactive Hover Events
    barGroups
      .on('mouseenter', (event, d) => {
        d3.select(event.currentTarget as SVGGElement)
          .select('rect:nth-child(2)')
          .transition()
          .duration(150)
          .attr('opacity', 0.85)
          .attr('transform', 'scale(1.02)');

        tooltip
          .style('opacity', 1)
          .style('display', 'block')
          .html(`
            <div class="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[240px] pointer-events-none backdrop-blur-md">
              <div class="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                <span class="font-extrabold text-amber-400 text-sm">${d.cycle}</span>
                <span class="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono text-slate-300">
                  Hari H: Tanggal ${d.hariH}
                </span>
              </div>
              <div class="space-y-1 text-[11px]">
                <div class="flex justify-between">
                  <span class="text-slate-400">Total Pelanggan:</span>
                  <span class="font-bold text-white">${d.total} Industri</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Selesai Dibaca:</span>
                  <span class="font-mono font-bold text-emerald-400">${d.completed} Industri</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Pending / Belum:</span>
                  <span class="font-mono font-bold text-orange-400">${d.pending} Industri</span>
                </div>
                <div class="flex justify-between border-t border-slate-700/80 pt-1 font-bold">
                  <span>Keterbacaan:</span>
                  <span class="${d.percentage === 100 ? 'text-emerald-400' : 'text-blue-400'}">${d.percentage}%</span>
                </div>
              </div>
              <div class="pt-2 border-t border-slate-800 text-[10px] space-y-1">
                <div class="text-amber-300 font-semibold flex items-center justify-between">
                  <span>Kontraktor (${d.hidecoReader}):</span>
                  <span>${d.hidecoCompleted}/${d.hidecoTotal}</span>
                </div>
                <div class="text-blue-300 font-semibold flex items-center justify-between">
                  <span>Key Account (${d.keyAccountReader}):</span>
                  <span>${d.keyAccountCompleted}/${d.keyAccountTotal}</span>
                </div>
              </div>
              <p class="text-[9px] text-slate-400 italic text-center pt-1 border-t border-slate-800">
                Klik bar untuk menyaring data industri ke cycle ini
              </p>
            </div>
          `);
      })
      .on('mousemove', (event) => {
        const [xPos, yPos] = d3.pointer(event, containerRef.current);
        tooltip
          .style('left', `${xPos + 15}px`)
          .style('top', `${yPos - 30}px`);
      })
      .on('mouseleave', (event: MouseEvent) => {
        d3.select(event.currentTarget as SVGGElement)
          .select('rect:nth-child(2)')
          .transition()
          .duration(150)
          .attr('opacity', 1)
          .attr('transform', 'scale(1)');

        tooltip.style('opacity', 0).style('display', 'none');
      })
      .on('click', (_, d) => {
        setSelectedCycleName(d.cycle);
        onSelectCycle(d.cycle);
      });

    // Value Labels on Top of Bars
    g.selectAll('.bar-label')
      .data(activeData)
      .enter()
      .append('text')
      .attr('class', 'bar-label select-none')
      .attr('x', (d) => (xScale(d.cycle) || 0) + xScale.bandwidth() / 2)
      .attr('y', innerHeight)
      .attr('text-anchor', 'middle')
      .attr('fill', '#334155')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .text((d) => (metricMode === 'percentage' ? `${d.percentage}%` : `${d.completed}/${d.total}`))
      .transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr(
        'y',
        (d) =>
          yScale(metricMode === 'percentage' ? d.percentage : d.completed) - 6
      );

    // X-Axis
    const xAxis = d3.axisBottom(xScale).tickSize(5);

    const xAxisGroup = g
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup
      .selectAll('text')
      .attr('fill', '#475569')
      .attr('font-weight', '700')
      .attr('font-size', '10px')
      .attr('transform', 'rotate(-25)')
      .style('text-anchor', 'end');

    xAxisGroup.select('.domain').attr('stroke', '#cbd5e1');

    // Y-Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => (metricMode === 'percentage' ? `${d}%` : `${d}`));

    const yAxisGroup = g.append('g').attr('class', 'y-axis').call(yAxis);
    yAxisGroup.selectAll('text').attr('fill', '#64748b').attr('font-size', '10px');
    yAxisGroup.select('.domain').attr('stroke', '#cbd5e1');

    // Y-Axis Title
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -38)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .text(
        metricMode === 'percentage'
          ? 'Tingkat Keterbacaan (%)'
          : 'Jumlah Pelanggan Industri'
      );
  }, [activeData, metricMode, categoryFilter, selectedCycleName, overallAvgRate, onSelectCycle]);

  return (
    <div
      ref={containerRef}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs p-5 space-y-5 transition-colors duration-200 relative"
    >
      {/* Floating Tooltip Container */}
      <div
        id="d3-cycle-tooltip"
        className="absolute z-50 pointer-events-none transition-opacity duration-150"
        style={{ opacity: 0, display: 'none' }}
      ></div>

      {/* Header and Controls: Note: Title does NOT contain "visualisasi D3.js:" */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-[#0055A5] dark:text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <span>Tingkat Keterbacaan Meter per Cycle</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#0055A5] text-white">
                Interaktif
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitoring penyelesaian pembacaan meter antara <strong>Petugas Lapangan Kontraktor</strong> dan <strong>Tim Key Account</strong> di setiap siklus.
          </p>
        </div>

        {/* View Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-1 text-xs">
            <button
              onClick={() => setMetricMode('percentage')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                metricMode === 'percentage'
                  ? 'bg-white dark:bg-slate-800 text-[#0055A5] dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Persentase (%)</span>
            </button>
            <button
              onClick={() => setMetricMode('count')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                metricMode === 'count'
                  ? 'bg-white dark:bg-slate-800 text-[#0055A5] dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Volume Industri</span>
            </button>
          </div>

          {/* Category filter dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none"
          >
            <option value="ALL">Semua Pelanggan (Kontraktor &amp; Key Account)</option>
            <option value="Kontraktor">Khusus Kontraktor / Vendor</option>
            <option value="Key Account">Khusus Key Account</option>
          </select>
        </div>
      </div>

      {/* KPI Comparison Cards: Kontraktor vs Key Account */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Card 1: Kontraktor */}
        <div
          onClick={() =>
            setCategoryFilter(
              categoryFilter === 'Kontraktor' ? 'ALL' : 'Kontraktor'
            )
          }
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            categoryFilter === 'Kontraktor'
              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-[#0284c7] ring-2 ring-[#0284c7]/20'
              : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#0284c7]" />
              Kontraktor / Vendor
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
              Pelaksana Lapangan
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-black text-slate-800 dark:text-white font-mono">
              {hidecoStats.perc}%
            </div>
            <div className="text-xs font-semibold text-slate-500 font-mono">
              {hidecoStats.comp} / {hidecoStats.total} Industri
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#0284c7] h-full rounded-full transition-all duration-500"
              style={{ width: `${hidecoStats.perc}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Key Account */}
        <div
          onClick={() =>
            setCategoryFilter(
              categoryFilter === 'Key Account' ? 'ALL' : 'Key Account'
            )
          }
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            categoryFilter === 'Key Account'
              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20'
              : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              Key Account Officer
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              Akun Strategis &amp; VIP
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-black text-slate-800 dark:text-white font-mono">
              {keyAccountStats.perc}%
            </div>
            <div className="text-xs font-semibold text-slate-500 font-mono">
              {keyAccountStats.comp} / {keyAccountStats.total} Industri
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${keyAccountStats.perc}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: Total Gabungan Keterbacaan */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-500" />
              Total Seluruh Cycle
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              15 Cycle
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-black text-slate-800 dark:text-white font-mono">
              {overallAvgRate}%
            </div>
            <div className="text-xs font-semibold text-slate-500 font-mono">
              {activeData.reduce((a, b) => a + b.completed, 0)} /{' '}
              {activeData.reduce((a, b) => a + b.total, 0)} Selesai
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallAvgRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* SVG Container */}
      <div className="w-full overflow-x-auto pt-2">
        <div className="min-w-[700px]">
          <svg ref={svgRef}></svg>
        </div>
      </div>

      {/* Footer Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
            <span>100% Selesai Dibaca</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#0055A5]"></span>
            <span>&ge; 50% Selesai</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#0284c7]"></span>
            <span>&lt; 50% Berjalan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-300 dark:bg-slate-600"></span>
            <span>0% Belum Dibaca</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#E86216]"></span>
            <span>Cycle Terpilih</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 italic">
          * Catatan: Dalam 1 siklus cycle pembacaan dapat dilakukan oleh Kontraktor lapangan maupun Tim Key Account.
        </p>
      </div>
    </div>
  );
};

// Also export as D3CycleProgressChart for backwards compatibility
export const D3CycleProgressChart = CycleProgressChart;
