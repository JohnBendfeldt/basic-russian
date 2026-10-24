import React from 'react';
import { FaFont, FaComment, FaListUl, FaCalculator, FaQuestionCircle } from 'react-icons/fa';

interface BottomNavigationProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  activeSection, 
  setActiveSection
}) => {
  const navItems = [
    { id: 'alphabet', label: 'Alphabet', icon: <FaFont /> },
    { id: 'phrases', label: 'Phrases', icon: <FaComment /> },
    { id: 'words', label: 'Words', icon: <FaListUl /> },
    { id: 'numbers', label: 'Numbers', icon: <FaCalculator /> },
    { id: 'quiz', label: 'Quiz', icon: <FaQuestionCircle /> }
  ];

  const handleNavClick = (id: string) => {
    // Apply tactile feedback when clicked
    const element = document.querySelector(`.bottom-nav-item[data-section="${id}"]`);
    if (element) {
      element.classList.add('nav-click-effect');
      setTimeout(() => {
        element.classList.remove('nav-click-effect');
      }, 200);
    }
    
    // Switch to the selected section immediately without delayed scroll jerk
    setActiveSection(id);
  };

  return (
    <nav className="bottom-navigation">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`bottom-nav-item ${activeSection === item.id ? 'active' : ''}`}
          onClick={() => handleNavClick(item.id)}
          aria-label={`Switch to ${item.label} section`}
          data-section={item.id}
        >
          <div className="bottom-nav-icon">{item.icon}</div>
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNavigation;
