import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { loadBudgetData } from '../lib/dataLoader';
import * as pdfParse from 'pdf-parse';

const router = Router();

// ── In-Memory Rate Limiter Middleware for AI Routes (Hygiene) ──────────────────
const rateLimitWindowMs = 15 * 60 * 1000; // 15 minutes
const rateLimitMaxRequests = 100; // max 100 requests per IP per window
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

const rateLimiter = (req: Request, res: Response, next: any) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  let record = ipRequestCounts.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + rateLimitWindowMs };
  }
  
  record.count++;
  ipRequestCounts.set(ip, record);
  
  if (record.count > rateLimitMaxRequests) {
    return res.status(429).json({
      error: 'Too many requests from this IP, please try again after 15 minutes.'
    });
  }
  
  // Set headers
  res.setHeader('X-RateLimit-Limit', rateLimitMaxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, rateLimitMaxRequests - record.count));
  res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
  
  next();
};


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
  let geminiErrMessage = '';
  // ── 1. Try Gemini ────────────────────────────────────────────────────────
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    return { text: result.response.text(), provider: 'gemini' };
  } catch (geminiErr: any) {
    geminiErrMessage = geminiErr.message;
    console.warn('⚠️  Gemini failed, trying Groq:', geminiErr.message);
  }

  // ── 2. Try Groq ──────────────────────────────────────────────────────────
  try {
    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.7,
    });
    const text = completion.choices[0]?.message?.content || '';
    return { text, provider: 'groq' };
  } catch (groqErr: any) {
    console.warn('⚠️  Groq also failed:', groqErr.message);
    throw new Error(`Gemini Error: ${geminiErrMessage || 'None'}, Groq Error: ${groqErr.message}`);
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
  let geminiErrMessage = '';
  // ── 1. Try Gemini ────────────────────────────────────────────────────────
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const conversationHistory = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'I understand. I am HisaabKitaab AI, ready to help Pakistani citizens understand the federal budget. I will always cite Finance Division, GoP as the source for budget figures.' }] },
        ...conversationHistory,
      ],
    });
    const result = await chat.sendMessage(userMessage);
    return { text: result.response.text(), provider: 'gemini' };
  } catch (geminiErr: any) {
    geminiErrMessage = geminiErr.message;
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
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });
    const text = completion.choices[0]?.message?.content || '';
    return { text, provider: 'groq' };
  } catch (groqErr: any) {
    console.warn('⚠️  Groq chat also failed:', groqErr.message);
    throw new Error(`Gemini Error: ${geminiErrMessage || 'None'}, Groq Error: ${groqErr.message}`);
  }
}

// ── POST /api/ai/explain ──────────────────────────────────────────────────────
router.post('/explain', rateLimiter, async (req: Request, res: Response) => {
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
router.post('/chat', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body as { message: string; history?: Array<{ role: string; text: string }> };

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const data = await loadBudgetData();
    const cleaned = message.toLowerCase().trim();

    // ── 1. Dynamic Search in Spreadsheet Budget Data (RAG-style) ─────────────────
    const matchedMinistries: any[] = [];
    
    // Map common abbreviations to their spreadsheet equivalents
    const commonAbbreviations: Record<string, string> = {
      'moitt': 'it & telecom',
      'it': 'it & telecom',
      'hec': 'education',
      'ndma': 'climate change',
      'nha': 'communications',
      'wapda': 'water resources',
      'fbr': 'finance',
      'pims': 'national health',
    };
    
    let searchTerm = cleaned;
    for (const [abbr, expanded] of Object.entries(commonAbbreviations)) {
      if (cleaned.includes(abbr)) {
        searchTerm = cleaned + ' ' + expanded;
      }
    }

    const queryWords = searchTerm.split(/\s+/).filter(w => 
      w.length > 2 && 
      !['the', 'and', 'for', 'budget', 'allocated', 'allocation', 'ministry', 'department', 'with', 'what', 'how', 'much', 'show', 'tell', 'explain'].includes(w)
    );
    
    // Scan all spreadsheet ministries
    for (const item of data.fy2526) {
      const ministryName = item.ministry.toLowerCase();
      const isDirectMatch = ministryName.includes(cleaned) || cleaned.includes(ministryName);
      const isWordMatch = queryWords.some(w => ministryName.includes(w));
      
      if (isDirectMatch || isWordMatch) {
        const y24 = data.fy2425.find(m => m.ministry === item.ministry)?.total || 0;
        const y23 = data.fy2324.find(m => m.ministry === item.ministry)?.total || 0;
        
        // Prevent duplicate entries
        if (!matchedMinistries.some(m => m.ministry === item.ministry)) {
          matchedMinistries.push({
            ministry: item.ministry,
            fy2526: item.total,
            fy2425: y24,
            fy2324: y23
          });
        }
      }
    }

    // ── 2. Build Enriched Context ──────────────────────────────────────────────
    let dynamicContext = "";
    if (matchedMinistries.length > 0) {
      dynamicContext += "\nSpecifically relevant budget allocations found in the spreadsheet:\n";
      for (const m of matchedMinistries) {
        dynamicContext += `- **${m.ministry}**:\n  * FY2025-26 Allocation: PKR ${m.fy2526.toFixed(1)} billion\n  * FY2024-25 Allocation: PKR ${m.fy2425.toFixed(1)} billion\n  * FY2023-24 Allocation: PKR ${m.fy2324.toFixed(1)} billion\n`;
      }
    }

    const total2526 = data.fy2526.reduce((s, m) => s + m.total, 0);
    const total2425 = data.fy2425.reduce((s, m) => s + m.total, 0);
    const total2324 = data.fy2324.reduce((s, m) => s + m.total, 0);

    const budgetContext = data.fy2526
      .slice(0, 15)
      .map(m => `${m.ministry}: PKR ${m.total.toFixed(1)} billion`)
      .join('\n');

    const systemPrompt = `You are HisaabKitaab AI, a helpful budget accountability assistant for Pakistan. You explain budget data to ordinary Pakistani citizens in simple, plain language. You can answer in both English and Urdu (Roman Urdu or Nastaliq). Be friendly, informative, and use relatable examples.

Here is the overall federal budget data (Source: Finance Division GoP):
- Total Budget FY2025-26: PKR ${total2526.toFixed(1)} billion (PKR ${(total2526 / 1000).toFixed(2)} trillion)
- Total Budget FY2024-25: PKR ${total2425.toFixed(1)} billion (PKR ${(total2425 / 1000).toFixed(2)} trillion)
- Total Budget FY2023-24: PKR ${total2324.toFixed(1)} billion (PKR ${(total2324 / 1000).toFixed(2)} trillion)

Top ministries by allocation in FY2025-26:
${budgetContext}
${dynamicContext}
Answer the user's question accurately using this real budget data. If they ask about a specific ministry (like IT, education, health, defence, etc.), make sure you cite its allocations for all 3 years from the context. If you present figures, always mention "Source: Finance Division, GoP". If the query is in Roman Urdu or Urdu, reply in both Urdu and English.`;

    const getMockResponse = () => {
      let response = `میں آپ کی بات سمجھ گیا! (I understand your question: "${message}")\n\n`;
      if (matchedMinistries.length > 0) {
        response += `Based on the official federal budget data (Source: Finance Division, GoP):\n`;
        for (const m of matchedMinistries) {
          response += `• **${m.ministry}**:\n  - FY2025-26: PKR ${m.fy2526.toFixed(1)}B\n  - FY2024-25: PKR ${m.fy2425.toFixed(1)}B\n  - FY2023-24: PKR ${m.fy2324.toFixed(1)}B\n`;
        }
      } else {
        response += `Here is the overall budget status:\n`;
        response += `• **Total Budget FY2025-26**: PKR ${total2526.toFixed(1)} billion\n`;
        response += `• **Total Budget FY2024-25**: PKR ${total2425.toFixed(1)} billion\n\n`;
        response += `To enable full AI chat, configure GEMINI_API_KEY in the environment.`;
      }
      return { response, mock: true };
    };

    try {
      const { text } = await chatText(systemPrompt, history || [], message);
      return res.json({ response: text });
    } catch (err: any) {
      console.warn('AI chat: both providers failed, using mock:', err.message);
      const mockRes = getMockResponse();
      mockRes.response += `\n\n*(Debug Error: ${err.message})*`;
      return res.json(mockRes);
    }
  } catch (err: any) {
    console.error('AI chat controller error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/rate-mna ─────────────────────────────────────────────────────
router.post('/rate-mna', rateLimiter, async (req: Request, res: Response) => {
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
router.post('/summarize-bill', rateLimiter, async (req: Request, res: Response) => {
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
