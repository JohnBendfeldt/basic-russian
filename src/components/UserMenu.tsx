import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaSignOutAlt, FaChartLine, FaSignInAlt, FaGoogle, FaMicrosoft, FaGithub, FaShieldAlt, FaFileContract } from 'react-icons/fa';
import { supabase, signOutUser } from '../services/supabaseClient';
import { ProgressService } from '../services/progressService';
import AuthModal from './AuthModal';
import ProgressModal from './ProgressModal';

interface UserMenuProps {
  onNavigate?: (section: string) => void;
  initialUser?: any;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onNavigate, initialUser = null }) => {
  const [currentUser, setCurrentUser] = useState<any>(initialUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) return;

    // Check existing session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      if (user) {
        ProgressService.syncGuestDataToCloud();
      }
    });

    // Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user) {
        ProgressService.syncGuestDataToCloud();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    await signOutUser();
    setCurrentUser(null);
  };

  const provider = currentUser?.app_metadata?.provider;
  const displayName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User';

  return (
    <div className="user-menu-wrapper" ref={dropdownRef}>
      {currentUser ? (
        // Logged-in state: trigger and dropdown are siblings, preventing bubbling bugs
        <>
          <button 
            type="button"
            className="user-profile-trigger" 
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-label={`User menu for ${displayName}`}
          >
            {currentUser.user_metadata?.avatar_url ? (
              <img
                src={currentUser.user_metadata.avatar_url}
                alt={displayName}
                className="user-avatar-img"
              />
            ) : (
              <div className="user-avatar-placeholder">
                <FaUser />
              </div>
            )}
            <span className="user-display-name">{displayName}</span>
          </button>

          {menuOpen && (
            <div 
              className="user-dropdown-menu" 
              role="menu"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="user-dropdown-header">
                <p className="dropdown-name">{displayName}</p>
                <p className="dropdown-email">{currentUser.email}</p>
                <span className="provider-badge">
                  {provider === 'azure' ? (
                    <>
                      <FaMicrosoft /> Microsoft Entra ID
                    </>
                  ) : provider === 'github' ? (
                    <>
                      <FaGithub /> GitHub
                    </>
                  ) : (
                    <>
                      <FaGoogle /> Google
                    </>
                  )}
                </span>
              </div>

              <div className="dropdown-divider"></div>

              <button
                type="button"
                className="dropdown-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  setProgressModalOpen(true);
                }}
              >
                <FaChartLine />
                <span>My Progress & Stats</span>
              </button>

              {onNavigate && (
                <>
                  <div className="dropdown-divider"></div>
                  <button
                    type="button"
                    className="dropdown-item legal-dropdown-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onNavigate('privacy');
                    }}
                  >
                    <FaShieldAlt />
                    <span>Privacy Policy</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-item legal-dropdown-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onNavigate('terms');
                    }}
                  >
                    <FaFileContract />
                    <span>Terms of Service</span>
                  </button>
                </>
              )}

              <div className="dropdown-divider"></div>

              <button type="button" className="dropdown-item signout-btn" onClick={handleSignOut}>
                <FaSignOutAlt />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </>
      ) : (
        // Guest state
        <div className="guest-action-buttons">
          <button
            type="button"
            className="header-action-btn progress-btn"
            onClick={() => setProgressModalOpen(true)}
            title="View learning stats"
            aria-label="View learning stats"
          >
            <FaChartLine />
            <span className="btn-text">My Stats</span>
          </button>

          <button
            type="button"
            className="header-action-btn signin-btn"
            onClick={() => setAuthModalOpen(true)}
            title="Sign in to sync progress"
            aria-label="Sign in to sync progress"
          >
            <FaSignInAlt />
            <span className="btn-text">Sign In</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <ProgressModal
        isOpen={progressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        userEmail={currentUser?.email}
      />
    </div>
  );
};

export default UserMenu;
