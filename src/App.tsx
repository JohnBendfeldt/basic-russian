import React, { JSX, useState } from 'react';
import './App.css';
import Alphabet from './components/Alphabet';
import Phrases from './components/Phrases';
import Navigation from './components/Navigation';
import Quiz from './components/Quiz';
import russianData from './data/russianData';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('alphabet');

  const renderActiveSection = (): JSX.Element => {
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
        return <Quiz data={russianData} />;
      default:
        return <Alphabet data={russianData.alphabet} />;
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Learn Russian</h1>
        <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />
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