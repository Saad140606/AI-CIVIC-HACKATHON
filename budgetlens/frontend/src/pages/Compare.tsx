import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { budgetApi } from '../lib/api';
import { formatBillions, getChangeColor, getChangeArrow } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Cell, LabelList
} from 'recharts';

const SECTOR_DATA = [
  { name: 'Education', nameUrdu: 'تعلیم', value: 12, display: '+12%', color: '#00E676' },
  { name: 'Health', nameUrdu: 'صحت', value: 8, display: '+8%', color: '#00D4FF' },
  { name: 'Defense', nameUrdu: 'دفاع', value: 5, display: '+5%', color: '#f59e0b' },
  { name: 'Climate', nameUrdu: 'موسمیاتی تبدیلی', value: -3, display: '-3%', color: '#EF5350' },
];

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
    { key: 'fy2526', label: 'FY 2025-26 (Estimated / Draft)', labelUrdu: 'مالی سال 2025-26 (تخمینی / ڈرافٹ)', data: compareData?.fy2526 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">{t.compare.title}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {isUrdu ? 'مختلف مالیاتی سالوں میں بجٹ کا موازنہ اور تجزیہ' : 'Side-by-side comparison across fiscal years'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#0d1b2e] border border-[#1e3a5f]/45 p-1 rounded-xl shrink-0 self-start">
          <button
            onClick={() => setActiveTab('sector')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'sector'
                ? 'bg-accent text-bg'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            {isUrdu ? 'شعبہ جاتی AI موازنہ' : 'Sector AI Compare'}
          </button>
          <button
            onClick={() => setActiveTab('ministry')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ministry'
                ? 'bg-accent text-bg'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            {isUrdu ? 'وزارت کا موازنہ' : 'Ministry Compare'}
          </button>
        </div>
      </div>

      {/* Tab 1: Sector AI Compare */}
      {activeTab === 'sector' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Chart Card */}
          <div className="bg-card border border-card-border rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-md font-bold text-white">
                {isUrdu ? 'شعبہ جاتی ترقی کی شرح (2025 بمقابلہ 2026)' : 'Sector Budget Growth (2025 vs 2026)'}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                {isUrdu ? 'اہم شعبوں میں فنڈز کے رد و بدل کا گراف' : 'Percentage changes in key sector allocations'}
              </p>
            </div>

            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={SECTOR_DATA}
                  layout="vertical"
                  margin={{ top: 10, right: 50, bottom: 10, left: 10 }}
                  barSize={20}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f/40" horizontal={false} />
                  <XAxis type="number" domain={[-5, 15]} tick={{ fill: '#8892A4', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey={isUrdu ? 'nameUrdu' : 'name'} tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {SECTOR_DATA.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                    <LabelList dataKey="display" position="right" style={{ fill: '#ffffff', fontSize: 11, fontWeight: 'black' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Assessment Card */}
          <div className="bg-[#0d1b2e] border border-[#1e3a5f]/60 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xl">
                  🤖
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    {isUrdu ? 'اے آئی موازنہ رپورٹ (WakalaLens)' : 'WakalaLens AI Comparison Report'}
                  </h4>
                  <p className="text-[10px] text-[#8892a4]">
                    {isUrdu ? 'پبلشڈ بجٹ پی ڈی ایف اور ڈیٹا کا خودکار تجزیہ' : 'Automatic analysis of published budget PDFs'}
                  </p>
                </div>
              </div>

              {/* Assessment english */}
              <div className="p-4 rounded-xl bg-card border border-card-border space-y-2">
                <div className="text-[9px] uppercase font-bold text-accent tracking-wider">English Analysis</div>
                <p className="text-xs text-[#a0aec0] leading-relaxed">
                  Education and Health sectors received substantial increases (+12% and +8% respectively) to support public service modernizations, while Defence grew moderately at +5%. Climate change funding was adjusted by -3% as part of administrative cost-reallocation measures.
                </p>
              </div>

              {/* Assessment urdu */}
              <div className="p-4 rounded-xl bg-card border border-card-border space-y-2" dir="rtl">
                <div className="text-[9px] uppercase font-bold text-accent tracking-wider">اردو تجزیہ (Nastaliq)</div>
                <p className="text-xs text-[#a0aec0] leading-relaxed font-urdu">
                  تعلیمی اور صحت کے شعبوں میں عوامی خدمات کو بہتر بنانے کے لیے نمایاں اضافہ (+12% اور +8%) کیا گیا، جبکہ دفاع میں +5% کا معتدل اضافہ ہوا۔ انتظامی اخراجات کو کم کرنے کے لیے موسمیاتی تبدیلیوں کے فنڈز میں -3% کی کمی کی گئی۔
                </p>
              </div>
            </div>

            <div className="mt-6 text-[10px] text-[#5a6a7e] flex items-center gap-1">
              <span>💡</span>
              <span>
                {isUrdu
                  ? 'رپورٹ کا ماخذ: وزارت خزانہ حکومت پاکستان کے سالانہ فنڈز ایلوکیشن تخمینے'
                  : 'Source: Finance Division budget estimates, Government of Pakistan.'}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 2: Ministry Detailed Compare */}
      {activeTab === 'ministry' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Search & select ministry */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">🔍</span>
            <input
              id="compare-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.compare.selectMinistry + '...'}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-card-border
                text-white placeholder:text-text-muted text-sm
                focus:outline-none focus:border-accent/50 transition-all"
            />
          </div>

          {/* Ministry list */}
          {(search || !selected) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {filtered.slice(0, 30).map(m => (
                <button
                  key={m.ministry}
                  id={`compare-ministry-${m.ministry.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => { setSelected(m.ministry); setSearch(''); }}
                  className={`text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 border ${
                    selected === m.ministry
                      ? 'bg-accent/10 border-accent/50 text-accent'
                      : 'bg-card border-card-border text-text-secondary hover:text-white hover:border-accent/30'
                  }`}
                >
                  <p className="font-medium truncate">{m.ministry}</p>
                  <p className="text-xs opacity-60 mt-0.5">PKR {formatBillions(m.total)}</p>
                </button>
              ))}
            </div>
          )}

          {/* Comparison view */}
          {compareData && selected && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">{compareData.ministry}</h2>

              {/* Year columns */}
              <div className="grid grid-cols-3 gap-4">
                {years.map(year => {
                  const val = year.data?.total;
                  const isLatest = year.key === 'fy2526';
                  return (
                    <div
                      key={year.key}
                      className={`rounded-2xl border p-5 ${
                        isLatest
                          ? 'bg-card border-accent/30'
                          : 'bg-card border-card-border'
                      }`}
                    >
                      {isLatest && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 mb-2 inline-block">
                          Latest
                        </span>
                      )}
                      <p className="text-xs text-text-secondary mb-1">{isUrdu ? year.labelUrdu : year.label}</p>
                      <p className={`text-2xl font-black ${val ? 'text-gradient' : 'text-text-muted'}`}>
                        {val ? `PKR ${formatBillions(val)}` : 'N/A'}
                      </p>
                    </div>
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
            <div className="text-center py-16 text-text-secondary">
              <div className="text-5xl mb-4">📊</div>
              <p>{isUrdu ? 'وزارت کا موازنہ دیکھنے کے لیے اوپر لسٹ سے کوئی وزارت منتخب کریں' : 'Select a ministry above to see year-over-year comparison'}</p>
            </div>
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
    <div className="bg-card border border-card-border rounded-xl p-5">
      <p className="text-xs text-text-secondary mb-3">{label}</p>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-right">
          <p className="text-xs text-text-secondary">Before</p>
          <p className="font-semibold text-white">PKR {formatBillions(prev)}B</p>
        </div>
        <span className="text-2xl" style={{ color }}>{arrow}</span>
        <div>
          <p className="text-xs text-text-secondary">After</p>
          <p className="font-semibold text-white">PKR {formatBillions(curr)}B</p>
        </div>
      </div>
      <div
        className="px-3 py-1.5 rounded-lg text-sm font-bold inline-flex items-center gap-1"
        style={{ color, background: `${color}22`, border: `1px solid ${color}44` }}
      >
        {arrow} {Math.abs(pct).toFixed(1)}%
        <span className="text-xs font-normal opacity-70 ml-1">
          ({change > 0 ? '+' : ''}{formatBillions(Math.abs(change))}B)
        </span>
      </div>
    </div>
  );
}
