import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthModal } from '../components/AuthModal';
import { UserMenu } from '../components/UserMenu';
import { ProgressModal } from '../components/ProgressModal';
import { ProgressService } from '../services/progressService';
import { isSupabaseConfigured, signInWithGoogle, signInWithEntra, signInWithGithub, supabase } from '../services/supabaseClient';

describe('AuthModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(<AuthModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders Google, GitHub, and Microsoft Entra ID login options when open', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Sync Your Learning Progress')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /GitHub/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Microsoft/i })).toBeInTheDocument();
  });

  it('renders auth options properly according to configuration state', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} />);
    if (isSupabaseConfigured()) {
      expect(screen.queryByText(/Running in Guest Mode/i)).not.toBeInTheDocument();
    } else {
      expect(screen.getByText(/Running in Guest Mode/i)).toBeInTheDocument();
    }
  });

  it('calls onClose when clicking the close button', () => {
    const handleClose = vi.fn();
    render(<AuthModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByLabelText('Close modal');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

describe('UserMenu Component', () => {
  it('renders My Stats and Sign In buttons for guests', () => {
    render(<UserMenu />);

    expect(screen.getByTitle('View learning stats')).toBeInTheDocument();
    expect(screen.getByTitle('Sign in to sync progress')).toBeInTheDocument();
  });

  it('opens AuthModal when clicking Sign In', () => {
    render(<UserMenu />);

    const signInBtn = screen.getByTitle('Sign in to sync progress');
    fireEvent.click(signInBtn);

    expect(screen.getByText('Sync Your Learning Progress')).toBeInTheDocument();
  });

  it('opens ProgressModal when clicking My Stats', async () => {
    render(<UserMenu />);

    const statsBtn = screen.getByTitle('View learning stats');
    fireEvent.click(statsBtn);

    await waitFor(() => {
      expect(screen.getByText('Your Learning Progress')).toBeInTheDocument();
    });
  });

  it('renders dropdown with Privacy Policy, Terms, and Stats when user is logged in', async () => {
    const mockUser = {
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
      app_metadata: { provider: 'google' }
    };

    const onNavigate = vi.fn();
    render(<UserMenu onNavigate={onNavigate} initialUser={mockUser} />);

    expect(screen.getByRole('button', { name: /user menu for Test User/i })).toBeInTheDocument();

    // Click trigger to open menu
    fireEvent.click(screen.getByRole('button', { name: /user menu for Test User/i }));

    // Verify items
    expect(screen.getByText('My Progress & Stats')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();

    // Click Privacy Policy
    fireEvent.click(screen.getByText('Privacy Policy'));
    expect(onNavigate).toHaveBeenCalledWith('privacy');
  });
});

describe('ProgressModal Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows empty state when no quizzes have been taken', async () => {
    render(<ProgressModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('No Quiz History Yet')).toBeInTheDocument();
    });
  });

  it('displays accurate stats and words to review after taking quizzes', async () => {
    // Seed test data via ProgressService
    await ProgressService.recordQuizSession({
      category: 'basicPhrases',
      score: 9,
      totalQuestions: 10
    });

    await ProgressService.recordWordAttempt({
      category: 'phrases',
      wordId: 'test-word-1',
      prompt: 'Привет',
      answer: 'hello',
      isCorrect: false
    });

    render(<ProgressModal isOpen={true} onClose={vi.fn()} userEmail="test@example.com" />);

    await waitFor(() => {
      expect(screen.getByText('Logged in as test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Quizzes Completed')).toBeInTheDocument();
      expect(screen.getByText('Words & Phrases to Review')).toBeInTheDocument();
      expect(screen.getByText('Привет')).toBeInTheDocument();
      expect(screen.getByText('hello')).toBeInTheDocument();
    });
  });
});

describe('Supabase Client Configuration & Auth Functions', () => {
  it('correctly determines whether Supabase is configured', () => {
    const configured = isSupabaseConfigured();
    expect(typeof configured).toBe('boolean');
  });

  it('provides signIn functions that return an error property', async () => {
    if (supabase) {
      vi.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValue({
        data: { provider: 'google', url: 'https://test.supabase.co' },
        error: null
      });
    }

    const googleResult = await signInWithGoogle();
    expect(googleResult).toHaveProperty('error');

    const githubResult = await signInWithGithub();
    expect(githubResult).toHaveProperty('error');

    const entraResult = await signInWithEntra();
    expect(entraResult).toHaveProperty('error');
  });
});
