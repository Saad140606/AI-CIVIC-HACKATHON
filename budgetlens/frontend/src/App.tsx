import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Dashboard from './pages/Dashboard';
import MinistryExplorer from './pages/MinistryExplorer';
import Compare from './pages/Compare';
import WakalaCheck from './pages/WakalaCheck';
import BillSummarizer from './pages/BillSummarizer';
import ChatBar from './components/ChatBar';
import LanguageToggle from './components/LanguageToggle';
import { motion, AnimatePresence } from 'framer-motion';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, refetchOnWindowFocus: false },
  },
});

const PageWrapper = ({ children, fullWidth = false }: { children: React.ReactNode; fullWidth?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    className={fullWidth ? "flex-1 relative" : "flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 relative"}
  >
    {children}
  </motion.div>
);

function AppContent() {
  const { t, lang } = useLanguage();
  const isUrdu = lang === 'ur';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { to: '/', label: t.nav.dashboard, icon: '🏠', end: true, id: 'nav-dashboard' },
    { to: '/explorer', label: t.nav.explorer, icon: '📊', end: false, id: 'nav-explorer' },
    { to: '/compare', label: t.nav.compare, icon: '⚖️', end: false, id: 'nav-compare' },
    { to: '/wakala', label: lang === 'ur' ? 'وکالت چیک' : 'WakalaCheck', icon: '🏛️', end: false, id: 'nav-wakala' },
    { to: '/bill-summarizer', label: t.nav.billSummarizer, icon: '📄', end: false, id: 'nav-bill-summarizer' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#03070f' }}>

      {/* Top Navbar */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'glass border-b border-[#1a3050]/60 shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
            : 'bg-[#03070f]/80 backdrop-blur-xl border-b border-[#1a3050]/40'
        }`}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d4ff]/50 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 shrink-0"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#00d4ff]/20 to-[#a855f7]/20 border border-[#00d4ff]/30 flex items-center justify-center text-xl">
                📊
              </div>
              <div className="absolute inset-0 rounded-xl ripple-ring border border-[#00d4ff]/20" style={{ animationDuration: '3s' }} />
            </div>
            <div className="hidden sm:block">
              <p className="font-black text-white text-sm leading-tight tracking-tight">
                {t.appName}
              </p>
              <p className="text-[10px] text-[#7f8ea4] leading-tight">{t.appSubtitle}</p>
            </div>
          </motion.div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 ml-8">
            {navLinks.map((link, i) => (
              <motion.div
                key={link.to}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 + 0.2 }}
              >
                <NavLink
                  to={link.to}
                  end={link.end}
                  id={link.id}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-250 ${
                      isActive
                        ? 'nav-link-active'
                        : 'text-[#7f8ea4] hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <span className="text-base">{link.icon}</span>
                  {link.label}
                </NavLink>
              </motion.div>
            ))}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            {/* Live indicator */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00e676]/8 border border-[#00e676]/20"
            >
              <div className="relative flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#00e676]" />
                <div className="absolute inset-0 rounded-full bg-[#00e676] animate-pulse-slow opacity-50" />
              </div>
              <span className="text-xs text-[#00e676] font-bold tracking-wide">LIVE</span>
            </motion.div>

            {/* Pakistan flag badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55 }}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/70"
            >
              🇵🇰 Pakistan
            </motion.div>

            <LanguageToggle />

            {/* Mobile menu button */}
            <button
              id="mobile-menu-btn"
              className="md:hidden p-2 rounded-xl glass border border-[#1a3050]/60 text-[#7f8ea4] hover:text-white transition-colors"
              onClick={() => setMobileNavOpen(v => !v)}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={mobileNavOpen ? 'close' : 'open'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {mobileNavOpen ? '✕' : '☰'}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden border-t border-[#1a3050]/50 overflow-hidden"
            >
              <nav className="p-4 space-y-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.to}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <NavLink
                      to={link.to}
                      end={link.end}
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'nav-link-active'
                            : 'text-[#7f8ea4] hover:text-white hover:bg-white/5'
                        }`
                      }
                    >
                      <span className="text-base">{link.icon}</span>
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Main content */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="/explorer" element={<PageWrapper><MinistryExplorer /></PageWrapper>} />
          <Route path="/compare" element={<PageWrapper><Compare /></PageWrapper>} />
          <Route path="/wakala" element={<PageWrapper fullWidth><WakalaCheck /></PageWrapper>} />
          <Route path="/bill-summarizer" element={<PageWrapper><BillSummarizer /></PageWrapper>} />
        </Routes>
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-[#1a3050]/40 py-6 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-[#3a4558]">
          <div className="flex items-center gap-2">
            <span className="text-[#00d4ff] font-bold">WakalaLens Pakistan</span>
            <span>—</span>
            <span>Open Civic Data Platform</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              {isUrdu ? 'ڈیٹا ماخذ:' : 'Data:'}
              {' '}
              <a href="https://www.finance.gov.pk" target="_blank" rel="noopener noreferrer"
                className="hover:text-[#00d4ff] transition-colors underline decoration-[#1a3050]">
                finance.gov.pk
              </a>
              {' '}&amp;{' '}
              <a href="https://na.gov.pk" target="_blank" rel="noopener noreferrer"
                className="hover:text-[#00d4ff] transition-colors underline decoration-[#1a3050]">
                na.gov.pk
              </a>
            </span>
            <span className="text-[#1a3050]">•</span>
            <span>AI: Google Gemini Flash</span>
            <span className="text-[#1a3050]">•</span>
            <span>Built for Pakistan 🇵🇰</span>
          </div>
        </div>
      </footer>

      {/* Floating AI Chat */}
      <ChatBar />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
