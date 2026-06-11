import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MinistryTotal } from '../lib/api';
import { budgetApi } from '../lib/api';
import BudgetChart from '../components/BudgetChart';
import MinistryCard from '../components/MinistryCard';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

type YearKey = 'fy2324' | 'fy2425' | 'fy2526';

const YEAR_LABELS: Record<YearKey, { short: string; full: string; color: string }> = {
  fy2324: { short: 'FY 23-24', full: 'FY 2023-24', color: '#7f8ea4' },
  fy2425: { short: 'FY 24-25', full: 'FY 2024-25', color: '#a855f7' },
  fy2526: { short: 'FY 25-26', full: 'FY 2025-26 (Est.)', color: '#00d4ff' },
};

export default function MinistryExplorer() {
  const { t } = useLanguage();
  const [selectedYear, setSelectedYear] = useState<YearKey>('fy2526');
  const [selectedMinistry, setSelectedMinistry] = useState<MinistryTotal | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['budget-summary'],
    queryFn: budgetApi.getSummary,
    staleTime: 5 * 60 * 1000,
  });

  const ministries: MinistryTotal[] = data?.[selectedYear] || [];
  const filtered = search
    ? ministries.filter(m => m.ministry.toLowerCase().includes(search.toLowerCase()))
    : ministries;

  // Compute YoY change map
  const changeMap = new Map<string, number>();
  if (data) {
    const prevKey: Record<YearKey, YearKey | null> = { fy2324: null, fy2425: 'fy2324', fy2526: 'fy2425' };
    const prevYearKey = prevKey[selectedYear];
    if (prevYearKey) {
      ministries.forEach(m => {
        const prev = data[prevYearKey]?.find(p => p.ministry === m.ministry);
        if (prev && prev.total > 0) {
          changeMap.set(m.ministry, ((m.total - prev.total) / prev.total) * 100);
        }
      });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-16 w-80 rounded-2xl" />
        <div className="skeleton h-12 rounded-xl" />
        <div className="skeleton h-96 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-[#ff5252] font-bold">Failed to load data. Make sure backend is running.</p>
      </div>
    );
  }

  const yearInfo = YEAR_LABELS[selectedYear];

  return (
    <div className="space-y-6">

      {/* ─── Header ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `${yearInfo.color}12`, border: `1px solid ${yearInfo.color}25` }}
            >
              📊
            </div>
            <h1 className="text-2xl font-black text-white">{t.nav.explorer}</h1>
          </div>
          <p className="text-[#7f8ea4] text-sm ml-13">
            Visualize &amp; drill into budget allocations across{' '}
            <span className="text-white font-semibold">{ministries.length} ministries</span>
          </p>
        </div>

        {/* Year Tabs */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex p-1 rounded-2xl"
          style={{ background: 'rgba(8, 15, 30, 0.8)', border: '1px solid rgba(26, 48, 80, 0.6)' }}
        >
          {(Object.entries(YEAR_LABELS) as [YearKey, typeof YEAR_LABELS[YearKey]][]).map(([key, info]) => (
            <motion.button
              key={key}
              id={`year-tab-${key}`}
              onClick={() => { setSelectedYear(key); setSelectedMinistry(null); }}
              whileHover={selectedYear !== key ? { scale: 1.05 } : {}}
              whileTap={{ scale: 0.96 }}
              className="relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
              style={{
                background: selectedYear === key
                  ? `linear-gradient(135deg, ${info.color}20, ${info.color}10)`
                  : 'transparent',
                border: selectedYear === key ? `1px solid ${info.color}35` : '1px solid transparent',
                color: selectedYear === key ? info.color : '#7f8ea4',
                boxShadow: selectedYear === key ? `0 4px 15px ${info.color}15` : 'none',
              }}
            >
              {info.short}
              {key === 'fy2526' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#f59e0b]" />
              )}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* ─── Search ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7f8ea4] text-lg">🔍</div>
        <input
          id="ministry-search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search ministries..."
          className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder:text-[#3a4558] text-sm premium-input"
        />
        <AnimatePresence>
          {search && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7f8ea4] hover:text-white text-sm transition-colors"
            >
              ✕
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Chart ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0c1929, #080f1e)',
          border: '1px solid rgba(26, 48, 80, 0.6)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Chart header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1a3050]/40">
          <div>
            <h2 className="text-sm font-bold text-white">Budget Allocation</h2>
            <p className="text-[11px] text-[#7f8ea4] mt-0.5">
              {yearInfo.full} · Top {Math.min(filtered.length, 20)} ministries
            </p>
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: `${yearInfo.color}12`,
              border: `1px solid ${yearInfo.color}25`,
              color: yearInfo.color,
            }}
          >
            {yearInfo.full}
          </div>
        </div>

        <div className="p-5">
          <BudgetChart
            data={filtered}
            onSelect={setSelectedMinistry}
            selectedMinistry={selectedMinistry?.ministry}
            height={Math.max(420, filtered.slice(0, 20).length * 38)}
            maxItems={20}
          />
        </div>
      </motion.div>

      {/* ─── Selected Ministry Detail ────────────────────────────── */}
      <AnimatePresence>
        {selectedMinistry && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #101f35, #0c1929)',
              border: '1px solid rgba(0, 212, 255, 0.25)',
              boxShadow: '0 12px 40px rgba(0, 212, 255, 0.08), 0 4px 16px rgba(0,0,0,0.5)',
            }}
          >
            <div className="p-5 border-b border-[#1a3050]/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.2)' }}
                >
                  📋
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{selectedMinistry.ministry}</h3>
                  <p className="text-[11px] text-[#7f8ea4]">Division breakdown</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedMinistry(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7f8ea4] hover:text-white hover:bg-white/10 transition-all text-xs"
              >
                ✕
              </motion.button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedMinistry.divisions.map((div, i) => (
                <motion.div
                  key={div.division}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors"
                  style={{ border: '1px solid rgba(26, 48, 80, 0.4)' }}
                >
                  <span className="text-sm text-[#7f8ea4] truncate pr-2">{div.division}</span>
                  <span className="text-sm font-bold text-[#00d4ff] shrink-0">
                    PKR {div.total.toFixed(1)}B
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Ministry Cards ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white">
            {filtered.length < ministries.length
              ? `${filtered.length} Results`
              : `All Ministries`}
          </h2>
          <span className="text-[11px] text-[#3a4558] px-3 py-1.5 rounded-lg"
            style={{ border: '1px solid rgba(26, 48, 80, 0.4)' }}>
            {filtered.length} / {ministries.length}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((ministry, idx) => (
            <MinistryCard
              key={ministry.ministry}
              ministry={ministry}
              rank={idx + 1}
              changePercent={changeMap.get(ministry.ministry)}
              onClick={() => setSelectedMinistry(prev => prev?.ministry === ministry.ministry ? null : ministry)}
              isSelected={selectedMinistry?.ministry === ministry.ministry}
              year={YEAR_LABELS[selectedYear].full}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-[#7f8ea4]"
          >
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-semibold">No ministries match &ldquo;{search}&rdquo;</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
