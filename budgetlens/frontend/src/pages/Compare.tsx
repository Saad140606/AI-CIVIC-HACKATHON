import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { budgetApi } from '../lib/api';
import { formatBillions, getChangeColor, getChangeArrow } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Cell, LabelList,
  LineChart, Line, Tooltip, Legend
} from 'recharts';

// ── CSV Export helper ─────────────────────────────────────────────────────────
function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Compare() {
  const { t, lang } = useLanguage();
  const isUrdu = lang === 'ur';
  const [activeTab, setActiveTab] = useState<'sector' | 'ministry'>('sector');
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');

  const { data } = useQuery({
    queryKey: ['budget-summary'],
    queryFn: budgetApi.getSummary,
    staleTime: 5 * 60 * 1000,
  });

  const { data: compareData } = useQuery({
    queryKey: ['compare', selected],
    queryFn: () => budgetApi.compareMinistry(selected),
    enabled: !!selected,
    staleTime: 5 * 60 * 1000,
  });

  const ministries = data?.fy2526 || [];
  const filtered = search
    ? ministries.filter(m => m.ministry.toLowerCase().includes(search.toLowerCase()))
    : ministries;

  const years = [
    { key: 'fy2324', label: 'FY 2023-24', labelUrdu: 'مالی سال 2023-24', data: compareData?.fy2324 },
    { key: 'fy2425', label: 'FY 2024-25', labelUrdu: 'مالی سال 2024-25', data: compareData?.fy2425 },
    { key: 'fy2526', label: 'FY 2025-26', labelUrdu: 'مالی سال 2025-26', data: compareData?.fy2526 },
  ];

  // ── Compute real sector YoY from live data ───────────────────────────────
  const computeSectorData = useCallback(() => {
    if (!data?.fy2425 || !data?.fy2526) return [];
    const sectors = [
      { name: 'Education', nameUrdu: 'تعلیم', keyword: 'education', color: '#00E676' },
      { name: 'Health', nameUrdu: 'صحت', keyword: 'health', color: '#00D4FF' },
      { name: 'Defense', nameUrdu: 'دفاع', keyword: 'defence', color: '#f59e0b' },
      { name: 'Climate', nameUrdu: 'موسمیاتی', keyword: 'climate', color: '#a855f7' },
      { name: 'Railways', nameUrdu: 'ریلوے', keyword: 'railways', color: '#EF5350' },
      { name: 'Energy', nameUrdu: 'توانائی', keyword: 'energy', color: '#FF9800' },
    ];
    return sectors.map(s => {
      const curr = data.fy2526.find(m => m.ministry.toLowerCase().includes(s.keyword));
      const prev = data.fy2425.find(m => m.ministry.toLowerCase().includes(s.keyword));
      if (!curr || !prev || prev.total === 0) return null;
      const pct = Math.round((curr.total - prev.total) / prev.total * 100);
      return {
        ...s,
        value: pct,
        display: `${pct >= 0 ? '+' : ''}${pct}%`,
        currTotal: curr.total,
        prevTotal: prev.total,
      };
    }).filter(Boolean) as Array<{ name: string; nameUrdu: string; value: number; display: string; color: string; currTotal: number; prevTotal: number }>;
  }, [data]);

  const sectorData = computeSectorData();

  // ── Compute AI assessment text from real numbers ──────────────────────────
  const getAiAssessment = () => {
    if (sectorData.length === 0) return { en: '', ur: '' };
    const topGainer = [...sectorData].sort((a, b) => b.value - a.value)[0];
    const topLoser = [...sectorData].sort((a, b) => a.value - b.value)[0];
    const def = sectorData.find(s => s.name === 'Defense');
    return {
      en: `${topGainer?.name ?? 'Education'} recorded the largest increase (${topGainer?.display ?? '+0%'}) in FY2025-26, while ${topLoser?.name ?? 'Climate'} saw the biggest relative shift (${topLoser?.display ?? '0%'}). Defence allocation ${def ? `${def.display}` : 'remained stable'} as a share of total budget. Source: Finance Division, Government of Pakistan — budget_2025_26.xlsx`,
      ur: `${topGainer?.nameUrdu ?? 'تعلیم'} میں سب سے زیادہ اضافہ (${topGainer?.display ?? '+0%'}) ہوا جبکہ ${topLoser?.nameUrdu ?? 'موسمیاتی'} میں سب سے زیادہ تبدیلی آئی (${topLoser?.display ?? '0%'})۔ دفاعی بجٹ ${def ? def.display : 'مستحکم'} رہا۔ ماخذ: وزارت خزانہ، حکومت پاکستان`
    };
  };
  const aiText = getAiAssessment();

  // ── Export all ministries as CSV ──────────────────────────────────────────
  const handleExportAllCSV = () => {
    const rows = [
      ['Ministry', 'FY2023-24 (PKR Bn)', 'FY2024-25 (PKR Bn)', 'FY2025-26 (PKR Bn)', 'Change FY24-25 to FY25-26 (%)'],
      ...(data?.fy2526 ?? []).map(m => {
        const prev = data?.fy2425.find(p => p.ministry === m.ministry);
        const prev2 = data?.fy2324.find(p => p.ministry === m.ministry);
        const pct = prev && prev.total > 0 ? ((m.total - prev.total) / prev.total * 100).toFixed(1) : 'N/A';
        return [m.ministry, prev2?.total?.toFixed(2) ?? 'N/A', prev?.total?.toFixed(2) ?? 'N/A', m.total.toFixed(2), pct];
      })
    ];
    downloadCSV(rows, 'pakistan_budget_fy2526_all_ministries.csv');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-start justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.2)' }}
            >
              ⚖️
            </div>
            <h1 className="text-2xl font-black text-white">{t.compare.title}</h1>
          </div>
          <p className="text-[#7f8ea4] text-sm ml-13">
            {isUrdu ? 'مختلف مالیاتی سالوں میں بجٹ کا موازنہ اور تجزیہ' : 'Side-by-side comparison across fiscal years'}
          </p>
          <p className="text-[10px] text-[#3a4558] ml-13 mt-0.5">
            📋 {isUrdu ? 'ماخذ: وزارت خزانہ، حکومت پاکستان — finance.gov.pk' : 'Source: Finance Division, Government of Pakistan — finance.gov.pk'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Export All CSV */}
          {data && (
            <motion.button
              onClick={handleExportAllCSV}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
              style={{
                background: 'rgba(0, 230, 118, 0.08)',
                border: '1px solid rgba(0, 230, 118, 0.2)',
                color: '#00e676',
              }}
              title="Download all ministry data as CSV"
            >
              ⬇ {isUrdu ? 'CSV ڈاؤن لوڈ' : 'Export CSV'}
            </motion.button>
          )}

          {/* Tab Switcher */}
          <div
            className="flex p-1 rounded-2xl"
            style={{ background: 'rgba(8, 15, 30, 0.8)', border: '1px solid rgba(26, 48, 80, 0.6)' }}
          >
            {(['sector', 'ministry'] as const).map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                whileHover={activeTab !== tab ? { scale: 1.05 } : {}}
                whileTap={{ scale: 0.96 }}
                className="relative px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
                style={{
                  background: activeTab === tab
                    ? 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.08))'
                    : 'transparent',
                  border: activeTab === tab
                    ? '1px solid rgba(0,212,255,0.25)'
                    : '1px solid transparent',
                  color: activeTab === tab ? '#00d4ff' : '#7f8ea4',
                  boxShadow: activeTab === tab ? '0 4px 15px rgba(0,212,255,0.1)' : 'none',
                }}
              >
                {tab === 'sector'
                  ? (isUrdu ? '📊 شعبہ جاتی موازنہ' : '📊 Sector AI Compare')
                  : (isUrdu ? '🏛️ وزارت موازنہ' : '🏛️ Ministry Compare')}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tab 1: Sector AI Compare */}
      {activeTab === 'sector' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Chart Card */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{
              background: 'linear-gradient(135deg, #0c1929, #080f1e)',
              border: '1px solid rgba(26, 48, 80, 0.6)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div>
              <h3 className="text-base font-bold text-white">
                {isUrdu ? 'شعبہ جاتی بجٹ تبدیلی (2024-25 بمقابلہ 2025-26)' : 'Sector Budget Change (FY2024-25 vs FY2025-26)'}
              </h3>
              <p className="text-xs text-[#7f8ea4] mt-0.5">
                {isUrdu ? 'حقیقی ڈیٹا — وزارت خزانہ، حکومت پاکستان' : 'Real data — Finance Division, GoP · budget_2025_26.xlsx'}
              </p>
            </div>

            {sectorData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-[#3a4558] text-sm">Loading real data...</div>
            ) : (
              <div style={{ height: 260, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sectorData}
                    layout="vertical"
                    margin={{ top: 10, right: 60, bottom: 10, left: 10 }}
                    barSize={20}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f/40" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#8892A4', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey={isUrdu ? 'nameUrdu' : 'name'} tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} width={80} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {sectorData.map((entry, index) => (
                        <Cell key={index} fill={entry.value >= 0 ? entry.color : '#EF5350'} />
                      ))}
                      <LabelList dataKey="display" position="right" style={{ fill: '#ffffff', fontSize: 11, fontWeight: 'black' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Mini table with PKR figures */}
            {sectorData.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-[#1a3050]/40">
                {sectorData.slice(0, 4).map(s => (
                  <div key={s.name} className="flex items-center justify-between text-[11px]">
                    <span style={{ color: s.color }} className="font-semibold">{isUrdu ? s.nameUrdu : s.name}</span>
                    <span className="text-[#7f8ea4]">PKR {s.currTotal.toFixed(1)}B</span>
                    <span style={{ color: s.value >= 0 ? '#00e676' : '#EF5350' }} className="font-bold">{s.display}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Assessment Card */}
          <div
            className="rounded-2xl p-6 flex flex-col justify-between"
            style={{
              background: 'linear-gradient(135deg, #0c1929, #080f1e)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              boxShadow: '0 8px 32px rgba(168,85,247,0.05), 0 4px 16px rgba(0,0,0,0.5)',
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.25)' }}
                >
                  🤖
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    {isUrdu ? 'AI موازنہ رپورٹ' : 'WakalaLens AI Comparison Report'}
                  </h4>
                  <p className="text-[10px] text-[#7f8ea4]">
                    {isUrdu ? 'حقیقی xlsx ڈیٹا پر مبنی تجزیہ' : 'Auto-analysis of budget_2025_26.xlsx (Finance Division, GoP)'}
                  </p>
                </div>
              </div>

              {/* Assessment english */}
              <div
                className="p-4 rounded-xl space-y-2"
                style={{ background: 'rgba(8, 15, 30, 0.6)', border: '1px solid rgba(26, 48, 80, 0.5)' }}
              >
                <div className="text-[9px] uppercase font-bold text-[#00d4ff] tracking-widest">English Analysis</div>
                <p className="text-xs text-[#a0aec0] leading-relaxed">{aiText.en || 'Loading real data...'}</p>
              </div>

              {/* Assessment urdu */}
              <div
                className="p-4 rounded-xl space-y-2"
                dir="rtl"
                style={{ background: 'rgba(8, 15, 30, 0.6)', border: '1px solid rgba(26, 48, 80, 0.5)' }}
              >
                <div className="text-[9px] uppercase font-bold text-[#00d4ff] tracking-widest">اردو تجزیہ</div>
                <p className="text-xs text-[#a0aec0] leading-relaxed font-urdu">{aiText.ur || '...'}</p>
              </div>
            </div>

            <div className="mt-5 text-[10px] text-[#3a4558] flex items-center gap-1.5 pt-4 border-t border-[#1a3050]/40">
              <span>💡</span>
              <span>
                {isUrdu
                  ? 'ماخذ: وزارت خزانہ حکومت پاکستان — budget_2025_26.xlsx'
                  : 'Source: Finance Division, Government of Pakistan — budget_2025_26.xlsx'}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── 3-Year Budget Trend Line Chart (only in sector tab) */}
      {activeTab === 'sector' && data && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, #0c1929, #080f1e)',
            border: '1px solid rgba(0, 212, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                {isUrdu ? 'بجٹ رجحان — 3 سالہ لکیری چارٹ' : '3-Year Budget Trend — Top Ministries'}
              </h3>
              <p className="text-xs text-[#7f8ea4] mt-0.5">
                {isUrdu ? 'حقیقی xlsx ڈیٹا پر مبنی' : 'Real xlsx data · FY2023-24, FY2024-25, FY2025-26'}
              </p>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold"
              style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', color: '#00e676' }}>
              📊 Live Data
            </span>
          </div>
          {(() => {
            // Build top-5 ministries by FY2526 budget
            const top5 = [...(data.fy2526 || [])].sort((a, b) => b.total - a.total).slice(0, 5);
            const lineColors = ['#00d4ff', '#a855f7', '#f59e0b', '#00e676', '#ef4444'];
            const chartData = [
              { year: 'FY23-24', yearUrdu: 'مالی سال 23-24' },
              { year: 'FY24-25', yearUrdu: 'مالی سال 24-25' },
              { year: 'FY25-26', yearUrdu: 'مالی سال 25-26' },
            ].map((yr, i) => {
              const yrData = i === 0 ? data.fy2324 : i === 1 ? data.fy2425 : data.fy2526;
              const row: Record<string, string | number> = { year: isUrdu ? yr.yearUrdu : yr.year };
              top5.forEach(m => {
                const entry = yrData?.find(e => e.ministry === m.ministry);
                row[m.ministry.substring(0, 18)] = entry ? parseFloat(entry.total.toFixed(1)) : 0;
              });
              return row;
            });
            return (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,48,80,0.4)" />
                    <XAxis dataKey="year" tick={{ fill: '#7f8ea4', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#7f8ea4', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}B`} />
                    <Tooltip
                      contentStyle={{
                        background: '#0c1929', border: '1px solid rgba(26,48,80,0.8)',
                        borderRadius: '12px', color: '#fff', fontSize: 12,
                      }}
                      formatter={(v: number) => [`PKR ${v.toFixed(1)}B`]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, color: '#7f8ea4', paddingTop: 8 }}
                      formatter={(v) => v.length > 20 ? v.substring(0, 20) + '…' : v}
                    />
                    {top5.map((m, i) => (
                      <Line
                        key={m.ministry}
                        type="monotone"
                        dataKey={m.ministry.substring(0, 18)}
                        stroke={lineColors[i]}
                        strokeWidth={2.5}
                        dot={{ fill: lineColors[i], strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: lineColors[i], strokeWidth: 2, fill: '#0c1929' }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* Tab 2: Ministry Detailed Compare */}

      {activeTab === 'ministry' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80 }}
          className="space-y-6"
        >
          {/* Search */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7f8ea4] text-lg">🔍</span>
            <input
              id="compare-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.compare.selectMinistry + '...'}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder:text-[#3a4558] text-sm premium-input"
            />
          </div>

          {/* Ministry list */}
          {(search || !selected) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto custom-scrollbar">
              {filtered.slice(0, 30).map((m, i) => (
                <motion.button
                  key={m.ministry}
                  id={`compare-ministry-${m.ministry.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => { setSelected(m.ministry); setSearch(''); }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="text-left px-4 py-3 rounded-xl text-sm transition-all duration-200"
                  style={{
                    background: selected === m.ministry
                      ? 'rgba(0, 212, 255, 0.08)'
                      : 'rgba(12, 25, 41, 0.8)',
                    border: selected === m.ministry
                      ? '1px solid rgba(0, 212, 255, 0.35)'
                      : '1px solid rgba(26, 48, 80, 0.5)',
                    color: selected === m.ministry ? '#00d4ff' : '#7f8ea4',
                    boxShadow: selected === m.ministry ? '0 4px 15px rgba(0,212,255,0.1)' : 'none',
                  }}
                >
                  <p className="font-semibold truncate">{m.ministry}</p>
                  <p className="text-[11px] opacity-60 mt-0.5 font-medium">PKR {formatBillions(m.total)}</p>
                </motion.button>
              ))}
            </div>
          )}

          {/* Comparison view */}
          {compareData && selected && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">{compareData.ministry}</h2>
                <span
                  className="text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}
                >
                  3-Year Comparison
                </span>
              </div>

              {/* Year columns */}
              <div className="grid grid-cols-3 gap-3">
                {years.map((year, yi) => {
                  const val = year.data?.total;
                  const isLatest = year.key === 'fy2526';
                  const colors = ['#7f8ea4', '#a855f7', '#00d4ff'];
                  return (
                    <motion.div
                      key={year.key}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: yi * 0.1 }}
                      className="rounded-2xl p-4"
                      style={{
                        background: isLatest
                          ? 'linear-gradient(135deg, rgba(0,212,255,0.06), rgba(0,212,255,0.02))'
                          : 'rgba(12, 25, 41, 0.7)',
                        border: isLatest
                          ? '1px solid rgba(0, 212, 255, 0.25)'
                          : '1px solid rgba(26, 48, 80, 0.5)',
                      }}
                    >
                      {isLatest && (
                        <span
                          className="text-[9px] px-2 py-0.5 rounded-full inline-block mb-2 font-bold uppercase tracking-wider"
                          style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}
                        >
                          Latest
                        </span>
                      )}
                      <p className="text-[10px] text-[#7f8ea4] mb-1.5 font-medium">{isUrdu ? year.labelUrdu : year.label}</p>
                      <p
                        className="text-xl font-black"
                        style={{
                          background: `linear-gradient(135deg, ${colors[yi]}, ${colors[yi]}99)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {val ? `PKR ${formatBillions(val)}` : 'N/A'}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Change indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {compareData.comparison2324vs2425 && (
                  <ChangeCard
                    label={isUrdu ? "مالی سال 2023-24 ← مالی سال 2024-25" : "FY2023-24 → FY2024-25"}
                    prev={compareData.comparison2324vs2425.prev}
                    curr={compareData.comparison2324vs2425.curr}
                    change={compareData.comparison2324vs2425.change}
                    pct={compareData.comparison2324vs2425.changePercent}
                  />
                )}
                {compareData.comparison2425vs2526 && (
                  <ChangeCard
                    label={isUrdu ? "مالی سال 2024-25 ← مالی سال 2025-26" : "FY2024-25 → FY2025-26"}
                    prev={compareData.comparison2425vs2526.prev}
                    curr={compareData.comparison2425vs2526.curr}
                    change={compareData.comparison2425vs2526.change}
                    pct={compareData.comparison2425vs2526.changePercent}
                  />
                )}
              </div>
            </div>
          )}

          {!selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-[#7f8ea4]"
            >
              <div className="text-5xl mb-4 animate-float">📊</div>
              <p className="font-semibold">
                {isUrdu ? 'اوپر سے کوئی وزارت منتخب کریں' : 'Select a ministry above to see year-over-year comparison'}
              </p>
              <p className="text-[#3a4558] text-sm mt-1">
                {isUrdu ? '' : 'Choose from the list to compare budgets across 3 fiscal years'}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function ChangeCard({ label, prev, curr, change, pct }: {
  label: string; prev: number; curr: number; change: number; pct: number;
}) {
  const color = getChangeColor(pct);
  const arrow = getChangeArrow(pct);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl p-5"
      style={{
        background: 'linear-gradient(135deg, #0c1929, #080f1e)',
        border: `1px solid ${color}25`,
        boxShadow: `0 4px 20px ${color}08`,
      }}
    >
      <p className="text-[11px] text-[#7f8ea4] font-bold uppercase tracking-wide mb-4">{label}</p>

      <div className="flex items-center gap-4 mb-4">
        <div
          className="flex-1 p-3 rounded-xl text-center"
          style={{ background: 'rgba(8, 15, 30, 0.6)', border: '1px solid rgba(26, 48, 80, 0.4)' }}
        >
          <p className="text-[10px] text-[#7f8ea4] mb-1">Before</p>
          <p className="font-bold text-white text-sm">PKR {formatBillions(prev)}B</p>
        </div>
        <span className="text-xl" style={{ color }}>{arrow}</span>
        <div
          className="flex-1 p-3 rounded-xl text-center"
          style={{ background: `${color}08`, border: `1px solid ${color}25` }}
        >
          <p className="text-[10px] text-[#7f8ea4] mb-1">After</p>
          <p className="font-bold text-sm" style={{ color }}>PKR {formatBillions(curr)}B</p>
        </div>
      </div>

      <div
        className="px-4 py-2.5 rounded-xl text-sm font-black inline-flex items-center gap-2"
        style={{ color, background: `${color}12`, border: `1px solid ${color}35` }}
      >
        {arrow} {Math.abs(pct).toFixed(1)}%
        <span className="text-xs font-normal opacity-70">
          ({change > 0 ? '+' : ''}{formatBillions(Math.abs(change))}B)
        </span>
      </div>
    </motion.div>
  );
}
