import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { mnaApi, aiApi, type MNAProfile, type MNASearchResult, type MNARatingResult } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import ShareCard from '../components/ShareCard';
import axios from 'axios';

// ─── Attendance Ring Component ────────────────────────────────────────────────
export const AttendanceRing: React.FC<{ percent: number; size?: number }> = ({ percent, size = 80 }) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 75 ? '#00e5a0' : percent >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text
        x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill={color} fontSize={size * 0.22} fontWeight="bold"
        style={{ transform: `rotate(90deg) translate(0, -${size}px)`, transformOrigin: 'center' }}
      />
    </svg>
  );
};

// ─── Grade Badge ───────────────────────────────────────────────────────────────
const GradeBadge: React.FC<{ grade: string }> = ({ grade }) => {
  const colors: Record<string, string> = {
    'A+': 'from-emerald-400 to-green-500', 'A': 'from-green-400 to-emerald-500',
    'B+': 'from-cyan-400 to-blue-500', 'B': 'from-blue-400 to-cyan-500',
    'C+': 'from-yellow-400 to-amber-500', 'C': 'from-amber-400 to-yellow-500',
    'D': 'from-orange-400 to-red-500', 'F': 'from-red-500 to-rose-600',
  };
  const bg = colors[grade] || 'from-gray-400 to-gray-500';
  return (
    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${bg} text-white text-2xl font-black shadow-lg`}>
      {grade}
    </div>
  );
};

// ─── MNA Profile Card ─────────────────────────────────────────────────────────
const MNAProfileCard: React.FC<{
  profile: MNAProfile;
  lang: 'en' | 'ur';
  onRate: () => void;
  rating: MNARatingResult | null;
  isRating: boolean;
}> = ({ profile, lang, onRate, rating, isRating }) => {
  const [showBills, setShowBills] = useState(false);
  const isUrdu = lang === 'ur';

  const attendColor = profile.attendancePercent >= 75
    ? 'text-emerald-400' : profile.attendancePercent >= 50
    ? 'text-amber-400' : 'text-red-400';

  const statusColor = (s: string) =>
    s === 'passed' ? 'text-emerald-400 bg-emerald-400/10' :
    s === 'rejected' ? 'text-red-400 bg-red-400/10' : 'text-amber-400 bg-amber-400/10';

  const statusLabel = (s: string) =>
    s === 'passed' ? (isUrdu ? 'منظور' : 'Passed') :
    s === 'rejected' ? (isUrdu ? 'مسترد' : 'Rejected') : (isUrdu ? 'زیر غور' : 'Pending');

  return (
    <div className="bg-[#0d1b2e] border border-[#1e3a5f]/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#1e3a5f]/40" style={{ borderLeft: `4px solid ${profile.partyColor}` }}>
        <div className="flex items-start justify-between gap-4">
          {/* Avatar & name */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${profile.partyColor}88, ${profile.partyColor})` }}
            >
              {profile.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                {isUrdu ? profile.nameUrdu : profile.name}
              </h2>
              <div className="text-xs text-[#00b4d8] mt-0.5">
                {isUrdu ? profile.constituencyUrdu : profile.constituency}
              </div>
              {profile.role && (
                <div className="text-xs text-[#8892a4] mt-0.5">
                  {isUrdu ? (profile.roleUrdu || profile.role) : profile.role}
                </div>
              )}
            </div>
          </div>

          {/* Party badge + attendance ring */}
          <div className="flex flex-col items-end gap-2">
            <div
              className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
              style={{ background: `${profile.partyColor}33`, border: `1px solid ${profile.partyColor}66`, color: profile.partyColor }}
            >
              {isUrdu ? profile.partyUrdu : profile.party}
            </div>
            <div className="text-[#8892a4] text-xs">{profile.province}</div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0.5 bg-[#1e3a5f]/10">
        {[
          {
            label: isUrdu ? 'حاضری' : 'Attendance',
            value: `${profile.attendancePercent}%`,
            sub: `${profile.sessionsAttended}/${profile.totalSessions}`,
            color: attendColor,
          },
          {
            label: isUrdu ? 'بل پیش کیے' : 'Bills Sponsored',
            value: profile.billsSponsored,
            sub: `${profile.billsPassed} ${isUrdu ? 'منظور' : 'passed'}`,
            color: 'text-[#00b4d8]',
          },
          {
            label: isUrdu ? 'سوالات' : 'Questions',
            value: profile.questionsRaised,
            sub: isUrdu ? 'قومی اسمبلی میں' : 'raised in NA',
            color: 'text-purple-400',
          },
          {
            label: isUrdu ? 'ادوار' : 'Terms',
            value: profile.terms,
            sub: isUrdu ? 'منتخب ہوئے' : 'elected',
            color: 'text-amber-400',
          },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0a1628] px-4 py-3 text-center">
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-[#8892a4] mt-0.5">{stat.sub}</div>
            <div className="text-[10px] text-[#5a6a7e] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Attendance bar & Salary Status grid */}
      <div className="px-5 py-4 border-b border-[#1e3a5f]/30 space-y-4 bg-[#0a1628]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Attendance progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-[#8892a4]">{isUrdu ? 'حاضری کا ریکارڈ' : 'Attendance Record'}</span>
              <span className={`text-xs font-bold ${attendColor}`}>{profile.attendancePercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#1e3a5f]/40 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${profile.attendancePercent}%`,
                  background: profile.attendancePercent >= 75
                    ? 'linear-gradient(90deg, #00c389, #00e5a0)'
                    : profile.attendancePercent >= 50
                    ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                    : 'linear-gradient(90deg, #dc2626, #ef4444)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-[#5a6a7e]">
              <span>0%</span>
              <span className="text-[#00b4d8] font-semibold">{isUrdu ? `قومی اوسط: ${profile.nationalAverage ?? 82}%` : `National Avg: ${profile.nationalAverage ?? 82}%`}</span>
              <span>100%</span>
            </div>
          </div>

          {/* Salary received status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#1e3a5f]/15 border border-[#1e3a5f]/30">
            <div>
              <div className="text-[10px] text-[#8892a4] uppercase font-bold tracking-wider">{isUrdu ? 'وصول شدہ تنخواہ' : 'Salary Received'}</div>
              <div className="text-sm font-black text-white mt-1">
                {isUrdu ? (profile.salaryReceivedUrdu || 'مکمل تنخواہ') : (profile.salaryReceived || 'Full Salary')}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-lg text-emerald-400">
              💵
            </div>
          </div>
        </div>
      </div>

      {/* Committees */}
      {profile.committees.length > 0 && (
        <div className="px-5 py-3 border-b border-[#1e3a5f]/30">
          <div className="text-xs text-[#8892a4] mb-2">{isUrdu ? 'کمیٹیاں' : 'Committees'}</div>
          <div className="flex flex-wrap gap-1.5">
            {profile.committees.map(c => (
              <span key={c} className="px-2 py-0.5 rounded-full text-[10px] bg-[#00b4d8]/10 text-[#00b4d8] border border-[#00b4d8]/20">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {profile.education && (
        <div className="px-5 py-3 border-b border-[#1e3a5f]/30">
          <span className="text-[10px] text-[#8892a4]">{isUrdu ? 'تعلیم: ' : 'Education: '}</span>
          <span className="text-[11px] text-[#a0aec0]">{profile.education}</span>
        </div>
      )}

      {/* Voting Record & AI Bill Explainer */}
      {profile.votingRecord && profile.votingRecord.length > 0 && (
        <div className="px-5 py-4 border-b border-[#1e3a5f]/30 bg-[#07111e]/30">
          <div className="text-xs text-[#8892a4] font-bold mb-3 flex items-center gap-1.5">
            <span>📜</span>
            <span>{isUrdu ? 'پارلیمانی ووٹنگ ریکارڈ اور بلز' : 'Parliamentary Voting Record & Bills'}</span>
          </div>
          <div className="space-y-3">
            {profile.votingRecord.map((record, index) => {
              const voteColor = record.vote === 'YES'
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
                : record.vote === 'NO'
                ? 'text-red-400 border-red-500/30 bg-red-500/5'
                : 'text-amber-400 border-amber-500/30 bg-amber-500/5';

              const voteLabel = record.vote === 'YES' ? (isUrdu ? 'ہاں' : 'YES') :
                                record.vote === 'NO' ? (isUrdu ? 'ناں' : 'NO') : (isUrdu ? 'غیر حاضر' : 'ABSENT');

              return (
                <div key={index} className="rounded-xl border border-[#1e3a5f]/40 bg-[#07111e] overflow-hidden">
                  <div className="p-3 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-white">{isUrdu ? record.billNameUrdu : record.billName}</h4>
                      <p className="text-[10px] text-[#5a6a7e] mt-0.5">{isUrdu ? 'قومی اسمبلی قانون سازی 2026' : 'National Assembly Act 2026'}</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-black border ${voteColor}`}>
                      {voteLabel}
                    </span>
                  </div>

                  {/* AI Explanation container */}
                  <div className="bg-[#1e3a5f]/10 px-3 py-2.5 border-t border-[#1e3a5f]/25 text-[11px] leading-relaxed">
                    <div className="text-[9px] text-[#00b4d8] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                      <span>🤖</span>
                      <span>{isUrdu ? 'AI بل کی وضاحت (WakalaLens)' : 'AI Bill Explanation (WakalaLens)'}</span>
                    </div>
                    <p className="text-[#a0aec0] font-medium">
                      {isUrdu ? record.explanationUrdu : record.explanationEnglish}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bills toggle */}
      {profile.recentBills.length > 0 && (
        <div className="px-5 py-3 border-b border-[#1e3a5f]/30">
          <button
            onClick={() => setShowBills(v => !v)}
            className="text-xs text-[#00b4d8] hover:text-[#00e5a0] transition-colors flex items-center gap-1"
          >
            <span>{isUrdu ? 'حالیہ بل' : 'Recent Bills'}</span>
            <span className="bg-[#00b4d8]/20 text-[#00b4d8] px-1.5 py-0.5 rounded-full text-[10px]">
              {profile.recentBills.length}
            </span>
            <span>{showBills ? '▲' : '▼'}</span>
          </button>
          {showBills && (
            <div className="mt-2 space-y-2">
              {profile.recentBills.map((bill, i) => (
                <div key={i} className="flex items-start justify-between gap-3 p-2 rounded-lg bg-[#1e3a5f]/10">
                  <div>
                    <div className="text-xs text-white">{isUrdu ? bill.titleUrdu : bill.title}</div>
                    <div className="text-[10px] text-[#5a6a7e] mt-0.5">{bill.date} · {bill.type}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor(bill.status)}`}>
                    {statusLabel(bill.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rate My MNA button */}
      <div className="px-5 py-4">
        <button
          onClick={onRate}
          disabled={isRating}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2"
          style={{
            background: isRating
              ? 'rgba(99,102,241,0.3)'
              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            boxShadow: isRating ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
          }}
        >
          {isRating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isUrdu ? 'تجزیہ کر رہا ہے...' : 'Analyzing...'}
            </>
          ) : (
            <>
              <span>⭐</span>
              {isUrdu ? 'اپنے رکن کو ریٹ کریں (AI)' : 'Rate My MNA (AI)'}
            </>
          )}
        </button>

        <ShareCard
          lang={lang}
          mna={{
            name: profile.name,
            nameUrdu: profile.nameUrdu,
            constituency: profile.constituency,
            constituencyUrdu: profile.constituencyUrdu,
            party: profile.party,
            partyUrdu: profile.partyUrdu || profile.party,
            partyColor: profile.partyColor,
            attendancePercent: profile.attendancePercent,
            sessionsAttended: profile.sessionsAttended,
            totalSessions: profile.totalSessions,
            billsSponsored: profile.billsSponsored,
            questionsRaised: profile.questionsRaised,
            grade: rating?.grade || (profile.attendancePercent >= 80 ? 'A' : profile.attendancePercent >= 65 ? 'B' : profile.attendancePercent >= 50 ? 'C' : 'D'),
            salaryReceived: profile.salaryReceived || (profile.attendancePercent >= 60 ? 'Full Salary' : 'Deducted'),
            salaryReceivedUrdu: profile.salaryReceivedUrdu || (profile.attendancePercent >= 60 ? 'مکمل تنخواہ' : 'کٹوتی شدہ'),
          }}
        />

        {/* Rating Result */}
        {rating && (
          <div className="mt-4 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
            <div className="flex items-center gap-3 mb-3">
              <GradeBadge grade={rating.grade} />
              <div>
                <div className="text-white font-bold">{isUrdu ? 'اے آئی کا فیصلہ' : 'AI Assessment'}</div>
                <div className="text-[#8892a4] text-xs">
                  {isUrdu ? 'گوگل جیمینی فلیش' : 'Powered by Google Gemini'}
                  {rating.mock && <span className="ml-1 text-amber-400">(demo)</span>}
                </div>
              </div>
            </div>

            <p className="text-sm text-[#a0aec0] mb-3 leading-relaxed">
              {isUrdu ? rating.urdu || rating.english : rating.english}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <div className="text-[10px] text-emerald-400 mb-1.5 font-semibold">
                  ✅ {isUrdu ? 'خوبیاں' : 'Strengths'}
                </div>
                {rating.strengths.map((s, i) => (
                  <div key={i} className="text-xs text-[#a0aec0] mb-1">• {s}</div>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <div className="text-[10px] text-red-400 mb-1.5 font-semibold">
                  ⚠️ {isUrdu ? 'کمزوریاں' : 'Weaknesses'}
                </div>
                {rating.weaknesses.map((w, i) => (
                  <div key={i} className="text-xs text-[#a0aec0] mb-1">• {w}</div>
                ))}
              </div>
            </div>

            {rating.recommendation && (
              <div className="p-3 rounded-lg bg-[#00b4d8]/5 border border-[#00b4d8]/20">
                <div className="text-[10px] text-[#00b4d8] mb-1 font-semibold">
                  💡 {isUrdu ? 'سفارش' : 'Recommendation'}
                </div>
                <div className="text-xs text-[#a0aec0]">{rating.recommendation}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MNA Search Result Row ─────────────────────────────────────────────────────
const MNAResultRow: React.FC<{ member: MNASearchResult; onClick: () => void; lang: 'en' | 'ur' }> = ({ member, onClick, lang }) => {
  const isUrdu = lang === 'ur';
  const attendColor = member.attendancePercent >= 75 ? '#00e5a0'
    : member.attendancePercent >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl bg-[#0d1b2e] border border-[#1e3a5f]/40 hover:border-[#00b4d8]/40 hover:bg-[#0d1b2e]/80 transition-all duration-150 flex items-center gap-3"
    >
      <div
        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
        style={{ background: `linear-gradient(135deg, ${member.partyColor}88, ${member.partyColor})` }}
      >
        {member.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">
          {isUrdu ? member.nameUrdu : member.name}
        </div>
        <div className="text-xs text-[#8892a4] truncate">
          {isUrdu ? member.constituency : member.constituency} · {member.province}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <div className="text-xs font-bold" style={{ color: attendColor }}>
          {member.attendancePercent}%
        </div>
        <div
          className="text-[10px] px-1.5 py-0.5 rounded-full"
          style={{ background: `${member.partyColor}22`, color: member.partyColor }}
        >
          {member.party}
        </div>
      </div>
    </button>
  );
};

// ─── Province Filter ───────────────────────────────────────────────────────────
const PROVINCES = ['All', 'Punjab', 'Sindh', 'KPK', 'Balochistan', 'Federal'];

// ─── Main WakalaCheck Page ────────────────────────────────────────────────────
const WakalaCheck: React.FC = () => {
  const { lang } = useLanguage();
  const isUrdu = lang === 'ur';

  const [query, setQuery] = useState('');
  const [province, setProvince] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rating, setRating] = useState<MNARatingResult | null>(null);

  // Advanced States
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedConstituency, setSelectedConstituency] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'leaderboard'>('profile');
  const [leaderboardSortBy, setLeaderboardSortBy] = useState<'attendance' | 'bills' | 'questions'>('attendance');

  // Drag and drop states for PDF Bill Summary
  const [dragActive, setDragActive] = useState(false);
  const [billSummary, setBillSummary] = useState<{ english: string, urdu: string, mock?: boolean } | null>(null);
  const [billLoading, setBillLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Search with debounce
  const [debouncedQ, setDebouncedQ] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch search results (paginated/filtered on current query)
  const { data: searchData, isLoading: searching } = useQuery({
    queryKey: ['mna-search', debouncedQ, province],
    queryFn: () => mnaApi.search(debouncedQ),
    staleTime: 30000,
  });

  // Fetch all MNAs for dropdown selectors and leaderboard
  const { data: allMNAsData } = useQuery({
    queryKey: ['mna-all'],
    queryFn: () => mnaApi.list(),
    staleTime: 5 * 60 * 1000,
  });

  const allMembers = allMNAsData?.members || [];

  const filteredMembers = (searchData?.members || []).filter(m =>
    province === 'All' || m.province === province
  );

  // Fetch selected MNA profile details
  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: ['mna-profile', selectedId],
    queryFn: () => selectedId ? mnaApi.getById(selectedId) : null,
    enabled: !!selectedId,
  });

  const profile = profileData?.member;

  // MNA city extraction helper
  const getCityFromConstituency = (constituency: string): string => {
    const c = constituency.toLowerCase();
    if (c.includes('karachi')) return 'Karachi';
    if (c.includes('lahore')) return 'Lahore';
    if (c.includes('rawalpindi')) return 'Rawalpindi';
    if (c.includes('peshawar')) return 'Peshawar';
    if (c.includes('quetta')) return 'Quetta';
    if (c.includes('swat')) return 'Swat';
    if (c.includes('sialkot')) return 'Sialkot';
    if (c.includes('larkana')) return 'Larkana';
    if (c.includes('islamabad')) return 'Islamabad';
    if (c.includes('narowal')) return 'Narowal';
    if (c.includes('gujranwala')) return 'Gujranwala';
    if (c.includes('haripur')) return 'Haripur';
    if (c.includes('chitral')) return 'Chitral';
    if (c.includes('kasur')) return 'Kasur';
    return 'Other';
  };

  const cityUrdu: Record<string, string> = {
    'Karachi': 'کراچی',
    'Lahore': 'لاہور',
    'Rawalpindi': 'راولپنڈی',
    'Peshawar': 'پشاور',
    'Quetta': 'کوئٹہ',
    'Swat': 'سوات',
    'Sialkot': 'سیالکوٹ',
    'Larkana': 'لاڑکانہ',
    'Islamabad': 'اسلام آباد',
    'Narowal': 'نارووال',
    'Gujranwala': 'گوجرانوالہ',
    'Haripur': 'ہری پور',
    'Chitral': 'چترال',
    'Kasur': 'قصور',
    'Other': 'دیگر',
  };

  const availableCities = Array.from(new Set(allMembers.map(m => getCityFromConstituency(m.constituency)))).sort();
  const constituenciesForCity = allMembers.filter(m => getCityFromConstituency(m.constituency) === selectedCity);

  // Rate MNA mutation
  const rateMutation = useMutation({
    mutationFn: () => {
      if (!profile) throw new Error('No profile');
      return aiApi.rateMna({
        mnaName: profile.name,
        mnaNameUrdu: profile.nameUrdu,
        constituency: profile.constituency,
        party: profile.party,
        attendancePercent: profile.attendancePercent,
        sessionsAttended: profile.sessionsAttended,
        totalSessions: profile.totalSessions,
        billsSponsored: profile.billsSponsored,
        billsPassed: profile.billsPassed,
        questionsRaised: profile.questionsRaised,
        role: profile.role,
        terms: profile.terms,
      });
    },
    onSuccess: (data) => setRating(data),
  });

  // Drag and drop handlers for PDF Summarizing
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      alert(isUrdu ? "صرف پی ڈی ایف فائل اپ لوڈ کریں" : "Please upload a PDF file only");
      return;
    }
    setUploadedFileName(file.name);
    setBillLoading(true);
    setBillSummary(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Url = e.target?.result as string;
        const fileBase64 = base64Url.split(',')[1];
        
        const res = await axios.post('/api/ai/summarize-bill', { fileBase64 });
        setBillSummary(res.data);
      } catch (err: any) {
        console.error("Failed to summarize bill:", err);
        setBillSummary({
          english: "Failed to connect to the AI summarizer. Please verify the backend is running and GEMINI_API_KEY is configured.",
          urdu: "اے آئی سمرائزر سے منسلک ہونے میں ناکامی۔ براہ کرم چیک کریں کہ بیک اینڈ سرور چل رہا ہے اور جیمینی کی چابی کنفیگرڈ ہے۔"
        });
      } finally {
        setBillLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Sort Leaderboard logic
  const getSortedMembers = () => {
    const list = [...allMembers];
    if (leaderboardSortBy === 'attendance') {
      return list.sort((a, b) => b.attendancePercent - a.attendancePercent);
    }
    if (leaderboardSortBy === 'bills') {
      return list.sort((a, b) => (b.billsSponsored || 0) - (a.billsSponsored || 0));
    }
    if (leaderboardSortBy === 'questions') {
      return list.sort((a, b) => (b.questionsRaised || 0) - (a.questionsRaised || 0));
    }
    return list;
  };

  const sortedMnas = getSortedMembers();

  return (
    <div className="min-h-screen bg-[#060d1a] text-white" dir={isUrdu ? 'rtl' : 'ltr'}>
      {/* Hero Banner */}
      <div className="relative overflow-hidden border-b border-[#1e3a5f]/40">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] via-[#060d1a] to-[#0a1628]" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(ellipse at 30% 50%, #7c3aed33 0%, transparent 70%), radial-gradient(ellipse at 70% 50%, #00b4d822 0%, transparent 70%)' }} />
        <div className="relative z-10 px-4 md:px-8 py-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-xl">
                🏛
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white">
                  {isUrdu ? 'وکالت چیک' : 'WakalaCheck'}
                  <span className="text-purple-400 mx-2">·</span>
                  <span className="text-lg text-[#8892a4] font-normal">
                    {isUrdu ? 'اپنے رکن قومی اسمبلی کو جانیں' : 'Know Your MNA'}
                  </span>
                </h1>
                <p className="text-sm text-[#8892a4] mt-1">
                  {isUrdu
                    ? '16ویں قومی اسمبلی کے اراکین کی حاضری، بل اور کارکردگی کا جائزہ'
                    : '16th National Assembly — Attendance, bills & AI performance ratings for elected representatives'}
                </p>
              </div>
            </div>

            {/* Hero stats */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { label: isUrdu ? 'کل اراکین' : 'Total Members', value: '336', icon: '👤' },
                { label: isUrdu ? 'اوسط حاضری' : 'Avg Attendance', value: '65%', icon: '📊' },
                { label: isUrdu ? 'اسمبلی' : 'Assembly', value: isUrdu ? '16ویں' : '16th', icon: '🏛' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{stat.icon}</div>
                  <div className="text-xl font-black text-white">{stat.value}</div>
                  <div className="text-[10px] text-[#8892a4] mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-6">
        <div className="flex bg-[#0d1b2e] border border-[#1e3a5f]/40 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'profile'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'text-[#8892a4] hover:text-white'
            }`}
          >
            <span>👤</span>
            <span>{isUrdu ? 'ارکان اسمبلی پروفائل' : 'MNA Profiles & Search'}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('leaderboard')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'leaderboard'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'text-[#8892a4] hover:text-white'
            }`}
          >
            <span>🏆</span>
            <span>{isUrdu ? 'پارلیمانی لیڈر بورڈ' : 'MNA Leaderboard'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
        {activeSubTab === 'profile' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
            {/* Left: Search & Filter Panel */}
            <div>
              {/* Constituency Selector Dropdowns */}
              <div className="p-4 rounded-xl bg-[#0d1b2e] border border-[#1e3a5f]/60 mb-4 space-y-3">
                <div className="text-xs text-[#00b4d8] font-bold uppercase tracking-wider">
                  📍 {isUrdu ? 'حلقہ اور شہر کے لحاظ سے تلاش کریں' : 'Constituency Selector'}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#8892a4] mb-1 font-semibold">
                      {isUrdu ? 'شہر منتخب کریں' : 'Select City'}
                    </label>
                    <select
                      value={selectedCity}
                      onChange={e => {
                        setSelectedCity(e.target.value);
                        setSelectedConstituency('');
                      }}
                      className="w-full bg-[#060d1a] border border-[#1e3a5f]/45 rounded-lg py-2 px-2 text-xs text-white focus:outline-none focus:border-[#00b4d8]/60"
                    >
                      <option value="">{isUrdu ? 'تمام شہر' : 'All Cities'}</option>
                      {availableCities.map(c => (
                        <option key={c} value={c}>
                          {isUrdu ? cityUrdu[c] || c : c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#8892a4] mb-1 font-semibold">
                      {isUrdu ? 'حلقہ منتخب کریں' : 'Select Constituency'}
                    </label>
                    <select
                      value={selectedConstituency}
                      disabled={!selectedCity}
                      onChange={e => {
                        const mnaId = e.target.value;
                        setSelectedConstituency(mnaId);
                        if (mnaId) {
                          setSelectedId(mnaId);
                          setRating(null);
                        }
                      }}
                      className="w-full bg-[#060d1a] border border-[#1e3a5f]/45 rounded-lg py-2 px-2 text-xs text-white focus:outline-none focus:border-[#00b4d8]/60 disabled:opacity-50"
                    >
                      <option value="">{isUrdu ? 'منتخب کریں...' : 'Select...'}</option>
                      {constituenciesForCity.map(m => (
                        <option key={m.id} value={m.id}>
                          {isUrdu ? m.constituencyUrdu || m.constituency : m.constituency.split(' ')[0]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Search input */}
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[#5a6a7e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={isUrdu ? 'نام، حلقہ یا پارٹی تلاش کریں...' : 'Search by name, constituency, or party...'}
                  className="w-full bg-[#0d1b2e] border border-[#1e3a5f]/60 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-[#5a6a7e] focus:outline-none focus:border-[#00b4d8]/60 focus:ring-1 focus:ring-[#00b4d8]/30"
                  dir={isUrdu ? 'rtl' : 'ltr'}
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-[#00b4d8]/30 border-t-[#00b4d8] rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Province filter */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {PROVINCES.map(p => (
                  <button
                    key={p}
                    onClick={() => setProvince(p)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      province === p
                        ? 'bg-[#00b4d8] text-white'
                        : 'bg-[#0d1b2e] border border-[#1e3a5f]/40 text-[#8892a4] hover:border-[#00b4d8]/40'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Results */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {filteredMembers.length === 0 && !searching ? (
                  <div className="text-center py-8 text-[#5a6a7e]">
                    <div className="text-3xl mb-2">🔍</div>
                    <div className="text-sm">
                      {isUrdu ? 'کوئی رکن نہیں ملا' : 'No members found'}
                    </div>
                  </div>
                ) : (
                  filteredMembers.map(member => (
                    <MNAResultRow
                      key={member.id}
                      member={member}
                      lang={lang}
                      onClick={() => {
                        setSelectedId(member.id);
                        setRating(null);
                        setSelectedCity('');
                        setSelectedConstituency('');
                      }}
                    />
                  ))
                )}
              </div>

              {/* Source note */}
              <div className="mt-4 p-3 rounded-xl bg-[#0d1b2e] border border-[#1e3a5f]/30">
                <div className="text-[10px] text-[#5a6a7e] flex items-start gap-1.5">
                  <span>ℹ️</span>
                  <span>
                    {isUrdu
                      ? 'ڈیٹا ماخذ: قومی اسمبلی پاکستان (na.gov.pk) - 16ویں قومی اسمبلی (2024-موجودہ)'
                      : 'Data source: National Assembly of Pakistan (na.gov.pk) — 16th NA (2024–present). Attendance based on official session records.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Profile & Bill Upload Panel */}
            <div className="space-y-6">
              {loadingProfile ? (
                <div className="flex items-center justify-center h-64 bg-[#0d1b2e] rounded-2xl border border-[#1e3a5f]/40">
                  <div className="text-center">
                    <div className="w-10 h-10 border-2 border-[#00b4d8]/30 border-t-[#00b4d8] rounded-full animate-spin mx-auto mb-3" />
                    <div className="text-sm text-[#8892a4]">
                      {isUrdu ? 'پروفائل لوڈ ہو رہا ہے...' : 'Loading profile...'}
                    </div>
                  </div>
                </div>
              ) : profile ? (
                <MNAProfileCard
                  profile={profile}
                  lang={lang}
                  onRate={() => rateMutation.mutate()}
                  rating={rating}
                  isRating={rateMutation.isPending}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-[#0d1b2e] rounded-2xl border border-[#1e3a5f]/40 text-center p-6 text-card-content">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-indigo-700/20 border border-purple-500/20 flex items-center justify-center text-3xl mb-4">
                    🏛️
                  </div>
                  <h3 className="text-white font-semibold mb-2">
                    {isUrdu ? 'رکن منتخب کریں' : 'Select a Member'}
                  </h3>
                  <p className="text-sm text-[#8892a4]">
                    {isUrdu
                      ? 'بائیں طرف سے نام یا حلقہ تلاش کریں اور کلک کریں'
                      : 'Search for an MNA by name or constituency and click to view their full profile'}
                  </p>
                </div>
              )}

              {/* AI Bill Summarizer Drag & Drop Widget */}
              <div className="bg-[#0d1b2e] border border-[#1e3a5f]/60 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">📄</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {isUrdu ? 'اے آئی قانون سازی بل سمرائزر' : 'AI Legislative Bill Summarizer'}
                    </h3>
                    <p className="text-[10px] text-[#8892a4]">
                      {isUrdu ? 'سرکاری بل کی پی ڈی ایف اپ لوڈ کر کے آسان خلاصہ حاصل کریں' : 'Upload any official parliament bill PDF to get instant simple Urdu/English explanations'}
                    </p>
                  </div>
                </div>

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    dragActive
                      ? 'border-[#00b4d8] bg-[#00b4d8]/5'
                      : 'border-[#1e3a5f]/60 bg-[#060d1a]/50 hover:border-[#00b4d8]/40'
                  }`}
                >
                  <input
                    type="file"
                    id="bill-upload"
                    accept="application/pdf"
                    onChange={handleChange}
                    className="hidden"
                  />
                  <label htmlFor="bill-upload" className="cursor-pointer block">
                    <div className="text-2xl mb-2">📤</div>
                    <div className="text-xs font-semibold text-white mb-1">
                      {uploadedFileName ? uploadedFileName : (isUrdu ? 'پی ڈی ایف بل یہاں کھینچیں یا تلاش کریں' : 'Drag & Drop PDF bill or click to browse')}
                    </div>
                    <div className="text-[10px] text-[#5a6a7e]">
                      {isUrdu ? 'صرف پی ڈی ایف فائلیں' : 'PDF files only'}
                    </div>
                  </label>
                </div>

                {billLoading && (
                  <div className="mt-4 flex items-center justify-center py-4 bg-[#0a1628] rounded-xl border border-[#1e3a5f]/30">
                    <div className="w-5 h-5 border-2 border-[#00b4d8]/30 border-t-[#00b4d8] rounded-full animate-spin mr-2" />
                    <span className="text-xs text-[#8892a4]">
                      {isUrdu ? 'بل کا تجزیہ کیا جا رہا ہے...' : 'AI is reading and translating the bill PDF...'}
                    </span>
                  </div>
                )}

                {billSummary && (
                  <div className="mt-4 p-4 rounded-xl border border-[#00b4d8]/30 bg-[#00b4d8]/5 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1e3a5f]/30 pb-2">
                      <span className="text-xs text-white font-bold">🤖 {isUrdu ? 'اے آئی خلاصہ رپورٹ' : 'AI Summary Report'}</span>
                      <span className="text-[10px] text-[#8892a4] font-semibold truncate max-w-[150px]">{uploadedFileName}</span>
                    </div>

                    <div className="space-y-3 text-xs leading-relaxed">
                      <div className="space-y-1">
                        <div className="text-[9px] uppercase font-bold text-[#00b4d8] tracking-wider">English Summary</div>
                        <p className="text-[#a0aec0] font-medium">{billSummary.english}</p>
                      </div>

                      <div className="space-y-1" dir="rtl">
                        <div className="text-[9px] uppercase font-bold text-[#00b4d8] tracking-wider text-left">اردو خلاصہ (Nastaliq)</div>
                        <p className="text-[#a0aec0] font-medium font-urdu text-right">{billSummary.urdu}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Leaderboard Sub-tab */
          <div className="bg-[#0d1b2e] border border-[#1e3a5f]/60 rounded-2xl p-6 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isUrdu ? 'قومی اسمبلی لیڈر بورڈ' : 'National Assembly Leaderboard'}
                </h3>
                <p className="text-xs text-[#8892a4] mt-0.5">
                  {isUrdu ? 'اراکینِ اسمبلی کی حاضری اور قانون سازی کی کارکردگی کا موازنہ' : 'Ranking members of the 16th National Assembly by key performance indicators'}
                </p>
              </div>

              {/* Sorting Controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8892a4]">{isUrdu ? 'ترتیب دیں:' : 'Sort by:'}</span>
                <div className="flex bg-[#060d1a] border border-[#1e3a5f]/40 p-1 rounded-lg">
                  {[
                    { key: 'attendance', label: isUrdu ? 'حاضری' : 'Attendance' },
                    { key: 'bills', label: isUrdu ? 'بل پیش کیے' : 'Bills' },
                    { key: 'questions', label: isUrdu ? 'سوالات' : 'Questions' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setLeaderboardSortBy(opt.key as any)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        leaderboardSortBy === opt.key
                          ? 'bg-[#1e3a5f] text-white shadow-sm'
                          : 'text-[#8892a4] hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" dir={isUrdu ? 'rtl' : 'ltr'}>
                <thead>
                  <tr className="border-b border-[#1e3a5f]/40 text-[#5a6a7e] text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 text-center w-12">#</th>
                    <th className={`${isUrdu ? 'text-right' : 'text-left'} py-3 px-4`}>{isUrdu ? 'رکن اسمبلی' : 'Member'}</th>
                    <th className={`${isUrdu ? 'text-right' : 'text-left'} py-3 px-4`}>{isUrdu ? 'پارٹی' : 'Party'}</th>
                    <th className="py-3 px-4 text-center">{isUrdu ? 'حاضری' : 'Attendance'}</th>
                    <th className="py-3 px-4 text-center">{isUrdu ? 'بل پیش کیے' : 'Bills Sponsored'}</th>
                    <th className="py-3 px-4 text-center">{isUrdu ? 'سوالات' : 'Questions Raised'}</th>
                    <th className="py-3 px-4 text-center">{isUrdu ? 'گریڈ' : 'AI Grade'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e3a5f]/30">
                  {sortedMnas.map((m, idx) => {
                    const attendColor = m.attendancePercent >= 75 ? 'text-emerald-400'
                      : m.attendancePercent >= 50 ? 'text-amber-400' : 'text-red-400';
                    
                    const grade = m.attendancePercent >= 80 ? 'A' : m.attendancePercent >= 65 ? 'B' : m.attendancePercent >= 50 ? 'C' : 'D';

                    return (
                      <tr
                        key={m.id}
                        onClick={() => {
                          setSelectedId(m.id);
                          setRating(null);
                          setActiveSubTab('profile');
                        }}
                        className="hover:bg-[#1e3a5f]/20 cursor-pointer transition-colors text-sm"
                      >
                        <td className="py-4 px-4 text-center font-black text-[#8892a4]">
                          {idx + 1}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-white">
                            {isUrdu ? m.nameUrdu : m.name}
                          </div>
                          <div className="text-xs text-[#8892a4]">
                            {isUrdu ? m.constituencyUrdu || m.constituency : m.constituency}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                            style={{ background: `${m.partyColor}22`, border: `1px solid ${m.partyColor}44`, color: m.partyColor }}
                          >
                            {isUrdu ? m.partyUrdu || m.party : m.party}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center font-bold">
                          <span className={attendColor}>{m.attendancePercent}%</span>
                        </td>
                        <td className="py-4 px-4 text-center text-[#00b4d8] font-semibold">
                          {m.billsSponsored ?? 0}
                        </td>
                        <td className="py-4 px-4 text-center text-purple-400 font-semibold">
                          {m.questionsRaised ?? 0}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-black text-white px-2 py-1 rounded bg-[#1e3a5f]/40 border border-[#1e3a5f]/80">
                            {grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WakalaCheck;
