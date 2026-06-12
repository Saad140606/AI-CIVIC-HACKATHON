import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Pakistan FY2025-26 debt servicing = PKR 8,199 Billion (as per budget)
// Total external + domestic debt ≈ PKR 68,000 Billion (as of June 2025)
const TOTAL_DEBT_PKR_B = 68000; // PKR Billions
const ANNUAL_INTEREST_PKR_B = 8199; // PKR Billions (FY2025-26 debt servicing allocation)
const SECONDS_PER_YEAR = 365.25 * 24 * 3600;
const PKR_PER_SECOND = (ANNUAL_INTEREST_PKR_B * 1e9) / SECONDS_PER_YEAR; // PKR per second

interface Props {
  isUrdu?: boolean;
}

export default function DebtClock({ isUrdu = false }: Props) {
  const [interestAccrued, setInterestAccrued] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setInterestAccrued(elapsed * PKR_PER_SECOND);
    }, 100);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatPKR = (n: number) => {
    if (n >= 1e12) return `${(n / 1e12).toFixed(4)} Trillion`;
    if (n >= 1e9) return `${(n / 1e9).toFixed(6)} Billion`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(4)} Million`;
    return `${Math.floor(n).toLocaleString()}`;
  };

  const perSecond = PKR_PER_SECOND;
  const perMinute = perSecond * 60;
  const perHour = perMinute * 60;
  const perDay = perHour * 24;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f0a1e, #1a0a10)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        boxShadow: '0 8px 32px rgba(239,68,68,0.08), 0 4px 16px rgba(0,0,0,0.5)',
      }}
    >
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), rgba(245,158,11,0.4), transparent)' }}
      />

      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.05) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              ⏱️
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isUrdu ? 'قومی قرض کا کلاک' : 'National Debt Interest Clock'}
              </h3>
              <p className="text-xs text-[#7f8ea4] mt-0.5">
                {isUrdu
                  ? 'آپ کی آمد سے اب تک سود کا خرچ'
                  : 'Interest accruing since you opened this page'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
            <span className="text-[10px] font-bold text-[#ef4444] uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Main counter */}
        <div className="text-center py-4">
          <div className="text-xs text-[#7f8ea4] uppercase tracking-widest mb-2 font-semibold">
            {isUrdu ? 'سود جمع ہوا (PKR)' : 'Interest Accrued (PKR)'}
          </div>
          <motion.div
            className="text-3xl md:text-4xl font-black tabular-nums"
            style={{ color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.4)' }}
          >
            ₨ {formatPKR(interestAccrued)}
          </motion.div>
          <div className="text-[10px] text-[#7f8ea4] mt-2">
            {isUrdu ? 'مالی سال 2025-26 کے قرض سروسنگ الاؤنس پر مبنی' : 'Based on FY2025-26 debt servicing allocation of PKR 8,199B'}
          </div>
        </div>

        {/* Rate breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          {[
            {
              label: isUrdu ? 'فی سیکنڈ' : 'Per Second',
              value: `₨${Math.round(perSecond).toLocaleString()}`,
              color: '#ef4444',
            },
            {
              label: isUrdu ? 'فی منٹ' : 'Per Minute',
              value: `₨${Math.round(perMinute).toLocaleString()}`,
              color: '#f97316',
            },
            {
              label: isUrdu ? 'فی گھنٹہ' : 'Per Hour',
              value: `₨${(perHour / 1e6).toFixed(1)}M`,
              color: '#f59e0b',
            },
            {
              label: isUrdu ? 'فی دن' : 'Per Day',
              value: `₨${(perDay / 1e9).toFixed(2)}B`,
              color: '#a855f7',
            },
          ].map(item => (
            <div key={item.label}
              className="p-3 rounded-xl text-center"
              style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}
            >
              <div className="text-sm font-black" style={{ color: item.color }}>{item.value}</div>
              <div className="text-[10px] text-[#7f8ea4] mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Context */}
        <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(26,48,80,0.4)' }}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#7f8ea4]">
              {isUrdu ? 'کل قرض (تخمینی)' : 'Total National Debt (Est.)'}
            </span>
            <span className="font-black text-[#ef4444]">PKR {TOTAL_DEBT_PKR_B.toLocaleString()}B</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1.5">
            <span className="text-[#7f8ea4]">
              {isUrdu ? 'بجٹ کا حصہ (قرض سروسنگ)' : 'FY2025-26 Debt Servicing Budget'}
            </span>
            <span className="font-black text-[#f59e0b]">PKR 8,199B (48.4% of total)</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1.5">
            <span className="text-[#7f8ea4]">
              {isUrdu ? 'ماخذ' : 'Source'}
            </span>
            <a href="https://www.finance.gov.pk" target="_blank" rel="noopener noreferrer"
              className="font-semibold text-[#00d4ff] hover:text-white transition-colors">
              finance.gov.pk ↗
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
