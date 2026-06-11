import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { budgetApi, aiApi } from '../lib/api';
import HeroStats from '../components/HeroStats';
import MinistryCard from '../components/MinistryCard';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function Dashboard() {
  const { t, lang } = useLanguage();
  const isUrdu = lang === 'ur';

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
        english: `With the federal budget prioritizing ${personalizerSector}, citizens in ${personalizerProvince} can expect target infrastructural developments and service support. This allocation aims to lower administrative delays and deliver public benefits locally. Greater accountability checks will monitor the progress of these initiatives.`,
        urdu: `${personalizerProvince} کے شہریوں کے لیے ${personalizerSector} پر خصوصی توجہ سے مقامی ترقی اور خدمات میں بہتری متوقع ہے۔ اس بجٹ سے انتظامی رکاوٹیں دور ہوں گی اور براہ راست عوامی فوائد فراہم ہوں گے۔ منصوبوں کی نگرانی کے لیے مانیٹرنگ کا نظام بھی سخت کیا جائے گا۔`,
      });
    } finally {
      setPersonalizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-36 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-danger font-semibold">{t.error}</p>
        <p className="text-text-secondary text-sm mt-2">Make sure the backend server is running on port 3001</p>
      </div>
    );
  }

  // Compute changes between FY24-25 and FY25-26
  const changeMap = new Map<string, number>();
  data.fy2526.forEach(m => {
    const prev = data.fy2425.find(p => p.ministry === m.ministry);
    if (prev && prev.total > 0) {
      changeMap.set(m.ministry, ((m.total - prev.total) / prev.total) * 100);
    }
  });

  return (
    <div className="space-y-8">
      {/* Hero glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-hero-glow pointer-events-none" />

      {/* Welcome Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-[#1e3a5f]/40 p-6 md:p-8 bg-gradient-to-br from-[#0d1b2e] to-[#060d1a] shadow-xl card-hover-physics">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(0,180,216,0.15),transparent_70%)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#00b4d8]/10 border border-[#00b4d8]/20 text-[#00b4d8]">
              <span>🇵🇰</span>
              <span>{isUrdu ? 'قومی احتساب ڈیش بورڈ' : 'Civic Accountability Dashboard'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
              {isUrdu ? 'وکالت لینس پاکستان' : 'WakalaLens Pakistan'}
            </h1>
            <p className="text-sm text-text-secondary max-w-xl leading-relaxed">
              {isUrdu
                ? 'وفاق پاکستان کے سالانہ بجٹ اور اراکین قومی اسمبلی کی کارکردگی کا موازنہ کرنے کا پہلا شفاف پلیٹ فارم۔ اپنی رائے قائم کریں اور جمہوری عمل میں اپنا کردار ادا کریں۔'
                : 'Explore federal budgets in plain Urdu and English, analyze representative attendance, sponsored bills, and get AI performance ratings directly from Gemini.'}
            </p>
          </div>
          <div className="shrink-0 flex gap-3">
            <a
              href="#allocations-sec"
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#00b4d8] text-[#060d1a] hover:bg-[#00b4d8]/90 transition-all shadow-lg shadow-[#00b4d8]/20 active:scale-95 duration-150"
            >
              📊 {isUrdu ? 'بجٹ تلاش کریں' : 'Explore Budget'}
            </a>
          </div>
        </div>
      </div>

      {/* Hero stats */}
      <HeroStats stats={data.heroStats} />

      {/* Budget Personalizer Widget */}
      <div className="bg-[#0d1b2e] border border-[#1e3a5f]/60 rounded-2xl p-6 relative overflow-hidden shadow-card">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_top_right,rgba(0,180,216,0.1),transparent_50%)]" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#00b4d8]/10 border border-[#00b4d8]/30 flex items-center justify-center text-lg">
              💡
            </div>
            <div>
              <h3 className="text-md font-bold text-white">
                {isUrdu ? 'بجٹ کا آپ پر کیا اثر ہوگا؟' : 'How does the budget affect you?'}
              </h3>
              <p className="text-xs text-[#8892a4] mt-0.5">
                {isUrdu ? 'اپنے صوبے اور دلچسپی کے شعبے کے مطابق ذاتی نوعیت کا AI تجزیہ حاصل کریں' : 'Get a personalized AI breakdown based on your province and interest'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#8892a4] mb-1.5 font-semibold">
                {isUrdu ? 'اپنا صوبہ منتخب کریں:' : 'Select your Province:'}
              </label>
              <select
                value={personalizerProvince}
                onChange={e => setPersonalizerProvince(e.target.value)}
                className="w-full bg-[#060d1a] border border-[#1e3a5f]/45 rounded-xl py-3 px-3 text-sm text-white focus:outline-none focus:border-[#00b4d8]/60 premium-input"
              >
                <option value="Punjab">{isUrdu ? 'پنجاب' : 'Punjab'}</option>
                <option value="Sindh">{isUrdu ? 'سندھ' : 'Sindh'}</option>
                <option value="KPK">{isUrdu ? 'خیبر پختونخوا' : 'KPK'}</option>
                <option value="Balochistan">{isUrdu ? 'بلوچستان' : 'Balochistan'}</option>
                <option value="Federal">{isUrdu ? 'وفاق (اسلام آباد)' : 'Federal (Islamabad)'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#8892a4] mb-1.5 font-semibold">
                {isUrdu ? 'دلچسپی کا شعبہ:' : 'Sector of Interest:'}
              </label>
              <select
                value={personalizerSector}
                onChange={e => setPersonalizerSector(e.target.value)}
                className="w-full bg-[#060d1a] border border-[#1e3a5f]/45 rounded-xl py-3 px-3 text-sm text-white focus:outline-none focus:border-[#00b4d8]/60 premium-input"
              >
                <option value="Education">{isUrdu ? 'تعلیم و تدریس' : 'Education'}</option>
                <option value="Health">{isUrdu ? 'صحت عامہ' : 'Health'}</option>
                <option value="Jobs & Industry">{isUrdu ? 'روزگار اور صنعت' : 'Jobs & Industry'}</option>
                <option value="Infrastructure">{isUrdu ? 'بنیادی ڈھانچہ اور ترقی' : 'Infrastructure'}</option>
              </select>
            </div>
          </div>

          <button
            onClick={handlePersonalize}
            disabled={personalizing}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#00b4d8] to-[#0077b6] text-white hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            {personalizing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isUrdu ? 'ذاتی تجزیہ تیار ہو رہا ہے...' : 'Generating personalized analysis...'}
              </>
            ) : (
              <>
                <span>🤖</span>
                {isUrdu ? 'ذاتی نوعیت کا AI تجزیہ حاصل کریں' : 'Personalize My Budget Insight (AI)'}
              </>
            )}
          </button>

          <AnimatePresence>
            {personalizerResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-3 overflow-hidden shadow-sm glow-purple"
              >
                <div className="text-[10px] text-[#00b4d8] uppercase font-bold tracking-wider">
                  ✨ {isUrdu ? 'ذاتی اے آئی تجزیہ رپورٹ' : 'Personalized AI Breakdown'}
                </div>
                <div className="text-sm leading-relaxed space-y-3">
                  <div className="space-y-1">
                    <div className="text-[9px] text-[#8892a4] uppercase tracking-wider font-bold">English</div>
                    <p className="text-[#a0aec0] font-medium">{personalizerResult.english}</p>
                  </div>
                  <div className="space-y-1" dir="rtl">
                    <div className="text-[9px] text-[#8892a4] uppercase tracking-wider text-left font-bold">اردو خلاصہ</div>
                    <p className="text-[#a0aec0] font-medium font-urdu text-right">{personalizerResult.urdu}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Section header */}
      <motion.div
        id="allocations-sec"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-between pt-4"
      >
        <div>
          <h2 className="text-xl font-bold text-white">
            {isUrdu ? 'بجٹ ایلوکیشنز مالی سال 2025-26 (تخمینی)' : 'FY2025-26 (Estimated / Draft) Allocations'}
          </h2>
          <p className="text-text-secondary text-sm mt-0.5">
            {isUrdu ? `بجٹ کے لحاظ سے ترتیب دی گئی تمام ${data.fy2526.length} وزارتیں` : `All ${data.fy2526.length} ministries sorted by budget`}
          </p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent">
          {isUrdu ? 'تخمینی ڈیٹا' : 'Estimated Data'}
        </span>
      </motion.div>

      {/* Ministry cards grid */}
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
              year={isUrdu ? "مالی سال 2025-26 (تخمینی)" : "FY2025-26 (Estimated)"}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
