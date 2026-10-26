import React, { useState, useEffect } from 'react';
import './App.css';
import Alphabet from './components/Alphabet';
import Phrases from './components/Phrases';
import Navigation from './components/Navigation';
import NumbersAndTime from './components/NumbersAndTime';
import Quiz from './components/Quiz';
import BottomNavigation from './components/BottomNavigation';
import UserMenu from './components/UserMenu';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import russianData from './data/russianData';
import { initVoices, cancelAllSpeech } from './utils/speech';

// Map URL paths to section IDs and SEO metadata
const SECTION_META: Record<string, { title: string; description: string }> = {
  alphabet: {
    title: 'Russian Alphabet (Cyrillic) | Basic Russian',
    description: 'Learn the 33 letters of the Russian alphabet (Cyrillic) with pronunciation guides, audio examples, and transliteration. Free interactive Russian alphabet chart for beginners.',
  },
  phrases: {
    title: 'Basic Russian Phrases | Basic Russian',
    description: 'Learn essential Russian phrases for beginners with audio pronunciation. Greetings, introductions, common expressions, and everyday Russian phrases with English translations.',
  },
  numbers: {
    title: 'Russian Numbers & Time | Basic Russian',
    description: 'Learn Russian numbers and telling time with authentic native audio. Count in Russian from 1 to 1000 and tell time accurately.',
  },
  time: {
    title: 'Russian Time & Telling Time | Basic Russian',
    description: 'Learn how to tell time in Russian with authentic native audio pronunciation. Hours, minutes, and practical time expressions for beginners.',
  },
  words: {
    title: 'Common Russian Words | Basic Russian',
    description: 'Learn the most common Russian words with audio pronunciation and English translations. Build your Russian vocabulary with essential everyday words for beginners.',
  },
  quiz: {
    title: 'Russian Quiz | Basic Russian',
    description: 'Test your Russian knowledge with interactive quizzes covering the alphabet, phrases, numbers, and vocabulary. Free Russian language practice for beginners.',
  },
  privacy: {
    title: 'Privacy Policy | Basic Russian',
    description: 'Privacy Policy for Basic Russian (basicrussian.org). Learn how we handle your data, quiz progress, and account information with privacy and security.',
  },
  terms: {
    title: 'Terms of Service | Basic Russian',
    description: 'Terms of Service for Basic Russian (basicrussian.org). Free Russian language learning application terms and guidelines.',
  },
};

const PATH_TO_SECTION: Record<string, string> = {
  '/': 'alphabet',
  '/alphabet': 'alphabet',
  '/phrases': 'phrases',
  '/numbers': 'numbers',
  '/time': 'time',
  '/words': 'words',
  '/quiz': 'quiz',
  '/privacy': 'privacy',
  '/terms': 'terms',
};

const SECTION_TO_PATH: Record<string, string> = {
  alphabet: '/alphabet',
  phrases: '/phrases',
  numbers: '/numbers',
  time: '/time',
  words: '/words',
  quiz: '/quiz',
  privacy: '/privacy',
  terms: '/terms',
};

const getSectionFromPath = (): string => {
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  return PATH_TO_SECTION[path] || 'alphabet';
};

const updateMeta = (section: string) => {
  const meta = SECTION_META[section] || SECTION_META.alphabet;
  document.title = meta.title;
  const descTag = document.querySelector('meta[name="description"]');
  if (descTag) descTag.setAttribute('content', meta.description);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', meta.title);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', meta.description);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', `https://basicrussian.org${SECTION_TO_PATH[section] || '/alphabet'}`);
};

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>(getSectionFromPath);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [speechInitialized, setSpeechInitialized] = useState(false);

  // Handle browser back/forward navigation
  useEffect(() => {
    const onPopState = () => {
      const section = getSectionFromPath();
      setActiveSection(section);
      updateMeta(section);
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPopState);
    // Set initial meta
    updateMeta(activeSection);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    const initSpeech = async () => {
      try {
        await initVoices();
        setSpeechInitialized(true);
      } catch (err) {
        console.error('Failed to initialize speech:', err);
        setSpeechInitialized(true);
      }
    };
    
    initSpeech();
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;

    (installPrompt as any).prompt();

    (installPrompt as any).userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
      } else {
      }
      setInstallPrompt(null);
    });
  };

  const _toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleSectionChange = (section: string) => {
    // Cancel any ongoing speech or audio when changing sections
    cancelAllSpeech();
    
    // Stop any potentially playing audio elements
    document.querySelectorAll('audio').forEach(audio => {
      try {
        audio.pause();
      } catch (e) {
        console.warn('Error pausing audio:', e);
      }
    });
    
    // Update URL without full page reload
    const newPath = SECTION_TO_PATH[section] || '/alphabet';
    if (window.location.pathname !== newPath) {
      window.history.pushState({ section }, '', newPath);
    }
    updateMeta(section);
    
    setActiveSection(section);
    closeMenu();
    window.scrollTo(0, 0);
  };

  const renderActiveSection = () => {
    if (!speechInitialized) {
      return (
        <div className="section loading-section">
          <h2>Loading Speech Functionality</h2>
          <p className="loading-message">Initializing voice capabilities. This may take a moment...</p>
          <div className="loading-spinner"></div>
        </div>
      );
    }
    
    switch (activeSection) {
      case 'alphabet':
        return <Alphabet data={russianData.alphabet} />;
      case 'phrases':
        return <Phrases 
          data={russianData.basicPhrases} 
          title="Basic Phrases" 
          contentType="phrases"
        />;
      case 'numbers':
      case 'time':
        return <NumbersAndTime 
          numbersData={russianData.numbers} 
          timeData={russianData.time}
          activeTab={activeSection === 'time' ? 'time' : 'numbers'}
          onTabChange={(tab) => handleSectionChange(tab)}
        />;
      case 'words':
        return <Phrases 
          data={russianData.commonWords} 
          title="Common Words" 
          contentType="words"
        />;
      case 'quiz':
        return <Quiz data={{
          alphabet: russianData.alphabet.map(item => ({
            character: item.letter,
            pronunciation: item.pronunciation,
            example: item.example,
          })),
          basicPhrases: russianData.basicPhrases,
          numbers: russianData.numbers,
          commonWords: russianData.commonWords
        }} />;
      case 'privacy':
        return <PrivacyPolicy onNavigate={handleSectionChange} />;
      case 'terms':
        return <TermsOfService onNavigate={handleSectionChange} />;
      default:
        return <Alphabet data={russianData.alphabet} />;
    }
  };

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <h1 onClick={() => handleSectionChange('alphabet')} style={{ cursor: 'pointer' }} title="Return to alphabet lessons">
            <svg className="app-emblem russia-flag" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Basic Russian logo" role="img">
              <defs>
                <linearGradient id="rusEmblemBg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb"/>
                  <stop offset="50%" stopColor="#1e40af"/>
                  <stop offset="100%" stopColor="#0f172a"/>
                </linearGradient>
                <linearGradient id="rusGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fde047"/>
                  <stop offset="60%" stopColor="#f59e0b"/>
                  <stop offset="100%" stopColor="#d97706"/>
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#rusEmblemBg)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
              {/* Russian Flag Accent in Top Corner */}
              <g transform="translate(6, 6)">
                <rect x="0" y="0" width="10" height="2" rx="1" fill="#ffffff" opacity="0.95"/>
                <rect x="0" y="2.5" width="10" height="2" rx="1" fill="#3b82f6"/>
                <rect x="0" y="5" width="10" height="2" rx="1" fill="#ef4444"/>
              </g>
              {/* Graduation Cap School Crest from OG image */}
              <g transform="translate(0, 3)">
                <path d="M24 13L8 20.5L24 28L40 20.5L24 13Z" fill="url(#rusGoldGrad)"/>
                <path d="M14 24.5V32C14 35.5 18 38 24 38C30 38 34 35.5 34 32V24.5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M40 21V30.5" stroke="url(#rusGoldGrad)" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="40" cy="31.5" r="1.5" fill="url(#rusGoldGrad)"/>
              </g>
            </svg>
            Basic Russian
          </h1>
          <div className="header-actions">
            {installPrompt && (
              <button onClick={handleInstallClick} className="install-button">
                Install App
              </button>
            )}
            <UserMenu onNavigate={handleSectionChange} />
          </div>
        </div>
        <Navigation 
          activeSection={activeSection} 
          setActiveSection={handleSectionChange} 
          isOpen={false}
          _onClose={closeMenu}
        />
      </header>
      
      <main tabIndex={-1}>
        {renderActiveSection()}
      </main>
      
      <BottomNavigation 
        activeSection={activeSection} 
        setActiveSection={handleSectionChange} 
      />
      
      <footer>
        <p>
          © {new Date().getFullYear()} Basic Russian Learning ·{' '}
          <a
            href="/privacy"
            className="footer-link"
            onClick={(e) => {
              e.preventDefault();
              handleSectionChange('privacy');
            }}
          >
            Privacy Policy
          </a>{' '}
          ·{' '}
          <a
            href="/terms"
            className="footer-link"
            onClick={(e) => {
              e.preventDefault();
              handleSectionChange('terms');
            }}
          >
            Terms of Service
          </a>
        </p>
      </footer>
    </div>
  );
};

export default App;