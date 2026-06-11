import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MinistryTotal } from '../lib/api';
import { budgetApi } from '../lib/api';
import BudgetChart from '../components/BudgetChart';
import MinistryCard from '../components/MinistryCard';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

type YearKey = 'fy2324' | 'fy2425' | 'fy2526';

const YEAR_LABELS: Record<YearKey, string> = {
  fy2324: 'FY 2023-24',
  fy2425: 'FY 2024-25',
  fy2526: 'FY 2025-26 (Est.)',
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

  // Compute change map for selected year
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
      <div className="space-y-4">
        <div className="skeleton h-12 w-64 rounded-xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-16 text-danger">
        Failed to load data. Make sure backend is running.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">{t.nav.explorer}</h1>
          <p className="text-text-secondary text-sm mt-1">
            Click any bar or card to see subdivision details
          </p>
        </div>

        {/* Year selector */}
        <div className="flex gap-2 p-1 rounded-xl bg-card border border-card-border">
          {(Object.keys(YEAR_LABELS) as YearKey[]).map(year => (
            <button
              key={year}
              id={`year-tab-${year}`}
              onClick={() => { setSelectedYear(year); setSelectedMinistry(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                selectedYear === year
                  ? 'bg-accent text-bg shadow-accent'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {YEAR_LABELS[year]}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">🔍</span>
        <input
          id="ministry-search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search ministries..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-card-border
            text-white placeholder:text-text-muted text-sm
            focus:outline-none focus:border-accent/50 transition-all"
        />
      </div>

      {/* Chart */}
      <div className="bg-card border border-card-border rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wide">
          Budget Allocation — {YEAR_LABELS[selectedYear]}
        </h2>
        <BudgetChart
          data={filtered}
          onSelect={setSelectedMinistry}
          selectedMinistry={selectedMinistry?.ministry}
          height={Math.max(400, filtered.slice(0, 20).length * 36)}
          maxItems={20}
        />
      </div>

      {/* Selected ministry detail */}
      <AnimatePresence>
        {selectedMinistry && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-card border border-accent/30 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">{selectedMinistry.ministry}</h3>
              <button
                onClick={() => setSelectedMinistry(null)}
                className="text-text-secondary hover:text-white text-sm"
              >
                ✕ Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedMinistry.divisions.map(div => (
                <div key={div.division} className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary">
                  <span className="text-sm text-text-secondary">{div.division}</span>
                  <span className="text-sm font-bold text-accent">PKR {div.total.toFixed(1)}B</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ministry cards list */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">
          All Ministries ({filtered.length})
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((ministry, idx) => (
            <MinistryCard
              key={ministry.ministry}
              ministry={ministry}
              rank={idx + 1}
              changePercent={changeMap.get(ministry.ministry)}
              onClick={() => setSelectedMinistry(prev => prev?.ministry === ministry.ministry ? null : ministry)}
              isSelected={selectedMinistry?.ministry === ministry.ministry}
              year={YEAR_LABELS[selectedYear]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
