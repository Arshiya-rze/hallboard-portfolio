import { afterNextRender, Component, DestroyRef, ElementRef, inject } from '@angular/core';

@Component({
  selector: 'app-contact-fab',
  imports: [],
  templateUrl: './contact-fab.html',
  styleUrl: './contact-fab.scss',
})
export class ContactFab {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => this.initializeVisibility());
  }

  private initializeVisibility(): void {
    const button = this.host.nativeElement.querySelector<HTMLElement>('.contact-fab');
    const heroShell = document.querySelector<HTMLElement>('[data-hero-film-shell]');
    const team = document.querySelector<HTMLElement>('[data-team-section]');
    if (!button || (!heroShell && !team)) return;
    let frame = 0;
    let revealAfter = 0;
    const measureRevealBoundary = (): void => {
      const scrollY = window.scrollY;
      revealAfter = heroShell
        ? heroShell.getBoundingClientRect().top + scrollY + heroShell.offsetHeight - window.innerHeight
        : team!.getBoundingClientRect().top + scrollY;
    };
    const update = (): void => {
      frame = 0;
      const scrollY = window.scrollY;
      // Keep the floating CTA out of the cinematic scene itself. The hero
      // parks at heroExit while its phone morph finishes; reveal the button
      // only after the document has actually moved beyond that boundary.
      button.hidden = scrollY <= revealAfter + 1;
    };
    const schedule = (): void => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const onResize = (): void => {
      measureRevealBoundary();
      schedule();
    };
    measureRevealBoundary();
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      if (frame) window.cancelAnimationFrame(frame);
    });
  }
}
