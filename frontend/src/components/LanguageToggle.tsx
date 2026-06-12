import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

export default function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();

  return (
    <motion.button
      id="language-toggle"
      onClick={toggleLang}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative flex items-center gap-1 px-1 py-1 rounded-full bg-card border border-card-border
        hover:border-accent/40 transition-all duration-200"
      title={lang === 'en' ? 'Switch to Urdu' : 'Switch to English'}
    >
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
          lang === 'en' ? 'bg-accent text-bg' : 'text-text-secondary'
        }`}
      >
        EN
      </span>
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
          lang === 'ur' ? 'bg-accent text-bg' : 'text-text-secondary'
        }`}
      >
        اردو
      </span>
    </motion.button>
  );
}
