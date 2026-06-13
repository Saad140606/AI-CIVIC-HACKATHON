import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────
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
  phone?: string;
  email?: string;
  committees: string[];
  recentBills: RecentBill[];
  lastUpdated: string;
  nationalAverage?: number;
  salaryReceived?: string;
  salaryReceivedUrdu?: string;
  votingRecord?: VotingRecordItem[];
}

export interface RecentBill {
  title: string;
  titleUrdu: string;
  date: string;
  status: 'passed' | 'pending' | 'rejected';
  type: 'government' | 'private';
}

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

// ─── Cache ─────────────────────────────────────────────────────────────────────
let mnaCache: MNAProfile[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Scraper and Fuzzy Match ──────────────────────────────────────────────────
export interface ScrapedMNA {
  name: string;
  constituency: string;
  party: string;
  profileUrl: string;
  imageUrl?: string;
}

export async function scrapeNAMembers(): Promise<ScrapedMNA[]> {
  return [];
}

// ─── Helper to load from file ─────────────────────────────────────────────────
function loadMNADataFromFile(): MNAProfile[] {
  try {
    const dataPath = path.join(__dirname, '../../data/mnas.json');
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(raw) as MNAProfile[];
    } else {
      console.warn(`MNA data file not found at: ${dataPath}`);
    }
  } catch (err) {
    console.error('Error reading mnas.json:', err);
  }
  return [];
}

// ─── Public API ────────────────────────────────────────────────────────────────
export async function getAllMNAs(): Promise<MNAProfile[]> {
  const now = Date.now();
  if (mnaCache && now - cacheTimestamp < CACHE_TTL_MS) {
    return mnaCache;
  }

  const data = loadMNADataFromFile();
  mnaCache = data;
  cacheTimestamp = now;
  return mnaCache;
}

export async function searchMNAs(query: string): Promise<MNASearchResult[]> {
  const all = await getAllMNAs();
  const keywords = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  if (keywords.length === 0) return all.slice(0, 20).map(toSearchResult);

  return all
    .filter(m => {
      const matchText = `${m.name} ${m.nameUrdu} ${m.constituency} ${m.constituencyUrdu} ${m.party} ${m.partyUrdu} ${m.province} ${m.role || ''}`.toLowerCase();
      return keywords.every(kw => matchText.includes(kw));
    })
    .slice(0, 30)
    .map(toSearchResult);
}

export async function getMNAById(id: string): Promise<MNAProfile | null> {
  const all = await getAllMNAs();
  return all.find(m => m.id === id) ?? null;
}

function toSearchResult(m: MNAProfile): MNASearchResult {
  return {
    id: m.id,
    name: m.name,
    nameUrdu: m.nameUrdu,
    constituency: m.constituency,
    constituencyUrdu: m.constituencyUrdu,
    party: m.party,
    partyUrdu: m.partyUrdu,
    partyColor: m.partyColor,
    province: m.province,
    attendancePercent: m.attendancePercent,
    role: m.role,
    billsSponsored: m.billsSponsored,
    billsPassed: m.billsPassed,
    questionsRaised: m.questionsRaised,
  };
}

export type { MNASearchResult as MNAListItem };
