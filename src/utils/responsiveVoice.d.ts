/**
 * Type definitions for ResponsiveVoice
 */

interface ResponsiveVoiceParameters {
  pitch?: number;
  rate?: number;
  volume?: number;
  lang?: string;
  voice?: string;
  onend?: () => void;
  onerror?: (error?: any) => void;
  [key: string]: any;
}

interface ResponsiveVoice {
  speak(text: string, voice?: string, parameters?: ResponsiveVoiceParameters): void;
  cancel(): void;
  pause(): void;
  resume(): void;
  isPlaying(): boolean;
  enableWindowClickHook(): void;
  setDefaultVoice(voice: string): void;
  getVoices(): Array<{name: string}>;
}

declare global {
  interface Window {
    responsiveVoice: ResponsiveVoice;
  }
}

export {};
