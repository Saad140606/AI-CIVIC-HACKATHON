import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Dashboard from './pages/Dashboard';
import MinistryExplorer from './pages/MinistryExplorer';
import Compare from './pages/Compare';
import WakalaCheck from './pages/WakalaCheck';
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
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    className={fullWidth ? "flex-1 relative" : "flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 relative"}
  >
    {children}
  </motion.div>
);

function AppContent() {
  const { t, lang } = useLanguage();
  const isUrdu = lang === 'ur';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/', label: t.nav.dashboard, icon: '🏠', end: true },
    { to: '/explorer', label: t.nav.explorer, icon: '📊', end: false },
    { to: '/compare', label: t.nav.compare, icon: '⚖️', end: false },
    { to: '/wakala', label: lang === 'ur' ? 'وکالت چیک' : 'WakalaCheck', icon: '🏛️', end: false },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <header className="glass border-b border-card-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-xl">
              📊
            </div>
            <div className="hidden sm:block">
              <p className="font-black text-white text-sm leading-tight">{t.appName}</p>
              <p className="text-xs text-text-secondary leading-tight">{t.appSubtitle}</p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 ml-8">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-accent/10 text-accent border border-accent/20 shadow-sm'
                      : 'text-text-secondary hover:text-white hover:bg-card-hover'
                  }`
                }
              >
                <span>{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-slow" />
              <span className="text-xs text-success font-medium">Live</span>
            </div>

            <LanguageToggle />

            {/* Mobile menu button */}
            <button
              id="mobile-menu-btn"
              className="md:hidden p-2 rounded-xl bg-card border border-card-border text-text-secondary hover:text-white"
              onClick={() => setMobileNavOpen(v => !v)}
            >
              {mobileNavOpen ? '✕' : '☰'}
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
              className="md:hidden border-t border-card-border overflow-hidden"
            >
              <nav className="p-4 space-y-2">
                {navLinks.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-accent/10 text-accent border border-accent/20'
                          : 'text-text-secondary hover:text-white hover:bg-card-hover'
                      }`
                    }
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content — WakalaCheck is full-width, others are max-width */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="/explorer" element={<PageWrapper><MinistryExplorer /></PageWrapper>} />
          <Route path="/compare" element={<PageWrapper><Compare /></PageWrapper>} />
          <Route path="/wakala" element={<PageWrapper fullWidth><WakalaCheck /></PageWrapper>} />
        </Routes>
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-card-border py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-text-muted">
          <div>
            <span className="text-accent font-semibold">WakalaLens Pakistan</span> — Open Civic Data
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span>{isUrdu ? 'ڈیٹا ماخذ:' : 'Data Sources:'} <a href="https://www.finance.gov.pk" target="_blank" rel="noopener noreferrer" className="hover:text-accent underline">finance.gov.pk</a> & <a href="https://na.gov.pk" target="_blank" rel="noopener noreferrer" className="hover:text-accent underline">na.gov.pk</a></span>
            <span>•</span>
            <span>AI: Google Gemini Flash</span>
            <span>•</span>
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
