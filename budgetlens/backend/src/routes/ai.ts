import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { loadBudgetData } from '../lib/dataLoader';
import * as pdfParse from 'pdf-parse';

const router = Router();

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return new GoogleGenerativeAI(apiKey);
}

// POST /api/ai/explain
router.post('/explain', async (req: Request, res: Response) => {
  try {
    const { ministry, budget, year } = req.body as { ministry: string; budget: number; year: string };

    if (!ministry) {
      return res.status(400).json({ error: 'ministry is required' });
    }

    const prompt = `Explain what the "${ministry}" does and what a PKR ${budget} billion budget allocation in ${year || 'Pakistan\'s federal budget'} means for ordinary Pakistani citizens. Answer in exactly 3 sentences in English, then provide the same 3-sentence explanation in Urdu (Roman Urdu or Nastaliq script). Be specific and relatable with real-world examples.`;

    const getMockResponse = () => ({
      english: `The ${ministry} is a key government department responsible for managing important national affairs. With PKR ${budget} billion allocated, this ministry can fund critical public services and infrastructure projects. This investment directly impacts the daily lives of millions of Pakistani citizens through improved services and facilities.`,
      urdu: `${ministry} ایک اہم سرکاری محکمہ ہے جو قومی امور کا انتظام کرتا ہے۔ PKR ${budget} ارب کی رقم سے یہ وزارت اہم عوامی خدمات اور بنیادی ڈھانچہ منصوبوں کو فنڈ کر سکتی ہے۔ یہ سرمایہ کاری پاکستان کے لاکھوں شہریوں کی روزمرہ زندگی پر براہ راست اثر ڈالتی ہے۔`,
      mock: true,
    });

    try {
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Split English and Urdu portions
      const parts = text.split(/(?=[\u0600-\u06FF]|اردو:|Urdu:|---)/i);
      const english = parts[0]?.trim() || text;
      const urdu = parts[1]?.trim() || '';

      return res.json({ english, urdu, full: text });
    } catch (err: any) {
      console.warn('AI explain failed, falling back to mock:', err.message);
      return res.json(getMockResponse());
    }
  } catch (err: any) {
    console.error('AI explain controller error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/chat
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body as { message: string; history?: Array<{ role: string; text: string }> };

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const userMsg = message.toLowerCase().trim();
    if (userMsg.includes('education') || userMsg.includes('تعلیم')) {
      return res.json({
        response: `**Education Budget:**\nPKR 315 Billion\n\n**Increase:**\n+12% from last year\n\n---\n\n**تعلیمی بجٹ:**\n315 ارب روپے\n\n**اضافہ:**\nگزشتہ سال سے +12%`,
        mock: true
      });
    }

    if (userMsg.includes('karachi') || userMsg.includes('کراچی')) {
      return res.json({
        response: `**Karachi Development:**\nPKR 45 Billion\n\n• **Roads:** PKR 18 Billion\n• **Water Projects:** PKR 12 Billion\n• **Transport:** PKR 15 Billion\n\n---\n\n**کراچی ترقیاتی بجٹ:**\n45 ارب روپے\n\n• **سڑکیں:** 18 ارب روپے\n• **پانی کے منصوبے:** 12 ارب روپے\n• **ٹرانسپورٹ:** 15 ارب روپے`,
        mock: true
      });
    }

    // Build budget context
    const data = await loadBudgetData();
    const budgetContext = data.fy2526
      .slice(0, 20)
      .map(m => `${m.ministry}: PKR ${m.total} billion`)
      .join('\n');

    const systemPrompt = `You are BudgetLens AI, a helpful assistant for Pakistan's federal budget. You explain budget data to ordinary Pakistani citizens in simple language. You can answer in both English and Urdu (Roman Urdu or Nastaliq). Be friendly, informative, and use relatable examples.

Here is Pakistan's FY2025-26 Federal Budget data (top ministries by allocation):
${budgetContext}

Total Budget FY2025-26: ~PKR ${Math.round(data.fy2526.reduce((s, m) => s + m.total, 0))} billion
Total Budget FY2024-25: ~PKR ${Math.round(data.fy2425.reduce((s, m) => s + m.total, 0))} billion

Answer the user's question based on this data. If they ask in Urdu or Roman Urdu, reply in both Urdu and English.`;

    const getMockResponse = () => ({
      response: `میں آپ کی بات سمجھ گیا! (I understand your question about: "${message}") 

To enable AI responses, please add your GEMINI_API_KEY to the backend .env file. 

Based on available budget data: Pakistan's FY2025-26 total budget is approximately PKR 18,877 billion. Education received PKR 212 billion and Defence received PKR 2,414 billion.`,
      mock: true,
    });

    try {
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Build conversation
      const conversationHistory = (history || []).map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      }));

      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'I understand. I am BudgetLens AI, ready to help Pakistani citizens understand the federal budget in simple words.' }] },
          ...conversationHistory,
        ],
      });

      const result = await chat.sendMessage(message);
      const response = result.response.text();

      return res.json({ response });
    } catch (err: any) {
      console.warn('AI chat failed, falling back to mock:', err.message);
      return res.json(getMockResponse());
    }
  } catch (err: any) {
    console.error('AI chat controller error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/rate-mna
router.post('/rate-mna', async (req: Request, res: Response) => {
  try {
    const { mnaName, mnaNameUrdu, constituency, party, attendancePercent,
      sessionsAttended, totalSessions, billsSponsored, billsPassed,
      questionsRaised, role, terms } = req.body as {
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
        english: `${mnaName} has an attendance record of ${attendancePercent}%, which is ${attendancePercent >= 70 ? 'above' : 'below'} the assembly average. With ${billsSponsored || 0} bills sponsored and ${questionsRaised || 0} questions raised, their legislative engagement ${(questionsRaised || 0) > 20 ? 'demonstrates active participation' : 'shows room for improvement'}. Overall, their performance ${attendancePercent >= 65 ? 'represents a reasonable level of public service' : 'falls short of citizens\' expectations for their elected representative'}.`,
        urdu: `${mnaName} کی حاضری ${attendancePercent}% ہے، جو اسمبلی اوسط سے ${attendancePercent >= 70 ? 'زیادہ' : 'کم'} ہے۔ ${billsSponsored || 0} بل پیش کیے اور ${questionsRaised || 0} سوالات اٹھائے، ان کی قانون سازی ${(questionsRaised || 0) > 20 ? 'سرگرم شرکت ظاہر کرتی ہے' : 'میں بہتری کی گنجائش ہے'}۔ مجموعی طور پر ان کی کارکردگی ${attendancePercent >= 65 ? 'قابل قبول سطح کی عوامی خدمت کی نمائندگی کرتی ہے' : 'عوام کی توقعات پر پوری نہیں اترتی'}.`,
        strengths: attendancePercent >= 70 ? ['Regular assembly attendance', 'Active in legislative process'] : ['Has prior legislative experience', 'Constituency representation'],
        weaknesses: attendancePercent < 70 ? ['Below-average attendance record', 'Limited bill sponsorship'] : ['Could raise more questions', 'Bill pass rate needs improvement'],
        recommendation: `Focus on ${attendancePercent < 70 ? 'improving attendance and' : 'sponsoring more'} legislative bills that directly benefit constituents in ${constituency || 'their constituency'}.`,
        mock: true,
      };
    };

    try {
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Parse the structured response
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
      console.warn('AI rate-mna failed, falling back to mock:', err.message);
      return res.json(getMockResponse());
    }
  } catch (err: any) {
    console.error('AI rate-mna controller error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/summarize-bill
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

    let genAI;
    try {
      genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const resText = result.response.text();

      const parts = resText.split(/(?=[\u0600-\u06FF]|اردو:|Urdu:|---)/i);
      const english = parts[0]?.trim() || resText;
      const urdu = parts[1]?.trim() || '';

      return res.json({ english, urdu, full: resText });
    } catch (err: any) {
      console.warn('AI bill summary failed, falling back to mock:', err.message);
      return res.json({
        english: "This bill proposes to establish a national framework for public service digitalization and governance improvements. It outlines key regulations to protect citizen privacy while enabling online access to government services. This will reduce administrative delays and make document applications easier for the public.",
        urdu: "یہ بل سرکاری خدمات کو آن لائن فراہم کرنے کے لیے بنایا گیا ہے۔ اس کا مقصد شہریوں کے لیے شناختی دستاویزات اور سرٹیفکیٹ آن لائن حاصل کرنے کے طریقہ کار کو آسان بنانا ہے۔ یہ بل سرکاری دفاتر کے چکروں اور طویل تاخیر کو ختم کرنے میں مددگار ثابت ہوگا۔",
        mock: true,
      });
    }
  } catch (err: any) {
    console.error('Bill summarize error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
