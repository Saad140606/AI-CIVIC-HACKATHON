import { motion } from 'framer-motion';
import type { MinistryTotal } from '../lib/api';

interface Props {
  ministry: MinistryTotal;
  allMinistries?: MinistryTotal[];
  prevYearTotal?: number;
}

// Compute a transparency/accountability score 0-100 based on data quality signals
export function computeTransparencyScore(ministry: MinistryTotal, allMinistries?: MinistryTotal[], prevYearTotal?: number): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  color: string;
  signals: { label: string; points: number; max: number }[];
} {
  let score = 0;
  const signals: { label: string; points: number; max: number }[] = [];

  // 1. Division count — more granular = more transparent (max 30 pts)
  const divCount = ministry.divisions.length;
  const divPoints = Math.min(Math.round((divCount / 10) * 30), 30);
  signals.push({ label: 'Data granularity', points: divPoints, max: 30 });
  score += divPoints;

  // 2. YoY variance — excessive spikes/cuts are a red flag (max 25 pts)
  let yoyPoints = 25;
  if (prevYearTotal && prevYearTotal > 0) {
    const change = Math.abs((ministry.total - prevYearTotal) / prevYearTotal);
    if (change > 0.5) yoyPoints = 5;        // >50% swing = suspicious
    else if (change > 0.3) yoyPoints = 12;   // >30% swing = concern
    else if (change > 0.15) yoyPoints = 18;  // >15% swing = minor concern
    else yoyPoints = 25;                      // stable = full points
  }
  signals.push({ label: 'Budget stability', points: yoyPoints, max: 25 });
  score += yoyPoints;

  // 3. Has sub-divisions (not just one lump sum) (max 20 pts)
  const hasMultipleDivs = divCount > 1 ? 20 : 5;
  signals.push({ label: 'Division breakdown', points: hasMultipleDivs, max: 20 });
  score += hasMultipleDivs;

  // 4. Relative size vs top ministry — very large share needs more scrutiny (max 15 pts)
  let sizePoints = 15;
  if (allMinistries && allMinistries.length > 0) {
    const totalBudget = allMinistries.reduce((s, m) => s + m.total, 0);
    const share = ministry.total / totalBudget;
    if (share > 0.4) sizePoints = 5;        // dominates >40% = flagged
    else if (share > 0.2) sizePoints = 10;   // large but ok
    else sizePoints = 15;
  }
  signals.push({ label: 'Budget proportion', points: sizePoints, max: 15 });
  score += sizePoints;

  // 5. Name clarity (has a clear ministry name, not generic) (max 10 pts)
  const nameClear = ministry.ministry.length > 5 && !ministry.ministry.toLowerCase().includes('unknown') ? 10 : 0;
  signals.push({ label: 'Name clarity', points: nameClear, max: 10 });
  score += nameClear;

  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';
  const color = grade === 'A' ? '#00e676' : grade === 'B' ? '#00d4ff' : grade === 'C' ? '#f59e0b' : grade === 'D' ? '#ff9800' : '#ef4444';

  return { score, grade, color, signals };
}

export default function TransparencyScore({ ministry, allMinistries, prevYearTotal }: Props) {
  const { score, grade, color } = computeTransparencyScore(ministry, allMinistries, prevYearTotal);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      title={`Transparency Score: ${score}/100 (Grade ${grade}) — Based on data granularity, budget stability, and division breakdown`}
      className="flex items-center gap-1.5 px-2 py-1 rounded-full cursor-help"
      style={{
        background: `${color}12`,
        border: `1px solid ${color}30`,
      }}
    >
      <div className="relative w-3 h-3 flex items-center justify-center">
        {/* Animated ring */}
        <svg viewBox="0 0 12 12" className="w-3 h-3 -rotate-90">
          <circle cx="6" cy="6" r="4.5" fill="none" stroke={`${color}30`} strokeWidth="1.5" />
          <motion.circle
            cx="6" cy="6" r="4.5"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 4.5}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 4.5 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 4.5 * (1 - score / 100) }}
            transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
          />
        </svg>
      </div>
      <span className="text-[10px] font-black" style={{ color }}>
        T-{grade}
      </span>
    </motion.div>
  );
}
