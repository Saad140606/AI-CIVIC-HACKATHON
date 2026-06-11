import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiApi } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

interface Message {
  role: 'user' | 'ai';
  text: string;
  mock?: boolean;
}

export default function ChatBar() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: `👋 Assalam-o-Alaikum! I'm WakalaLens AI. Ask me anything about Pakistan's federal budget or MNAs — in English or Urdu!\n\nTry: "Which ministry got the most money?" or "تعلیم کو کتنا پیسہ ملا؟"`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const history = messages.slice(1).map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
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

  const quickQuestions = [
    "Which ministry got the most money?",
    "تعلیم کو کتنا ملا؟",
    "Defence vs Education comparison",
    "Biggest budget increase this year?",
  ];

  return (
    <>
      {/* Floating chat button */}
      <motion.button
        id="chat-toggle-btn"
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent shadow-accent
          flex items-center justify-center text-2xl text-bg font-bold
          hover:bg-accent-hover transition-all duration-200"
        title="Ask WakalaLens AI"
      >
        {open ? '✕' : '🤖'}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-1.5rem)] rounded-2xl
              glass border border-card-border shadow-card overflow-hidden flex flex-col"
            style={{ height: '500px' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-card-border bg-card">
              <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-sm">
                🤖
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{t.chat.title}</p>
                <p className="text-xs text-text-secondary">{t.chat.poweredBy}</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-success animate-pulse-slow" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-accent text-bg font-medium rounded-br-sm'
                        : 'bg-card border border-card-border text-white rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                    {msg.mock && (
                      <p className="text-xs opacity-60 mt-1">(Add GEMINI_API_KEY for real AI responses)</p>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-card-border rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-accent"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick questions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {quickQuestions.map(q => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-xs px-2.5 py-1 rounded-full bg-card border border-card-border
                        text-text-secondary hover:text-accent hover:border-accent/40 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-card-border bg-card">
              <div className="flex gap-2">
                <input
                  id="chat-input"
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.chat.placeholder}
                  className="chat-input flex-1 bg-bg-secondary border border-card-border rounded-xl
                    px-4 py-2.5 text-sm text-white placeholder:text-text-muted
                    focus:border-accent/50 transition-all"
                />
                <button
                  id="chat-send-btn"
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="px-4 py-2.5 rounded-xl bg-accent text-bg font-semibold text-sm
                    hover:bg-accent-hover active:scale-95 transition-all
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t.chat.send}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
