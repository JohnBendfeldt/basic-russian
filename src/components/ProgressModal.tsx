import React, { useEffect, useState } from 'react';
import { FaTimes, FaTrophy, FaGraduationCap, FaRedo, FaCheckCircle, FaChartBar } from 'react-icons/fa';
import { ProgressService } from '../services/progressService';
import { UserStats } from '../types/progress';
import PronunciationButton from './PronunciationButton';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({ isOpen, onClose, userEmail }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      ProgressService.getUserStats()
        .then(data => setStats(data))
        .catch(err => console.error('Error fetching progress stats:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="progress-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="progress-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="progress-modal-close" onClick={onClose} aria-label="Close modal">
          <FaTimes />
        </button>

        <div className="progress-modal-header">
          <div className="progress-header-title">
            <FaChartBar className="header-icon" />
            <div>
              <h2>Your Learning Progress</h2>
              <p className="user-indicator">
                {userEmail ? `Logged in as ${userEmail}` : 'Guest Mode (Saved in this browser)'}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="progress-loading">
            <div className="loading-spinner"></div>
            <p>Loading your statistics...</p>
          </div>
        ) : !stats || (stats.totalQuizzesTaken === 0 && stats.wordsMasteredCount === 0 && stats.wordsLearningCount === 0) ? (
          <div className="progress-empty-state">
            <FaGraduationCap className="empty-icon" />
            <h3>No Quiz History Yet</h3>
            <p>Start taking quizzes or practicing phrases to track your accuracy, mastery, and vocabulary over time!</p>
          </div>
        ) : (
          <div className="progress-modal-body">
            {/* Stat Cards Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon trophy-icon">
                  <FaTrophy />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stats.totalQuizzesTaken}</span>
                  <span className="stat-label">Quizzes Completed</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon accuracy-icon">
                  <FaChartBar />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stats.averageScore}%</span>
                  <span className="stat-label">Average Score</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon mastered-icon">
                  <FaCheckCircle />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stats.wordsMasteredCount}</span>
                  <span className="stat-label">Words Mastered</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon learning-icon">
                  <FaGraduationCap />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stats.wordsLearningCount}</span>
                  <span className="stat-label">Words Learning</span>
                </div>
              </div>
            </div>

            {/* Words To Review Section */}
            {stats.wordsToReview.length > 0 && (
              <div className="progress-section">
                <div className="section-title">
                  <FaRedo className="section-icon" />
                  <h3>Words & Phrases to Review</h3>
                </div>
                <p className="section-subtitle">
                  These items were missed recently. Practice their pronunciation to reinforce your memory.
                </p>

                <div className="review-words-list">
                  {stats.wordsToReview.map((item) => (
                    <div key={item.wordId} className="review-word-card">
                      <div className="review-word-info">
                        <span className="russian-text">{item.prompt}</span>
                        <span className="english-translation">{item.answer}</span>
                      </div>

                      <div className="review-word-actions">
                        <span className="accuracy-badge">
                          {item.timesCorrect}✓ / {item.timesIncorrect}✗
                        </span>
                        <PronunciationButton
                          text={item.prompt}
                          audioCategory={item.category as any}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Sessions List */}
            {stats.recentSessions.length > 0 && (
              <div className="progress-section">
                <div className="section-title">
                  <FaTrophy className="section-icon" />
                  <h3>Recent Quiz Sessions</h3>
                </div>

                <div className="recent-sessions-list">
                  {stats.recentSessions.map((session) => (
                    <div key={session.id} className="session-item">
                      <div className="session-meta">
                        <span className="session-category">{session.category}</span>
                        <span className="session-date">
                          {new Date(session.completedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="session-score">
                        <span className={`score-badge ${session.percentage >= 80 ? 'high' : session.percentage >= 50 ? 'med' : 'low'}`}>
                          {session.score}/{session.totalQuestions} ({session.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressModal;
