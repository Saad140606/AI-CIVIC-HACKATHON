import { motion } from 'framer-motion';
import type { HeroStats as HeroStatsType } from '../lib/api';
import { formatBillions, formatChangePercent, getChangeColor } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  stats: HeroStatsType;
}

function StatCard({ icon, label, value, sub, subColor, delay }: {
  icon: string; label: string; value: string; sub?: string; subColor?: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="budget-card relative overflow-hidden rounded-2xl bg-card border border-card-border p-6 flex flex-col gap-3"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <p className="text-text-secondary text-sm font-medium">{label}</p>
      </div>

      <div>
        <p className="text-3xl font-black text-gradient">{value}</p>
        {sub && (
          <p className="text-sm font-semibold mt-1" style={{ color: subColor || '#8892A4' }}>
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function HeroStats({ stats }: Props) {
  const { t } = useLanguage();
  const changeColor = getChangeColor(stats.totalChangePercent);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Total Budget */}
      <StatCard
        icon="🇵🇰"
        label={t.hero.totalBudget}
        value={`PKR ${formatBillions(stats.fy2526Total)}`}
        sub={`${formatChangePercent(stats.totalChangePercent)} ${t.hero.vsLastYear}`}
        subColor={changeColor}
        delay={0}
      />

      {/* Top 3 Ministries */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="budget-card relative overflow-hidden rounded-2xl bg-card border border-card-border p-6"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-warning/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🏛️</span>
          <p className="text-text-secondary text-sm font-medium">{t.hero.topMinistries}</p>
        </div>
        <div className="space-y-2">
          {stats.top3.map((m, i) => (
            <div key={m.ministry} className="flex items-center gap-2">
              <span className="text-xs font-bold text-accent w-5">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{m.ministry}</p>
              </div>
              <p className="text-xs font-bold text-accent shrink-0">PKR {formatBillions(m.total)}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Biggest Changes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="budget-card relative overflow-hidden rounded-2xl bg-card border border-card-border p-6"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📈</span>
          <p className="text-text-secondary text-sm font-medium">{t.hero.biggestChange}</p>
        </div>
        <div className="space-y-3">
          {stats.biggestIncrease && (
            <div>
              <p className="text-xs text-text-secondary mb-0.5">↑ {t.hero.increase}</p>
              <p className="text-xs font-semibold text-white truncate">{stats.biggestIncrease.ministry}</p>
              <p className="text-sm font-bold text-success">+{stats.biggestIncrease.changePercent.toFixed(1)}%</p>
            </div>
          )}
          {stats.biggestDecrease && (
            <div>
              <p className="text-xs text-text-secondary mb-0.5">↓ {t.hero.decrease}</p>
              <p className="text-xs font-semibold text-white truncate">{stats.biggestDecrease.ministry}</p>
              <p className="text-sm font-bold text-danger">{stats.biggestDecrease.changePercent.toFixed(1)}%</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
