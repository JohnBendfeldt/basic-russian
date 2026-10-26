import React from 'react';
import { PhraseItem } from '../types/index';
import Phrases from './Phrases';
import { FaCalculator, FaClock, FaLightbulb, FaInfoCircle } from 'react-icons/fa';

interface NumbersAndTimeProps {
  numbersData: PhraseItem[];
  timeData: PhraseItem[];
  activeTab: 'numbers' | 'time';
  onTabChange: (tab: 'numbers' | 'time') => void;
}

const NumbersAndTime: React.FC<NumbersAndTimeProps> = ({
  numbersData,
  timeData,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="numbers-and-time-section">
      <div className="section-tab-container">
        <div className="section-tab-bar" role="tablist" aria-label="Numbers and Time Navigation">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'numbers'}
            className={`section-tab-btn ${activeTab === 'numbers' ? 'active' : ''}`}
            onClick={() => onTabChange('numbers')}
          >
            <FaCalculator className="tab-btn-icon" aria-hidden="true" />
            <span>Numbers</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'time'}
            className={`section-tab-btn ${activeTab === 'time' ? 'active' : ''}`}
            onClick={() => onTabChange('time')}
          >
            <FaClock className="tab-btn-icon" aria-hidden="true" />
            <span>Telling Time</span>
          </button>
        </div>
      </div>

      {activeTab === 'time' && (
        <div className="time-grammar-guide">
          <div className="guide-header">
            <FaLightbulb className="guide-icon" aria-hidden="true" />
            <h3>Russian Time Grammar Rules</h3>
          </div>
          <div className="guide-grid">
            <div className="guide-card">
              <span className="guide-badge">Rule 1</span>
              <h4>The 1 / 2–4 / 5+ Hour Rule</h4>
              <p>The word for &quot;hour&quot; changes based on the number:</p>
              <ul>
                <li><strong>1:</strong> <em>один час</em> (nominative)</li>
                <li><strong>2, 3, 4:</strong> <em>два, три, четыре часа</em> (genitive singular)</li>
                <li><strong>5–12:</strong> <em>пять ... двенадцать часов</em> (genitive plural)</li>
              </ul>
            </div>

            <div className="guide-card">
              <span className="guide-badge">Rule 2</span>
              <h4>No AM / PM — Use Times of Day</h4>
              <p>Russian specifies the time of day instead of AM/PM:</p>
              <ul>
                <li><strong>утра</strong> (morning): <em>8 часов утра</em> (8:00 AM)</li>
                <li><strong>дня</strong> (afternoon): <em>2 часа дня</em> (2:00 PM)</li>
                <li><strong>вечера</strong> (evening): <em>7 часов вечера</em> (7:00 PM)</li>
                <li><strong>ночи</strong> (night): <em>2 часа ночи</em> (2:00 AM)</li>
              </ul>
            </div>

            <div className="guide-card">
              <span className="guide-badge">Rule 3</span>
              <h4>Asking the Time</h4>
              <p>Two natural ways to ask what time it is:</p>
              <ul>
                <li><strong>Который час?</strong> — Lit. &quot;Which hour?&quot; (Most common)</li>
                <li><strong>Сколько сейчас времени?</strong> — &quot;How much time is it now?&quot;</li>
                <li><strong>Во сколько?</strong> — &quot;At what time?&quot;</li>
              </ul>
            </div>
          </div>
          <div className="guide-footer-hint">
            <FaInfoCircle aria-hidden="true" />
            <span>All phrases below feature native Russian neural audio recordings. Tap any card to reveal phonetics and translation!</span>
          </div>
        </div>
      )}

      {activeTab === 'numbers' ? (
        <Phrases
          data={numbersData}
          title="Russian Numbers (0–1,000)"
          contentType="numbers"
        />
      ) : (
        <Phrases
          data={timeData}
          title="Telling Time & Time Phrases"
          contentType="time"
        />
      )}
    </div>
  );
};

export default NumbersAndTime;
