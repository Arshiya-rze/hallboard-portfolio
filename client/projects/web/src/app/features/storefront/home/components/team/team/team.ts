import { afterNextRender, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-team-section',
  imports: [NgOptimizedImage],
  templateUrl: './team.html',
  styleUrl: './team.scss',
})
export class Team {
  protected readonly activePortrait = signal<string | null>(null);
  protected readonly pinnedPortrait = signal<string | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => this.initializeCardMotion());
  }

  protected activatePortrait(id: string): void {
    this.activePortrait.set(id);
  }

  protected deactivatePortrait(id: string): void {
    if (this.pinnedPortrait() === id) return;
    if (this.activePortrait() === id) this.activePortrait.set(this.pinnedPortrait());
  }

  protected togglePortrait(id: string): void {
    if (this.pinnedPortrait() === id) {
      this.pinnedPortrait.set(null);
      if (this.activePortrait() === id) this.activePortrait.set(null);
      return;
    }
    this.pinnedPortrait.set(id);
    this.activePortrait.set(id);
  }

  private initializeCardMotion(): void {
    const scenes = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('[data-team-scene]'));
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    const disposers: Array<() => void> = [];

    for (const scene of scenes) {
      const card = scene.querySelector<HTMLElement>('[data-team-card]');
      if (!card) continue;
      const updatePointer = (event: PointerEvent): void => {
        if (event.pointerType !== 'mouse' || reducedMotion) return;
        const bounds = scene.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
        const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
        card.style.setProperty('--card-rx', `${(-y * 2.5).toFixed(2)}deg`);
        card.style.setProperty('--card-ry', `${(x * 4).toFixed(2)}deg`);
        card.style.setProperty('--card-light-x', `${(50 + x * 35).toFixed(1)}%`);
        card.style.setProperty('--card-light-y', `${(50 + y * 35).toFixed(1)}%`);
        card.style.setProperty('--card-shadow-x', `${(-x * 8).toFixed(2)}px`);
      };
      const reset = (): void => {
        card.classList.remove('is-card-engaged');
        scene.classList.remove('is-card-engaged');
        card.style.removeProperty('--card-rx');
        card.style.removeProperty('--card-ry');
        card.style.removeProperty('--card-light-x');
        card.style.removeProperty('--card-light-y');
        card.style.removeProperty('--card-shadow-x');
      };
      const engage = (): void => {
        card.classList.add('is-card-engaged');
        scene.classList.add('is-card-engaged');
      };
      const onFocusOut = (event: FocusEvent): void => {
        if (!scene.contains(event.relatedTarget as Node | null)) reset();
      };

      scene.addEventListener('pointerenter', engage);
      scene.addEventListener('pointermove', updatePointer, { passive: true });
      scene.addEventListener('pointerleave', reset);
      scene.addEventListener('focusin', engage);
      scene.addEventListener('focusout', onFocusOut);
      disposers.push(() => {
        scene.removeEventListener('pointerenter', engage);
        scene.removeEventListener('pointermove', updatePointer);
        scene.removeEventListener('pointerleave', reset);
        scene.removeEventListener('focusin', engage);
        scene.removeEventListener('focusout', onFocusOut);
      });
    }
    this.destroyRef.onDestroy(() => disposers.forEach((dispose) => dispose()));
  }
}
