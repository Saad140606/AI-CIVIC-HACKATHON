import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiApi } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  ministry: string;
  budget: number;
  year?: string;
}

export default function AIExplainButton({ ministry, budget, year = 'FY2025-26' }: Props) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<{ english: string; urdu: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const handleExplain = async () => {
    if (explanation) {
      setOpen(prev => !prev);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await aiApi.explain(ministry, budget, year);
      setExplanation({ english: result.english, urdu: result.urdu });
      setOpen(true);
    } catch {
      setError('AI explanation unavailable. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        id={`explain-btn-${ministry.replace(/\s+/g, '-').toLowerCase()}`}
        onClick={handleExplain}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
          bg-accent/10 border border-accent/30 text-accent
          hover:bg-accent/20 hover:border-accent/60 hover:shadow-accent
          active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            {t.ministry.explaining}
          </>
        ) : (
          <>
            <span className="text-lg">✨</span>
            {t.ministry.explainBtn}
          </>
        )}
      </button>

      <AnimatePresence>
        {open && explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 rounded-xl bg-bg-secondary border border-card-border">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                  ✨ Gemini AI
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="ml-auto text-text-secondary hover:text-white text-xs"
                >
                  ✕ Close
                </button>
              </div>
              {/* English explanation */}
              <div className="mb-3">
                <p className="text-xs text-text-secondary mb-1 uppercase tracking-wide">English</p>
                <p className="text-sm text-white/90 leading-relaxed">{explanation.english}</p>
              </div>
              {/* Urdu explanation */}
              {explanation.urdu && (
                <div dir="rtl" className="border-t border-card-border pt-3">
                  <p className="text-xs text-text-secondary mb-1 tracking-wide" dir="ltr">اردو</p>
                  <p className="text-sm text-white/90 leading-loose font-urdu">{explanation.urdu}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-2 text-xs text-danger/80">{error}</p>
      )}
    </div>
  );
}
