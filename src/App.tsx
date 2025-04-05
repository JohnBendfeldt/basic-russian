import React, { useState, useEffect } from 'react';
import './App.css';
import Alphabet from './components/Alphabet';
import Navigation from './components/Navigation';
import Quiz from './components/Quiz';
import russianData from './data/russianData';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('alphabet');
  const [installPrompt, setInstallPrompt] = useState<any>(null);

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

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'alphabet':
        return <Alphabet data={russianData.alphabet} />;
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
        <h1>Learn Russian</h1>
        <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />
        {installPrompt && (
          <button onClick={handleInstallClick} className="install-button">
            Install App
          </button>
        )}
      </header>
      <main>
        {renderActiveSection()}
      </main>
      <footer>
        <p>© {new Date().getFullYear()} Russian Learning App</p>
      </footer>
    </div>
  );
};

export default App;