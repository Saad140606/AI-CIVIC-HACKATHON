import axios from 'axios';

const getBaseURL = () => {
  let url = import.meta.env.VITE_API_URL;
  if (!url || url === '/') {
    return '/api';
  }
  // If it's a domain name (contains a dot) but missing protocol, prepend https://
  if (!url.startsWith('http') && url.includes('.')) {
    url = `https://${url}`;
  }
  // If it's a full URL, ensure it ends with /api
  if (url.startsWith('http')) {
    return url.endsWith('/api') || url.endsWith('/api/') 
      ? url 
      : `${url.replace(/\/+$/, '')}/api`;
  }
  return url;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
});

export interface MinistryTotal {
  ministry: string;
  total: number;
  divisions: { division: string; total: number }[];
}

export interface HeroStats {
  fy2425Total: number;
  fy2526Total: number;
  totalChangePercent: number;
  top3: MinistryTotal[];
  biggestIncrease: { ministry: string; changePercent: number; prev: number; curr: number } | null;
  biggestDecrease: { ministry: string; changePercent: number; prev: number; curr: number } | null;
}

export interface BudgetSummaryResponse {
  fy2324: MinistryTotal[];
  fy2425: MinistryTotal[];
  fy2526: MinistryTotal[];
  heroStats: HeroStats;
}

export interface MinistryDetailResponse {
  fy2324?: MinistryTotal;
  fy2425?: MinistryTotal;
  fy2526?: MinistryTotal;
}

export interface CompareResponse {
  ministry: string;
  fy2324?: MinistryTotal;
  fy2425?: MinistryTotal;
  fy2526?: MinistryTotal;
  comparison2324vs2425: { prev: number; curr: number; change: number; changePercent: number } | null;
  comparison2425vs2526: { prev: number; curr: number; change: number; changePercent: number } | null;
}

// Budget API
export const budgetApi = {
  getSummary: () => api.get<BudgetSummaryResponse>('/budget/summary').then(r => r.data),
  getMinistry: (name: string) => api.get<MinistryDetailResponse>(`/budget/ministry/${encodeURIComponent(name)}`).then(r => r.data),
  compareMinistry: (name: string) => api.get<CompareResponse>(`/budget/compare/${encodeURIComponent(name)}`).then(r => r.data),
  getYears: () => api.get('/budget/years').then(r => r.data),
};

// AI API
export const aiApi = {
  explain: (ministry: string, budget: number, year: string) =>
    api.post<{ english: string; urdu: string; full?: string; mock?: boolean }>('/ai/explain', { ministry, budget, year }).then(r => r.data),
  chat: (message: string, history?: Array<{ role: string; text: string }>) =>
    api.post<{ response: string; mock?: boolean }>('/ai/chat', { message, history }).then(r => r.data),
  rateMna: (params: {
    mnaName: string; mnaNameUrdu?: string; constituency?: string;
    party?: string; attendancePercent: number; sessionsAttended?: number;
    totalSessions?: number; billsSponsored?: number; billsPassed?: number;
    questionsRaised?: number; role?: string; terms?: number;
  }) => api.post<{
    grade: string; english: string; urdu: string;
    strengths: string[]; weaknesses: string[];
    recommendation: string; full?: string; mock?: boolean;
  }>('/ai/rate-mna', params).then(r => r.data),
  summarizeBill: (fileBase64: string) =>
    api.post<{ english: string; urdu: string; full?: string; mock?: boolean }>(
      '/ai/summarize-bill',
      { fileBase64 }
    ).then(r => r.data),
};

// MNA Types
export interface MNASearchResult {
  id: string;
  name: string;
  nameUrdu: string;
  constituency: string;
  constituencyUrdu?: string;
  party: string;
  partyUrdu?: string;
  partyColor: string;
  province: string;
  attendancePercent: number;
  role?: string;
  billsSponsored?: number;
  billsPassed?: number;
  questionsRaised?: number;
}

export interface RecentBill {
  title: string;
  titleUrdu: string;
  date: string;
  status: 'passed' | 'pending' | 'rejected';
  type: 'government' | 'private';
}

export interface VotingRecordItem {
  billName: string;
  billNameUrdu: string;
  vote: 'YES' | 'NO' | 'ABSENT';
  voteUrdu: 'ہاں' | 'ناں' | 'غیر حاضر';
  explanationEnglish: string;
  explanationUrdu: string;
}

export interface MNAProfile {
  id: string;
  name: string;
  nameUrdu: string;
  constituency: string;
  constituencyUrdu: string;
  province: string;
  party: string;
  partyUrdu: string;
  partyColor: string;
  role?: string;
  roleUrdu?: string;
  attendancePercent: number;
  sessionsAttended: number;
  totalSessions: number;
  billsSponsored: number;
  billsPassed: number;
  questionsRaised: number;
  profileUrl: string;
  imageUrl?: string;
  terms: number;
  education?: string;
  committees: string[];
  recentBills: RecentBill[];
  lastUpdated: string;
  nationalAverage?: number;
  salaryReceived?: string;
  salaryReceivedUrdu?: string;
  votingRecord?: VotingRecordItem[];
  dataSource?: {
    name: 'wikipedia' | 'seed';
    attendance: 'pildat' | 'estimated';
    votes: 'election2024' | 'none';
    questions: 'na.gov.pk' | 'none';
  };
}

export interface MNARatingResult {
  grade: string;
  english: string;
  urdu: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  mock?: boolean;
}

// MNA API
export const mnaApi = {
  search: (q: string) =>
    api.get<{ success: boolean; count: number; members: MNASearchResult[] }>(`/mna/search?q=${encodeURIComponent(q)}`).then(r => r.data),
  list: () =>
    api.get<{ success: boolean; count: number; members: MNASearchResult[] }>('/mna/list').then(r => r.data),
  getById: (id: string) =>
    api.get<{ success: boolean; member: MNAProfile }>(`/mna/${id}`).then(r => r.data),
};

export default api;
