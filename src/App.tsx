import React, { useState, useEffect } from 'react';
import './App.css';
import Alphabet from './components/Alphabet';
import Phrases from './components/Phrases';
import Navigation from './components/Navigation';
import Quiz from './components/Quiz';
import russianData from './data/russianData';
import { FaBars, FaTimes } from 'react-icons/fa';
import { initVoices } from './utils/speech';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('alphabet');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [speechInitialized, setSpeechInitialized] = useState(false);

  useEffect(() => {
    // Handle the install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e);
    };

    // Check if the app is already installed
    const handleAppInstalled = () => {
      // Clear the install prompt state
      setInstallPrompt(null);
      // Optionally log or track the install
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
    // Initialize speech synthesis when the app loads
    const initSpeech = async () => {
      try {
        await initVoices();
        setSpeechInitialized(true);
        console.log('Speech initialization completed successfully');
      } catch (err) {
        console.error('Failed to initialize speech:', err);
      }
    };
    
    initSpeech();
  }, []);

  // Function to trigger the install prompt
  const handleInstallClick = () => {
    if (!installPrompt) return;

    // Show the install prompt
    (installPrompt as any).prompt();

    // Wait for the user to respond to the prompt
    (installPrompt as any).userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      // Clear the prompt state
      setInstallPrompt(null);
    });
  };

  const toggleMenu = () => {
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
    // Add a check to only render sections if speech is initialized
    if (!speechInitialized) {
      // Show loading state while speech initializes
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
          <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
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
          isOpen={menuOpen}
          _onClose={closeMenu}  // Updated to match the new property name
        />
      </header>
      {menuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}
      <main>
        {renderActiveSection()}
      </main>
      <footer>
        <p>© {new Date().getFullYear()} Basic Russian Learning</p>
      </footer>
    </div>
  );
};

export default App;