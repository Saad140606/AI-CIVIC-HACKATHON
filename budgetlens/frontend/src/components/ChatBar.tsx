import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiApi } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

interface Message {
  role: 'user' | 'ai';
  text: string;
  mock?: boolean;
}

const QUICK_QUESTIONS = [
  { text: "Which ministry got the most money?", emoji: "💰" },
  { text: "sehat ka budget kitna hai", emoji: "🏥" },
  { text: "تعلیم کو کتنا ملا؟", emoji: "📚" },
  { text: "karachi ke MNA kaun hain", emoji: "🏛️" },
];

export default function ChatBar() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: `👋 Assalam-o-Alaikum! I'm WakalaLens AI. Ask me anything about Pakistan's federal budget or MNAs — in English, Urdu, or Roman Urdu!\n\nTry: "Which ministry got the most money?", "sehat ka budget kitna hai" (Roman Urdu), or "تعلیم کو کتنا پیسہ ملا؟"`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const history = messages.slice(1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text,
      }));
      const result = await aiApi.chat(userMsg, history);
      setMessages(prev => [...prev, { role: 'ai', text: result.response, mock: result.mock }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: 'Sorry, I encountered an error. Please check your API key configuration.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating chat button */}
      <motion.button
        id="chat-toggle-btn"
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold"
        style={{
          background: open
            ? 'linear-gradient(135deg, #ff5252, #c62828)'
            : 'linear-gradient(135deg, #00d4ff, #0077b6)',
          boxShadow: open
            ? '0 8px 30px rgba(255,82,82,0.4), 0 0 0 3px rgba(255,82,82,0.15)'
            : '0 8px 30px rgba(0,212,255,0.4), 0 0 0 3px rgba(0,212,255,0.15)',
          color: '#03070f',
        }}
        title="Ask WakalaLens AI"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={open ? 'close' : 'bot'}
            initial={{ rotate: -180, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 180, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {open ? '✕' : '🤖'}
          </motion.span>
        </AnimatePresence>

        {/* Ripple ring */}
        {!open && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#00d4ff]/30"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.92, originY: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-1.5rem)] rounded-2xl overflow-hidden flex flex-col"
            style={{
              height: '520px',
              background: 'linear-gradient(135deg, #0c1929, #080f1e)',
              border: '1px solid rgba(0, 212, 255, 0.15)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,255,0.05)',
            }}
          >
            {/* Accent top line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent" />

            {/* Header */}
            <div
              className="flex items-center gap-3 p-4 border-b shrink-0"
              style={{ borderColor: 'rgba(26, 48, 80, 0.5)', background: 'rgba(8, 15, 30, 0.6)' }}
            >
              <div className="relative">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                  style={{ background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.25)' }}
                >
                  🤖
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#00e676] border-2 border-[#080f1e]" />
              </div>

              <div className="flex-1">
                <p className="font-bold text-white text-sm">{t.chat.title}</p>
                <p className="text-[11px] text-[#7f8ea4]">{t.chat.poweredBy}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  <span className="loading-dot" style={{ background: '#00e676' }} />
                  <span className="loading-dot" style={{ background: '#00e676', animationDelay: '0.2s' }} />
                  <span className="loading-dot" style={{ background: '#00e676', animationDelay: '0.4s' }} />
                </div>
                <span className="text-[10px] text-[#00e676] font-bold">OFFICIAL DATA</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'ai' && (
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 mr-2 mt-0.5"
                      style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}
                    >
                      🤖
                    </div>
                  )}
                  <div
                    className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                    style={
                      msg.role === 'user'
                        ? {
                            background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                            color: '#03070f',
                            fontWeight: 600,
                            borderBottomRightRadius: 4,
                            boxShadow: '0 4px 15px rgba(0,212,255,0.2)',
                          }
                        : {
                            background: 'rgba(12, 25, 41, 0.9)',
                            border: '1px solid rgba(26, 48, 80, 0.6)',
                            color: '#e2e8f0',
                            borderBottomLeftRadius: 4,
                          }
                    }
                  >
                    {msg.text.split('\n').map((line, j) => (
                      <span key={j}>{line}{j < msg.text.split('\n').length - 1 && <br />}</span>
                    ))}
                    {msg.mock && (
                      <p className="text-[10px] opacity-50 mt-1.5 italic">
                        (Add GEMINI_API_KEY for real AI)
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Loading */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <div
                      className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5"
                      style={{
                        background: 'rgba(12, 25, 41, 0.9)',
                        border: '1px solid rgba(26, 48, 80, 0.6)',
                      }}
                    >
                      {[0, 1, 2].map(idx => (
                        <motion.div
                          key={idx}
                          className="w-2 h-2 rounded-full bg-[#00d4ff]"
                          animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 0.7, delay: idx * 0.15, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Quick questions */}
            <AnimatePresence>
              {messages.length <= 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-3"
                >
                  <p className="text-[10px] text-[#3a4558] uppercase font-bold tracking-wider mb-2">Quick questions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_QUESTIONS.map(q => (
                      <motion.button
                        key={q.text}
                        onClick={() => setInput(q.text)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="text-[11px] px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-all"
                        style={{
                          background: 'rgba(26, 48, 80, 0.5)',
                          border: '1px solid rgba(26, 48, 80, 0.7)',
                          color: '#7f8ea4',
                        }}
                      >
                        <span>{q.emoji}</span>
                        <span className="truncate max-w-[100px]">{q.text}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div
              className="p-4 border-t shrink-0"
              style={{ borderColor: 'rgba(26, 48, 80, 0.5)', background: 'rgba(8, 15, 30, 0.6)' }}
            >
              <div className="flex gap-2 items-center">
                <input
                  id="chat-input"
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.chat.placeholder}
                  className="flex-1 bg-[#080f1e] border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#3a4558] focus:outline-none transition-all"
                  style={{
                    borderColor: 'rgba(26, 48, 80, 0.6)',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(0, 212, 255, 0.4)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 212, 255, 0.08)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(26, 48, 80, 0.6)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <motion.button
                  id="chat-send-btn"
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  whileHover={!loading && input.trim() ? { scale: 1.08 } : {}}
                  whileTap={!loading && input.trim() ? { scale: 0.92 } : {}}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all shrink-0"
                  style={{
                    background: loading || !input.trim()
                      ? 'rgba(26, 48, 80, 0.4)'
                      : 'linear-gradient(135deg, #00d4ff, #0077b6)',
                    color: loading || !input.trim() ? '#3a4558' : '#03070f',
                    cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                    boxShadow: loading || !input.trim() ? 'none' : '0 4px 15px rgba(0,212,255,0.25)',
                  }}
                >
                  {loading ? '⏳' : '→'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
