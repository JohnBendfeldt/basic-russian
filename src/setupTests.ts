// Extends Vitest's expect with jest-dom matchers
// e.g. expect(element).toBeInTheDocument()
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock window.scrollTo for jsdom environment
window.scrollTo = vi.fn();

// Stub canvas getContext so axe-core checks run cleanly in jsdom without unimplemented warnings
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as any;
}

// Default matchMedia mock for prefers-reduced-motion checks in jsdom
if (typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
