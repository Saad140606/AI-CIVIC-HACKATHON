import { motion } from 'framer-motion';

const PROVINCES = [
  {
    name: 'Punjab',
    nameUrdu: 'پنجاب',
    flag: '🌾',
    color: '#00d4ff',
    nfcShare: 51.74,
    population: 110,
    psdpAlloc: 180, // PKR Billions
    perCapita: 1636, // PKR per person
    highlight: 'Largest NFC share',
    highlightUrdu: 'سب سے زیادہ NFC حصہ',
  },
  {
    name: 'Sindh',
    nameUrdu: 'سندھ',
    flag: '🌊',
    color: '#00e676',
    nfcShare: 24.55,
    population: 47.9,
    psdpAlloc: 83,
    perCapita: 1734,
    highlight: 'Karachi economic hub',
    highlightUrdu: 'کراچی اقتصادی مرکز',
  },
  {
    name: 'KPK',
    nameUrdu: 'خیبر پختونخوا',
    flag: '🏔️',
    color: '#a855f7',
    nfcShare: 14.62,
    population: 40.5,
    psdpAlloc: 55,
    perCapita: 1358,
    highlight: 'FATA merger bonus +3%',
    highlightUrdu: 'فاٹا انضمام +3%',
  },
  {
    name: 'Balochistan',
    nameUrdu: 'بلوچستان',
    flag: '⛰️',
    color: '#f59e0b',
    nfcShare: 9.09,
    population: 14.9,
    psdpAlloc: 45,
    perCapita: 3020,
    highlight: 'Highest per-capita share',
    highlightUrdu: 'فی کس سب سے زیادہ',
  },
];

// FY2025-26 NFC Pool estimate (PKR Billions) — 57.5% of divisible pool ~PKR 6,200B
const NFC_POOL_B = 6200;

interface Props {
  isUrdu?: boolean;
}

export default function ProvinceMap({ isUrdu = false }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0c1929, #080f1e)',
        border: '1px solid rgba(26, 48, 80, 0.6)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div
        className="relative px-6 pt-5 pb-4 border-b border-[#1a3050]/40"
      >
        <div className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), rgba(168,85,247,0.3), transparent)' }}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)' }}>
              🗺️
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isUrdu ? 'صوبہ وار بجٹ تقسیم' : 'Province Budget Distribution'}
              </h3>
              <p className="text-xs text-[#7f8ea4] mt-0.5">
                {isUrdu ? `NFC پول: PKR ${NFC_POOL_B.toLocaleString()}B — مالی سال 2025-26` : `NFC Pool: PKR ${NFC_POOL_B.toLocaleString()}B — FY2025-26`}
              </p>
            </div>
          </div>
          <a
            href="https://www.finance.gov.pk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] px-2.5 py-1 rounded-full font-bold"
            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}
          >
            finance.gov.pk
          </a>
        </div>
      </div>

      {/* Province Cards */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PROVINCES.map((prov, i) => {
          const nfcAmount = Math.round(NFC_POOL_B * prov.nfcShare / 100);
          return (
            <motion.div
              key={prov.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
              whileHover={{ y: -3, scale: 1.02 }}
              className="relative rounded-xl p-4 cursor-default overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${prov.color}08, ${prov.color}04)`,
                border: `1px solid ${prov.color}25`,
                boxShadow: `0 4px 20px ${prov.color}08`,
              }}
            >
              {/* Glow accent */}
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none"
                style={{ background: `radial-gradient(circle, ${prov.color}12 0%, transparent 70%)` }}
              />

              <div className="relative z-10">
                {/* Flag + Name row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{prov.flag}</span>
                    <div>
                      <p className="font-black text-white text-sm">{isUrdu ? prov.nameUrdu : prov.name}</p>
                      <p className="text-[10px] text-[#7f8ea4]">
                        {isUrdu ? `آبادی: ${prov.population}M` : `Pop: ${prov.population}M`}
                      </p>
                    </div>
                  </div>
                  <div
                    className="text-right px-2.5 py-1 rounded-lg"
                    style={{ background: `${prov.color}15`, border: `1px solid ${prov.color}30` }}
                  >
                    <div className="text-xs font-black" style={{ color: prov.color }}>{prov.nfcShare}%</div>
                    <div className="text-[9px] text-[#7f8ea4]">NFC</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(8,15,30,0.6)' }}>
                    <p className="text-[9px] text-[#7f8ea4] uppercase tracking-wider">NFC Transfer</p>
                    <p className="text-sm font-black text-white">PKR {nfcAmount}B</p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(8,15,30,0.6)' }}>
                    <p className="text-[9px] text-[#7f8ea4] uppercase tracking-wider">{isUrdu ? 'PSDP' : 'PSDP Alloc'}</p>
                    <p className="text-sm font-black text-white">PKR {prov.psdpAlloc}B</p>
                  </div>
                </div>

                {/* NFC share bar */}
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full bg-[#080f1e] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: prov.color, boxShadow: `0 0 6px ${prov.color}60` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${prov.nfcShare}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-[#3a4558]">
                    <span>
                      {isUrdu ? `فی کس: PKR ${prov.perCapita.toLocaleString()}` : `Per-capita: PKR ${prov.perCapita.toLocaleString()}`}
                    </span>
                    <span style={{ color: prov.color }}>{isUrdu ? prov.highlightUrdu : prov.highlight}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="px-6 pb-4">
        <p className="text-[10px] text-[#3a4558]">
          {isUrdu
            ? 'ماخذ: وزارت خزانہ — NFC ایوارڈ 2009 کے تحت تقسیم'
            : 'Source: Ministry of Finance, GoP — NFC Award 2009 distribution formula'}
        </p>
      </div>
    </motion.div>
  );
}
