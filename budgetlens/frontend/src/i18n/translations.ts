// i18n translations
export const en = {
  appName: 'WakalaLens Pakistan',
  appSubtitle: 'AI-Powered Budget & Representative Explorer',
  nav: {
    dashboard: 'Dashboard',
    explorer: 'Ministry Explorer',
    compare: 'Compare Years',
    billSummarizer: 'Bill Summarizer',
  },
  hero: {
    totalBudget: 'Total Budget FY2025-26',
    vsLastYear: 'vs FY2024-25',
    topMinistries: 'Top Ministries',
    biggestChange: 'Biggest Change',
    increase: 'Increase',
    decrease: 'Decrease',
    pkrBillion: 'PKR Billion',
  },
  ministry: {
    explainBtn: 'Explain in Simple Words',
    explaining: 'Getting AI Explanation...',
    divisions: 'Divisions',
    allocated: 'Allocated',
    share: 'Share Insight',
    viewDetails: 'View Details',
  },
  compare: {
    title: 'Compare Budget Years',
    selectMinistry: 'Select a Ministry',
    fy2324: 'FY 2023-24',
    fy2425: 'FY 2024-25',
    fy2526: 'FY 2025-26 (Est.)',
    change: 'Change',
  },
  chat: {
    placeholder: "Ask budget or MNAs (e.g. 'sehat ka budget kitna hai', 'how much for education')",
    send: 'Send',
    title: 'Ask WakalaLens AI',
    poweredBy: 'Powered by Gemini AI',
  },
  loading: 'Loading budget data...',
  error: 'Failed to load data. Please try again.',
  billion: 'B',
  trillion: 'T',
  mna: {
    nationalAverage: 'National Average',
    salaryStatus: 'Salary Received',
    votingRecord: 'Voting Record',
    billExplanation: 'AI Bill Explanation',
    voteYes: 'YES',
    voteNo: 'NO',
    voteAbsent: 'ABSENT',
  }
} as const;

export const ur = {
  appName: 'وکالت لینس پاکستان',
  appSubtitle: 'AI سے چلنے والا بجٹ اور ایم این اے ایکسپلورر',
  nav: {
    dashboard: 'ڈیش بورڈ',
    explorer: 'وزارت ایکسپلورر',
    compare: 'سال موازنہ',
    billSummarizer: 'بل خلاصہ ساز',
  },
  hero: {
    totalBudget: 'کل بجٹ مالی سال 2025-26',
    vsLastYear: 'مالی سال 2024-25 کے مقابلے میں',
    topMinistries: 'سرفہرست وزارتیں',
    biggestChange: 'سب سے بڑی تبدیلی',
    increase: 'اضافہ',
    decrease: 'کمی',
    pkrBillion: 'ارب روپے',
  },
  ministry: {
    explainBtn: 'آسان الفاظ میں سمجھائیں',
    explaining: 'AI وضاحت حاصل ہو رہی ہے...',
    divisions: 'ڈویژن',
    allocated: 'مختص',
    share: 'شیئر کریں',
    viewDetails: 'تفصیل دیکھیں',
  },
  compare: {
    title: 'بجٹ سال موازنہ',
    selectMinistry: 'وزارت منتخب کریں',
    fy2324: 'مالی سال 2023-24',
    fy2425: 'مالی سال 2024-25',
    fy2526: 'مالی سال 2025-26',
    change: 'تبدیلی',
  },
  chat: {
    placeholder: 'بجٹ یا اراکین (مثلاً "taleem ka budget", "تعلیم کو کتنا ملا")',
    send: 'بھیجیں',
    title: 'وکالت لینس AI سے پوچھیں',
    poweredBy: 'Gemini AI کی مدد سے',
  },
  loading: 'بجٹ ڈیٹا لوڈ ہو رہا ہے...',
  error: 'ڈیٹا لوڈ نہیں ہوا۔ دوبارہ کوشش کریں۔',
  billion: 'ارب',
  trillion: 'کھرب',
  mna: {
    nationalAverage: 'قومی اوسط',
    salaryStatus: 'وصول شدہ تنخواہ',
    votingRecord: 'ووٹنگ ریکارڈ',
    billExplanation: 'بل کی اے آئی وضاحت',
    voteYes: 'ہاں',
    voteNo: 'ناں',
    voteAbsent: 'غیر حاضر',
  }
} as const;

// Use 'export type' for type aliases - required by verbatimModuleSyntax
export type Lang = 'en' | 'ur';

// Export a runtime value so ESM can resolve it
export const LANGS: string[] = ['en', 'ur'];

export interface Translations {
  appName: string;
  appSubtitle: string;
  nav: {
    dashboard: string;
    explorer: string;
    compare: string;
    billSummarizer: string;
  };
  hero: {
    totalBudget: string;
    vsLastYear: string;
    topMinistries: string;
    biggestChange: string;
    increase: string;
    decrease: string;
    pkrBillion: string;
  };
  ministry: {
    explainBtn: string;
    explaining: string;
    divisions: string;
    allocated: string;
    share: string;
    viewDetails: string;
  };
  compare: {
    title: string;
    selectMinistry: string;
    fy2324: string;
    fy2425: string;
    fy2526: string;
    change: string;
  };
  chat: {
    placeholder: string;
    send: string;
    title: string;
    poweredBy: string;
  };
  loading: string;
  error: string;
  billion: string;
  trillion: string;
  mna: {
    nationalAverage: string;
    salaryStatus: string;
    votingRecord: string;
    billExplanation: string;
    voteYes: string;
    voteNo: string;
    voteAbsent: string;
  };
}
