// Extends Vitest's expect with jest-dom matchers
// e.g. expect(element).toBeInTheDocument()
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock window.scrollTo for jsdom environment
window.scrollTo = vi.fn();
