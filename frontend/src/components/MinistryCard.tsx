import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MinistryTotal } from '../lib/api';
import { formatBillions, getChangeColor, getChangeArrow, formatChangePercent } from '../lib/utils';
import AIExplainButton from './AIExplainButton';
import ShareCard from './ShareCard';
import TransparencyScore from './TransparencyScore';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  ministry: MinistryTotal;
  rank: number;
  changePercent?: number;
  onClick?: () => void;
  isSelected?: boolean;
  year?: string;
  allMinistries?: MinistryTotal[];
}

// Ministry rank colors
const RANK_GRADIENT: Record<number, { bg: string; text: string; shadow: string }> = {
  1: { bg: 'linear-gradient(135deg, #f59e0b, #ef4444)', text: '#f59e0b', shadow: 'rgba(245,158,11,0.4)' },
  2: { bg: 'linear-gradient(135deg, #a855f7, #6366f1)', text: '#a855f7', shadow: 'rgba(168,85,247,0.35)' },
  3: { bg: 'linear-gradient(135deg, #00d4ff, #0099cc)', text: '#00d4ff', shadow: 'rgba(0,212,255,0.35)' },
};

// Category icons based on ministry name keywords
function getMinistryIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('defence') || n.includes('defense')) return '🛡️';
  if (n.includes('education')) return '📚';
  if (n.includes('health')) return '🏥';
  if (n.includes('finance')) return '💰';
  if (n.includes('energy') || n.includes('power')) return '⚡';
  if (n.includes('communication') || n.includes('digital')) return '📡';
  if (n.includes('transport') || n.includes('aviation')) return '✈️';
  if (n.includes('interior')) return '🏛️';
  if (n.includes('water')) return '💧';
  if (n.includes('agriculture')) return '🌾';
  if (n.includes('commerce') || n.includes('trade')) return '🤝';
  if (n.includes('industry')) return '🏭';
  if (n.includes('foreign') || n.includes('affairs')) return '🌍';
  if (n.includes('housing') || n.includes('urban')) return '🏗️';
  if (n.includes('science') || n.includes('technology')) return '🔬';
  if (n.includes('justice') || n.includes('law')) return '⚖️';
  if (n.includes('information')) return '📻';
  if (n.includes('railway')) return '🚂';
  if (n.includes('planning')) return '📋';
  if (n.includes('narcotics') || n.includes('drug')) return '💊';
  return '🏢';
}

export default function MinistryCard({ ministry, rank, changePercent, onClick, isSelected, year = 'FY2025-26', allMinistries }: Props) {
  const { lang } = useLanguage();
  const [showDivisions, setShowDivisions] = useState(false);
  const changeColor = changePercent !== undefined ? getChangeColor(changePercent) : undefined;
  const arrow = changePercent !== undefined ? getChangeArrow(changePercent) : '';
  const rankStyle = RANK_GRADIENT[rank];
  const icon = getMinistryIcon(ministry.ministry);

  // Calculate the bar width based on max budget of ~9775 PKR
  const barWidth = Math.min((ministry.total / 9775) * 100, 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 80,
        damping: 16,
        delay: Math.min(rank * 0.025, 0.5)
      }}
      id={`ministry-card-${rank}`}
      whileHover={{ y: isSelected ? 0 : -4, scale: isSelected ? 1 : 1.01 }}
      onClick={onClick}
      title={lang === 'ur' ? 'ماخذ: وزارت خزانہ، حکومت پاکستان — finance.gov.pk' : 'Source: Ministry of Finance, GoP — finance.gov.pk'}
      className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isSelected ? 'ring-2 ring-[#00d4ff]/40' : ''
      }`}
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, #101f35, #0c1929)'
          : 'linear-gradient(135deg, #0c1929, #080f1e)',
        border: isSelected
          ? '1px solid rgba(0, 212, 255, 0.35)'
          : '1px solid rgba(26, 48, 80, 0.6)',
        boxShadow: isSelected
          ? '0 12px 40px rgba(0, 212, 255, 0.1), 0 4px 16px rgba(0,0,0,0.5)'
          : '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      {/* Top shimmer line on selected */}
      {isSelected && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent" />
      )}

      {/* Rank glow for top 3 */}
      {rankStyle && (
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none"
          style={{ background: `radial-gradient(circle, ${rankStyle.shadow} 0%, transparent 70%)` }}
        />
      )}

      <div className="relative z-10 p-5">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Rank badge */}
          <div
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black"
            style={
              rankStyle
                ? { background: rankStyle.bg, boxShadow: `0 4px 12px ${rankStyle.shadow}`, color: '#fff' }
                : { background: 'rgba(26, 48, 80, 0.6)', color: '#7f8ea4', border: '1px solid rgba(26,48,80,0.8)' }
            }
          >
            {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : `#${rank}`}
          </div>

          {/* Ministry icon */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 bg-[#080f1e] border border-[#1a3050]/60">
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1.5">
                <h3 className="font-bold text-white text-sm leading-tight">{ministry.ministry}</h3>
                <div onClick={e => e.stopPropagation()} className="w-fit">
                  <TransparencyScore ministry={ministry} allMinistries={allMinistries} prevYearTotal={undefined} />
                </div>
              </div>
              {changePercent !== undefined && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="shrink-0 text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{
                    color: changeColor,
                    background: `${changeColor}18`,
                    border: `1px solid ${changeColor}35`,
                    boxShadow: `0 2px 8px ${changeColor}25`,
                  }}
                >
                  <span>{arrow}</span>
                  <span>{formatChangePercent(changePercent)}</span>
                </motion.span>
              )}
            </div>

            {/* Budget value */}
            <div className="flex items-baseline gap-2 mt-1.5">
              <p
                className="text-2xl font-black"
                style={{
                  background: rankStyle
                    ? rankStyle.bg
                    : 'linear-gradient(135deg, #00d4ff, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                PKR {formatBillions(ministry.total)}
              </p>
              <span className="text-[11px] text-[#7f8ea4] font-medium">{year}</span>
            </div>
          </div>
        </div>

        {/* Animated progress bar */}
        <div className="mt-4 h-1.5 rounded-full bg-[#080f1e] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 1.2, delay: rank * 0.04, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              background: rankStyle
                ? rankStyle.bg
                : 'linear-gradient(90deg, #00d4ff, #a855f7)',
              boxShadow: rankStyle
                ? `0 0 8px ${rankStyle.shadow}`
                : '0 0 8px rgba(0, 212, 255, 0.3)',
            }}
          />
        </div>

        {/* Division count badge */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-[#3a4558]">{ministry.divisions.length} divisions</span>
          <span className="text-[10px] text-[#3a4558]">{barWidth.toFixed(1)}% of top</span>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-3 mt-4 flex-wrap pt-3 border-t border-[#1a3050]/40">
          <motion.button
            id={`divisions-btn-${rank}`}
            onClick={e => { e.stopPropagation(); setShowDivisions(v => !v); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
            style={{
              background: showDivisions ? 'rgba(0, 212, 255, 0.1)' : 'rgba(26, 48, 80, 0.4)',
              border: showDivisions ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid rgba(26, 48, 80, 0.6)',
              color: showDivisions ? '#00d4ff' : '#7f8ea4',
            }}
          >
            <motion.span
              animate={{ rotate: showDivisions ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="text-[10px]"
            >
              ▼
            </motion.span>
            {ministry.divisions.length} Divisions
          </motion.button>


          <div onClick={e => e.stopPropagation()}>
            <ShareCard ministry={ministry} changePercent={changePercent} />
          </div>
        </div>

        {/* AI Explain */}
        <div onClick={e => e.stopPropagation()} className="mt-2">
          <AIExplainButton ministry={ministry.ministry} budget={ministry.total} year={year} />
        </div>

        {/* Divisions breakdown */}
        <AnimatePresence>
          {showDivisions && ministry.divisions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="mt-4 pt-4 border-t border-[#1a3050]/40 overflow-hidden"
            >
              <div className="space-y-2">
                {ministry.divisions.slice(0, 8).map((div, i) => (
                  <motion.div
                    key={div.division}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-[#080f1e]/60 transition-colors group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]/40 shrink-0 group-hover:bg-[#00d4ff] transition-colors" />
                    <p className="text-xs text-[#7f8ea4] flex-1 truncate group-hover:text-white transition-colors">
                      {div.division}
                    </p>
                    <p className="text-xs font-bold text-white shrink-0">PKR {formatBillions(div.total)}</p>
                  </motion.div>
                ))}
                {ministry.divisions.length > 8 && (
                  <p className="text-[10px] text-[#3a4558] text-center pt-1">
                    +{ministry.divisions.length - 8} more divisions
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
