import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { loadBudgetData } from '../lib/dataLoader';
import * as pdfParse from 'pdf-parse';

const router = Router();

// ── AI provider helpers ───────────────────────────────────────────────────────

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return new GoogleGenerativeAI(apiKey);
}

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error('GROQ_API_KEY not configured');
  }
  return new Groq({ apiKey });
}

/**
 * Try Gemini → fall back to Groq → throw if both fail.
 * Returns { text, provider } so callers know which succeeded.
 */
async function generateText(prompt: string): Promise<{ text: string; provider: 'gemini' | 'groq' }> {
  // ── 1. Try Gemini ────────────────────────────────────────────────────────
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    return { text: result.response.text(), provider: 'gemini' };
  } catch (geminiErr: any) {
    console.warn('⚠️  Gemini failed, trying Groq:', geminiErr.message);
  }

  // ── 2. Try Groq ──────────────────────────────────────────────────────────
  try {
    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.7,
    });
    const text = completion.choices[0]?.message?.content || '';
    return { text, provider: 'groq' };
  } catch (groqErr: any) {
    console.warn('⚠️  Groq also failed:', groqErr.message);
    throw new Error(`Both Gemini and Groq failed. Gemini: ${(groqErr as any)?.message}`);
  }
}

/**
 * Multi-turn chat: Gemini first, then Groq (which doesn't support multi-turn
 * natively so we flatten history into a single prompt).
 */
async function chatText(
  systemPrompt: string,
  history: Array<{ role: string; text: string }>,
  userMessage: string
): Promise<{ text: string; provider: 'gemini' | 'groq' }> {
  // ── 1. Try Gemini ────────────────────────────────────────────────────────
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const conversationHistory = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'I understand. I am BudgetLens AI, ready to help Pakistani citizens understand the federal budget. I will always cite Finance Division, GoP as the source for budget figures.' }] },
        ...conversationHistory,
      ],
    });
    const result = await chat.sendMessage(userMessage);
    return { text: result.response.text(), provider: 'gemini' };
  } catch (geminiErr: any) {
    console.warn('⚠️  Gemini chat failed, trying Groq:', geminiErr.message);
  }

  // ── 2. Try Groq (flatten to single prompt) ───────────────────────────────
  try {
    const groq = getGroq();
    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({
        role: (h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: h.text,
      })),
      { role: 'user', content: userMessage },
    ];
    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });
    const text = completion.choices[0]?.message?.content || '';
    return { text, provider: 'groq' };
  } catch (groqErr: any) {
    console.warn('⚠️  Groq chat also failed:', groqErr.message);
    throw new Error('Both Gemini and Groq failed for chat');
  }
}

// ── POST /api/ai/explain ──────────────────────────────────────────────────────
router.post('/explain', async (req: Request, res: Response) => {
  try {
    const { ministry, budget, year } = req.body as { ministry: string; budget: number; year: string };

    if (!ministry) {
      return res.status(400).json({ error: 'ministry is required' });
    }

    const prompt = `Explain what the "${ministry}" does and what a PKR ${budget} billion budget allocation in ${year || "Pakistan's federal budget"} means for ordinary Pakistani citizens. Answer in exactly 3 sentences in English, then provide the same 3-sentence explanation in Urdu (Roman Urdu or Nastaliq script). Be specific and relatable with real-world examples.`;

    const getMockResponse = () => ({
      english: `The ${ministry} is a key government department responsible for managing important national affairs. With PKR ${budget} billion allocated, this ministry can fund critical public services and infrastructure projects. This investment directly impacts the daily lives of millions of Pakistani citizens through improved services and facilities.`,
      urdu: `${ministry} ایک اہم سرکاری محکمہ ہے جو قومی امور کا انتظام کرتا ہے۔ PKR ${budget} ارب کی رقم سے یہ وزارت اہم عوامی خدمات اور بنیادی ڈھانچہ منصوبوں کو فنڈ کر سکتی ہے۔ یہ سرمایہ کاری پاکستان کے لاکھوں شہریوں کی روزمرہ زندگی پر براہ راست اثر ڈالتی ہے۔`,
      mock: true,
    });

    try {
      const { text } = await generateText(prompt);
      const parts = text.split(/(?=[\u0600-\u06FF]|اردو:|Urdu:|---)/i);
      const english = parts[0]?.trim() || text;
      const urdu = parts[1]?.trim() || '';
      return res.json({ english, urdu, full: text });
    } catch (err: any) {
      console.warn('AI explain: both providers failed, using mock:', err.message);
      return res.json(getMockResponse());
    }
  } catch (err: any) {
    console.error('AI explain controller error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body as { message: string; history?: Array<{ role: string; text: string }> };

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const data = await loadBudgetData();

    // ── Helper: find ministry total by keyword ────────────────────────────
    const findMinistry = (keyword: string) =>
      data.fy2526.find(m => m.ministry.toLowerCase().includes(keyword));

    const formatBn = (n: number) => `PKR ${n.toFixed(1)} billion (PKR ${(n / 1000).toFixed(2)} trillion)`;

    const changeVs2425 = (name: string) => {
      const curr = data.fy2526.find(m => m.ministry.toLowerCase().includes(name));
      const prev = data.fy2425.find(m => m.ministry.toLowerCase().includes(name));
      if (!curr || !prev || prev.total === 0) return null;
      const pct = ((curr.total - prev.total) / prev.total * 100).toFixed(1);
      return { curr: curr.total, prev: prev.total, pct, dir: Number(pct) >= 0 ? '▲' : '▼' };
    };

    // ── Intent: Total budget / overview ──────────────────────────────────
    if (/total budget|overall budget|kitna hai|total baj|کل بجٹ|مجموعی بجٹ|how much is.+budget/i.test(message)) {
      const total2526 = data.fy2526.reduce((s, m) => s + m.total, 0);
      const total2425 = data.fy2425.reduce((s, m) => s + m.total, 0);
      const pct = ((total2526 - total2425) / total2425 * 100).toFixed(1);
      return res.json({
        response: `**Pakistan FY2025-26 Federal Budget: ${formatBn(total2526)}**\n\nCompared to FY2024-25 (PKR ${total2425.toFixed(1)}B), that's a **${pct}%** ${Number(pct) >= 0 ? 'increase' : 'decrease'}.\n\n**Top 3 allocations:**\n${data.fy2526.slice(0, 3).map((m, i) => `${i + 1}. ${m.ministry}: PKR ${m.total.toFixed(1)}B`).join('\n')}\n\n---\n\n**پاکستان مالی سال 2025-26 وفاقی بجٹ:** ${(total2526 / 1000).toFixed(2)} کھرب روپے\n\nسرفہرست 3 مختصات: ${data.fy2526.slice(0, 3).map(m => `${m.ministry}: ${m.total.toFixed(1)} ارب روپے`).join('، ')}\n\n**ماخذ: وزارت خزانہ، حکومت پاکستان**`
      });
    }

    // ── Intent: Education ────────────────────────────────────────────────
    if (/education|taleem|تعلیم|hec|higher education|school|university/i.test(message)) {
      const edu = findMinistry('education');
      const chg = changeVs2425('education');
      return res.json({
        response: `**Education Budget FY2025-26:**\n${edu ? formatBn(edu.total) : 'PKR 212 billion'}\n${chg ? `\n**Change from FY2024-25:** ${chg.dir} ${chg.pct}% (was PKR ${chg.prev.toFixed(1)}B)` : ''}\n\nKey divisions: Higher Education Commission (HEC), Federal Directorate of Education (FDE), and vocational training institutes.\n\n**Source: Finance Division, GoP — finance.gov.pk**\n\n---\n\n**تعلیمی بجٹ 2025-26:** ${edu ? `${edu.total.toFixed(1)} ارب روپے` : '212 ارب روپے'}\n${chg ? `گذشتہ سال سے ${chg.dir} ${chg.pct}%` : ''}\n\nاعلیٰ تعلیمی کمیشن، وفاقی تعلیمی ڈائریکٹریٹ اور ووکیشنل ادارے اس بجٹ سے مستفید ہوں گے۔`
      });
    }

    // ── Intent: Health ────────────────────────────────────────────────────
    if (/health|sehat|صحت|hospital|nhsrc|seha|medical/i.test(message)) {
      const health = findMinistry('health');
      const chg = changeVs2425('health');
      return res.json({
        response: `**Health Budget FY2025-26:**\n${health ? formatBn(health.total) : 'PKR 96 billion'}\n${chg ? `\n**Change from FY2024-25:** ${chg.dir} ${chg.pct}%` : ''}\n\nCovers: National Health Services, NHSRC, Pakistan Institute of Medical Sciences (PIMS), and federal hospital administration.\n\n**Source: Finance Division, GoP — finance.gov.pk**\n\n---\n\n**صحت بجٹ 2025-26:** ${health ? `${health.total.toFixed(1)} ارب روپے` : '96 ارب روپے'}\n\nقومی صحت سروسز، NHSRC اور وفاقی ہسپتال اس بجٹ سے فنڈ حاصل کریں گے۔`
      });
    }

    // ── Intent: Defence ───────────────────────────────────────────────────
    if (/defence|defense|defa|فوج|دفاع|military|army|armed forces/i.test(message)) {
      const def = findMinistry('defence');
      const chg = changeVs2425('defence');
      return res.json({
        response: `**Defence Budget FY2025-26:**\n${def ? formatBn(def.total) : 'PKR 2,414 billion'}\n${chg ? `\n**Change from FY2024-25:** ${chg.dir} ${chg.pct}%` : ''}\n\nIncludes Pakistan Army, Navy, Air Force, and defence production. Pakistan's defence spending is ~${def ? ((def.total / data.fy2526.reduce((s, m) => s + m.total, 0)) * 100).toFixed(1) : '13'}% of total budget.\n\n**Source: Finance Division, GoP**\n\n---\n\n**دفاعی بجٹ 2025-26:** ${def ? `${def.total.toFixed(1)} ارب روپے` : '2,414 ارب روپے'}\n\nپاک فوج، بحریہ، فضائیہ اور دفاعی پیداوار کا مجموعی بجٹ۔`
      });
    }

    // ── Intent: Karachi ───────────────────────────────────────────────────
    if (/karachi|کراچی/i.test(message)) {
      return res.json({
        response: `**Karachi Development (FY2025-26 PSDP allocations):**\n• **Roads & highways (NHA):** PKR 18 billion\n• **Water supply projects (CDA/K-W&S):** PKR 12 billion\n• **Urban transport & metro:** PKR 15 billion\n• **Karachi Circular Railway (KCR) revival:** PKR 8 billion\n\n**Total estimated Karachi share: ~PKR 53 billion**\n\nNote: Federal PSDP allocations for Sindh (Karachi's province) total PKR 140+ billion in FY2025-26.\n\n**Source: Planning Division, GoP — pc.gov.pk**\n\n---\n\n**کراچی ترقیاتی بجٹ (PSDP 2025-26):**\n• سڑکیں: 18 ارب\n• پانی: 12 ارب\n• ٹرانسپورٹ: 15 ارب\n• کراچی سرکلر ریلوے: 8 ارب\n\nکراچی کا تخمینی حصہ: 53+ ارب روپے`
      });
    }

    // ── Intent: NFC / Provinces ───────────────────────────────────────────
    if (/nfc|province|صوبہ|صوبوں|transfer|punj|sindh|baloch|kpk/i.test(message)) {
      const nfc = findMinistry('provinces') ?? findMinistry('transfer') ?? findMinistry('nfc');
      return res.json({
        response: `**NFC / Provincial Transfers FY2025-26:**\n${nfc ? formatBn(nfc.total) : 'PKR 7,438 billion'}\n\nUnder the 7th NFC Award, provinces receive ~57.5% of the federal divisible pool. Punjab gets ~51.7%, Sindh ~24.6%, KPK ~14.6%, Balochistan ~9.1%.\n\n**Source: Finance Division, GoP**\n\n---\n\n**این ایف سی/ صوبائی منتقلی 2025-26:** ${nfc ? `${nfc.total.toFixed(1)} ارب روپے` : '7,438 ارب روپے'}\n\n7ویں این ایف سی ایوارڈ کے تحت: پنجاب 51.7%، سندھ 24.6%، کے پی کے 14.6%، بلوچستان 9.1%`
      });
    }

    // ── Intent: PSDP ─────────────────────────────────────────────────────
    if (/psdp|development|infrastructure|ترقی|بنیادی ڈھانچہ|منصوبے/i.test(message)) {
      const psdp = findMinistry('planning') ?? findMinistry('psdp');
      return res.json({
        response: `**PSDP (Development Budget) FY2025-26:**\n${psdp ? formatBn(psdp.total) : 'PKR 1,050 billion'}\n\nThe Public Sector Development Programme funds roads, dams, power projects, hospitals, and schools across Pakistan. Key projects include Diamer Bhasha Dam, ML-1 Railway, and various motorway extensions.\n\n**Source: Planning Division, GoP — pc.gov.pk**\n\n---\n\n**پی ایس ڈی پی (ترقیاتی بجٹ) 2025-26:** ${psdp ? `${psdp.total.toFixed(1)} ارب روپے` : '1,050 ارب روپے'}\n\nاس فنڈ سے سڑکیں، بند، بجلی منصوبے، ہسپتال اور اسکول تعمیر کیے جاتے ہیں۔`
      });
    }

    // ── Intent: Debt servicing ────────────────────────────────────────────
    if (/debt|qarz|قرض|interest|markup|سود/i.test(message)) {
      const debt = findMinistry('debt');
      return res.json({
        response: `**Debt Servicing FY2025-26:**\n${debt ? formatBn(debt.total) : 'PKR 9,775 billion'}\n\nThis is Pakistan's single largest budget item — interest payments on domestic and foreign debt. It represents ~${debt ? ((debt.total / data.fy2526.reduce((s, m) => s + m.total, 0)) * 100).toFixed(0) : '52'}% of total federal expenditure.\n\n**Source: Finance Division, GoP**\n\n---\n\n**قرض کی ادائیگی 2025-26:** ${debt ? `${debt.total.toFixed(1)} ارب روپے` : '9,775 ارب روپے'}\n\nیہ پاکستان کا سب سے بڑا بجٹ مد ہے — ملکی و غیرملکی قرض پر سود کی ادائیگی۔`
      });
    }

    // ── Intent: Year comparison ───────────────────────────────────────────
    if (/compare|comparison|vs|versus|muqabla|موازنہ|2324|2425|2526|fy23|fy24|fy25/i.test(message)) {
      const t2324 = data.fy2324.reduce((s, m) => s + m.total, 0);
      const t2425 = data.fy2425.reduce((s, m) => s + m.total, 0);
      const t2526 = data.fy2526.reduce((s, m) => s + m.total, 0);
      return res.json({
        response: `**3-Year Budget Comparison:**\n\n| Year | Total Budget |\n|------|-------------|\n| FY2023-24 | PKR ${t2324.toFixed(0)}B |\n| FY2024-25 | PKR ${t2425.toFixed(0)}B |\n| FY2025-26 | PKR ${t2526.toFixed(0)}B |\n\nGrowth FY24→25: ${((t2425 - t2324) / t2324 * 100).toFixed(1)}%\nGrowth FY25→26: ${((t2526 - t2425) / t2425 * 100).toFixed(1)}%\n\n**Source: Finance Division, GoP — finance.gov.pk**\n\n---\n\n**تین سالہ بجٹ موازنہ:**\n2023-24: ${t2324.toFixed(0)} ارب | 2024-25: ${t2425.toFixed(0)} ارب | 2025-26: ${t2526.toFixed(0)} ارب روپے`
      });
    }

    // ── Build full budget context for AI ─────────────────────────────────
    const budgetContext = data.fy2526
      .slice(0, 20)
      .map(m => `${m.ministry}: PKR ${m.total.toFixed(1)} billion`)
      .join('\n');

    const systemPrompt = `You are BudgetLens AI, a helpful assistant for Pakistan's federal budget. You explain budget data to ordinary Pakistani citizens in simple language. You can answer in both English and Urdu (Roman Urdu or Nastaliq). Be friendly, informative, and use relatable examples.

Here is Pakistan's FY2025-26 Federal Budget data (top ministries by allocation, Source: Finance Division GoP):
${budgetContext}

Total Budget FY2025-26: ~PKR ${Math.round(data.fy2526.reduce((s, m) => s + m.total, 0))} billion
Total Budget FY2024-25: ~PKR ${Math.round(data.fy2425.reduce((s, m) => s + m.total, 0))} billion
Total Budget FY2023-24: ~PKR ${Math.round(data.fy2324.reduce((s, m) => s + m.total, 0))} billion

Answer the user's question based on this data. Always cite "Source: Finance Division, GoP" when sharing budget figures. If they ask in Urdu or Roman Urdu, reply in both Urdu and English.`;

    const getMockResponse = () => ({
      response: `میں آپ کی بات سمجھ گیا! (I understand your question about: "${message}") 

Based on available real budget data (Source: Finance Division, GoP):
• FY2025-26 total budget: PKR ${Math.round(data.fy2526.reduce((s, m) => s + m.total, 0))} billion
• Education: PKR ${data.fy2526.find(m => m.ministry.toLowerCase().includes('education'))?.total?.toFixed(1) ?? '212'} billion
• Defence: PKR ${data.fy2526.find(m => m.ministry.toLowerCase().includes('defence'))?.total?.toFixed(1) ?? '2414'} billion

To enable richer AI responses, configure GEMINI_API_KEY or GROQ_API_KEY in backend/.env`,
      mock: true,
    });

    try {
      const { text } = await chatText(systemPrompt, history || [], message);
      return res.json({ response: text });
    } catch (err: any) {
      console.warn('AI chat: both providers failed, using mock:', err.message);
      return res.json(getMockResponse());
    }
  } catch (err: any) {
    console.error('AI chat controller error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/rate-mna ─────────────────────────────────────────────────────
router.post('/rate-mna', async (req: Request, res: Response) => {
  try {
    const {
      mnaName, mnaNameUrdu, constituency, party, attendancePercent,
      sessionsAttended, totalSessions, billsSponsored, billsPassed,
      questionsRaised, role, terms
    } = req.body as {
      mnaName: string; mnaNameUrdu?: string; constituency?: string;
      party?: string; attendancePercent: number;
      sessionsAttended?: number; totalSessions?: number;
      billsSponsored?: number; billsPassed?: number;
      questionsRaised?: number; role?: string; terms?: number;
    };

    if (!mnaName || attendancePercent === undefined) {
      return res.status(400).json({ error: 'mnaName and attendancePercent are required' });
    }

    const prompt = `You are a civic accountability analyst for Pakistan's National Assembly. Rate the parliamentary performance of the following MNA based on their public record data:

Name: ${mnaName} (${mnaNameUrdu || ''})
Constituency: ${constituency || 'N/A'}
Party: ${party || 'N/A'}
Role: ${role || 'MNA'}
Terms Served: ${terms || 'N/A'}
Attendance: ${attendancePercent}% (${sessionsAttended || '?'}/${totalSessions || '?'} sessions)
Bills Sponsored: ${billsSponsored || 0}
Bills Passed: ${billsPassed || 0}
Questions Raised in Assembly: ${questionsRaised || 0}

Please provide:
1. A performance GRADE (A+, A, B+, B, C+, C, D, F)
2. A 3-sentence English assessment explaining the grade
3. The same 3-sentence assessment in Urdu (Nastaliq script)
4. 2 STRENGTHS and 2 WEAKNESSES as bullet points
5. One concrete recommendation for improvement in plain language

Format your response EXACTLY as:
GRADE: [letter]
ENGLISH: [3 sentences]
URDU: [3 sentences in Urdu]
STRENGTHS:
• [strength 1]
• [strength 2]
WEAKNESSES:
• [weakness 1]
• [weakness 2]
RECOMMENDATION: [one sentence]`;

    const getMockResponse = () => {
      const grade = attendancePercent >= 80 ? 'A' : attendancePercent >= 65 ? 'B' : attendancePercent >= 50 ? 'C' : 'D';
      return {
        grade,
        english: `${mnaName} has an attendance record of ${attendancePercent}%, which is ${attendancePercent >= 70 ? 'above' : 'below'} the assembly average. With ${billsSponsored || 0} bills sponsored and ${questionsRaised || 0} questions raised, their legislative engagement ${(questionsRaised || 0) > 20 ? 'demonstrates active participation' : 'shows room for improvement'}. Overall, their performance ${attendancePercent >= 65 ? 'represents a reasonable level of public service' : "falls short of citizens' expectations for their elected representative"}.`,
        urdu: `${mnaName} کی حاضری ${attendancePercent}% ہے، جو اسمبلی اوسط سے ${attendancePercent >= 70 ? 'زیادہ' : 'کم'} ہے۔ ${billsSponsored || 0} بل پیش کیے اور ${questionsRaised || 0} سوالات اٹھائے، ان کی قانون سازی ${(questionsRaised || 0) > 20 ? 'سرگرم شرکت ظاہر کرتی ہے' : 'میں بہتری کی گنجائش ہے'}۔ مجموعی طور پر ان کی کارکردگی ${attendancePercent >= 65 ? 'قابل قبول سطح کی عوامی خدمت کی نمائندگی کرتی ہے' : 'عوام کی توقعات پر پوری نہیں اترتی'}.`,
        strengths: attendancePercent >= 70 ? ['Regular assembly attendance', 'Active in legislative process'] : ['Has prior legislative experience', 'Constituency representation'],
        weaknesses: attendancePercent < 70 ? ['Below-average attendance record', 'Limited bill sponsorship'] : ['Could raise more questions', 'Bill pass rate needs improvement'],
        recommendation: `Focus on ${attendancePercent < 70 ? 'improving attendance and' : 'sponsoring more'} legislative bills that directly benefit constituents in ${constituency || 'their constituency'}.`,
        mock: true,
      };
    };

    try {
      const { text } = await generateText(prompt);

      const gradeMatch = text.match(/GRADE:\s*([A-F][+\-]?)/i);
      const englishMatch = text.match(/ENGLISH:\s*([\s\S]*?)(?=URDU:|$)/i);
      const urduMatch = text.match(/URDU:\s*([\s\S]*?)(?=STRENGTHS:|$)/i);
      const strengthsMatch = text.match(/STRENGTHS:\s*([\s\S]*?)(?=WEAKNESSES:|$)/i);
      const weaknessesMatch = text.match(/WEAKNESSES:\s*([\s\S]*?)(?=RECOMMENDATION:|$)/i);
      const recMatch = text.match(/RECOMMENDATION:\s*([\s\S]*?)$/i);

      const parsePoints = (txt: string | undefined) =>
        (txt || '').split('\n')
          .filter(l => l.trim().startsWith('•') || l.trim().startsWith('-'))
          .map(l => l.replace(/^[•\-]\s*/, '').trim())
          .filter(Boolean)
          .slice(0, 2);

      const strengths = parsePoints(strengthsMatch?.[1]);
      const weaknesses = parsePoints(weaknessesMatch?.[1]);

      return res.json({
        grade: gradeMatch?.[1]?.trim() || 'C',
        english: englishMatch?.[1]?.trim() || text.slice(0, 300),
        urdu: urduMatch?.[1]?.trim() || '',
        strengths: strengths.length === 2 ? strengths : getMockResponse().strengths,
        weaknesses: weaknesses.length === 2 ? weaknesses : getMockResponse().weaknesses,
        recommendation: recMatch?.[1]?.trim() || getMockResponse().recommendation,
        full: text,
      });
    } catch (err: any) {
      console.warn('AI rate-mna: both providers failed, using mock:', err.message);
      return res.json(getMockResponse());
    }
  } catch (err: any) {
    console.error('AI rate-mna controller error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/summarize-bill ───────────────────────────────────────────────
router.post('/summarize-bill', async (req: Request, res: Response) => {
  try {
    const { fileBase64 } = req.body as { fileBase64: string };
    if (!fileBase64) {
      return res.status(400).json({ error: 'fileBase64 is required' });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    const parse = (pdfParse as any).default || pdfParse;
    const data = await parse(buffer);
    const text = data.text;

    const prompt = `You are a parliamentary analyst. Summarize the following National Assembly bill PDF text in exactly 3 simple sentences in English, then provide the same 3-sentence summary in Urdu (Roman Urdu or Nastaliq script). Be clear and explain the practical impact of the bill on ordinary Pakistani citizens.

Bill text:
${text.slice(0, 8000)}`;

    try {
      const { text: resText } = await generateText(prompt);
      const parts = resText.split(/(?=[\u0600-\u06FF]|اردو:|Urdu:|---)/i);
      const english = parts[0]?.trim() || resText;
      const urdu = parts[1]?.trim() || '';
      return res.json({ english, urdu, full: resText });
    } catch (err: any) {
      console.warn('AI bill summary: both providers failed, using mock:', err.message);
      return res.json({
        english: 'This bill proposes to establish a national framework for public service digitalization and governance improvements. It outlines key regulations to protect citizen privacy while enabling online access to government services. This will reduce administrative delays and make document applications easier for the public.',
        urdu: 'یہ بل سرکاری خدمات کو آن لائن فراہم کرنے کے لیے بنایا گیا ہے۔ اس کا مقصد شہریوں کے لیے شناختی دستاویزات اور سرٹیفکیٹ آن لائن حاصل کرنے کے طریقہ کار کو آسان بنانا ہے۔ یہ بل سرکاری دفاتر کے چکروں اور طویل تاخیر کو ختم کرنے میں مددگار ثابت ہوگا۔',
        mock: true,
      });
    }
  } catch (err: any) {
    console.error('Bill summarize error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
