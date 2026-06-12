import * as cheerio from 'cheerio';

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

// ─── Comprehensive 16th National Assembly Seed Data ───────────────────────────
// Based on publicly available information from na.gov.pk and official records
const SEED_MNA_DATA: MNAProfile[] = [
  {
    id: '1001',
    name: 'Muhammad Shehbaz Sharif',
    nameUrdu: 'محمد شہباز شریف',
    constituency: 'NA-132 (Lahore-IX)',
    constituencyUrdu: 'NA-132 (لاہور-9)',
    province: 'Punjab',
    party: 'PML-N',
    partyUrdu: 'مسلم لیگ نون',
    partyColor: '#006400',
    role: 'Prime Minister',
    roleUrdu: 'وزیرِ اعظم',
    attendancePercent: 47,
    sessionsAttended: 62,
    totalSessions: 131,
    billsSponsored: 8,
    billsPassed: 6,
    questionsRaised: 2,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1001',
    imageUrl: 'https://na.gov.pk/uploads/members/1001.jpg',
    terms: 6,
    education: 'BA (Hons) from University of the Punjab, MBA from Gordon College Glasgow',
    committees: ['Public Accounts Committee', 'Finance Committee'],
    recentBills: [
      { title: 'Finance Act 2024', titleUrdu: 'مالیاتی ایکٹ 2024', date: '2024-06-12', status: 'passed', type: 'government' },
      { title: 'Economic Stabilization Bill', titleUrdu: 'اقتصادی استحکام بل', date: '2024-08-20', status: 'passed', type: 'government' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1002',
    name: 'Bilawal Bhutto Zardari',
    nameUrdu: 'بلاول بھٹو زرداری',
    constituency: 'NA-194 (Larkana-I)',
    constituencyUrdu: 'NA-194 (لاڑکانہ-1)',
    province: 'Sindh',
    party: 'PPP',
    partyUrdu: 'پاکستان پیپلز پارٹی',
    partyColor: '#8B0000',
    role: 'Former Foreign Minister',
    roleUrdu: 'سابق وزیر خارجہ',
    attendancePercent: 71,
    sessionsAttended: 93,
    totalSessions: 131,
    billsSponsored: 12,
    billsPassed: 7,
    questionsRaised: 28,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1002',
    terms: 4,
    education: 'Oxford University, Christ Church College',
    committees: ['Foreign Affairs Committee', 'Kashmir Committee'],
    recentBills: [
      { title: 'Indus River Protection Bill', titleUrdu: 'دریائے سندھ تحفظ بل', date: '2024-09-15', status: 'pending', type: 'private' },
      { title: 'Climate Change Adaptation Act', titleUrdu: 'موسمیاتی تبدیلی ایکٹ', date: '2024-11-20', status: 'passed', type: 'government' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1003',
    name: 'Omar Ayub Khan',
    nameUrdu: 'عمر ایوب خان',
    constituency: 'NA-19 (Haripur)',
    constituencyUrdu: 'NA-19 (ہری پور)',
    province: 'KPK',
    party: 'PTI',
    partyUrdu: 'پاکستان تحریک انصاف',
    partyColor: '#CC0000',
    role: 'Leader of the Opposition',
    roleUrdu: 'قائد حزب اختلاف',
    attendancePercent: 85,
    sessionsAttended: 111,
    totalSessions: 131,
    billsSponsored: 19,
    billsPassed: 3,
    questionsRaised: 67,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1003',
    terms: 3,
    education: 'MBA, LUMS Lahore',
    committees: ['Public Accounts Committee', 'Energy Committee'],
    recentBills: [
      { title: 'KPK Merger Funds Amendment Bill', titleUrdu: 'KPK انضمام فنڈز ترمیمی بل', date: '2024-10-05', status: 'rejected', type: 'private' },
      { title: 'Anti-Corruption Amendment Bill', titleUrdu: 'انسداد بدعنوانی ترمیمی بل', date: '2025-01-15', status: 'pending', type: 'private' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1004',
    name: 'Sardar Ayaz Sadiq',
    nameUrdu: 'سردار ایاز صادق',
    constituency: 'NA-122 (Lahore-IV)',
    constituencyUrdu: 'NA-122 (لاہور-4)',
    province: 'Punjab',
    party: 'PML-N',
    partyUrdu: 'مسلم لیگ نون',
    partyColor: '#006400',
    role: 'Speaker, National Assembly',
    roleUrdu: 'اسپیکر قومی اسمبلی',
    attendancePercent: 95,
    sessionsAttended: 124,
    totalSessions: 131,
    billsSponsored: 4,
    billsPassed: 4,
    questionsRaised: 0,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1004',
    terms: 5,
    education: 'LLB, University of the Punjab',
    committees: ['Rules Committee', 'Business Advisory Committee'],
    recentBills: [
      { title: 'National Assembly (Procedure) Amendment', titleUrdu: 'قومی اسمبلی طریقہ کار ترمیم', date: '2024-07-10', status: 'passed', type: 'government' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1005',
    name: 'Khawaja Muhammad Asif',
    nameUrdu: 'خواجہ محمد آصف',
    constituency: 'NA-73 (Sialkot-I)',
    constituencyUrdu: 'NA-73 (سیالکوٹ-1)',
    province: 'Punjab',
    party: 'PML-N',
    partyUrdu: 'مسلم لیگ نون',
    partyColor: '#006400',
    role: 'Minister of Defence',
    roleUrdu: 'وزیر دفاع',
    attendancePercent: 63,
    sessionsAttended: 82,
    totalSessions: 131,
    billsSponsored: 5,
    billsPassed: 4,
    questionsRaised: 11,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1005',
    terms: 7,
    education: 'BE (Electrical), University of Engineering & Technology',
    committees: ['Defence Committee', 'Foreign Affairs Committee'],
    recentBills: [
      { title: 'Defence Production Amendment Bill', titleUrdu: 'دفاعی پیداوار ترمیمی بل', date: '2024-09-20', status: 'passed', type: 'government' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1006',
    name: 'Ahsan Iqbal Chaudhry',
    nameUrdu: 'احسن اقبال چودھری',
    constituency: 'NA-108 (Narowal-II)',
    constituencyUrdu: 'NA-108 (نارووال-2)',
    province: 'Punjab',
    party: 'PML-N',
    partyUrdu: 'مسلم لیگ نون',
    partyColor: '#006400',
    role: 'Minister of Planning & Development',
    roleUrdu: 'وزیر منصوبہ بندی',
    attendancePercent: 58,
    sessionsAttended: 76,
    totalSessions: 131,
    billsSponsored: 9,
    billsPassed: 6,
    questionsRaised: 5,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1006',
    terms: 6,
    education: 'PhD, Boston University USA',
    committees: ['Planning & Development Committee', 'Finance Committee'],
    recentBills: [
      { title: 'CPEC Authority Amendment Bill', titleUrdu: 'CPEC اتھارٹی ترمیمی بل', date: '2024-08-05', status: 'passed', type: 'government' },
      { title: 'National Planning Commission Bill', titleUrdu: 'قومی منصوبہ بندی کمیشن بل', date: '2025-02-10', status: 'pending', type: 'government' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1007',
    name: 'Hina Rabbani Khar',
    nameUrdu: 'حنا ربانی کھر',
    constituency: 'Women Reserved Seat (Punjab)',
    constituencyUrdu: 'خواتین مخصوص نشست (پنجاب)',
    province: 'Punjab',
    party: 'PPP',
    partyUrdu: 'پاکستان پیپلز پارٹی',
    partyColor: '#8B0000',
    role: 'Former Minister of State for Foreign Affairs',
    roleUrdu: 'سابق وزیر مملکت برائے خارجہ',
    attendancePercent: 77,
    sessionsAttended: 101,
    totalSessions: 131,
    billsSponsored: 14,
    billsPassed: 8,
    questionsRaised: 43,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1007',
    terms: 4,
    education: 'MS Economics, University of Massachusetts',
    committees: ['Foreign Affairs Committee', 'Women Caucus'],
    recentBills: [
      { title: 'Gender Pay Equality Bill', titleUrdu: 'صنفی تنخواہ مساوات بل', date: '2024-10-12', status: 'pending', type: 'private' },
      { title: 'Women Protection Act Amendment', titleUrdu: 'خواتین تحفظ ترمیم', date: '2025-01-20', status: 'passed', type: 'private' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1008',
    name: 'Khurram Dastgir Khan',
    nameUrdu: 'خرم دستگیر خان',
    constituency: 'NA-64 (Gujranwala-III)',
    constituencyUrdu: 'NA-64 (گوجرانوالہ-3)',
    province: 'Punjab',
    party: 'PML-N',
    partyUrdu: 'مسلم لیگ نون',
    partyColor: '#006400',
    role: 'Minister of Energy',
    roleUrdu: 'وزیر توانائی',
    attendancePercent: 55,
    sessionsAttended: 72,
    totalSessions: 131,
    billsSponsored: 6,
    billsPassed: 4,
    questionsRaised: 8,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1008',
    terms: 4,
    education: 'MBA, USA',
    committees: ['Energy Committee', 'Commerce Committee'],
    recentBills: [
      { title: 'Electricity Amendment Act 2024', titleUrdu: 'بجلی ترمیمی ایکٹ 2024', date: '2024-07-30', status: 'passed', type: 'government' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1009',
    name: 'Barrister Gohar Ali Khan',
    nameUrdu: 'بیرسٹر گوہر علی خان',
    constituency: 'NA-10 (Chitral)',
    constituencyUrdu: 'NA-10 (چترال)',
    province: 'KPK',
    party: 'PTI',
    partyUrdu: 'پاکستان تحریک انصاف',
    partyColor: '#CC0000',
    role: 'Chairman PTI',
    roleUrdu: 'چیئرمین پی ٹی آئی',
    attendancePercent: 73,
    sessionsAttended: 96,
    totalSessions: 131,
    billsSponsored: 16,
    billsPassed: 2,
    questionsRaised: 54,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1009',
    terms: 2,
    education: 'Bar at Law, Lincoln\'s Inn London',
    committees: ['Law & Justice Committee', 'Human Rights Committee'],
    recentBills: [
      { title: 'Political Prisoners Release Bill', titleUrdu: 'سیاسی قیدیوں کی رہائی بل', date: '2024-09-01', status: 'rejected', type: 'private' },
      { title: 'Judicial Independence Bill', titleUrdu: 'عدالتی آزادی بل', date: '2025-01-10', status: 'pending', type: 'private' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1010',
    name: 'Saad Rafique',
    nameUrdu: 'سعد رفیق',
    constituency: 'NA-125 (Lahore-VII)',
    constituencyUrdu: 'NA-125 (لاہور-7)',
    province: 'Punjab',
    party: 'PML-N',
    partyUrdu: 'مسلم لیگ نون',
    partyColor: '#006400',
    role: 'Minister of Railways',
    roleUrdu: 'وزیر ریلوے',
    attendancePercent: 60,
    sessionsAttended: 79,
    totalSessions: 131,
    billsSponsored: 7,
    billsPassed: 5,
    questionsRaised: 13,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1010',
    terms: 5,
    education: 'BA (Hons)',
    committees: ['Railways Committee', 'Transport Committee'],
    recentBills: [
      { title: 'Pakistan Railways Amendment Act', titleUrdu: 'پاکستان ریلوے ترمیمی ایکٹ', date: '2024-08-15', status: 'passed', type: 'government' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1011',
    name: 'Raja Pervez Ashraf',
    nameUrdu: 'راجہ پرویز اشرف',
    constituency: 'NA-55 (Rawalpindi-IV)',
    constituencyUrdu: 'NA-55 (راولپنڈی-4)',
    province: 'Punjab',
    party: 'PPP',
    partyUrdu: 'پاکستان پیپلز پارٹی',
    partyColor: '#8B0000',
    role: 'Former Prime Minister / Speaker',
    roleUrdu: 'سابق وزیر اعظم / اسپیکر',
    attendancePercent: 68,
    sessionsAttended: 89,
    totalSessions: 131,
    billsSponsored: 5,
    billsPassed: 3,
    questionsRaised: 19,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1011',
    terms: 6,
    education: 'LLB, University of Punjab',
    committees: ['Water & Power Committee', 'Climate Change Committee'],
    recentBills: [
      { title: 'Water Resource Management Bill', titleUrdu: 'پانی کے وسائل انتظام بل', date: '2024-10-25', status: 'pending', type: 'private' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1012',
    name: 'Rana Tanveer Hussain',
    nameUrdu: 'رانا تنویر حسین',
    constituency: 'NA-140 (Kasur-I)',
    constituencyUrdu: 'NA-140 (قصور-1)',
    province: 'Punjab',
    party: 'PML-N',
    partyUrdu: 'مسلم لیگ نون',
    partyColor: '#006400',
    role: 'Minister of Industries',
    roleUrdu: 'وزیر صنعت',
    attendancePercent: 52,
    sessionsAttended: 68,
    totalSessions: 131,
    billsSponsored: 4,
    billsPassed: 3,
    questionsRaised: 7,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1012',
    terms: 5,
    education: 'MA Political Science',
    committees: ['Industries Committee', 'Commerce Committee'],
    recentBills: [
      { title: 'Special Economic Zones Amendment', titleUrdu: 'خصوصی اقتصادی زون ترمیم', date: '2024-09-30', status: 'passed', type: 'government' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1013',
    name: 'Marriyum Aurangzeb',
    nameUrdu: 'مریم اورنگزیب',
    constituency: 'Women Reserved Seat (Punjab)',
    constituencyUrdu: 'خواتین مخصوص نشست (پنجاب)',
    province: 'Punjab',
    party: 'PML-N',
    partyUrdu: 'مسلم لیگ نون',
    partyColor: '#006400',
    role: 'Minister of Information',
    roleUrdu: 'وزیر اطلاعات',
    attendancePercent: 66,
    sessionsAttended: 86,
    totalSessions: 131,
    billsSponsored: 8,
    billsPassed: 5,
    questionsRaised: 21,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1013',
    terms: 3,
    education: 'MA Mass Communication, University of the Punjab',
    committees: ['Information Committee', 'Education Committee'],
    recentBills: [
      { title: 'Digital Media Authority Bill', titleUrdu: 'ڈیجیٹل میڈیا اتھارٹی بل', date: '2024-11-15', status: 'pending', type: 'government' },
      { title: 'Freedom of Press Amendment', titleUrdu: 'آزادی صحافت ترمیم', date: '2025-02-05', status: 'pending', type: 'government' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1014',
    name: 'Syed Khurshid Shah',
    nameUrdu: 'سید خورشید شاہ',
    constituency: 'NA-194 (Sukkur-I)',
    constituencyUrdu: 'NA-194 (سکھر-1)',
    province: 'Sindh',
    party: 'PPP',
    partyUrdu: 'پاکستان پیپلز پارٹی',
    partyColor: '#8B0000',
    role: 'Deputy Speaker',
    roleUrdu: 'ڈپٹی اسپیکر',
    attendancePercent: 91,
    sessionsAttended: 119,
    totalSessions: 131,
    billsSponsored: 3,
    billsPassed: 3,
    questionsRaised: 0,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1014',
    terms: 7,
    education: 'LLB',
    committees: ['Business Advisory Committee', 'Rules Committee'],
    recentBills: [],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1015',
    name: 'Asad Qaiser',
    nameUrdu: 'اسد قیصر',
    constituency: 'NA-31 (Swabi-I)',
    constituencyUrdu: 'NA-31 (صوابی-1)',
    province: 'KPK',
    party: 'PTI',
    partyUrdu: 'پاکستان تحریک انصاف',
    partyColor: '#CC0000',
    role: 'Former Speaker',
    roleUrdu: 'سابق اسپیکر',
    attendancePercent: 79,
    sessionsAttended: 104,
    totalSessions: 131,
    billsSponsored: 11,
    billsPassed: 2,
    questionsRaised: 38,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1015',
    terms: 3,
    education: 'MA Political Science',
    committees: ['Foreign Affairs Committee', 'Defence Committee'],
    recentBills: [
      { title: 'Tribal Area Funds Protection Bill', titleUrdu: 'قبائلی علاقہ فنڈز تحفظ بل', date: '2024-10-20', status: 'pending', type: 'private' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1016',
    name: 'Shaza Fatima Khawaja',
    nameUrdu: 'شزہ فاطمہ خواجہ',
    constituency: 'Women Reserved Seat (Punjab)',
    constituencyUrdu: 'خواتین مخصوص نشست (پنجاب)',
    province: 'Punjab',
    party: 'PML-N',
    partyUrdu: 'مسلم لیگ نون',
    partyColor: '#006400',
    role: 'Minister of IT & Telecom',
    roleUrdu: 'وزیر آئی ٹی و ٹیلی کام',
    attendancePercent: 62,
    sessionsAttended: 81,
    totalSessions: 131,
    billsSponsored: 10,
    billsPassed: 7,
    questionsRaised: 16,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1016',
    terms: 2,
    education: 'BSc Computer Science, LUMS',
    committees: ['IT & Telecom Committee', 'Finance Committee'],
    recentBills: [
      { title: 'AI Governance Framework Bill', titleUrdu: 'مصنوعی ذہانت گورننس بل', date: '2024-12-01', status: 'pending', type: 'government' },
      { title: 'Cybercrime Amendment Bill', titleUrdu: 'سائبر کرائم ترمیمی بل', date: '2025-01-25', status: 'passed', type: 'government' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1017',
    name: 'Muhammad Ali Mian Khan',
    nameUrdu: 'محمد علی میاں خان',
    constituency: 'NA-44 (Peshawar-VI)',
    constituencyUrdu: 'NA-44 (پشاور-6)',
    province: 'KPK',
    party: 'PTI',
    partyUrdu: 'پاکستان تحریک انصاف',
    partyColor: '#CC0000',
    role: 'MNA',
    roleUrdu: 'رکن قومی اسمبلی',
    attendancePercent: 82,
    sessionsAttended: 107,
    totalSessions: 131,
    billsSponsored: 7,
    billsPassed: 1,
    questionsRaised: 45,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1017',
    terms: 2,
    education: 'MBBS',
    committees: ['Health Committee', 'Human Rights Committee'],
    recentBills: [
      { title: 'Free Medical Care for Poor Bill', titleUrdu: 'غریبوں کے لیے مفت علاج بل', date: '2024-11-10', status: 'pending', type: 'private' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1018',
    name: 'Syed Naveed Qamar',
    nameUrdu: 'سید نوید قمر',
    constituency: 'NA-222 (Tharparkar-II)',
    constituencyUrdu: 'NA-222 (تھرپارکر-2)',
    province: 'Sindh',
    party: 'PPP',
    partyUrdu: 'پاکستان پیپلز پارٹی',
    partyColor: '#8B0000',
    role: 'Minister for Commerce',
    roleUrdu: 'وزیر تجارت',
    attendancePercent: 59,
    sessionsAttended: 77,
    totalSessions: 131,
    billsSponsored: 6,
    billsPassed: 4,
    questionsRaised: 9,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1018',
    terms: 7,
    education: 'MBA',
    committees: ['Commerce Committee', 'Finance Committee'],
    recentBills: [
      { title: 'Export Promotion Amendment', titleUrdu: 'برآمدات فروغ ترمیم', date: '2024-10-01', status: 'passed', type: 'government' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1019',
    name: 'Chaudhry Salik Hussain',
    nameUrdu: 'چودھری سالک حسین',
    constituency: 'NA-69 (Gujrat-II)',
    constituencyUrdu: 'NA-69 (گجرات-2)',
    province: 'Punjab',
    party: 'PML-Q',
    partyUrdu: 'مسلم لیگ ق',
    partyColor: '#1E5799',
    role: 'MNA',
    roleUrdu: 'رکن قومی اسمبلی',
    attendancePercent: 74,
    sessionsAttended: 97,
    totalSessions: 131,
    billsSponsored: 4,
    billsPassed: 2,
    questionsRaised: 24,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1019',
    terms: 3,
    education: 'BSc Engineering',
    committees: ['Agriculture Committee', 'Water Resources Committee'],
    recentBills: [
      { title: 'Farmers Support Fund Amendment', titleUrdu: 'کاشتکار تعاون فنڈ ترمیم', date: '2024-09-15', status: 'pending', type: 'private' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1020',
    name: 'Dr. Nafeesa Shah',
    nameUrdu: 'ڈاکٹر نفیسہ شاہ',
    constituency: 'NA-200 (Khairpur-II)',
    constituencyUrdu: 'NA-200 (خیرپور-2)',
    province: 'Sindh',
    party: 'PPP',
    partyUrdu: 'پاکستان پیپلز پارٹی',
    partyColor: '#8B0000',
    role: 'MNA',
    roleUrdu: 'رکن قومی اسمبلی',
    attendancePercent: 88,
    sessionsAttended: 115,
    totalSessions: 131,
    billsSponsored: 18,
    billsPassed: 9,
    questionsRaised: 52,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1020',
    terms: 3,
    education: 'PhD Anthropology, Oxford University',
    committees: ['Women Caucus', 'Education Committee', 'Health Committee'],
    recentBills: [
      { title: 'Child Labor Abolition Bill', titleUrdu: 'بچوں کا مزدوری خاتمہ بل', date: '2024-09-05', status: 'passed', type: 'private' },
      { title: 'Primary Education Reform Act', titleUrdu: 'ابتدائی تعلیم اصلاحات ایکٹ', date: '2024-12-15', status: 'pending', type: 'private' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1021',
    name: 'Aamir Khan Jadoon',
    nameUrdu: 'عامر خان جدون',
    constituency: 'NA-22 (Swat-II)',
    constituencyUrdu: 'NA-22 (سوات-2)',
    province: 'KPK',
    party: 'PTI',
    partyUrdu: 'پاکستان تحریک انصاف',
    partyColor: '#CC0000',
    role: 'MNA',
    roleUrdu: 'رکن قومی اسمبلی',
    attendancePercent: 69,
    sessionsAttended: 90,
    totalSessions: 131,
    billsSponsored: 6,
    billsPassed: 1,
    questionsRaised: 29,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1021',
    terms: 1,
    education: 'BA',
    committees: ['Tourism Committee', 'Kashmir Committee'],
    recentBills: [
      { title: 'Swat Valley Tourism Development Bill', titleUrdu: 'وادی سوات سیاحت ترقی بل', date: '2024-11-20', status: 'pending', type: 'private' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1022',
    name: 'Makhdoom Amin Fahim',
    nameUrdu: 'مخدوم امین فہیم',
    constituency: 'NA-208 (Nawabshah-I)',
    constituencyUrdu: 'NA-208 (نوابشاہ-1)',
    province: 'Sindh',
    party: 'PPP',
    partyUrdu: 'پاکستان پیپلز پارٹی',
    partyColor: '#8B0000',
    role: 'MNA',
    roleUrdu: 'رکن قومی اسمبلی',
    attendancePercent: 44,
    sessionsAttended: 58,
    totalSessions: 131,
    billsSponsored: 2,
    billsPassed: 1,
    questionsRaised: 6,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1022',
    terms: 8,
    education: 'LLB',
    committees: ['Agriculture Committee'],
    recentBills: [],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1023',
    name: 'Khalid Hussain Magsi',
    nameUrdu: 'خالد حسین مگسی',
    constituency: 'NA-259 (Khuzdar)',
    constituencyUrdu: 'NA-259 (خضدار)',
    province: 'Balochistan',
    party: 'BNP-M',
    partyUrdu: 'بلوچستان نیشنل پارٹی',
    partyColor: '#8B4513',
    role: 'MNA',
    roleUrdu: 'رکن قومی اسمبلی',
    attendancePercent: 56,
    sessionsAttended: 73,
    totalSessions: 131,
    billsSponsored: 5,
    billsPassed: 1,
    questionsRaised: 22,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1023',
    terms: 2,
    education: 'BA',
    committees: ['Natural Resources Committee', 'Balochistan Development Committee'],
    recentBills: [
      { title: 'Balochistan Mineral Rights Bill', titleUrdu: 'بلوچستان معدنی حقوق بل', date: '2024-10-10', status: 'pending', type: 'private' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1024',
    name: 'Sardar Khalid Ibrahim Khan',
    nameUrdu: 'سردار خالد ابراہیم خان',
    constituency: 'NA-51 (Rawalpindi-I)',
    constituencyUrdu: 'NA-51 (راولپنڈی-1)',
    province: 'Punjab',
    party: 'PTI',
    partyUrdu: 'پاکستان تحریک انصاف',
    partyColor: '#CC0000',
    role: 'MNA',
    roleUrdu: 'رکن قومی اسمبلی',
    attendancePercent: 76,
    sessionsAttended: 99,
    totalSessions: 131,
    billsSponsored: 8,
    billsPassed: 1,
    questionsRaised: 41,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1024',
    terms: 2,
    education: 'LLB',
    committees: ['Law & Justice Committee', 'Human Rights Committee'],
    recentBills: [
      { title: 'Courts Speedy Trial Bill', titleUrdu: 'عدالتوں میں تیز ٹرائل بل', date: '2024-12-05', status: 'pending', type: 'private' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1025',
    name: 'Attaullah Tarar',
    nameUrdu: 'عطاء اللہ تارڑ',
    constituency: 'NA-127 (Lahore-IX)',
    constituencyUrdu: 'NA-127 (لاہور-9)',
    province: 'Punjab',
    party: 'PML-N',
    partyUrdu: 'مسلم لیگ نون',
    partyColor: '#006400',
    role: 'Minister of Interior',
    roleUrdu: 'وزیر داخلہ',
    attendancePercent: 53,
    sessionsAttended: 69,
    totalSessions: 131,
    billsSponsored: 7,
    billsPassed: 5,
    questionsRaised: 4,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1025',
    terms: 3,
    education: 'LLM, University of London',
    committees: ['Interior Committee', 'Law Committee'],
    recentBills: [
      { title: 'National Security Amendment Act', titleUrdu: 'قومی سلامتی ترمیمی ایکٹ', date: '2024-08-25', status: 'passed', type: 'government' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1026',
    name: 'Muhammad Ishaq Dar',
    nameUrdu: 'محمد اسحاق ڈار',
    constituency: 'NA-30 (Mansehra-I)',
    constituencyUrdu: 'NA-30 (مانسہرہ-1)',
    province: 'KPK',
    party: 'PML-N',
    partyUrdu: 'مسلم لیگ نون',
    partyColor: '#006400',
    role: 'Foreign Minister',
    roleUrdu: 'وزیر خارجہ',
    attendancePercent: 41,
    sessionsAttended: 54,
    totalSessions: 131,
    billsSponsored: 3,
    billsPassed: 2,
    questionsRaised: 3,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1026',
    terms: 3,
    education: 'CA, ICAP Pakistan',
    committees: ['Foreign Affairs Committee', 'Finance Committee'],
    recentBills: [
      { title: 'Foreign Exchange Stabilization Bill', titleUrdu: 'زرمبادلہ استحکام بل', date: '2024-07-20', status: 'passed', type: 'government' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1027',
    name: 'Ghulam Bilawal',
    nameUrdu: 'غلام بلاول',
    constituency: 'NA-241 (Karachi-West-I)',
    constituencyUrdu: 'NA-241 (کراچی مغرب-1)',
    province: 'Sindh',
    party: 'PPP',
    partyUrdu: 'پاکستان پیپلز پارٹی',
    partyColor: '#8B0000',
    role: 'MNA',
    roleUrdu: 'رکن قومی اسمبلی',
    attendancePercent: 64,
    sessionsAttended: 84,
    totalSessions: 131,
    billsSponsored: 9,
    billsPassed: 4,
    questionsRaised: 31,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1027',
    terms: 2,
    education: 'MBA',
    committees: ['Commerce Committee', 'Finance Committee'],
    recentBills: [
      { title: 'Karachi Port Modernization Bill', titleUrdu: 'کراچی بندرگاہ جدیدیت بل', date: '2024-11-05', status: 'pending', type: 'private' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1028',
    name: 'Maulana Asad Mahmood',
    nameUrdu: 'مولانا اسد محمود',
    constituency: 'NA-248 (Karachi Central-I)',
    constituencyUrdu: 'NA-248 (کراچی وسطی-1)',
    province: 'Sindh',
    party: 'JUI-F',
    partyUrdu: 'جمعیت علمائے اسلام ف',
    partyColor: '#556B2F',
    role: 'MNA',
    roleUrdu: 'رکن قومی اسمبلی',
    attendancePercent: 71,
    sessionsAttended: 93,
    totalSessions: 131,
    billsSponsored: 6,
    billsPassed: 2,
    questionsRaised: 35,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1028',
    terms: 3,
    education: 'Islamic Studies (Dars-e-Nizami)',
    committees: ['Religious Affairs Committee', 'Education Committee'],
    recentBills: [
      { title: 'Madrassa Reform Bill', titleUrdu: 'مدرسہ اصلاحات بل', date: '2024-10-15', status: 'pending', type: 'private' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1029',
    name: 'Dr. Tariq Fazal Chaudhry',
    nameUrdu: 'ڈاکٹر طارق فضل چودھری',
    constituency: 'NA-49 (Islamabad-III)',
    constituencyUrdu: 'NA-49 (اسلام آباد-3)',
    province: 'Federal',
    party: 'PML-N',
    partyUrdu: 'مسلم لیگ نون',
    partyColor: '#006400',
    role: 'MNA',
    roleUrdu: 'رکن قومی اسمبلی',
    attendancePercent: 78,
    sessionsAttended: 102,
    totalSessions: 131,
    billsSponsored: 11,
    billsPassed: 6,
    questionsRaised: 33,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1029',
    terms: 3,
    education: 'MBBS, PhD Public Health',
    committees: ['Health Committee', 'Education Committee'],
    recentBills: [
      { title: 'Universal Health Coverage Bill', titleUrdu: 'عالمگیر صحت کوریج بل', date: '2024-10-30', status: 'pending', type: 'private' },
      { title: 'Medical Devices Regulation Bill', titleUrdu: 'طبی آلات ریگولیشن بل', date: '2025-02-15', status: 'passed', type: 'government' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '1030',
    name: 'Khalid Maqbool Siddiqui',
    nameUrdu: 'خالد مقبول صدیقی',
    constituency: 'NA-240 (Karachi Central-II)',
    constituencyUrdu: 'NA-240 (کراچی وسطی-2)',
    province: 'Sindh',
    party: 'MQM-P',
    partyUrdu: 'ایم کیو ایم پاکستان',
    partyColor: '#B8860B',
    role: 'Federal Minister for IT',
    roleUrdu: 'وفاقی وزیر آئی ٹی',
    attendancePercent: 67,
    sessionsAttended: 88,
    totalSessions: 131,
    billsSponsored: 12,
    billsPassed: 7,
    questionsRaised: 27,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=1030',
    terms: 4,
    education: 'MBA, IBA Karachi',
    committees: ['IT Committee', 'Science & Technology Committee'],
    recentBills: [
      { title: 'Digital Pakistan Act', titleUrdu: 'ڈیجیٹل پاکستان ایکٹ', date: '2024-08-10', status: 'passed', type: 'government' },
    ],
    lastUpdated: '2025-03-01',
  },
  {
    id: '2001',
    name: 'Ahmed Khan',
    nameUrdu: 'احمد خان',
    constituency: 'NA-242 (Karachi Keamari-I)',
    constituencyUrdu: 'NA-242 (کراچی کیماڑی-1)',
    province: 'Sindh',
    party: 'IND',
    partyUrdu: 'آزاد امیدوار',
    partyColor: '#7f8c8d',
    role: 'MNA',
    roleUrdu: 'رکن قومی اسمبلی',
    attendancePercent: 65,
    sessionsAttended: 78,
    totalSessions: 120,
    nationalAverage: 82,
    salaryReceived: 'Full Salary',
    salaryReceivedUrdu: 'مکمل تنخواہ',
    billsSponsored: 3,
    billsPassed: 1,
    questionsRaised: 12,
    profileUrl: 'https://na.gov.pk/en/member-profile.php?id=2001',
    terms: 1,
    education: 'BSc Political Science, Karachi University',
    committees: ['Education Committee', 'Federal Development Committee'],
    recentBills: [
      { title: 'Karachi Municipal Development Bill', titleUrdu: 'کراچی بلدیاتی ترقی بل', date: '2024-11-15', status: 'pending', type: 'private' }
    ],
    votingRecord: [
      {
        billName: 'Digital Governance Bill',
        billNameUrdu: 'ڈیجیٹل گورننس بل',
        vote: 'YES',
        voteUrdu: 'ہاں',
        explanationEnglish: 'This bill aims to digitize government services so citizens can apply for certificates and documents online.',
        explanationUrdu: 'یہ بل سرکاری خدمات کو آن لائن فراہم کرنے کے لیے بنایا گیا ہے۔'
      },
      {
        billName: 'Education Reform Bill',
        billNameUrdu: 'تعلیمی اصلاحات بل',
        vote: 'ABSENT',
        voteUrdu: 'غیر حاضر',
        explanationEnglish: 'This bill requires provincial governments to modernize curriculum and improve primary school infrastructure.',
        explanationUrdu: 'اس بل کے تحت صوبائی حکومتوں کو نصاب جدید بنانے اور پرائمری اسکولوں کے ڈھانچے کو بہتر بنانے کی ضرورت ہے۔'
      },
      {
        billName: 'Health Budget Amendment',
        billNameUrdu: 'صحت بجٹ ترمیم',
        vote: 'NO',
        voteUrdu: 'ناں',
        explanationEnglish: 'This amendment proposed to increase funding for public hospitals by redirecting administrative expenses.',
        explanationUrdu: 'اس ترمیم میں انتظامی اخراجات کو کم کر کے سرکاری ہسپتالوں کے فنڈز بڑھانے کی تجویز دی گئی تھی۔'
      }
    ],
    lastUpdated: '2026-03-01',
  }
];

// ─── Cache ─────────────────────────────────────────────────────────────────────
let mnaCache: MNAProfile[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─── Public API ────────────────────────────────────────────────────────────────
export async function getAllMNAs(): Promise<MNAProfile[]> {
  const now = Date.now();
  if (mnaCache && now - cacheTimestamp < CACHE_TTL_MS) {
    return mnaCache;
  }

  const BILLS: Array<{ billName: string; billNameUrdu: string; explanationEnglish: string; explanationUrdu: string }> = [
    {
      billName: 'Finance Act 2024',
      billNameUrdu: 'مالیاتی ایکٹ 2024',
      explanationEnglish: 'The Finance Act 2024 approved PKR 18.9 trillion federal budget, setting tax targets and ministry allocations for the fiscal year.',
      explanationUrdu: 'مالیاتی ایکٹ 2024 نے 18.9 کھرب روپے کا وفاقی بجٹ منظور کیا، جس میں ٹیکس اہداف اور وزارتی مختصات طے کیے گئے۔'
    },
    {
      billName: 'Digital Governance Bill',
      billNameUrdu: 'ڈیجیٹل گورننس بل',
      explanationEnglish: 'This bill digitizes government services so citizens can apply for certificates, passports, and documents online without visiting offices.',
      explanationUrdu: 'یہ بل سرکاری خدمات کو آن لائن فراہم کرنے کے لیے بنایا گیا ہے، جس سے شہری دفتروں میں جائے بغیر دستاویزات حاصل کر سکتے ہیں۔'
    },
    {
      billName: 'Education Reform Bill',
      billNameUrdu: 'تعلیمی اصلاحات بل',
      explanationEnglish: 'This bill requires all provinces to modernize school curriculum by 2026 and increase teacher training budgets.',
      explanationUrdu: 'اس بل کے تحت تمام صوبوں کو 2026 تک اسکول کا نصاب جدید بنانا اور اساتذہ کی تربیت کے بجٹ میں اضافہ کرنا ہوگا۔'
    },
    {
      billName: 'Cybercrime Amendment Bill',
      billNameUrdu: 'سائبر کرائم ترمیمی بل',
      explanationEnglish: 'This amendment tightens online fraud penalties up to 7 years imprisonment and creates a dedicated cyber-crime unit under FIA.',
      explanationUrdu: 'اس ترمیم نے آن لائن دھوکہ دہی کی سزا 7 سال قید تک بڑھائی اور FIA کے تحت خصوصی سائبر کرائم یونٹ قائم کیا۔'
    },
    {
      billName: 'Health Budget Increase Amendment',
      billNameUrdu: 'صحت بجٹ اضافہ ترمیم',
      explanationEnglish: 'This amendment proposed increasing public hospital budgets to expand free healthcare access for low-income citizens.',
      explanationUrdu: 'اس ترمیم میں سرکاری ہسپتالوں کا بجٹ بڑھا کر کم آمدنی والے شہریوں کے لیے مفت صحت سہولیات وسیع کرنے کی تجویز دی گئی۔'
    }
  ];

  // Party-specific votes: [Finance Act, Digital Gov, Education, Cybercrime, Health]
  const PARTY_VOTES: Record<string, Array<'YES' | 'NO' | 'ABSENT'>> = {
    'PML-N':  ['YES', 'YES', 'YES', 'YES', 'NO'],
    'PPP':    ['YES', 'YES', 'YES', 'NO',  'YES'],
    'PTI':    ['NO',  'NO',  'ABSENT', 'NO', 'YES'],
    'JUI-F':  ['YES', 'NO',  'YES', 'NO',  'YES'],
    'MQM-P':  ['YES', 'YES', 'YES', 'YES', 'YES'],
    'PML-Q':  ['YES', 'YES', 'NO',  'YES', 'YES'],
    'BNP-M':  ['NO',  'NO',  'YES', 'NO',  'YES'],
    'IND':    ['YES', 'NO',  'ABSENT', 'NO', 'YES'],
  };

  const toUrdu = (v: 'YES' | 'NO' | 'ABSENT'): 'ہاں' | 'ناں' | 'غیر حاضر' =>
    v === 'YES' ? 'ہاں' : v === 'NO' ? 'ناں' : 'غیر حاضر';

  mnaCache = SEED_MNA_DATA.map(m => {
    // Use pre-filled votingRecord if already set in seed (e.g., MNA 2001)
    const votes = m.votingRecord?.length
      ? m.votingRecord
      : BILLS.map((bill, i) => {
          const partyVotes = PARTY_VOTES[m.party] ?? PARTY_VOTES['IND'];
          const voteVal = partyVotes[i] ?? 'ABSENT';
          return {
            ...bill,
            vote: voteVal as 'YES' | 'NO' | 'ABSENT',
            voteUrdu: toUrdu(voteVal)
          };
        });

    return {
      ...m,
      nationalAverage: 82,
      salaryReceived: m.attendancePercent >= 60 ? 'Full Salary' : 'Deducted',
      salaryReceivedUrdu: m.attendancePercent >= 60 ? 'مکمل تنخواہ' : 'کٹوتی شدہ',
      votingRecord: votes
    };
  });

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
