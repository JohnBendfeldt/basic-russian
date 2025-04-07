import React, { useState, useEffect } from 'react';
import './App.css';
import Alphabet from './components/Alphabet';
import Phrases from './components/Phrases';
import Navigation from './components/Navigation';
import Quiz from './components/Quiz';
import BottomNavigation from './components/BottomNavigation';
import russianData from './data/russianData';
import { FaTimes, FaInfoCircle } from 'react-icons/fa';
import { initVoices, isRussianVoiceAvailable } from './utils/speech';
import { getRussianVoiceInstallInstructions } from './utils/browserSpeech';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('alphabet');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [speechInitialized, setSpeechInitialized] = useState(false);
  const [showVoicePrompt, setShowVoicePrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      console.log('App was installed');
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
        
        if (!isRussianVoiceAvailable()) {
          setShowVoicePrompt(true);
        }
        
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
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
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
    setActiveSection(section);
    closeMenu();
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
        return <Phrases data={russianData.basicPhrases} title="Basic Phrases" />;
      case 'numbers':
        return <Phrases data={russianData.numbers} title="Numbers" />;
      case 'words':
        return <Phrases data={russianData.commonWords} title="Common Words" />;
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
      default:
        return <Alphabet data={russianData.alphabet} />;
    }
  };

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <h1>Basic Russian</h1>
          {installPrompt && (
            <button onClick={handleInstallClick} className="install-button">
              Install App
            </button>
          )}
        </div>
        <Navigation 
          activeSection={activeSection} 
          setActiveSection={handleSectionChange} 
          isOpen={false}
          _onClose={closeMenu}
        />
      </header>
      
      {showVoicePrompt && (
        <div className="voice-prompt-banner">
          <FaInfoCircle className="voice-prompt-icon" />
          <div className="voice-prompt-text">
            <p><strong>Russian voice not detected!</strong> Pronunciation features require a Russian voice pack.</p>
            <p className="voice-instructions">{getRussianVoiceInstallInstructions()}</p>
          </div>
          <button 
            className="voice-prompt-close" 
            onClick={() => setShowVoicePrompt(false)}
            aria-label="Close voice prompt"
          >
            <FaTimes />
          </button>
        </div>
      )}
      
      <main tabIndex={-1}>
        {renderActiveSection()}
      </main>
      
      <BottomNavigation 
        activeSection={activeSection} 
        setActiveSection={handleSectionChange} 
      />
      
      <footer>
        <p>© {new Date().getFullYear()} Basic Russian Learning</p>
      </footer>
    </div>
  );
};

export default App;