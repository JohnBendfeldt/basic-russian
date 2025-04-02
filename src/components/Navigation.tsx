import React from 'react';

interface NavigationProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

interface SectionItem {
  id: string;
  name: string;
}

const Navigation: React.FC<NavigationProps> = ({ activeSection, setActiveSection }) => {
  const sections: SectionItem[] = [
    { id: 'alphabet', name: 'Alphabet' },
    { id: 'phrases', name: 'Basic Phrases' },
    { id: 'numbers', name: 'Numbers' },
    { id: 'words', name: 'Common Words' },
    { id: 'quiz', name: 'Quiz' }
  ];

  return (
    <nav className="navigation">
      <ul>
        {sections.map((section) => (
          <li 
            key={section.id}
            className={activeSection === section.id ? 'active' : ''}
            onClick={() => setActiveSection(section.id)}
          >
            {section.name}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navigation;