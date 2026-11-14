import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';
import RussianKeyboard from '../components/RussianKeyboard';
import AuthModal from '../components/AuthModal';
import UserMenu from '../components/UserMenu';
import * as supabaseMod from '../services/supabaseClient';
import * as speechMod from '../utils/speech';
import { ProgressService } from '../services/progressService';

describe('App Routing, Numbers & Time, RussianKeyboard, AuthModal & UserMenu', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    localStorage.clear();
    vi.spyOn(speechMod, 'initVoices').mockResolvedValue();
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('routes cleanly across /, /words, /time, /numbers, /phrases, /quiz, /terms, /privacy, and popstate', async () => {
    window.history.pushState({}, '', '/time/');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /Russian Time Grammar Rules/i })).toBeInTheDocument();
    expect(document.title).toContain('Russian Time');

    // Switch back to Numbers tab inside NumbersAndTime
    fireEvent.click(screen.getByRole('tab', { name: /Numbers/i }));
    expect(await screen.findByRole('heading', { name: /Russian Numbers/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/numbers');

    // Switch via BottomNavigation to Words and Phrases
    fireEvent.click(screen.getByRole('button', { name: 'Switch to Words section' }));
    expect(await screen.findByRole('heading', { name: /Common Words/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/words');

    fireEvent.click(screen.getByRole('button', { name: 'Switch to Phrases section' }));
    expect(await screen.findByRole('heading', { name: /Basic Phrases/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/phrases');

    // Top Navigation bar -> Quiz
    const navListItems = document.querySelectorAll('.navigation li');
    const quizNavItem = Array.from(navListItems).find((el) => el.textContent === 'Quiz')!;
    fireEvent.click(quizNavItem);
    expect(window.location.pathname).toBe('/quiz');

    // Footer Terms of Service -> View Privacy Policy -> Back to Practice
    fireEvent.click(screen.getByRole('link', { name: 'Terms of Service' }));
    expect(await screen.findByRole('heading', { name: 'Terms of Service' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/terms');

    fireEvent.click(screen.getByRole('button', { name: 'View Privacy Policy' }));
    expect(await screen.findByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/privacy');

    // Header h1 logo returns to alphabet
    fireEvent.click(screen.getByTitle('Return to alphabet lessons'));
    expect(await screen.findByRole('heading', { name: /Russian Alphabet/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/alphabet');

    // Browser popstate back to /terms and Back to Practice button
    act(() => {
      window.history.pushState({}, '', '/terms');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(await screen.findByRole('heading', { name: 'Terms of Service' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to practice lessons' }));
    expect(await screen.findByRole('heading', { name: /Russian Alphabet/i })).toBeInTheDocument();
  });

  it('handles PWA beforeinstallprompt, Install App click, and appinstalled events', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: /Russian Alphabet/i });

    const promptSpy = vi.fn();
    const fakeInstallEvent = new Event('beforeinstallprompt');
    Object.assign(fakeInstallEvent, {
      preventDefault: vi.fn(),
      prompt: promptSpy,
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });

    act(() => {
      window.dispatchEvent(fakeInstallEvent);
    });

    const installBtn = await screen.findByRole('button', { name: 'Install App' });
    fireEvent.click(installBtn);
    expect(promptSpy).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Install App' })).not.toBeInTheDocument());

    act(() => {
      window.dispatchEvent(fakeInstallEvent);
    });
    expect(await screen.findByRole('button', { name: 'Install App' })).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });
    expect(screen.queryByRole('button', { name: 'Install App' })).not.toBeInTheDocument();
  });

  it('emits phonetic keys, space, soft sign, special letters, uppercase vowels, backspace, and clear in RussianKeyboard', () => {
    const onLetterClick = vi.fn();
    render(<RussianKeyboard onLetterClick={onLetterClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Insert letter щ' }));
    expect(onLetterClick).toHaveBeenLastCalledWith('щ');

    fireEvent.click(screen.getByRole('button', { name: 'Space' }));
    expect(onLetterClick).toHaveBeenLastCalledWith(' ');

    fireEvent.click(screen.getByRole('button', { name: 'Insert soft sign (ь)' }));
    expect(onLetterClick).toHaveBeenLastCalledWith('ь');

    fireEvent.click(screen.getByRole('button', { name: 'Insert letter Я' }));
    expect(onLetterClick).toHaveBeenLastCalledWith('я');

    fireEvent.click(screen.getByRole('button', { name: 'Insert uppercase letter А' }));
    expect(onLetterClick).toHaveBeenLastCalledWith('А');

    fireEvent.click(screen.getByRole('button', { name: 'Backspace' }));
    expect(onLetterClick).toHaveBeenLastCalledWith('backspace');

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onLetterClick).toHaveBeenLastCalledWith('clear');
  });

  it('invokes Google, GitHub, and Microsoft Entra login handlers in AuthModal and displays errors', async () => {
    const onClose = vi.fn();
    vi.spyOn(supabaseMod, 'signInWithGoogle').mockResolvedValue({ error: new Error('Google OAuth disabled') });
    vi.spyOn(supabaseMod, 'signInWithGithub').mockRejectedValue(new Error('GitHub timeout'));
    const entraSpy = vi.spyOn(supabaseMod, 'signInWithEntra').mockResolvedValue({ error: null });

    render(<AuthModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    expect(await screen.findByText('Google OAuth disabled')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in with GitHub' }));
    expect(await screen.findByText('GitHub timeout')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Microsoft Entra ID' }));
    await waitFor(() => expect(entraSpy).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('validates UserMenu avatar URLs, provider badges, outside click dismissal, legal links, and sign-out', async () => {
    const signOutSpy = vi.spyOn(supabaseMod, 'signOutUser').mockResolvedValue({ error: null });
    const onNavigate = vi.fn();
    vi.spyOn(ProgressService, 'getUserStats').mockResolvedValue({
      totalQuizzesTaken: 0,
      averageScore: 0,
      wordsMasteredCount: 0,
      wordsLearningCount: 0,
      wordsToReview: [],
      recentSessions: [],
    });

    const { unmount } = render(
      <UserMenu
        onNavigate={onNavigate}
        initialUser={{
          id: 'u1',
          email: 'ivan@example.com',
          app_metadata: { provider: 'github' },
          user_metadata: { full_name: 'Ivan', avatar_url: 'javascript:alert(1)' },
        }}
      />
    );

    const trigger = screen.getByRole('button', { name: 'User menu for Ivan' });
    expect(document.querySelector('.user-avatar-img')).toBeNull();

    fireEvent.click(trigger);
    expect(screen.getByText(/GitHub/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Privacy Policy'));
    expect(onNavigate).toHaveBeenCalledWith('privacy');

    fireEvent.click(trigger);
    fireEvent.click(screen.getByText('Terms of Service'));
    expect(onNavigate).toHaveBeenCalledWith('terms');

    fireEvent.click(trigger);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(trigger);
    fireEvent.click(screen.getByText('Sign Out'));
    await waitFor(() => expect(signOutSpy).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('button', { name: 'Sign in to sync progress' })).toBeInTheDocument();

    unmount();

    render(
      <UserMenu
        initialUser={{
          id: 'u2',
          email: 'olga@example.com',
          app_metadata: { provider: 'azure' },
          user_metadata: { full_name: 'Olga', avatar_url: 'https://avatars.githubusercontent.com/u/2?v=4' },
        }}
      />
    );
    expect(screen.getByAltText('Olga')).toHaveAttribute('referrerpolicy', 'no-referrer');
  });

  it('renders secure links to Basic Language School in the header, footer, and user menu', async () => {
    render(<App />);

    const headerLink = await screen.findByRole('link', {
      name: /Explore 15\+ world languages on Basic Language School/i,
    });
    expect(headerLink).toHaveAttribute('href', 'https://basiclanguage.school');
    expect(headerLink).toHaveAttribute('rel', 'noopener noreferrer');

    const footerLink = screen.getByRole('link', { name: 'Basic Language School' });
    expect(footerLink).toHaveAttribute('href', 'https://basiclanguage.school');
    expect(footerLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
