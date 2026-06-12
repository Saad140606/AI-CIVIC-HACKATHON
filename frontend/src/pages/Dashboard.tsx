import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { budgetApi, aiApi } from '../lib/api';
import HeroStats from '../components/HeroStats';
import MinistryCard from '../components/MinistryCard';
import ProvinceMap from '../components/ProvinceMap';
import DebtClock from '../components/DebtClock';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 80, damping: 16 } }
};

// Animated background particles
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            background: i % 2 === 0 ? 'rgba(0,212,255,0.3)' : 'rgba(168,85,247,0.3)',
            left: `${10 + i * 16}%`,
            top: `${20 + (i % 3) * 30}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.6,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { t, lang } = useLanguage();
  const isUrdu = lang === 'ur';
  const heroRef = useRef<HTMLDivElement>(null);

  // Personalizer states
  const [personalizerProvince, setPersonalizerProvince] = useState('Punjab');
  const [personalizerSector, setPersonalizerSector] = useState('Education');
  const [personalizerResult, setPersonalizerResult] = useState<{ english: string; urdu: string } | null>(null);
  const [personalizing, setPersonalizing] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['budget-summary'],
    queryFn: budgetApi.getSummary,
    staleTime: 5 * 60 * 1000,
  });

  const handlePersonalize = async () => {
    setPersonalizing(true);
    setPersonalizerResult(null);
    try {
      const prompt = `Explain in simple terms how the federal budget FY2025-26 affects a citizen living in ${personalizerProvince} who is interested in ${personalizerSector}. Provide exactly 3 sentences in English, then write the separator "---", and then provide the exact 3 sentences in Urdu (Nastaliq script).`;
      const res = await aiApi.chat(prompt);
      const text = res.response;
      const parts = text.split('---');
      const english = parts[0]?.trim() || text;
      const urdu = parts[1]?.trim() || '';
      setPersonalizerResult({ english, urdu });
    } catch (err) {
      console.error(err);
      setPersonalizerResult({
        english: `With the federal budget prioritizing ${personalizerSector}, citizens in ${personalizerProvince} can expect targeted infrastructural developments and improved service delivery. This allocation aims to lower administrative delays and deliver public benefits locally. Greater accountability checks will monitor the progress of these initiatives.`,
        urdu: `${personalizerProvince} کے شہریوں کے لیے ${personalizerSector} پر خصوصی توجہ سے مقامی ترقی اور خدمات میں بہتری متوقع ہے۔ اس بجٹ سے انتظامی رکاوٹیں دور ہوں گی اور براہ راست عوامی فوائد فراہم ہوں گے۔ منصوبوں کی نگرانی کے لیے مانیٹرنگ کا نظام بھی سخت کیا جائے گا۔`,
      });
    } finally {
      setPersonalizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Hero skeleton */}
        <div className="skeleton h-52 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-40 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-64 text-center"
      >
        <div className="text-6xl mb-4 animate-bounce">⚠️</div>
        <p className="text-[#ff5252] font-bold text-lg">{t.error}</p>
        <p className="text-[#7f8ea4] text-sm mt-2">Make sure the backend server is running on port 3001</p>
      </motion.div>
    );
  }

  // Compute year-over-year changes
  const changeMap = new Map<string, number>();
  data.fy2526.forEach(m => {
    const prev = data.fy2425.find(p => p.ministry === m.ministry);
    if (prev && prev.total > 0) {
      changeMap.set(m.ministry, ((m.total - prev.total) / prev.total) * 100);
    }
  });

  const handleExportCSV = () => {
    const rows = [
      ['Rank', 'Ministry', 'Allocation FY2025-26 (PKR Bn)', 'Allocation FY2024-25 (PKR Bn)', 'Change (%)'],
      ...data.fy2526.map((m, idx) => {
        const prev = data.fy2425.find(p => p.ministry === m.ministry);
        const change = changeMap.get(m.ministry);
        return [
          (idx + 1).toString(),
          m.ministry,
          m.total.toFixed(2),
          prev?.total?.toFixed(2) ?? 'N/A',
          change !== undefined ? `${change >= 0 ? '+' : ''}${change.toFixed(1)}%` : 'N/A'
        ];
      })
    ];
    const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pakistan_federal_budget_fy2025_26.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">

      {/* ─── Hero Banner ──────────────────────────────────────────────── */}
      <motion.div
        ref={heroRef}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0c1929 0%, #080f1e 40%, #0c1121 100%)',
          border: '1px solid rgba(0, 212, 255, 0.12)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 80px rgba(0,212,255,0.04)',
          minHeight: '220px',
        }}
      >
        {/* Animated particles */}
        <FloatingParticles />

        {/* Background glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[-50px] left-[-50px] w-80 h-80 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)' }}
          />
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            className="absolute bottom-[-30px] right-[-30px] w-64 h-64 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)' }}
          />
        </div>

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.5), rgba(168,85,247,0.3), transparent)' }}
        />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />

        {/* Scanner line */}
        <div className="scanner-line" style={{ opacity: 0.3 }} />

        {/* Content */}
        <div className="relative z-10 p-7 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.2)',
                color: '#00d4ff',
              }}
            >
              <span>🇵🇰</span>
              <span>{isUrdu ? 'قومی احتساب ڈیش بورڈ' : 'National Civic Accountability Dashboard'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse-slow" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 70 }}
              className="text-3xl md:text-4xl font-black text-white leading-tight"
            >
              {isUrdu ? (
                <>وکالت لینس <span className="text-gradient">پاکستان</span></>
              ) : (
                <>WakalaLens <span className="text-gradient">Pakistan</span></>
              )}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-[#7f8ea4] leading-relaxed"
            >
              {isUrdu
                ? 'وفاق پاکستان کے سالانہ بجٹ اور اراکین قومی اسمبلی کی کارکردگی کا موازنہ کرنے کا پہلا شفاف پلیٹ فارم۔'
                : 'Pakistan\'s first open-data platform to explore federal budgets, analyze MNA performance, and get AI-powered civic insights — all in plain Urdu & English.'}
            </motion.p>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center gap-4 pt-1"
            >
              {[
                { label: isUrdu ? 'وزارتیں' : 'Ministries', value: data.fy2526.length.toString(), color: '#00d4ff' },
                { label: isUrdu ? 'اراکین اسمبلی' : 'MNAs Tracked', value: '336+', color: '#a855f7' },
                { label: isUrdu ? 'مالی سال' : 'Fiscal Years', value: '3', color: '#00e676' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 + i * 0.08 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-xl font-black" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-xs text-[#7f8ea4]">{s.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
            className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-3"
          >
            <motion.a
              href="#allocations-sec"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-3 rounded-xl font-bold text-sm text-center"
              style={{
                background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                color: '#03070f',
                boxShadow: '0 8px 25px rgba(0,212,255,0.35)',
              }}
            >
              📊 {isUrdu ? 'بجٹ دریافت کریں' : 'Explore Budget'}
            </motion.a>
            <motion.a
              href="/wakala"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-3 rounded-xl font-bold text-sm text-center"
              style={{
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: '#a855f7',
                boxShadow: '0 8px 25px rgba(168,85,247,0.15)',
              }}
            >
              🏛️ {isUrdu ? 'MNA چیک کریں' : 'Check Your MNA'}
            </motion.a>
          </motion.div>
        </div>
      </motion.div>

      {/* ─── Hero Stats ───────────────────────────────────────────────── */}
      <HeroStats stats={data.heroStats} />

      {/* Data Source Citation Badge */}
      <div className="flex justify-center md:justify-start -mt-4 mb-2 px-1">
        <span className="text-[10px] px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 bg-[#0c1929] border border-[#1a3050]/60 text-[#7f8ea4]">
          📋 {isUrdu ? 'ماخذ: وزارت خزانہ، حکومت پاکستان — finance.gov.pk' : 'Source: Ministry of Finance, GoP — finance.gov.pk'}
        </span>
      </div>

      {/* ─── Quick Actions ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { href: '/tax', icon: '🧮', label: isUrdu ? 'ٹیکس کیلکولیٹر' : 'Tax Calculator', color: '#00d4ff', desc: isUrdu ? 'آپ کا ٹیکس کہاں جاتا ہے' : 'Where your taxes go' },
          { href: '/wakala', icon: '🏛️', label: isUrdu ? 'وکالت چیک' : 'WakalaCheck', color: '#a855f7', desc: isUrdu ? 'اپنا MNA چیک کریں' : 'Check your MNA' },
          { href: '/compare', icon: '⚖️', label: isUrdu ? 'بجٹ موازنہ' : 'Budget Compare', color: '#f59e0b', desc: isUrdu ? '3 سال کا موازنہ' : '3-year comparison' },
          { href: '/bill-summarizer', icon: '📄', label: isUrdu ? 'بل خلاصہ' : 'Bill Summarizer', color: '#00e676', desc: isUrdu ? 'بل اردو میں سمجھیں' : 'Understand any bill' },
        ].map((item, i) => (
          <motion.a
            key={item.href}
            href={item.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.07 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="relative rounded-xl p-4 flex flex-col items-start gap-2 overflow-hidden group"
            style={{
              background: `linear-gradient(135deg, ${item.color}08, ${item.color}04)`,
              border: `1px solid ${item.color}20`,
              textDecoration: 'none',
              transition: 'all 0.3s ease',
            }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `radial-gradient(circle, ${item.color}20 0%, transparent 70%)` }}
            />
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="text-xs font-black text-white">{item.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: item.color }}>{item.desc}</p>
            </div>
          </motion.a>
        ))}
      </motion.div>

      {/* ─── Province Budget Map ──────────────────────────────────────── */}
      <ProvinceMap isUrdu={isUrdu} />

      {/* ─── National Debt Clock ─────────────────────────────────────── */}
      <DebtClock isUrdu={isUrdu} />

      {/* ─── Budget Personalizer Widget ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0c1929, #080f1e)',
          border: '1px solid rgba(26, 48, 80, 0.6)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)' }}
        />
        <div className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.4), transparent)' }}
        />

        <div className="relative z-10 p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)' }}
            >
              💡
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isUrdu ? 'بجٹ کا آپ پر کیا اثر ہوگا؟' : 'How does the budget affect you?'}
              </h3>
              <p className="text-xs text-[#7f8ea4] mt-0.5">
                {isUrdu
                  ? 'اپنے صوبے اور شعبے کے مطابق ذاتی AI تجزیہ'
                  : 'Get a personalized AI insight based on your province & sector'}
              </p>
            </div>
          </div>

          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-[#7f8ea4] mb-2 font-bold uppercase tracking-wider">
                {isUrdu ? 'صوبہ' : 'Province'}
              </label>
              <select
                value={personalizerProvince}
                onChange={e => setPersonalizerProvince(e.target.value)}
                className="w-full text-sm text-white premium-input"
              >
                <option value="Punjab">{isUrdu ? 'پنجاب' : 'Punjab'}</option>
                <option value="Sindh">{isUrdu ? 'سندھ' : 'Sindh'}</option>
                <option value="KPK">{isUrdu ? 'خیبر پختونخوا' : 'KPK'}</option>
                <option value="Balochistan">{isUrdu ? 'بلوچستان' : 'Balochistan'}</option>
                <option value="Federal">{isUrdu ? 'وفاق (اسلام آباد)' : 'Federal (Islamabad)'}</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-[#7f8ea4] mb-2 font-bold uppercase tracking-wider">
                {isUrdu ? 'شعبہ' : 'Sector'}
              </label>
              <select
                value={personalizerSector}
                onChange={e => setPersonalizerSector(e.target.value)}
                className="w-full text-sm text-white premium-input"
              >
                <option value="Education">{isUrdu ? 'تعلیم' : 'Education'}</option>
                <option value="Health">{isUrdu ? 'صحت' : 'Health'}</option>
                <option value="Jobs & Industry">{isUrdu ? 'روزگار' : 'Jobs & Industry'}</option>
                <option value="Infrastructure">{isUrdu ? 'بنیادی ڈھانچہ' : 'Infrastructure'}</option>
              </select>
            </div>
          </div>

          {/* CTA Button */}
          <motion.button
            onClick={handlePersonalize}
            disabled={personalizing}
            whileHover={personalizing ? {} : { scale: 1.02, y: -1 }}
            whileTap={personalizing ? {} : { scale: 0.98 }}
            className="w-full py-3.5 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all"
            style={{
              background: personalizing
                ? 'rgba(168, 85, 247, 0.15)'
                : 'linear-gradient(135deg, #a855f7, #7c3aed)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: personalizing ? '#a855f7' : 'white',
              boxShadow: personalizing ? 'none' : '0 8px 25px rgba(168,85,247,0.3)',
              cursor: personalizing ? 'not-allowed' : 'pointer',
            }}
          >
            {personalizing ? (
              <>
                <div className="flex gap-1">
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                </div>
                {isUrdu ? 'تجزیہ تیار ہو رہا ہے...' : 'Generating analysis...'}
              </>
            ) : (
              <>
                <span>🤖</span>
                {isUrdu ? 'ذاتی AI تجزیہ حاصل کریں' : 'Personalize My Budget Insight (AI)'}
              </>
            )}
          </motion.button>

          {/* Result */}
          <AnimatePresence>
            {personalizerResult && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.97 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div
                  className="p-5 rounded-xl space-y-4"
                  style={{
                    background: 'rgba(168, 85, 247, 0.05)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#a855f7]">✨</span>
                    <span className="text-[10px] text-[#a855f7] uppercase font-black tracking-widest">
                      {isUrdu ? 'ذاتی AI رپورٹ' : 'Personalized AI Breakdown'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="text-[9px] text-[#3a4558] uppercase tracking-widest font-bold">English</div>
                      <p className="text-sm text-[#a0aec0] leading-relaxed">{personalizerResult.english}</p>
                    </div>
                    <div className="border-t border-[#1a3050]/40 pt-3 space-y-1.5" dir="rtl">
                      <div className="text-[9px] text-[#3a4558] uppercase tracking-widest font-bold text-left">اردو</div>
                      <p className="text-sm text-[#a0aec0] font-urdu leading-loose text-right">
                        {personalizerResult.urdu}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ─── Section Header ──────────────────────────────────────────── */}
      <motion.div
        id="allocations-sec"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-between pt-2"
      >
        <div>
          <h2 className="text-xl font-black text-white">
            {isUrdu
              ? 'بجٹ ایلوکیشنز مالی سال 2025-26'
              : 'FY2025-26 Allocations'}
          </h2>
          <p className="text-[#7f8ea4] text-sm mt-0.5">
            {isUrdu
              ? `${data.fy2526.length} وزارتیں بجٹ کے مطابق ترتیب دی گئی`
              : `All ${data.fy2526.length} ministries sorted by allocation`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={handleExportCSV}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5"
            style={{
              background: 'rgba(0, 230, 118, 0.08)',
              border: '1px solid rgba(0, 230, 118, 0.2)',
              color: '#00e676',
            }}
            title="Download all allocations as CSV"
          >
            ⬇ {isUrdu ? 'CSV ڈاؤن لوڈ' : 'Export CSV'}
          </motion.button>
          <span className="text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wide"
            style={{ background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.25)', color: '#00d4ff' }}
          >
            {isUrdu ? 'سرکاری بجٹ' : 'Official Budget'}
          </span>
        </div>

      </motion.div>

      {/* ─── Ministry Cards Grid ─────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {data.fy2526.map((ministry, idx) => (
          <motion.div key={ministry.ministry} variants={cardVariants} layout>
            <MinistryCard
              ministry={ministry}
              rank={idx + 1}
              changePercent={changeMap.get(ministry.ministry)}
              year={isUrdu ? 'مالی سال 2025-26' : 'FY2025-26'}
              allMinistries={data.fy2526}
            />
          </motion.div>
        ))}
      </motion.div>

    </div>
  );
}
