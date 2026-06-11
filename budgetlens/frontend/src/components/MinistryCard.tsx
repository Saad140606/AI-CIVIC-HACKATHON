import { useState } from 'react';
import { motion } from 'framer-motion';
import type { MinistryTotal } from '../lib/api';
import { formatBillions, getChangeColor, getChangeArrow, formatChangePercent } from '../lib/utils';
import AIExplainButton from './AIExplainButton';
import ShareCard from './ShareCard';

interface Props {
  ministry: MinistryTotal;
  rank: number;
  changePercent?: number;
  onClick?: () => void;
  isSelected?: boolean;
  year?: string;
}

export default function MinistryCard({ ministry, rank, changePercent, onClick, isSelected, year = 'FY2025-26' }: Props) {
  const [showDivisions, setShowDivisions] = useState(false);
  const changeColor = changePercent !== undefined ? getChangeColor(changePercent) : undefined;
  const arrow = changePercent !== undefined ? getChangeArrow(changePercent) : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(rank * 0.03, 0.5) }}
      id={`ministry-card-${rank}`}
      className={`budget-card rounded-xl border p-5 cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-card-hover border-accent/50 shadow-accent'
          : 'bg-card border-card-border hover:bg-card-hover hover:border-accent/30'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Rank */}
        <div className="shrink-0 w-8 h-8 rounded-lg bg-bg-secondary border border-card-border flex items-center justify-center">
          <span className="text-xs font-bold text-text-secondary">#{rank}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white text-sm leading-tight">{ministry.ministry}</h3>
            {changePercent !== undefined && (
              <span
                className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  color: changeColor,
                  background: `${changeColor}22`,
                  border: `1px solid ${changeColor}44`,
                }}
              >
                {arrow} {formatChangePercent(changePercent)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2">
            <p className="text-xl font-black text-gradient">PKR {formatBillions(ministry.total)}</p>
            <p className="text-xs text-text-secondary">{year}</p>
          </div>

          {/* Budget bar */}
          <div className="mt-3 h-1.5 rounded-full bg-bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((ministry.total / 9775) * 100, 100)}%` }}
              transition={{ duration: 0.8, delay: rank * 0.05 }}
              className="h-full rounded-full bg-gradient-to-r from-accent to-blue-400"
            />
          </div>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <button
          id={`divisions-btn-${rank}`}
          onClick={e => { e.stopPropagation(); setShowDivisions(v => !v); }}
          className="text-xs text-text-secondary hover:text-accent transition-colors"
        >
          {showDivisions ? '▲' : '▼'} {ministry.divisions.length} Divisions
        </button>
        <div onClick={e => e.stopPropagation()}>
          <ShareCard ministry={ministry} changePercent={changePercent} />
        </div>
      </div>

      {/* AI explain */}
      <div onClick={e => e.stopPropagation()}>
        <AIExplainButton ministry={ministry.ministry} budget={ministry.total} year={year} />
      </div>

      {/* Divisions breakdown */}
      {showDivisions && ministry.divisions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-card-border space-y-2 overflow-hidden"
        >
          {ministry.divisions.slice(0, 8).map(div => (
            <div key={div.division} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent/60 shrink-0" />
              <p className="text-xs text-text-secondary flex-1 truncate">{div.division}</p>
              <p className="text-xs font-semibold text-white">PKR {formatBillions(div.total)}</p>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
