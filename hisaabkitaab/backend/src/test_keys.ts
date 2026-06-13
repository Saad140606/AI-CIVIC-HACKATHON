import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config({ override: true });

async function testKeys() {
  console.log('Testing environment variables (with dotenv override)...');
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  console.log(`GEMINI_API_KEY: ${geminiKey ? 'Present (length: ' + geminiKey.length + ')' : 'Missing'}`);
  console.log(`GROQ_API_KEY: ${groqKey ? 'Present (length: ' + groqKey.length + ')' : 'Missing'}`);

  if (geminiKey) {
    try {
      console.log('Calling Gemini API (gemini-2.0-flash)...');
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent('Hello, say test');
      console.log('✅ Gemini Success:', result.response.text().trim());
    } catch (err: any) {
      console.error('❌ Gemini Failed:', err.message);
    }
  } else {
    console.log('Skipping Gemini test (no key).');
  }

  if (groqKey) {
    try {
      console.log('Calling Groq API (llama-3.3-70b-versatile)...');
      const groq = new Groq({ apiKey: groqKey });
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Hello, say test' }],
        max_tokens: 10,
      });
      console.log('✅ Groq Success:', completion.choices[0]?.message?.content?.trim());
    } catch (err: any) {
      console.error('❌ Groq Failed:', err.message);
    }
  } else {
    console.log('Skipping Groq test (no key).');
  }
}

testKeys();
