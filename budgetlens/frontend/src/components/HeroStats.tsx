import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { HeroStats as HeroStatsType } from '../lib/api';
import { formatBillions, formatChangePercent, getChangeColor } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  stats: HeroStatsType;
}

// Animated number counter
function AnimatedNumber({ value, suffix = '' }: { value: string; suffix?: string }) {
  const [displayed, setDisplayed] = useState('0');
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    // Just animate opacity - number is already formatted
    setDisplayed(value);
  }, [value]);

  return <span>{displayed}{suffix}</span>;
}

const statCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 80,
      damping: 16,
      delay: i * 0.12,
    }
  })
};

function StatCard({ icon, label, value, sub, subColor, index, accentColor = '#00d4ff', children }: {
  icon: string;
  label: string;
  value?: string;
  sub?: string;
  subColor?: string;
  index: number;
  accentColor?: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      custom={index}
      variants={statCardVariants}
      initial="hidden"
      animate="show"
      whileHover={{ y: -6, scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      className="relative rounded-2xl overflow-hidden cursor-default"
      style={{
        background: 'linear-gradient(135deg, #0c1929 0%, #080f1e 100%)',
        border: '1px solid rgba(26, 48, 80, 0.7)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Top accent border glow */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }}
      />

      {/* Background radial glow */}
      <div
        className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accentColor}10 0%, transparent 70%)` }}
      />

      {/* Corner accent */}
      <div
        className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accentColor}08 0%, transparent 70%)` }}
      />

      <div className="relative z-10 p-6">
        {/* Icon + label row */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}25` }}
          >
            {icon}
          </div>
          <p className="text-[#7f8ea4] text-sm font-medium leading-snug">{label}</p>
        </div>

        {/* Value */}
        {value && (
          <div className="space-y-1">
            <p
              className="text-3xl font-black leading-none"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              <AnimatedNumber value={value} />
            </p>
            {sub && (
              <p className="text-sm font-bold mt-2" style={{ color: subColor || '#7f8ea4' }}>
                {sub}
              </p>
            )}
          </div>
        )}

        {children}
      </div>
    </motion.div>
  );
}

export default function HeroStats({ stats }: Props) {
  const { t } = useLanguage();
  const changeColor = getChangeColor(stats.totalChangePercent);
  const isPositive = stats.totalChangePercent > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

      {/* Total Budget */}
      <StatCard
        icon="🇵🇰"
        label={t.hero.totalBudget}
        value={`PKR ${formatBillions(stats.fy2526Total)}`}
        sub={`${formatChangePercent(stats.totalChangePercent)} ${t.hero.vsLastYear}`}
        subColor={changeColor}
        index={0}
        accentColor={isPositive ? '#00d4ff' : '#ff5252'}
      >
        {/* Trend mini bar */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-[#080f1e] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Math.abs(stats.totalChangePercent) * 3, 100)}%` }}
              transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: changeColor, boxShadow: `0 0 8px ${changeColor}80` }}
            />
          </div>
          <span className="text-xs font-bold" style={{ color: changeColor }}>
            {isPositive ? '▲' : '▼'} {Math.abs(stats.totalChangePercent).toFixed(1)}%
          </span>
        </div>
      </StatCard>

      {/* Top 3 Ministries */}
      <StatCard
        icon="🏛️"
        label={t.hero.topMinistries}
        index={1}
        accentColor="#a855f7"
      >
        <div className="space-y-3 mt-1">
          {stats.top3.map((m, i) => (
            <motion.div
              key={m.ministry}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0"
                style={{
                  background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #ef4444)' :
                               i === 1 ? 'linear-gradient(135deg, #a855f7, #6366f1)' :
                               'linear-gradient(135deg, #00d4ff, #0077b6)',
                  boxShadow: i === 0 ? '0 2px 8px rgba(245,158,11,0.3)' : ''
                }}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-semibold text-white truncate">{m.ministry.split(' ').slice(0, 3).join(' ')}</p>
                  <p className="text-xs font-black text-[#a855f7] shrink-0">PKR {formatBillions(m.total)}</p>
                </div>
                {/* Proportional bar */}
                <div className="mt-1 h-0.5 rounded-full bg-[#080f1e] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(m.total / stats.top3[0].total) * 100}%` }}
                    transition={{ duration: 1, delay: 0.6 + i * 0.1 }}
                    className="h-full rounded-full"
                    style={{
                      background: i === 0 ? '#f59e0b' : i === 1 ? '#a855f7' : '#00d4ff',
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </StatCard>

      {/* Biggest Changes */}
      <StatCard
        icon="📈"
        label={t.hero.biggestChange}
        index={2}
        accentColor="#00e676"
      >
        <div className="space-y-4 mt-1">
          {stats.biggestIncrease && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-3 rounded-xl"
              style={{ background: 'rgba(0, 230, 118, 0.06)', border: '1px solid rgba(0, 230, 118, 0.15)' }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[#00e676] text-xs font-black">▲</span>
                <p className="text-[9px] text-[#7f8ea4] uppercase font-bold tracking-widest">{t.hero.increase}</p>
              </div>
              <p className="text-xs font-semibold text-white truncate">{stats.biggestIncrease.ministry}</p>
              <p className="text-lg font-black text-[#00e676] mt-0.5">
                +{stats.biggestIncrease.changePercent.toFixed(1)}%
              </p>
            </motion.div>
          )}
          {stats.biggestDecrease && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="p-3 rounded-xl"
              style={{ background: 'rgba(255, 82, 82, 0.06)', border: '1px solid rgba(255, 82, 82, 0.15)' }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[#ff5252] text-xs font-black">▼</span>
                <p className="text-[9px] text-[#7f8ea4] uppercase font-bold tracking-widest">{t.hero.decrease}</p>
              </div>
              <p className="text-xs font-semibold text-white truncate">{stats.biggestDecrease.ministry}</p>
              <p className="text-lg font-black text-[#ff5252] mt-0.5">
                {stats.biggestDecrease.changePercent.toFixed(1)}%
              </p>
            </motion.div>
          )}
        </div>
      </StatCard>

    </div>
  );
}
