import React, { useState } from 'react';
import { FaTimes, FaGoogle, FaMicrosoft, FaGithub, FaLock } from 'react-icons/fa';
import { signInWithGoogle, signInWithEntra, signInWithGithub, isSupabaseConfigured } from '../services/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sanitizeAuthError = (
  raw?: string | null,
  fallback = 'Authentication failed. Please try again.'
): string => {
  if (!raw || typeof raw !== 'string') return fallback;
  const cleaned = raw
    .replace(/<[^>]*>/g, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return fallback;
  if (/postgres|pgrst|pg_|sqlstate|syntax error|stack trace|at \S+\s+\(/i.test(cleaned)) {
    return fallback;
  }
  return cleaned.slice(0, 180);
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'azure' | 'github' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoadingProvider('google');
    setErrorMessage(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) setErrorMessage(sanitizeAuthError(error.message, 'Failed to initialize Google login'));
    } catch (err: any) {
      setErrorMessage(sanitizeAuthError(err?.message, 'Failed to initialize Google login'));
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGithubLogin = async () => {
    setLoadingProvider('github');
    setErrorMessage(null);
    try {
      const { error } = await signInWithGithub();
      if (error) setErrorMessage(sanitizeAuthError(error.message, 'Failed to initialize GitHub login'));
    } catch (err: any) {
      setErrorMessage(sanitizeAuthError(err?.message, 'Failed to initialize GitHub login'));
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleEntraLogin = async () => {
    setLoadingProvider('azure');
    setErrorMessage(null);
    try {
      const { error } = await signInWithEntra();
      if (error) setErrorMessage(sanitizeAuthError(error.message, 'Failed to initialize Microsoft login'));
    } catch (err: any) {
      setErrorMessage(sanitizeAuthError(err?.message, 'Failed to initialize Microsoft login'));
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close modal">
          <FaTimes />
        </button>

        <div className="auth-modal-header">
          <div className="auth-modal-icon">
            <FaLock />
          </div>
          <div className="auth-ecosystem-badge">
            <span aria-hidden="true">🌐</span> Basic Language School Account
          </div>
          <h2>Sync Your Learning Progress</h2>
          <p>
            Sign in with your <strong>Basic Language School</strong> account to save your quiz history, track words mastered, and sync across all 15+ language apps.
          </p>
        </div>

        {errorMessage && (
          <div className="auth-modal-alert auth-modal-error">
            {errorMessage}
          </div>
        )}

        {!configured && (
          <div className="auth-modal-alert auth-modal-info">
            <strong>Running in Guest Mode:</strong> Your progress is currently saved offline in your browser. To enable live cloud sync, connect your Supabase project credentials in <code>.env.local</code>.
          </div>
        )}

        <div className="auth-providers-grid">
          {/* Google */}
          <button
            className={`auth-tile-btn google-tile ${loadingProvider === 'google' ? 'loading' : ''}`}
            onClick={handleGoogleLogin}
            disabled={loadingProvider !== null}
            title="Sign in with Google (Gmail)"
            aria-label="Sign in with Google"
          >
            <div className="auth-tile-icon-wrap google">
              <FaGoogle className="tile-icon" />
            </div>
            <div className="auth-tile-text">
              <span className="tile-name">Google</span>
              <span className="tile-subtext">Gmail</span>
            </div>
          </button>

          {/* GitHub */}
          <button
            className={`auth-tile-btn github-tile ${loadingProvider === 'github' ? 'loading' : ''}`}
            onClick={handleGithubLogin}
            disabled={loadingProvider !== null}
            title="Sign in with GitHub"
            aria-label="Sign in with GitHub"
          >
            <div className="auth-tile-icon-wrap github">
              <FaGithub className="tile-icon" />
            </div>
            <div className="auth-tile-text">
              <span className="tile-name">GitHub</span>
              <span className="tile-subtext">1-Click</span>
            </div>
          </button>

          {/* Microsoft */}
          <button
            className={`auth-tile-btn entra-tile ${loadingProvider === 'azure' ? 'loading' : ''}`}
            onClick={handleEntraLogin}
            disabled={loadingProvider !== null}
            title="Sign in with Microsoft Entra ID"
            aria-label="Sign in with Microsoft Entra ID"
          >
            <div className="auth-tile-icon-wrap entra">
              <FaMicrosoft className="tile-icon" />
            </div>
            <div className="auth-tile-text">
              <span className="tile-name">Microsoft</span>
              <span className="tile-subtext">Entra ID</span>
            </div>
          </button>
        </div>

        {loadingProvider && (
          <div className="auth-loading-notice">
            Connecting to {loadingProvider === 'azure' ? 'Microsoft' : loadingProvider === 'github' ? 'GitHub' : 'Google'}...
          </div>
        )}

        <div className="auth-modal-footer">
          <p>We respect your privacy.</p>
          <p>No spam, only your language learning progress.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
