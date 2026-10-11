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
    const update = (): void => {
      frame = 0;
      const scrollY = window.scrollY;
      const heroExit = heroShell
        ? heroShell.getBoundingClientRect().top + scrollY + heroShell.offsetHeight - window.innerHeight
        : team!.getBoundingClientRect().top + scrollY;
      // Keep the floating CTA out of the cinematic scene itself. The hero
      // parks at heroExit while its phone morph finishes; reveal the button
      // only after the document has actually moved beyond that boundary.
      button.hidden = scrollY <= heroExit + 1;
    };
    const schedule = (): void => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    });
  }
}
