import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

// Scraper modules
import { scrapeWikipedia } from './scrapers/wikipediaScraper';
import { scrapeElectionResults } from './scrapers/electionScraper';
import { scrapeKarachiResults } from './scrapers/geoKarachiScraper';
import { scrapePildatAttendance } from './scrapers/pildatScraper';
import { scrapeNAQuestions } from './scrapers/naQuestionsScraper';
import { scrapeNABills } from './scrapers/naBillsScraper';
import { hydrateAllMnas } from './dataHydrator';

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
  dataSource?: {
    name: 'wikipedia' | 'seed';
    attendance: 'pildat' | 'estimated';
    votes: 'election2024' | 'none';
    questions: 'na.gov.pk' | 'none';
  };
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
  dataSource?: any;
}

// ─── Corrected Seed Data (TASK 9) ──────────────────────────────────────────────
export const SEED_MNA_DATA: MNAProfile[] = [
  {
    id: '2001',
    name: 'Syed Mustafa Kamal',
    nameUrdu: 'سید مصطفیٰ کمال',
    constituency: 'NA-242 (Karachi Keamari-I)',
    constituencyUrdu: 'این اے 242 کراچی کیماڑی',
    party: 'MQM-P',
    partyUrdu: 'متحدہ قومی موومنٹ پاکستان',
    partyColor: '#FF5733',
    province: 'Sindh',
    role: 'Member, National Assembly',
    roleUrdu: 'رکن قومی اسمبلی',
    attendancePercent: 71,
    sessionsAttended: 92,
    totalSessions: 130,
    billsSponsored: 4,
    billsPassed: 1,
    questionsRaised: 18,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=2001',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Mustafa_Kamal.jpg/220px-Mustafa_Kamal.jpg',
    terms: 2,
    education: 'MBA, University of Karachi',
    committees: ['Standing Committee on Ports and Shipping'],
    recentBills: [
      {
        title: 'Karachi Infrastructure Development Act 2024',
        titleUrdu: 'کراچی انفراسٹرکچر ڈویلپمنٹ ایکٹ 2024',
        date: 'Tuesday, 6th August, 2024',
        status: 'pending',
        type: 'private'
      }
    ],
    lastUpdated: new Date().toISOString(),
    nationalAverage: 62.5,
    dataSource: {
      name: 'seed',
      attendance: 'estimated',
      votes: 'none',
      questions: 'none'
    }
  },
  {
    id: '1027',
    name: 'Mirza Ikhtiar Baig',
    nameUrdu: 'مرزا اختیار بیگ',
    constituency: 'NA-241 (Karachi South-III)',
    constituencyUrdu: 'این اے 241 کراچی ساؤتھ',
    party: 'PPP',
    partyUrdu: 'پاکستان پیپلز پارٹی',
    partyColor: '#FF0000',
    province: 'Sindh',
    role: 'Member, National Assembly',
    roleUrdu: 'رکن قومی اسمبلی',
    attendancePercent: 85,
    sessionsAttended: 110,
    totalSessions: 130,
    billsSponsored: 6,
    billsPassed: 2,
    questionsRaised: 28,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1027',
    imageUrl: 'https://na.gov.pk/uploads/members/1027.jpg',
    terms: 1,
    education: 'PhD in Economics',
    committees: ['Standing Committee on Commerce and Industries'],
    recentBills: [],
    lastUpdated: new Date().toISOString(),
    nationalAverage: 62.5,
    dataSource: {
      name: 'seed',
      attendance: 'estimated',
      votes: 'none',
      questions: 'none'
    }
  },
  {
    id: '1025',
    name: 'Afzal Khokhar',
    nameUrdu: 'افضل کھوکر',
    constituency: 'NA-125 (Lahore-IX)',
    constituencyUrdu: 'این اے 125 لاہور',
    party: 'PML-N',
    partyUrdu: 'پاکستان مسلم لیگ (ن)',
    partyColor: '#008000',
    province: 'Punjab',
    role: 'Member, National Assembly',
    roleUrdu: 'رکن قومی اسمبلی',
    attendancePercent: 62,
    sessionsAttended: 80,
    totalSessions: 130,
    billsSponsored: 3,
    billsPassed: 1,
    questionsRaised: 14,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1025',
    imageUrl: 'https://na.gov.pk/uploads/members/1025.jpg',
    terms: 3,
    education: 'LLB, Punjab University',
    committees: ['Standing Committee on Housing and Works'],
    recentBills: [],
    lastUpdated: new Date().toISOString(),
    nationalAverage: 62.5,
    dataSource: {
      name: 'seed',
      attendance: 'estimated',
      votes: 'none',
      questions: 'none'
    }
  },
  // Missing Karachi MNAs (NA-229, NA-230, NA-231, NA-243, NA-244, NA-245, NA-246)
  {
    id: '2229',
    name: 'Jam Abdul Karim',
    nameUrdu: 'جام عبدالکریم',
    constituency: 'NA-229 (Karachi Malir-I)',
    constituencyUrdu: 'این اے 229 کراچی ملیر',
    party: 'PPP',
    partyUrdu: 'پاکستان پیپلز پارٹی',
    partyColor: '#FF0000',
    province: 'Sindh',
    role: 'Member, National Assembly',
    attendancePercent: 68,
    sessionsAttended: 88,
    totalSessions: 130,
    billsSponsored: 2,
    billsPassed: 0,
    questionsRaised: 9,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=2229',
    imageUrl: 'https://na.gov.pk/uploads/members/2229.jpg',
    terms: 2,
    committees: [],
    recentBills: [],
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2230',
    name: 'Syed Rafiullah',
    nameUrdu: 'سید رفیع اللہ',
    constituency: 'NA-230 (Karachi Malir-II)',
    constituencyUrdu: 'این اے 230 کراچی ملیر',
    party: 'PPP',
    partyUrdu: 'پاکستان پیپلز پارٹی',
    partyColor: '#FF0000',
    province: 'Sindh',
    role: 'Member, National Assembly',
    attendancePercent: 70,
    sessionsAttended: 91,
    totalSessions: 130,
    billsSponsored: 3,
    billsPassed: 1,
    questionsRaised: 11,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=2230',
    imageUrl: 'https://na.gov.pk/uploads/members/2230.jpg',
    terms: 2,
    committees: [],
    recentBills: [],
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2231',
    name: 'Abdul Hakeem Baloch',
    nameUrdu: 'عبدالحکیم بلوچ',
    constituency: 'NA-231 (Karachi Malir-III)',
    constituencyUrdu: 'این اے 231 کراچی ملیر',
    party: 'PPP',
    partyUrdu: 'پاکستان پیپلز پارٹی',
    partyColor: '#FF0000',
    province: 'Sindh',
    role: 'Member, National Assembly (IPP since 2026)',
    attendancePercent: 64,
    sessionsAttended: 83,
    totalSessions: 130,
    billsSponsored: 1,
    billsPassed: 0,
    questionsRaised: 8,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=2231',
    imageUrl: 'https://na.gov.pk/uploads/members/2231.jpg',
    terms: 3,
    committees: [],
    recentBills: [],
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2243',
    name: 'Abdul Qadir Patel',
    nameUrdu: 'عبدالقادر پٹیل',
    constituency: 'NA-243 (Karachi Keamari-II)',
    constituencyUrdu: 'این اے 243 کراچی کیماڑی',
    party: 'PPP',
    partyUrdu: 'پاکستان پیپلز پارٹی',
    partyColor: '#FF0000',
    province: 'Sindh',
    role: 'Member, National Assembly',
    attendancePercent: 78,
    sessionsAttended: 101,
    totalSessions: 130,
    billsSponsored: 4,
    billsPassed: 2,
    questionsRaised: 22,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=2243',
    imageUrl: 'https://na.gov.pk/uploads/members/2243.jpg',
    terms: 3,
    committees: [],
    recentBills: [],
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2244',
    name: 'Dr Farooq Sattar',
    nameUrdu: 'ڈاکٹر فاروق ستار',
    constituency: 'NA-244 (Karachi West-I)',
    constituencyUrdu: 'این اے 244 کراچی غربی',
    party: 'MQM-P',
    partyUrdu: 'متحدہ قومی موومنٹ پاکستان',
    partyColor: '#FF5733',
    province: 'Sindh',
    role: 'Member, National Assembly',
    attendancePercent: 75,
    sessionsAttended: 98,
    totalSessions: 130,
    billsSponsored: 5,
    billsPassed: 1,
    questionsRaised: 19,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=2244',
    imageUrl: 'https://na.gov.pk/uploads/members/2244.jpg',
    terms: 5,
    committees: [],
    recentBills: [],
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2245',
    name: 'Syed Hafeez Uddin Aminul Haque',
    nameUrdu: 'سید حفیظ الدین امین الحق',
    constituency: 'NA-245 (Karachi West-II)',
    constituencyUrdu: 'این اے 245 کراچی غربی',
    party: 'MQM-P',
    partyUrdu: 'متحدہ قومی موومنٹ پاکستان',
    partyColor: '#FF5733',
    province: 'Sindh',
    role: 'Member, National Assembly',
    attendancePercent: 72,
    sessionsAttended: 94,
    totalSessions: 130,
    billsSponsored: 2,
    billsPassed: 0,
    questionsRaised: 12,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=2245',
    imageUrl: 'https://na.gov.pk/uploads/members/2245.jpg',
    terms: 1,
    committees: [],
    recentBills: [],
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2246',
    name: 'Syed Aminul Haque',
    nameUrdu: 'سید امین الحق',
    constituency: 'NA-246 (Karachi West-III)',
    constituencyUrdu: 'این اے 246 کراچی غربی',
    party: 'MQM-P',
    partyUrdu: 'متحدہ قومی موومنٹ پاکستان',
    partyColor: '#FF5733',
    province: 'Sindh',
    role: 'Member, National Assembly',
    attendancePercent: 82,
    sessionsAttended: 107,
    totalSessions: 130,
    billsSponsored: 5,
    billsPassed: 2,
    questionsRaised: 26,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=2246',
    imageUrl: 'https://na.gov.pk/uploads/members/2246.jpg',
    terms: 3,
    committees: [],
    recentBills: [],
    lastUpdated: new Date().toISOString()
  }
];

// ─── Cache & Status ────────────────────────────────────────────────────────────
let mnaCache: MNAProfile[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days cache TTL (TASK 8)

export const scrapeProgress = {
  running: false,
  stage: 'idle',
  count: 0,
  lastRunTime: 0
};

// ─── Helper to load from file ─────────────────────────────────────────────────
function loadMNADataFromFile(): MNAProfile[] {
  try {
    const dataPath = path.resolve(__dirname, '../../data/mnas.json');
    if (fs.existsSync(dataPath)) {
      // Check file age
      const stats = fs.statSync(dataPath);
      const ageMs = Date.now() - stats.mtimeMs;
      
      const raw = fs.readFileSync(dataPath, 'utf8');
      const data = JSON.parse(raw) as MNAProfile[];
      
      if (ageMs > CACHE_TTL_MS) {
        console.log('🔄 Cached MNA data is stale (> 7 days). Triggering background re-scrape...');
        runBackgroundScrape().catch(err => console.error('Error in background scrape:', err));
      } else {
        console.log('🔄 Loaded MNA data from cache (fresh)');
      }
      return data;
    } else {
      console.warn(`MNA data file not found at: ${dataPath}. Triggering re-scrape...`);
      runBackgroundScrape().catch(err => console.error('Error in background scrape:', err));
    }
  } catch (err) {
    console.error('Error reading mnas.json:', err);
  }
  return SEED_MNA_DATA;
}

// ─── Log Writer Helper (TASK 12) ──────────────────────────────────────────────
function updateScrapeLog(source: string, status: 'success' | 'partial' | 'failed', count: number, error?: string) {
  try {
    const logPath = path.resolve(__dirname, '../data/scrape_log.json');
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    let logs: any = {};
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
    
    logs[source] = {
      timestamp: new Date().toISOString(),
      status,
      recordCount: count,
      error: error || null
    };
    
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
    console.log(`📝 [Log] Source: ${source} | Status: ${status} | Count: ${count}`);
  } catch (err) {
    console.error('Error writing scrape log:', err);
  }
}

// ─── Background Scraper Pipeline ─────────────────────────────────────────────
export async function runBackgroundScrape() {
  if (scrapeProgress.running) return;
  
  // Rate limit: refresh only once every 24 hours
  const logPath = path.resolve(__dirname, '../data/scrape_log.json');
  if (fs.existsSync(logPath)) {
    try {
      const logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      const lastHydration = logs['hydration'];
      if (lastHydration && lastHydration.timestamp) {
        const lastRun = new Date(lastHydration.timestamp).getTime();
        const diffMs = Date.now() - lastRun;
        if (diffMs < 24 * 60 * 60 * 1000) {
          console.log('🔄 Rate limit active: Scraped recently (< 24 hours ago). Skipping background re-scrape.');
          return;
        }
      }
    } catch (e) {
      // ignore parsing error, proceed
    }
  }

  scrapeProgress.running = true;
  scrapeProgress.stage = 'started';
  scrapeProgress.count = 0;
  
  console.log('🔄 Starting full background scrape pipeline...');
  
  try {
    // 1. Wikipedia Scraper
    scrapeProgress.stage = 'Wikipedia members list';
    const wikiMnas = await scrapeWikipedia();
    scrapeProgress.count = wikiMnas.length;
    updateScrapeLog('wikipedia', 'success', wikiMnas.length);
    
    // 2. Karachi results
    scrapeProgress.stage = 'Geo.tv Karachi results';
    const karachi = await scrapeKarachiResults();
    updateScrapeLog('geo_karachi', 'success', karachi.length);
    
    // 3. PILDAT
    scrapeProgress.stage = 'PILDAT attendance PDFs';
    const attendance = await scrapePildatAttendance();
    updateScrapeLog('pildat', 'success', Object.keys(attendance).length);
    
    // 4. Questions
    scrapeProgress.stage = 'na.gov.pk questions search';
    const questions = await scrapeNAQuestions();
    updateScrapeLog('na_questions', 'success', Object.keys(questions).length);
    
    // 5. Bills
    scrapeProgress.stage = 'na.gov.pk bills list';
    const bills = await scrapeNABills();
    updateScrapeLog('na_bills', 'success', bills.length);
    
    // 6. Election results
    scrapeProgress.stage = 'Election 2024 results';
    const election = await scrapeElectionResults();
    updateScrapeLog('election2024', 'success', election.length);
    
    // 7. Hydrate
    scrapeProgress.stage = 'Consolidating and Hydrating Profiles';
    const finalMnas = await hydrateAllMnas();
    
    // Save to Cache
    const outPath = path.resolve(__dirname, '../../data/mnas.json');
    fs.writeFileSync(outPath, JSON.stringify(finalMnas, null, 2));
    
    scrapeProgress.stage = 'completed';
    scrapeProgress.lastRunTime = Date.now();
    updateScrapeLog('hydration', 'success', finalMnas.length);
    console.log('✅ Background scrape and hydration pipeline completed successfully!');
  } catch (err: any) {
    scrapeProgress.stage = `failed: ${err.message}`;
    updateScrapeLog('hydration', 'failed', 0, err.message);
    console.error('❌ Background scrape pipeline failed:', err);
  } finally {
    scrapeProgress.running = false;
  }
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
    dataSource: m.dataSource
  };
}

export type { MNASearchResult as MNAListItem };
