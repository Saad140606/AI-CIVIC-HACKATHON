import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import ShareCard from '../components/ShareCard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// Pakistan income tax slabs FY2025-26 (Federal Budget)
const TAX_SLABS = [
  { min: 0, max: 600000, rate: 0, fixed: 0, label: 'No Tax' },
  { min: 600000, max: 1200000, rate: 0.05, fixed: 0, label: '5%' },
  { min: 1200000, max: 2400000, rate: 0.15, fixed: 30000, label: '15%' },
  { min: 2400000, max: 3600000, rate: 0.25, fixed: 210000, label: '25%' },
  { min: 3600000, max: 6000000, rate: 0.30, fixed: 510000, label: '30%' },
  { min: 6000000, max: Infinity, rate: 0.35, fixed: 1230000, label: '35%' },
];

function calculateIncomeTax(annualIncome: number): number {
  for (const slab of TAX_SLABS) {
    if (annualIncome <= slab.max) {
      return slab.fixed + (annualIncome - slab.min) * slab.rate;
    }
  }
  return 0;
}

// Budget allocation percentages (from real FY25-26 data)
const BUDGET_CATEGORIES = [
  { key: 'debt', label: 'Debt Servicing', labelUrdu: 'قرض ادائیگی', color: '#ef4444', pct: 0.484, emoji: '💸', description: 'Interest payments on foreign and domestic debt', descUrdu: 'ملکی و غیرملکی قرضوں پر سود' },
  { key: 'defence', label: 'Defence', labelUrdu: 'دفاع', color: '#f59e0b', pct: 0.150, emoji: '🛡️', description: 'Pakistan Army, Navy, Air Force & defence production', descUrdu: 'فوج، بحریہ، فضائیہ اور دفاعی پیداوار' },
  { key: 'transfers', label: 'Provincial Transfers (NFC)', labelUrdu: 'صوبائی منتقلی', color: '#8b5cf6', pct: 0.218, emoji: '🏛️', description: '57.5% of federal divisible pool to provinces', descUrdu: 'وفاقی قابلِ تقسیم پول کا 57.5% صوبوں کو' },
  { key: 'psdp', label: 'Development (PSDP)', labelUrdu: 'ترقیاتی بجٹ', color: '#00d4ff', pct: 0.062, emoji: '🏗️', description: 'Roads, dams, hospitals, schools nationwide', descUrdu: 'سڑکیں، بند، ہسپتال، اسکول' },
  { key: 'education', label: 'Education', labelUrdu: 'تعلیم', color: '#00e676', pct: 0.012, emoji: '📚', description: 'HEC, federal schools & vocational training', descUrdu: 'ایچ ای سی، وفاقی اسکول' },
  { key: 'health', label: 'Health', labelUrdu: 'صحت', color: '#06b6d4', pct: 0.006, emoji: '🏥', description: 'NHSRC, federal hospitals & PIMS', descUrdu: 'قومی صحت سروسز اور وفاقی ہسپتال' },
  { key: 'other', label: 'Other Ministries', labelUrdu: 'دیگر وزارتیں', color: '#6b7280', pct: 0.068, emoji: '🏢', description: 'All other federal ministries & divisions', descUrdu: 'تمام دیگر وفاقی وزارتیں' },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-[#0c1929] border border-[#1a3050]/60 rounded-xl p-3 shadow-2xl max-w-[200px]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{d.emoji}</span>
          <span className="text-white font-bold text-sm">{d.label}</span>
        </div>
        <div className="text-[#00d4ff] font-black text-base">{(d.pct * 100).toFixed(1)}%</div>
        <div className="text-[#7f8ea4] text-xs mt-0.5">{d.description}</div>
      </div>
    );
  }
  return null;
};

export default function TaxCalculator() {
  const { lang } = useLanguage();
  const isUrdu = lang === 'ur';

  const [monthlyIncome, setMonthlyIncome] = useState(100000);
  const [showResults, setShowResults] = useState(false);

  const calculations = useMemo(() => {
    const annual = monthlyIncome * 12;
    const incomeTax = calculateIncomeTax(annual);
    const monthlyTax = incomeTax / 12;

    // Estimate total tax burden including indirect taxes (~GST 17%, fuel levies etc.)
    const indirectTaxMonthly = monthlyIncome * 0.08; // ~8% of income as indirect taxes
    const totalMonthlyTax = monthlyTax + indirectTaxMonthly;

    // Your contribution per category
    const breakdown = BUDGET_CATEGORIES.map(cat => ({
      ...cat,
      myMonthlyShare: totalMonthlyTax * cat.pct,
      myAnnualShare: totalMonthlyTax * 12 * cat.pct,
    }));

    // Interesting real-world equivalents
    const educationMonthly = breakdown.find(c => c.key === 'education')!.myMonthlyShare;
    const healthMonthly = breakdown.find(c => c.key === 'health')!.myMonthlyShare;
    const debtMonthly = breakdown.find(c => c.key === 'debt')!.myMonthlyShare;

    const taxSlab = TAX_SLABS.find(s => annual <= s.max) || TAX_SLABS[TAX_SLABS.length - 1];
    const effectiveRate = annual > 0 ? (incomeTax / annual) * 100 : 0;

    return {
      annual,
      incomeTax,
      monthlyTax,
      indirectTaxMonthly,
      totalMonthlyTax,
      breakdown,
      taxSlab,
      effectiveRate,
      schoolDaysFunded: Math.floor(educationMonthly / 3500 * 30), // ~PKR 3500/month per school child
      hospitalVisits: Math.floor(healthMonthly / 800), // ~PKR 800 per public hospital visit
      debtMonthly,
    };
  }, [monthlyIncome]);

  const pieData = calculations.breakdown.map(c => ({
    ...c,
    value: c.pct * 100,
    name: isUrdu ? c.labelUrdu : c.label,
  }));

  const formatPKR = (n: number) => {
    if (n >= 1000) return `PKR ${(n / 1000).toFixed(1)}K`;
    return `PKR ${Math.round(n).toLocaleString()}`;
  };

  return (
    <div className="space-y-8" dir={isUrdu ? 'rtl' : 'ltr'}>

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden p-8"
        style={{
          background: 'linear-gradient(135deg, #0c1929 0%, #0a0f1e 50%, #0c1121 100%)',
          border: '1px solid rgba(0, 212, 255, 0.15)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.6), rgba(168,85,247,0.4), transparent)' }}
        />
        <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)' }}>
                🧮
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white">
                  {isUrdu ? 'آپ کا ٹیکس کہاں جاتا ہے؟' : 'Where Does Your Tax Go?'}
                </h1>
                <p className="text-[#7f8ea4] text-sm mt-0.5">
                  {isUrdu
                    ? 'اپنی آمدنی درج کریں اور جانیں کہ آپ کا ٹیکس حکومت کیسے خرچ کرتی ہے'
                    : 'Enter your income and see exactly how Pakistan\'s FY2025-26 budget spends your taxes'}
                </p>
              </div>
            </div>

            {/* Key stats */}
            <div className="flex flex-wrap gap-3 mt-2">
              {[
                { label: isUrdu ? 'کل بجٹ' : 'Total Budget', value: 'PKR 17T' },
                { label: isUrdu ? 'ٹیکس فائلرز' : 'Tax Filers', value: '5.5M+' },
                { label: isUrdu ? 'بجٹ سال' : 'Budget Year', value: 'FY2025-26' },
              ].map(s => (
                <div key={s.label} className="px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}>
                  {s.label}: {s.value}
                </div>
              ))}
            </div>
          </div>

          {/* Big icon */}
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="text-7xl hidden md:block"
          >
            💰
          </motion.div>
        </div>
      </motion.div>

      {/* Income Input */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl p-6"
        style={{ background: '#0c1929', border: '1px solid rgba(26,48,80,0.6)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
      >
        <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
          <span>💼</span>
          <span>{isUrdu ? 'اپنی ماہانہ آمدنی درج کریں' : 'Enter Your Monthly Income (PKR)'}</span>
        </h2>

        <div className="space-y-5">
          {/* Slider */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[#7f8ea4] text-sm">{isUrdu ? 'ماہانہ آمدنی' : 'Monthly Income'}</span>
              <span className="text-2xl font-black text-white">
                PKR {monthlyIncome.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={25000}
              max={1000000}
              step={5000}
              value={monthlyIncome}
              onChange={e => { setMonthlyIncome(Number(e.target.value)); setShowResults(true); }}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #00d4ff ${((monthlyIncome - 25000) / (1000000 - 25000)) * 100}%, #1a3050 0%)`,
              }}
            />
            <div className="flex justify-between text-xs text-[#3a4558] mt-1">
              <span>PKR 25K</span>
              <span>PKR 500K</span>
              <span>PKR 1M</span>
            </div>
          </div>

          {/* Quick select buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: isUrdu ? 'ملازم' : 'Salaried (50K)', val: 50000 },
              { label: isUrdu ? 'درمیانی' : 'Middle Class (150K)', val: 150000 },
              { label: isUrdu ? 'اعلیٰ' : 'Upper Middle (300K)', val: 300000 },
              { label: isUrdu ? 'کاروباری' : 'Business (500K)', val: 500000 },
            ].map(b => (
              <motion.button
                key={b.val}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { setMonthlyIncome(b.val); setShowResults(true); }}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: monthlyIncome === b.val ? 'rgba(0,212,255,0.15)' : 'rgba(26,48,80,0.4)',
                  border: monthlyIncome === b.val ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(26,48,80,0.6)',
                  color: monthlyIncome === b.val ? '#00d4ff' : '#7f8ea4',
                }}
              >
                {b.label}
              </motion.button>
            ))}
          </div>

          {!showResults && (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowResults(true)}
              className="w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                color: '#03070f',
                boxShadow: '0 8px 25px rgba(0,212,255,0.35)',
              }}
            >
              🧮 {isUrdu ? 'میرا ٹیکس حساب لگائیں' : 'Calculate My Tax Contribution'}
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >

            {/* Tax Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: isUrdu ? 'ماہانہ انکم ٹیکس' : 'Monthly Income Tax',
                  value: formatPKR(calculations.monthlyTax),
                  sub: isUrdu ? `مؤثر شرح: ${calculations.effectiveRate.toFixed(1)}%` : `Effective rate: ${calculations.effectiveRate.toFixed(1)}%`,
                  color: '#f59e0b',
                  icon: '📋',
                },
                {
                  label: isUrdu ? 'بالواسطہ ٹیکس (تخمینی)' : 'Indirect Taxes (Est.)',
                  value: formatPKR(calculations.indirectTaxMonthly),
                  sub: isUrdu ? 'جی ایس ٹی، پیٹرولیم لیوی وغیرہ' : 'GST, petroleum levy, duties etc.',
                  color: '#a855f7',
                  icon: '🛒',
                },
                {
                  label: isUrdu ? 'کل ماہانہ تعاون' : 'Total Monthly Contribution',
                  value: formatPKR(calculations.totalMonthlyTax),
                  sub: isUrdu ? 'قومی خزانے میں آپ کا حصہ' : 'Your share in national treasury',
                  color: '#00d4ff',
                  icon: '💰',
                },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-2xl p-5"
                  style={{
                    background: `linear-gradient(135deg, ${card.color}08, ${card.color}04)`,
                    border: `1px solid ${card.color}25`,
                    boxShadow: `0 4px 20px ${card.color}10`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{card.icon}</span>
                    <span className="text-xs text-[#7f8ea4] font-semibold">{card.label}</span>
                  </div>
                  <div className="text-2xl font-black" style={{ color: card.color }}>{card.value}</div>
                  <div className="text-[10px] text-[#7f8ea4] mt-1">{card.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Pie Chart + Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Pie Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl p-6"
                style={{ background: '#0c1929', border: '1px solid rgba(26,48,80,0.6)' }}
              >
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <span>🥧</span>
                  <span>{isUrdu ? 'آپ کا ٹیکس کہاں جاتا ہے' : 'How Your Tax Is Spent'}</span>
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="space-y-1.5 mt-2">
                  {BUDGET_CATEGORIES.map(cat => (
                    <div key={cat.key} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                        <span className="text-[#7f8ea4]">{isUrdu ? cat.labelUrdu : cat.label}</span>
                      </div>
                      <span className="font-bold" style={{ color: cat.color }}>{(cat.pct * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Breakdown list */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl p-6"
                style={{ background: '#0c1929', border: '1px solid rgba(26,48,80,0.6)' }}
              >
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <span>📊</span>
                  <span>{isUrdu ? 'ماہانہ حصہ بقدر زمرہ' : 'Your Monthly Share by Category'}</span>
                </h3>
                <div className="space-y-3">
                  {calculations.breakdown.map((cat, i) => (
                    <motion.div
                      key={cat.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{cat.emoji}</span>
                          <span className="text-xs text-[#7f8ea4]">{isUrdu ? cat.labelUrdu : cat.label}</span>
                        </div>
                        <span className="text-xs font-black" style={{ color: cat.color }}>
                          {formatPKR(cat.myMonthlyShare)}/mo
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#0a1220] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: cat.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(cat.myMonthlyShare / calculations.totalMonthlyTax) * 100}%` }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Real-world equivalents */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl p-6"
              style={{ background: 'linear-gradient(135deg, #0c1929, #080f1e)', border: '1px solid rgba(0,230,118,0.2)' }}
            >
              <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                <span>💡</span>
                <span>{isUrdu ? 'آپ کے ٹیکس کا حقیقی دنیا میں مطلب' : 'What Your Taxes Actually Buy (Monthly)'}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    icon: '📚',
                    title: isUrdu ? 'تعلیمی دن' : 'School Days',
                    value: `${calculations.schoolDaysFunded}`,
                    unit: isUrdu ? 'دن فنڈ' : 'days funded',
                    desc: isUrdu ? 'ایک بچے کی تعلیم کے لیے' : 'for one child per month',
                    color: '#00e676',
                  },
                  {
                    icon: '🏥',
                    title: isUrdu ? 'ہسپتال دورے' : 'Hospital Visits',
                    value: `${calculations.hospitalVisits}`,
                    unit: isUrdu ? 'دورے' : 'public visits',
                    desc: isUrdu ? 'سرکاری ہسپتال میں' : 'at government hospitals',
                    color: '#06b6d4',
                  },
                  {
                    icon: '💸',
                    title: isUrdu ? 'قرض ادائیگی' : 'Debt Payments',
                    value: formatPKR(calculations.debtMonthly),
                    unit: isUrdu ? 'ماہانہ' : '/month',
                    desc: isUrdu ? 'صرف قرض کے سود پر' : 'just for interest payments',
                    color: '#ef4444',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="p-4 rounded-xl text-center"
                    style={{
                      background: `${item.color}08`,
                      border: `1px solid ${item.color}25`,
                    }}
                  >
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <div className="text-2xl font-black" style={{ color: item.color }}>{item.value}</div>
                    <div className="text-xs font-bold text-white">{item.unit}</div>
                    <div className="text-[10px] text-[#7f8ea4] mt-1">{item.desc}</div>
                  </motion.div>
                ))}
              </div>

              {/* Tax slab info */}
              <div className="mt-5 p-4 rounded-xl" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span>📋</span>
                  <span className="text-xs text-[#00d4ff] font-bold uppercase tracking-wider">
                    {isUrdu ? 'آپ کا ٹیکس سلیب' : 'Your Tax Slab (FY2025-26)'}
                  </span>
                </div>
                <p className="text-xs text-[#7f8ea4]">
                  {isUrdu
                    ? `سالانہ آمدنی PKR ${(calculations.annual / 1000).toFixed(0)}K — ٹیکس کی شرح: ${calculations.taxSlab.label}`
                    : `Annual income: PKR ${(calculations.annual / 1000).toFixed(0)}K — Tax bracket: ${calculations.taxSlab.label} rate`}
                </p>
                <p className="text-[10px] text-[#3a4558] mt-1">
                  {isUrdu
                    ? 'ماخذ: وفاقی بجٹ 2025-26، ایف بی آر'
                    : 'Source: Finance Act 2025-26, Federal Board of Revenue (FBR)'}
                </p>
              </div>
            </motion.div>

            {/* Share CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-[#1a3050]/60 bg-[#0c1929] p-4"
            >
              <div>
                <p className="text-sm font-semibold text-white">
                  {isUrdu ? 'اپنا ٹیکس بریک ڈاؤن شیئر کریں' : 'Share My Tax Breakdown'}
                </p>
                <p className="text-xs text-[#7f8ea4] mt-1">
                  {isUrdu
                    ? '“میری ٹیکس کا 48% قرض ادائیگی پر جاتا ہے 😤” جیسی شیئرایبل اسٹیٹس بنانے کے لیے۔'
                    : 'Make your tax story shareable with a polished image card.'}
                </p>
              </div>
              <div className="w-full sm:w-auto">
                <ShareCard
                  lang={lang}
                  taxData={{
                    monthlyIncome: monthlyIncome,
                    annualTax: calculations.totalMonthlyTax * 12,
                    debtShare: calculations.breakdown.find(c => c.key === 'debt')!.myAnnualShare,
                    defenceShare: calculations.breakdown.find(c => c.key === 'defence')!.myAnnualShare,
                    nfcShare: calculations.breakdown.find(c => c.key === 'transfers')!.myAnnualShare,
                    educationShare: calculations.breakdown.find(c => c.key === 'education')!.myAnnualShare,
                    healthShare: calculations.breakdown.find(c => c.key === 'health')!.myAnnualShare,
                  }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="flex flex-col sm:flex-row gap-3 items-center justify-center pt-1"
            >
              <p className="text-xs text-[#3a4558]">
                {isUrdu
                  ? '⚠️ یہ تخمینی حساب ہے۔ پیشہ ورانہ مشورے کے لیے ٹیکس ماہر سے رجوع کریں'
                  : '⚠️ Estimated calculation based on FY2025-26 tax slabs. Consult a tax professional for precise figures.'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
