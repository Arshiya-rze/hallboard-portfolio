import { DOCUMENT } from '@angular/common';
import { afterNextRender, computed, inject, Service, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'hallboard-theme';

@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  readonly mode = signal<ThemeMode>('dark');
  readonly isLight = computed(() => this.mode() === 'light');

  constructor() {
    // Read browser storage only after hydration; the first render stays dark and stable.
    afterNextRender(() => {
      let storedMode: string | null = null;
      try {
        storedMode = this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY) ?? null;
      } catch {
        // Storage may be unavailable in private or restricted browsing contexts.
      }

      this.apply(storedMode === 'light' ? 'light' : 'dark', false);
    });
  }

  toggle(): void {
    this.apply(this.isLight() ? 'dark' : 'light', true);
  }

  private apply(mode: ThemeMode, persist: boolean): void {
    this.mode.set(mode);
    this.document.documentElement.setAttribute('data-theme', mode);
    this.document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', mode === 'light' ? '#f4f6fb' : '#02030a');

    if (persist) {
      try {
        this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, mode);
      } catch {
        // The theme still works for the current session when storage is blocked.
      }
    }
  }
}
