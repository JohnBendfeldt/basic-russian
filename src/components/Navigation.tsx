import React from 'react';

interface NavigationProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isOpen: boolean;
  _onClose: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  activeSection, 
  setActiveSection,
  isOpen,
  _onClose
}) => {
  const navItems = [
    { id: 'alphabet', label: 'Alphabet' },
    { id: 'phrases', label: 'Basic Phrases' },
    { id: 'words', label: 'Common Words' },
    { id: 'numbers', label: 'Numbers & Time' },
    { id: 'quiz', label: 'Quiz' }
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
  };

  return (
    <nav className={`navigation ${isOpen ? 'open' : ''}`} aria-label="Main navigation">
      <ul>
        {navItems.map(item => {
          const isActive = activeSection === item.id || (item.id === 'numbers' && activeSection === 'time');
          return (
            <li key={item.id} className={isActive ? 'active' : ''}>
              <button
                type="button"
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleNavClick(item.id)}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navigation;
