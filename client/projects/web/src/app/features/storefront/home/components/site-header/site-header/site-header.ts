import { afterNextRender, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-site-header',
  imports: [NgOptimizedImage],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  protected readonly menuOpen = signal(false);

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
      const hidingOverHero = hasScrolled && scrollY < heroEnd - 1;

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
    document.addEventListener('keydown', this.handleEscape);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('keydown', this.handleEscape);
      if (frame) window.cancelAnimationFrame(frame);
    });
  }

  private readonly handleEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.menuOpen.set(false);
  };
}
