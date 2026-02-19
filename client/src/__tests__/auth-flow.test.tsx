/**
 * AUTH FLOW TESTS
 * ===============
 * Tests for authentication logic: input validation, route guards, and
 * the auth context state machine.
 *
 * These tests do NOT require a real Firebase connection.
 * Firebase is mocked at the module boundary.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Pure validation helpers (mirrors signup.tsx inline)
// ---------------------------------------------------------------------------

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  return null;
}

const BLOCKED_DOMAINS = ['example.com', 'example.org', 'test.com'];
function isDomainBlocked(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return BLOCKED_DOMAINS.includes(domain);
}

// ---------------------------------------------------------------------------
// Email validation
// ---------------------------------------------------------------------------

describe('validateEmail', () => {
  it('accepts a standard email address', () => {
    expect(validateEmail('user@gmail.com')).toBe(true);
    expect(validateEmail('user.name+tag@company.co.uk')).toBe(true);
  });

  it('rejects missing @ symbol', () => {
    expect(validateEmail('notanemail')).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('rejects missing local part', () => {
    expect(validateEmail('@domain.com')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('rejects spaces in email', () => {
    expect(validateEmail('user @domain.com')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Password validation
// ---------------------------------------------------------------------------

describe('validatePassword', () => {
  it('accepts a password of exactly 8 characters', () => {
    expect(validatePassword('12345678')).toBeNull();
  });

  it('accepts passwords longer than 8 characters', () => {
    expect(validatePassword('a-strong-password-123!')).toBeNull();
  });

  it('rejects a 7-character password', () => {
    expect(validatePassword('1234567')).toBe('Password must be at least 8 characters');
  });

  it('rejects an empty password', () => {
    expect(validatePassword('')).toBe('Password must be at least 8 characters');
  });
});

// ---------------------------------------------------------------------------
// Domain blocklist
// ---------------------------------------------------------------------------

describe('isDomainBlocked', () => {
  it('blocks example.com', () => {
    expect(isDomainBlocked('user@example.com')).toBe(true);
  });

  it('blocks example.org', () => {
    expect(isDomainBlocked('user@example.org')).toBe(true);
  });

  it('blocks test.com', () => {
    expect(isDomainBlocked('user@test.com')).toBe(true);
  });

  it('allows gmail.com', () => {
    expect(isDomainBlocked('user@gmail.com')).toBe(false);
  });

  it('allows company domains', () => {
    expect(isDomainBlocked('employee@driiva.com')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isDomainBlocked('user@EXAMPLE.COM')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ProtectedRoute component
// ---------------------------------------------------------------------------

// Mock deps before importing the component under test
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('wouter', () => ({
  useLocation: vi.fn(() => ['/', vi.fn()]),
}));

import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const mockUseAuth = vi.mocked(useAuth);
const mockUseLocation = vi.mocked(useLocation);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockUseLocation.mockReturnValue(['/', vi.fn()] as unknown as ReturnType<typeof useLocation>);
});

describe('ProtectedRoute', () => {
  it('shows a loading spinner while auth is initialising', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      login: vi.fn(),
      logout: vi.fn(),
      setIsAuthenticated: vi.fn(),
      setUser: vi.fn(),
      checkOnboardingStatus: vi.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Spinner should render, content should not
    expect(screen.queryByText('Protected Content')).toBeNull();
    // Spinner uses animate-spin class
    expect(document.querySelector('.animate-spin')).not.toBeNull();
  });

  it('renders children when user is authenticated and onboarding is complete', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'uid-1', name: 'Test User', email: 'test@example.com', onboardingComplete: true },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      setIsAuthenticated: vi.fn(),
      setUser: vi.fn(),
      checkOnboardingStatus: vi.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeTruthy();
  });

  it('renders nothing (redirect pending) when user is not authenticated', () => {
    const mockSetLocation = vi.fn();
    mockUseLocation.mockReturnValue(['/', mockSetLocation] as unknown as ReturnType<typeof useLocation>);

    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      setIsAuthenticated: vi.fn(),
      setUser: vi.fn(),
      checkOnboardingStatus: vi.fn(),
    });

    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected Content')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it('passes through in demo mode without checking auth', () => {
    localStorage.setItem('driiva-demo-mode', 'true');

    mockUseAuth.mockReturnValue({
      user: null, // no real user
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      setIsAuthenticated: vi.fn(),
      setUser: vi.fn(),
      checkOnboardingStatus: vi.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Demo Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Demo Content')).toBeTruthy();
  });

  it('renders children when skipOnboardingCheck is true even if onboarding incomplete', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'uid-1', name: 'New User', email: 'new@example.com', onboardingComplete: false },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      setIsAuthenticated: vi.fn(),
      setUser: vi.fn(),
      checkOnboardingStatus: vi.fn(),
    });

    render(
      <ProtectedRoute skipOnboardingCheck>
        <div>Onboarding Page</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Onboarding Page')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Auth state helpers
// ---------------------------------------------------------------------------

describe('Auth utility: username → email resolution', () => {
  // This mirrors the logic in signin.tsx for resolving a username to email
  function resolveEmailFromInput(input: string, fallbackDomain = 'driiva.co.uk'): string {
    const raw = input.trim();
    if (raw.includes('@')) return raw;
    return `${raw}@${fallbackDomain}`;
  }

  it('returns an email address unchanged', () => {
    expect(resolveEmailFromInput('user@gmail.com')).toBe('user@gmail.com');
  });

  it('converts a username to an email using the fallback domain', () => {
    expect(resolveEmailFromInput('driiva1')).toBe('driiva1@driiva.co.uk');
  });

  it('trims whitespace before resolving', () => {
    expect(resolveEmailFromInput('  user@gmail.com  ')).toBe('user@gmail.com');
  });
});

// ---------------------------------------------------------------------------
// Password match validation
// ---------------------------------------------------------------------------

describe('Password confirmation check', () => {
  function passwordsMatch(a: string, b: string): boolean {
    return a === b;
  }

  it('returns true when passwords are identical', () => {
    expect(passwordsMatch('mypassword', 'mypassword')).toBe(true);
  });

  it('returns false when passwords differ', () => {
    expect(passwordsMatch('mypassword', 'differentpassword')).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(passwordsMatch('Password', 'password')).toBe(false);
  });

  it('returns false for empty vs non-empty', () => {
    expect(passwordsMatch('', 'password')).toBe(false);
  });
});
