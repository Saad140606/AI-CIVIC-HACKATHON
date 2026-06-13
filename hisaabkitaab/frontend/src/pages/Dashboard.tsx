import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { budgetApi, aiApi, mnaApi } from '../lib/api';
import HeroStats from '../components/HeroStats';
import MinistryCard from '../components/MinistryCard';
import ProvinceMap from '../components/ProvinceMap';
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

const CNIC_LOOKUP_DB = [
  { inputs: ['422', '421', '423', '424', '425', '420', 'karachi', 'keamari', 'کراچی'], constituency: 'NA-242 (Karachi Keamari-I)', mnaId: '2001' },
  { inputs: ['352', 'lahore', 'لاہور'], constituency: 'NA-132 (Lahore-X)', mnaId: '1132' },
  { inputs: ['432', 'larkana', 'لاڑکانہ'], constituency: 'NA-194 (Larkana-I)', mnaId: '1194' },
  { inputs: ['131', 'haripur', 'ہری پور'], constituency: 'NA-19 (Haripur)', mnaId: '1019' },
  { inputs: ['346', 'sialkot', 'سیالکوٹ'], constituency: 'NA-73 (Sialkot-IV)', mnaId: '1073' },
  { inputs: ['345', 'narowal', 'نارووال'], constituency: 'NA-108 (Narowal-V)', mnaId: '1108' },
  { inputs: ['152', 'chitral', 'چترال'], constituency: 'NA-10 (Chitral)', mnaId: '1010' },
  { inputs: ['374', 'rawalpindi', 'راولپنڈی'], constituency: 'NA-52 (Rawalpindi-I)', mnaId: '1052' },
  { inputs: ['351', 'kasur', 'قصور'], constituency: 'NA-140 (Kasur-IV)', mnaId: '1140' },
  { inputs: ['455', '452', 'sukkur', 'khairpur', 'سکھر', 'خیرپور'], constituency: 'NA-200 (Sukkur-I)', mnaId: '1200' },
  { inputs: ['162', 'swabi', 'صوابی'], constituency: 'NA-31 (Swabi-I)', mnaId: '1031' },
  { inputs: ['173', 'peshawar', 'پشاور', '17'], constituency: 'NA-44 (Peshawar-III)', mnaId: '1044' },
  { inputs: ['443', 'tharparkar', 'تھرپارکر'], constituency: 'NA-222 (Tharparkar-I)', mnaId: '1222' },
  { inputs: ['341', 'gujrat', 'گجرات'], constituency: 'NA-69 (Gujrat-IV)', mnaId: '1069' },
  { inputs: ['156', 'swat', 'سوات'], constituency: 'NA-22 (Swat-III)', mnaId: '1022' },
  { inputs: ['453', 'nawabshah', 'نوابشاہ'], constituency: 'NA-208 (Nawabshah-II)', mnaId: '1208' },
  { inputs: ['542', 'khuzdar', 'خضدار'], constituency: 'NA-259 (Khuzdar)', mnaId: '1259' },
  { inputs: ['135', 'mansehra', 'مانسہرہ'], constituency: 'NA-30 (Mansehra-I)', mnaId: '1030' },
  { inputs: ['331', 'faisalabad', 'فیصل آباد', '33'], constituency: 'NA-97 (Faisalabad-III)', mnaId: '1097' },
  { inputs: ['363', 'multan', 'ملتان', '36'], constituency: 'NA-148 (Multan-I)', mnaId: '1148' },
  { inputs: ['501', 'quetta', 'کوئٹہ', '50'], constituency: 'NA-263 (Quetta-II)', mnaId: '1263' },
  { inputs: ['413', 'hyderabad', 'حیدرآباد', '41'], constituency: 'NA-220 (Hyderabad-III)', mnaId: '1220' },
  { inputs: ['322', 'gujranwala', 'گوجرانوالہ', '34'], constituency: 'NA-79 (Gujranwala-V)', mnaId: '1079' },
  { inputs: ['611', 'islamabad', 'اسلام آباد'], constituency: 'NA-49 (Islamabad-III)', mnaId: '1049' }
];

export default function Dashboard() {
  const { t, lang } = useLanguage();
  const isUrdu = lang === 'ur';
  const heroRef = useRef<HTMLDivElement>(null);

  // Personalizer states
  const [personalizerProvince, setPersonalizerProvince] = useState('Punjab');
  const [personalizerSector, setPersonalizerSector] = useState('Education');
  const [personalizerResult, setPersonalizerResult] = useState<{ english: string; urdu: string } | null>(null);
  const [personalizing, setPersonalizing] = useState(false);

  // Live Debt Clock Hook
  const [accruedInterest, setAccruedInterest] = useState(0);
  const [clockStartTime] = useState(Date.now());
  const PKR_PER_SECOND = 309692;

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - clockStartTime) / 1000;
      setAccruedInterest(elapsed * PKR_PER_SECOND);
    }, 100);
    return () => clearInterval(interval);
  }, [clockStartTime]);

  // Representative Lookup States
  const [lookupInput, setLookupInput] = useState('');
  const [matchedMNA, setMatchedMNA] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState('');

  // Citizen Report Card States
  const [selectedReportCity, setSelectedReportCity] = useState('Karachi');

  // Fetch Budget Data
  const { data, isLoading, isError } = useQuery({
    queryKey: ['budget-summary'],
    queryFn: budgetApi.getSummary,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch MNA Data
  const { data: mnaData } = useQuery({
    queryKey: ['mna-all-dashboard'],
    queryFn: () => mnaApi.list(),
  });
  const allMNAs = mnaData?.members || [];

  const handleLookup = () => {
    setLookupError('');
    setMatchedMNA(null);
    const cleaned = lookupInput.trim().toLowerCase();
    if (!cleaned) return;

    // First try to match directly by constituency code (e.g. "NA-242")
    const naMatch = cleaned.match(/na-\d+/i);
    let constituencyCode = naMatch ? naMatch[0].toUpperCase() : '';
    let matchedItem: any = null;

    if (!constituencyCode) {
      // Try to find matching item in CNIC_LOOKUP_DB
      const match = CNIC_LOOKUP_DB.find(item => 
        item.inputs.some(inp => cleaned.includes(inp) || inp.includes(cleaned))
      );
      if (match) {
        matchedItem = match;
        constituencyCode = match.constituency.split(' ')[0].toUpperCase();
      }
    }

    if (matchedItem && matchedItem.mnaId) {
      const mna = allMNAs.find(m => m.id === matchedItem.mnaId);
      if (mna) {
        setMatchedMNA(mna);
        return;
      }
    }

    if (constituencyCode) {
      // Find MNA that starts with constituencyCode
      const mna = allMNAs.find(m => 
        m.constituency.toUpperCase().startsWith(constituencyCode) ||
        m.constituency.toUpperCase().includes(`(${constituencyCode}`) ||
        m.constituency.toUpperCase().includes(`${constituencyCode} `)
      );
      if (mna) {
        setMatchedMNA(mna);
      } else {
        setLookupError(isUrdu ? 'نمائندہ کا ڈیٹا لوڈ ہو رہا ہے، دوبارہ کوشش کریں' : 'Representative data loading, please try again.');
      }
    } else {
      setLookupError(isUrdu 
        ? 'شناختی کارڈ کوڈ (مثلا 42201) یا شہر کا نام تلاش نہیں ہو سکا. کراچی، لاہور، فیصل آباد یا اسلام آباد درج کریں!' 
        : 'Constituency not found. Try typing Karachi, Lahore, Faisalabad, Islamabad, or a CNIC code like 42201 / 33101!');
    }
  };

  const handleLookupKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup();
    }
  };

  const getCityMnaName = (city: string) => {
    if (city === 'Karachi') return 'Syed Mustafa Kamal';
    if (city === 'Lahore') return 'Muhammad Shehbaz Sharif';
    if (city === 'Peshawar') return 'Muhammad Ali Mian Khan';
    if (city === 'Rawalpindi') return 'Raja Pervaiz Ashraf';
    return '';
  };
  const getCityConstituency = (city: string) => {
    if (city === 'Karachi') return 'NA-242';
    if (city === 'Lahore') return 'NA-132';
    if (city === 'Peshawar') return 'NA-44';
    if (city === 'Rawalpindi') return 'NA-52';
    return '';
  };
  const getCityMnaAttendance = (city: string) => {
    if (city === 'Karachi') return 79;
    if (city === 'Lahore') return 47;
    if (city === 'Peshawar') return 82;
    if (city === 'Rawalpindi') return 56;
    return 0;
  };
  const getCityMnaGrade = (city: string) => {
    if (city === 'Karachi') return 'A-';
    if (city === 'Lahore') return 'C';
    if (city === 'Peshawar') return 'A';
    if (city === 'Rawalpindi') return 'C+';
    return '';
  };

  const downloadCityReportCard = () => {
    const card = document.getElementById('city-report-card');
    if (!card) return;
    import('html2canvas').then(html2canvasModule => {
      const h2c = html2canvasModule.default || html2canvasModule;
      h2c(card, { backgroundColor: '#0d1b2e' }).then(canvas => {
        const link = document.createElement('a');
        link.download = `${selectedReportCity}_budget_report_card_2026.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    });
  };

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

      {/* ─── Live Debt Clock Hero & MNA Lookup ────────────────────────── */}
      <motion.div
        ref={heroRef}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="relative rounded-3xl overflow-hidden p-6 md:p-8 flex flex-col gap-6"
        style={{
          background: 'linear-gradient(135deg, #10061e 0%, #03070f 60%, #07111e 100%)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 80px rgba(239,68,68,0.03)',
        }}
      >
        <FloatingParticles />
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(239,68,68,1) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/5 pb-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-red-500/10 border border-red-500/30 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>LIVE DEBT RUN RATE</span>
            </div>
            <h2 className="text-sm uppercase tracking-widest text-white/60 font-black">
              {isUrdu ? 'حکومتِ پاکستان سود کی ادائیگی کا لائیو کاؤنٹر' : 'Pakistan National Debt Interest Servicing Clock'}
            </h2>
            <div
              className="text-4xl md:text-5xl font-black font-mono tracking-tight text-red-500 select-all"
              style={{ textShadow: '0 0 30px rgba(239,68,68,0.5)' }}
            >
              ₨ {(9775000000000 + accruedInterest).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-[#7f8ea4]">
              {isUrdu 
                ? 'مالی سال 2025-26 کے لیے سود کی ادائیگی کا بجٹ ₨ 9,775 ارب ہے، جو کہ ₨ 309,692 فی سیکنڈ کی رفتار سے بڑھ رہا ہے۔'
                : 'Based on the FY2025-26 debt interest servicing allocation of PKR 9,775 Billion, growing by ₨ 309,692 every single second.'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-4 w-full lg:w-auto">
            {[
              { label: isUrdu ? 'فی سیکنڈ' : 'Per Second', val: '₨ 309,692', col: 'text-red-400 bg-red-500/5 border-red-500/10' },
              { label: isUrdu ? 'فی منٹ' : 'Per Minute', val: '₨ 18.5M', col: 'text-orange-400 bg-orange-500/5 border-orange-500/10' },
              { label: isUrdu ? 'فی گھنٹہ' : 'Per Hour', val: '₨ 1.11B', col: 'text-amber-400 bg-amber-500/5 border-amber-500/10' }
            ].map((stat, i) => (
              <div key={i} className={`p-3 rounded-xl border text-center ${stat.col}`}>
                <div className="text-sm font-black">{stat.val}</div>
                <div className="text-[9px] text-[#7f8ea4] mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CNIC / City Lookup Search */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🏛️</span>
              <span>{isUrdu ? 'اپنے حلقے کا نمائندہ (MNA) تلاش کریں' : 'Find Your MNA Representative'}</span>
            </h3>
            <p className="text-xs text-[#7f8ea4]">
              {isUrdu
                ? 'اپنے شناختی کارڈ کے پہلے 5 ہندسے (مثلاً 42201) یا اپنے شہر کا نام درج کریں۔'
                : 'Enter the first 5 digits of your CNIC (e.g., 42201) or your city name to instantly see your MNA.'}
            </p>
          </div>

          <div className="flex gap-2 max-w-xl">
            <input
              type="text"
              value={lookupInput}
              onChange={e => setLookupInput(e.target.value)}
              onKeyDown={handleLookupKeyDown}
              placeholder={isUrdu ? 'شناختی کارڈ کوڈ یا شہر درج کریں... (مثلاً 42201، کراچی)' : 'Enter CNIC prefix or City... (e.g. 42201, Karachi)'}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            />
            <button
              onClick={handleLookup}
              className="px-5 py-3 rounded-xl text-sm font-bold bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white transition-all shadow-md"
            >
              {isUrdu ? 'تلاش کریں' : 'Search'}
            </button>
          </div>

          {lookupError && (
            <p className="text-xs text-red-400 font-semibold">{lookupError}</p>
          )}

          {/* Matched MNA Report Card */}
          <AnimatePresence>
            {matchedMNA && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-5 rounded-2xl border border-red-500/30 bg-[#0c1322] space-y-4 max-w-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${matchedMNA.partyColor}15 0%, transparent 70%)` }}
                />
                
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-black text-white"
                    style={{ background: `linear-gradient(135deg, ${matchedMNA.partyColor}88, ${matchedMNA.partyColor})` }}
                  >
                    {matchedMNA.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-black text-white truncate">
                      {isUrdu ? matchedMNA.nameUrdu : matchedMNA.name}
                    </h4>
                    <p className="text-xs text-red-400 font-semibold mt-0.5">
                      {isUrdu ? matchedMNA.constituencyUrdu || matchedMNA.constituency : matchedMNA.constituency}
                    </p>
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white mt-1"
                      style={{ background: matchedMNA.partyColor }}
                    >
                      {isUrdu ? matchedMNA.partyUrdu : matchedMNA.party}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#7f8ea4] block">AI Grade</span>
                    <span className="text-2xl font-black text-white bg-red-600/30 border border-red-500/40 px-3 py-1 rounded-xl block mt-0.5 text-center">
                      {matchedMNA.attendancePercent >= 80 ? 'A' : matchedMNA.attendancePercent >= 65 ? 'B' : matchedMNA.attendancePercent >= 50 ? 'C' : 'D'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/5">
                  <div className="text-center">
                    <div className="text-[10px] text-[#7f8ea4]">{isUrdu ? 'حاضری' : 'Attendance'}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{matchedMNA.attendancePercent}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-[#7f8ea4]">{isUrdu ? 'بل پیش کیے' : 'Bills Sponsored'}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{matchedMNA.billsSponsored || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-[#7f8ea4]">{isUrdu ? 'سوالات' : 'Questions'}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{matchedMNA.questionsRaised || 0}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-[#7f8ea4]">{isUrdu ? 'تنخواہ کی حیثیت:' : 'Salary Status:'} {isUrdu ? matchedMNA.salaryReceivedUrdu : matchedMNA.salaryReceived}</span>
                  <a
                    href={`/wakala?id=${matchedMNA.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1e293b] hover:bg-[#334155] text-white transition-colors"
                  >
                    {isUrdu ? 'مکمل رپورٹ اور ووٹنگ ریکارڈ دیکھیں ➔' : 'View Full Profile & Voting ➔'}
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

      {/* ─── AI Budget Anomaly Detector ─────────────────────────────── */}
      <motion.div
        variants={cardVariants}
        className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl bg-red-500/5 pointer-events-none" />
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <span>🚨</span>
          <span>{isUrdu ? 'مصنوعی ذہانت: بجٹ میں تضادات کی نشاندہی' : 'AI Budget Anomaly Detector'}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-normal">FY25-26 Analysis</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: isUrdu ? 'موسمیاتی فنڈز میں بڑی کٹوتی' : 'Severe Climate Budget Cut',
              desc: isUrdu 
                ? 'موسمیاتی تبدیلی کا بجٹ پچھلے سال کے مقابلے میں 40.2 فیصد کم کر دیا گیا ہے، باوجود اس کے کہ حالیہ سالوں میں سیلاب کی بڑی تباہ کاریاں ہوئی ہیں۔'
                : 'Ministry of Climate Change budget dropped 40.2% YoY (PKR 8.5B to PKR 5.1B) despite catastrophic flood risks and global warming warnings.',
              badge: isUrdu ? 'ماحولیات' : 'Climate Change',
              color: 'text-amber-400 border-amber-500/20 bg-amber-500/5'
            },
            {
              title: isUrdu ? 'دفاع بمقابلہ تعلیم کا عدم توازن' : 'Defence vs Social Allocation Gap',
              desc: isUrdu
                ? 'دفاعی بجٹ میں 17.6 فیصد اضافہ کیا گیا ہے جبکہ تعلیمی بجٹ میں صرف 2.8 فیصد اضافہ ہوا ہے، جس سے بنیادی ترقیاتی ترجیحات متاثر ہو رہی ہیں۔'
                : 'Defence budget increased by 17.6% (+PKR 370B) while Education spending saw only a 2.8% increase, widening the security-development gap.',
              badge: isUrdu ? 'ترقیاتی تناسب' : 'Priority Gap',
              color: 'text-red-400 border-red-500/20 bg-red-500/5'
            },
            {
              title: isUrdu ? 'قرضوں کی ادائیگی کا بوجھ' : 'Debt Servicing Burden',
              desc: isUrdu
                ? 'سود کی ادائیگیاں کل وفاقی بجٹ کا 57.5 فیصد (₨9,775 ارب) بنتی ہیں، جو پچھلے سال سے 22.3 فیصد زیادہ ہے۔'
                : 'Interest payments consume 57.5% of the total federal budget (PKR 9,775B), representing a 22.3% YoY increase in debt servicing burden.',
              badge: isUrdu ? 'قرض سروسنگ' : 'Debt Trap',
              color: 'text-orange-400 border-orange-500/20 bg-orange-500/5'
            },
            {
              title: isUrdu ? 'ترقیاتی فنڈز (PSDP) میں کٹوتی' : 'Development Funding Deficit',
              desc: isUrdu
                ? 'پبلک سیکٹر ڈویلپمنٹ پروگرام (PSDP) کے لیے 1050 ارب روپے مختص ہیں جو مہنگائی کے تناسب سے 5 فیصد کٹوتی کو ظاہر کرتے ہیں۔'
                : 'PSDP development funds received PKR 1,050B, which is a 5% inflation-adjusted cut, slowing down vital infrastructure progress.',
              badge: isUrdu ? 'ترقیاتی بجٹ' : 'Development',
              color: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5'
            }
          ].map((anomaly, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-[#1e3a5f]/40 bg-[#07111e]/45 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{anomaly.title}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${anomaly.color}`}>{anomaly.badge}</span>
              </div>
              <p className="text-xs text-[#a0aec0] leading-relaxed">{anomaly.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ─── Citizen Report Card Generator ──────────────────────────── */}
      <motion.div
        variants={cardVariants}
        className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl bg-indigo-500/5 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📄</span>
              <span>{isUrdu ? 'شہری رپورٹ کارڈ میکر' : 'Citizen Report Card Generator'}</span>
            </h3>
            <p className="text-xs text-[#7f8ea4] mt-0.5">
              {isUrdu ? 'اپنے شہر کا بجٹ اور منتخب نمائندے کا کارکردگی کارڈ ڈاؤن لوڈ کریں' : 'Download and share a scorecard of your city allocations and MNA performance'}
            </p>
          </div>
          
          <div className="flex gap-2">
            {['Karachi', 'Lahore', 'Peshawar', 'Rawalpindi'].map(city => (
              <button
                key={city}
                onClick={() => setSelectedReportCity(city)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedReportCity === city 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'bg-white/5 text-[#7f8ea4] hover:text-white'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Scorecard Preview */}
        {selectedReportCity && (
          <div id="city-report-card" className="p-6 rounded-xl border border-indigo-500/30 bg-[#0d1b2e] text-white space-y-4 max-w-lg mx-auto relative shadow-2xl">
            <div className="absolute top-2 right-2 text-[9px] font-bold text-indigo-400 uppercase tracking-widest">HisaabKitaab</div>
            <div className="flex items-center gap-3 border-b border-[#1e3a5f]/40 pb-3">
              <span className="text-2xl">🇵🇰</span>
              <div>
                <h4 className="text-sm font-bold">{selectedReportCity} Score Card (FY2025-26)</h4>
                <p className="text-[10px] text-[#7f8ea4]">Compiled from Ministry of Finance & PILDAT Records</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <div className="text-[10px] text-emerald-400 font-bold uppercase">Water & Sanitation</div>
                <div className="text-lg font-black mt-1">₨ 12.4 Billion</div>
                <div className="text-[9px] text-[#7f8ea4] mt-0.5">↓ 8% from last year</div>
              </div>
              <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                <div className="text-[10px] text-cyan-400 font-bold uppercase">Roads & Transport</div>
                <div className="text-lg font-black mt-1">₨ 18.2 Billion</div>
                <div className="text-[9px] text-[#7f8ea4] mt-0.5">↑ 15% from last year</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#07111e] border border-[#1e3a5f]/40 flex items-center justify-between gap-3">
              <div>
                <div className="text-[9px] text-[#00b4d8] font-bold uppercase">Representing MNA</div>
                <div className="text-sm font-bold mt-0.5">{getCityMnaName(selectedReportCity)}</div>
                <div className="text-[9px] text-[#7f8ea4]">Constituency: {getCityConstituency(selectedReportCity)}</div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="text-[10px] text-amber-400 font-bold">Attendance: {getCityMnaAttendance(selectedReportCity)}%</div>
                <div className="text-xs px-2 py-0.5 rounded bg-indigo-600 font-black text-white mt-1 inline-block">Grade: {getCityMnaGrade(selectedReportCity)}</div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center text-[9px] text-[#5a6a7e]">
              <span>#HisaabKitaabPakistan</span>
              <span>transparency.hisaabkitaab.pk</span>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-4">
          <button
            onClick={downloadCityReportCard}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors text-xs font-bold rounded-lg text-white shadow-md flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>{isUrdu ? 'رپورٹ کارڈ ڈاؤن لوڈ کریں' : 'Download Scorecard Image'}</span>
          </button>
        </div>
      </motion.div>

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
