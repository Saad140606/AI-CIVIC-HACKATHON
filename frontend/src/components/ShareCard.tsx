import { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import type { MinistryTotal } from '../lib/api';
import { formatBillions } from '../lib/utils';

interface Props {
  ministry?: MinistryTotal;
  changePercent?: number;
  mna?: {
    name: string;
    nameUrdu: string;
    constituency: string;
    constituencyUrdu: string;
    party: string;
    partyUrdu: string;
    partyColor: string;
    attendancePercent: number;
    sessionsAttended: number;
    totalSessions: number;
    billsSponsored: number;
    questionsRaised: number;
    grade: string;
    salaryReceived: string;
    salaryReceivedUrdu: string;
  };
  taxData?: {
    monthlyIncome: number;
    annualTax: number;
    debtShare: number;
    defenceShare: number;
    nfcShare: number;
    educationShare: number;
    healthShare: number;
  };
  lang?: 'en' | 'ur';
}

export default function ShareCard({ ministry, changePercent, mna, taxData, lang = 'en' }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isUrdu = lang === 'ur';

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0A1628',
        scale: 2,
        useCORS: true,
      });

      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = mna
          ? `wakalalens-mna-${mna.name.replace(/\s+/g, '-').toLowerCase()}.png`
          : taxData
          ? `wakalalens-tax-breakdown.png`
          : `wakalalens-budget-${ministry?.ministry.replace(/\s+/g, '-')}.png`;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch {
      // Fallback: copy text to clipboard
      const text = mna
        ? `${mna.name} (${mna.constituency}) has ${mna.attendancePercent}% attendance in the National Assembly. AI Grade: ${mna.grade}. Check their profile on #WakalaLens #Pakistan`
        : taxData
        ? `Out of PKR ${taxData.annualTax.toLocaleString()} estimated annual tax I pay, 48% (PKR ${Math.round(taxData.debtShare).toLocaleString()}) goes straight to Debt Servicing! 😤 Check yours on #WakalaLens #Pakistan`
        : `${ministry?.ministry} received PKR ${ministry?.total.toFixed(1)} Billion in Pakistan's FY2025-26 Budget. #PakistanBudget #WakalaLens`;
      navigator.clipboard.writeText(text);
      alert('Insight copied to clipboard!');
    }
  }, [ministry, mna, taxData]);

  if (mna) {
    return (
      <div className="w-full">
        {/* Hidden card for MNA screenshot */}
        <div
          ref={cardRef}
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '600px',
            padding: '40px',
            background: 'linear-gradient(135deg, #0A1628 0%, #0F2040 100%)',
            borderRadius: '16px',
            border: '1px solid #1E3A5F',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: 'white',
          }}
          dir={isUrdu ? 'rtl' : 'ltr'}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, justifyContent: isUrdu ? 'flex-end' : 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#00D4FF22', border: '1px solid #00D4FF44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              🏛
            </div>
            <div style={{ textAlign: isUrdu ? 'right' : 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#00D4FF' }}>WakalaLens Pakistan</div>
              <div style={{ fontSize: 11, color: '#8892A4' }}>وکالت لینس</div>
            </div>
          </div>

          {/* MNA Name and Constituency */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexDirection: isUrdu ? 'row-reverse' : 'row' }}>
            <div style={{ textAlign: isUrdu ? 'right' : 'left' }}>
              <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>
                {isUrdu ? mna.nameUrdu : mna.name}
              </div>
              <div style={{ fontSize: 14, color: '#00D4FF', fontWeight: 600 }}>
                {isUrdu ? mna.constituencyUrdu : mna.constituency}
              </div>
            </div>
            <div
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                background: `${mna.partyColor}22`,
                border: `1px solid ${mna.partyColor}44`,
                color: mna.partyColor,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {isUrdu ? mna.partyUrdu : mna.party}
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            <div style={{ background: '#07111E', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #1E3A5F' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#00E676' }}>{mna.attendancePercent}%</div>
              <div style={{ fontSize: 11, color: '#8892A4', marginTop: 4 }}>
                {isUrdu ? 'حاضری' : 'Attendance'}
              </div>
              <div style={{ fontSize: 10, color: '#5A6A7E', marginTop: 2 }}>
                {mna.sessionsAttended}/{mna.totalSessions} {isUrdu ? 'اجلاس' : 'sessions'}
              </div>
            </div>
            <div style={{ background: '#07111E', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #1E3A5F' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#00D4FF' }}>{mna.billsSponsored}</div>
              <div style={{ fontSize: 11, color: '#8892A4', marginTop: 4 }}>
                {isUrdu ? 'بل پیش کیے' : 'Bills Sponsored'}
              </div>
              <div style={{ fontSize: 10, color: '#5A6A7E', marginTop: 2 }}>
                {isUrdu ? 'اسمبلی میں' : 'in assembly'}
              </div>
            </div>
            <div style={{ background: '#07111E', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #1E3A5F' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#E040FB' }}>{mna.grade}</div>
              <div style={{ fontSize: 11, color: '#8892A4', marginTop: 4 }}>
                {isUrdu ? 'اے آئی گریڈ' : 'AI Performance Grade'}
              </div>
              <div style={{ fontSize: 10, color: '#5A6A7E', marginTop: 2 }}>
                {isUrdu ? 'جیمینی تجزیہ' : 'Gemini rated'}
              </div>
            </div>
          </div>

          {/* Salary Status */}
          <div style={{ background: '#1E3A5F15', padding: '12px 16px', borderRadius: '12px', border: '1px solid #1E3A5F44', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexDirection: isUrdu ? 'row-reverse' : 'row' }}>
            <div style={{ fontSize: 12, color: '#8892A4' }}>
              {isUrdu ? 'سرکاری تنخواہ اسٹیٹس:' : 'Official Salary Status:'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>
              {isUrdu ? mna.salaryReceivedUrdu : mna.salaryReceived}
            </div>
          </div>

          {/* Footer */}
          <div style={{ paddingTop: 16, borderTop: '1px solid #1E3A5F', fontSize: 12, color: '#4A5568', display: 'flex', justifyContent: 'space-between', flexDirection: isUrdu ? 'row-reverse' : 'row' }}>
            <span>wakalalens.pk • #WakalaCheck</span>
            <span>{isUrdu ? 'عوامی احتساب ڈیش بورڈ' : 'Democratic Accountability'}</span>
          </div>
        </div>

        {/* Visible Button */}
        <button
          onClick={handleShare}
          className="w-full mt-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-[#0d1b2e] border border-[#1e3a5f] text-[#00b4d8] hover:text-white hover:border-[#00b4d8] transition-all flex items-center justify-center gap-2"
        >
          <span>📤</span>
          {isUrdu ? 'رپورٹ کارڈ ڈاؤن لوڈ کریں' : 'Download Report Card Image'}
        </button>
      </div>
    );
  }
  if (taxData) {
    const formattedTax = taxData.annualTax.toLocaleString();
    const formattedIncome = taxData.monthlyIncome.toLocaleString();
    return (
      <div className="w-full">
        {/* Hidden card for Tax screenshot */}
        <div
          ref={cardRef}
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '600px',
            padding: '40px',
            background: 'linear-gradient(135deg, #0A1628 0%, #15082E 100%)',
            borderRadius: '16px',
            border: '1px solid #7c3aed33',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: 'white',
          }}
          dir={isUrdu ? 'rtl' : 'ltr'}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, justifyContent: isUrdu ? 'flex-end' : 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#7c3aed22', border: '1px solid #7c3aed44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              🧮
            </div>
            <div style={{ textAlign: isUrdu ? 'right' : 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#c084fc' }}>WakalaLens Pakistan</div>
              <div style={{ fontSize: 11, color: '#8892A4' }}>{isUrdu ? 'ٹیکس کیلکولیٹر' : 'Tax Calculator'}</div>
            </div>
          </div>

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 12, color: '#8892A4', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>
              {isUrdu ? 'میرے ٹیکس کی کہانی' : 'My Pakistan Tax Story'}
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginTop: 6 }}>
              PKR {formattedTax}
            </div>
            <div style={{ fontSize: 13, color: '#a0aec0', marginTop: 4 }}>
              {isUrdu ? `سالانہ ٹیکس شراکت (ماہانہ آمدنی: PKR ${formattedIncome})` : `Estimated Annual Tax Contribution (Salary: PKR ${formattedIncome}/mo)`}
            </div>
          </div>

          {/* Viral Callout */}
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '16px', borderRadius: '12px', textAlign: 'center', marginBottom: 24, fontSize: 15, fontWeight: 700, color: '#ff7878' }}>
            {isUrdu 
              ? '😤 میرے ٹیکس کا 48.4% حصہ براہِ راست قرض کی ادائیگی پر جاتا ہے!' 
              : '😤 48.4% of my taxes go straight to Debt Servicing!'}
          </div>

          {/* Breakdown Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {[
              { label: isUrdu ? '💸 قرض کی ادائیگی (48.4%)' : '💸 Debt Servicing (48.4%)', value: taxData.debtShare, color: '#ef4444' },
              { label: isUrdu ? '🏛️ صوبائی منتقلی (21.8%)' : '🏛️ Provincial Transfers (21.8%)', value: taxData.nfcShare, color: '#8b5cf6' },
              { label: isUrdu ? '🛡️ دفاع (15.0%)' : '🛡️ Defence (15.0%)', value: taxData.defenceShare, color: '#f59e0b' },
              { label: isUrdu ? '📚 تعلیم (1.2%)' : '📚 Education (1.2%)', value: taxData.educationShare, color: '#00e676' },
              { label: isUrdu ? '🏥 صحت (0.6%)' : '🏥 Health (0.6%)', value: taxData.healthShare, color: '#06b6d4' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#07111E', padding: '12px 16px', borderRadius: '10px', border: '1px solid #1E3A5F44' }}>
                <span style={{ fontSize: 13, color: '#a0aec0' }}>{item.label}</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: item.color }}>PKR {Math.round(item.value).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ paddingTop: 16, borderTop: '1px solid #7c3aed22', fontSize: 12, color: '#4A5568', display: 'flex', justifyContent: 'space-between', flexDirection: isUrdu ? 'row-reverse' : 'row' }}>
            <span>wakalalens.pk • #TaxCalculator</span>
            <span>{isUrdu ? 'بجٹ لینس پاکستان' : 'Open Budget Transparency'}</span>
          </div>
        </div>

        {/* Visible button */}
        <button
          onClick={handleShare}
          className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-[#7c3aed]/10 border border-[#7c3aed]/30 text-[#c084fc] hover:text-white hover:border-[#7c3aed] hover:bg-[#7c3aed]/20 transition-all flex items-center justify-center gap-2"
        >
          <span>📤</span>
          {isUrdu ? 'ٹیکس کارڈ ڈاؤن لوڈ کریں' : 'Download Tax Breakdown Card'}
        </button>
      </div>
    );
  }

  const changeColor = changePercent !== undefined
    ? (changePercent > 0 ? '#00E676' : '#FF5252')
    : '#8892A4';

  const changeArrow = changePercent !== undefined
    ? (changePercent > 0 ? '↑' : '↓')
    : '';

  return (
    <div>
      {/* Hidden card for screenshot */}
      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '600px',
          padding: '40px',
          background: 'linear-gradient(135deg, #0A1628 0%, #0F2040 100%)',
          borderRadius: '16px',
          border: '1px solid #1E3A5F',
          fontFamily: 'Inter, sans-serif',
          color: 'white',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#00D4FF22', border: '1px solid #00D4FF44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            📊
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#00D4FF' }}>WakalaLens Pakistan</div>
            <div style={{ fontSize: 11, color: '#8892A4' }}>وکالت لینس</div>
          </div>
        </div>

        {/* Ministry name */}
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
          {ministry?.ministry}
        </div>

        {/* Budget */}
        <div style={{ fontSize: 48, fontWeight: 900, color: '#00D4FF', marginBottom: 8 }}>
          PKR {ministry ? formatBillions(ministry.total) : '0'}
        </div>
        <div style={{ fontSize: 14, color: '#8892A4', marginBottom: 20 }}>
          Federal Budget Allocation — FY2025-26
        </div>

        {/* Change */}
        {changePercent !== undefined && (
          <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: `${changeColor}22`, border: `1px solid ${changeColor}44`, color: changeColor, fontSize: 16, fontWeight: 600 }}>
            {changeArrow} {Math.abs(changePercent).toFixed(1)}% vs FY2024-25
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #1E3A5F', fontSize: 12, color: '#4A5568' }}>
          wakalalens.pk • #PakistanBudget2526 • #وکالت_لینس
        </div>
      </div>

      {/* Visible button */}
      <button
        id={ministry ? `share-btn-${ministry.ministry.replace(/\s+/g, '-').toLowerCase()}` : undefined}
        onClick={handleShare}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
          bg-card-border/50 border border-card-border text-text-secondary
          hover:bg-card-hover hover:text-white hover:border-accent/30
          active:scale-95 transition-all duration-200"
      >
        <span>📤</span>
        Share Insight
      </button>
    </div>
  );
}
