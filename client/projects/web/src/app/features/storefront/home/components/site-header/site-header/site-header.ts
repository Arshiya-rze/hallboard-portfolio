import { afterNextRender, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ThemeService } from '../../../../../../core/theme/theme.service';

@Component({
  selector: 'app-site-header',
  imports: [NgOptimizedImage],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  protected readonly menuOpen = signal(false);
  protected readonly theme = inject(ThemeService);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => this.initializeScrollState());
  }

  protected toggleMenu(event: Event): void {
    this.menuOpen.set((event.target as HTMLInputElement).checked);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  private initializeScrollState(): void {
    const header = this.host.nativeElement.querySelector<HTMLElement>('.header');
    const heroShell = document.querySelector<HTMLElement>('[data-hero-film-shell]');
    if (!header) return;

    let frame = 0;
    let brandScrollAnchor = window.scrollY;
    const update = (): void => {
      frame = 0;
      const scrollY = Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight));
      const shellTop = heroShell ? heroShell.getBoundingClientRect().top + scrollY : 0;
      const heroEnd = heroShell ? shellTop + heroShell.offsetHeight - window.innerHeight : 0;
      const hasScrolled = scrollY > 18;
      // Firefox may settle exactly on the sticky hero's end coordinate while
      // Chromium can land a fractional pixel before it. Keep the header hidden
      // through that boundary; reveal it only after a real scroll past the hero.
      const hidingOverHero = hasScrolled && !!heroShell && scrollY <= heroEnd + 1;

      header.classList.toggle('is-hero-hidden', hidingOverHero);
      header.classList.toggle('is-sticky', hasScrolled && !hidingOverHero);
      if (hidingOverHero && this.menuOpen()) this.menuOpen.set(false);

      if (scrollY <= 24) {
        header.classList.remove('is-brand-expanded');
        brandScrollAnchor = scrollY;
      } else if (Math.abs(scrollY - brandScrollAnchor) >= 12) {
        header.classList.toggle('is-brand-expanded', scrollY > brandScrollAnchor);
        brandScrollAnchor = scrollY;
      }
    };
    const schedule = (): void => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    document.addEventListener('click', this.handleOutsideClick);
    document.addEventListener('keydown', this.handleEscape);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('click', this.handleOutsideClick);
      document.removeEventListener('keydown', this.handleEscape);
      if (frame) window.cancelAnimationFrame(frame);
    });
  }

  private readonly handleEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.menuOpen.set(false);
  };

  private readonly handleOutsideClick = (event: MouseEvent): void => {
    if (!this.menuOpen()) return;

    const target = event.target;
    if (!(target instanceof Node)) return;

    const header = this.host.nativeElement.querySelector<HTMLElement>('.header');
    const nav = header?.querySelector<HTMLElement>('.nav');
    const hamburger = header?.querySelector<HTMLElement>('.hamburger');
    if (nav?.contains(target) || hamburger?.contains(target)) return;

    this.closeMenu();
  };
}
