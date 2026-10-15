import { afterNextRender, ApplicationRef, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { first } from 'rxjs';
import { ScrollRevealDirective } from '../../../../../../shared/directives/scroll-reveal.directive';

const teamMotionCleanups = new WeakMap<HTMLElement, () => void>();

@Component({
  selector: 'app-team-section',
  imports: [NgOptimizedImage, NgTemplateOutlet, ScrollRevealDirective],
  templateUrl: './team.html',
  styleUrl: './team.scss',
})
export class Team {
  protected readonly activePortrait = signal<string | null>(null);
  protected readonly pinnedPortrait = signal<string | null>(null);
  protected readonly stackReady = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly appRef = inject(ApplicationRef);

  constructor() {
    afterNextRender(() => {
      let initialized = false;
      const initialize = (): void => {
        if (initialized || this.destroyRef.destroyed) return;
        initialized = true;
        const fontsReady = document.fonts?.ready ?? Promise.resolve();
        let fontFallbackTimer = 0;
        const fontFallback = new Promise<void>((resolve) => {
          fontFallbackTimer = window.setTimeout(resolve, 700);
        });
        void Promise.race([fontsReady, fontFallback]).then(() => {
          window.clearTimeout(fontFallbackTimer);
          if (this.destroyRef.destroyed) return;
          window.requestAnimationFrame(() => this.initializeCardMotion());
        });
      };
      const stabilityFallback = window.setTimeout(initialize, 900);
      this.appRef.isStable.pipe(first((isStable) => isStable)).subscribe(() => {
        window.clearTimeout(stabilityFallback);
        initialize();
      });
    });
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
    const root = this.host.nativeElement.querySelector<HTMLElement>('[data-team-section]');
    const track = root?.querySelector<HTMLElement>('[data-team-track]');
    const stage = root?.querySelector<HTMLElement>('[data-team-stage]');
    const scenes = Array.from(root?.querySelectorAll<HTMLElement>('[data-team-scene]') ?? []);
    if (!root || !track || !stage || !scenes.length) return;
    const sceneContents = scenes.map((scene) => scene.querySelector<HTMLElement>('.team-card-content'));

    // Hydration may recreate the component while retaining the server DOM.
    // Retire the previous controller before taking ownership of this section.
    teamMotionCleanups.get(root)?.();

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const disposers: Array<() => void> = [];
    let stackFrame = 0;
    let stackEnabled = false;
    let stepDistance = 0;
    let stackStart = 0;
    let lastProgress = -1;
    let configuredWidth = window.innerWidth;
    let resizeTimer = 0;
    let rowCount = scenes.length;
    let cardsPerRow = 1;

    const clearStack = (): void => {
      stackEnabled = false;
      lastProgress = -1;
      this.stackReady.set(false);
      root.classList.remove('is-stack-ready');
      track.style.removeProperty('--team-stack-total-height');
      stage.style.removeProperty('--team-stage-height');
      stage.style.removeProperty('--team-stack-top');
      scenes.forEach((scene) => {
        scene.inert = false;
        scene.removeAttribute('aria-hidden');
        scene.style.removeProperty('--team-stack-y');
        scene.style.removeProperty('--team-stack-scale');
        scene.style.removeProperty('--team-stack-z');
        scene.style.removeProperty('--team-stack-right');
        scene.style.removeProperty('--team-copy-opacity');
        scene.style.removeProperty('--team-copy-y');
        scene.style.removeProperty('transform');
        scene.style.removeProperty('z-index');
      });
      sceneContents.forEach((content) => {
        content?.style.removeProperty('opacity');
        content?.style.removeProperty('transform');
      });
    };

    const updateStack = (): void => {
      stackFrame = 0;
      if (!stackEnabled) return;
      const scrollY = window.scrollY;
      const rawProgress = Math.max(0, Math.min(rowCount - 1, (scrollY - stackStart) / stepDistance));
      // Keep the visuals directly tied to the scroll position. Extra easing
      // here creates perceived input lag, especially with touch/trackpad input.
      const progress = rawProgress;
      if (progress === lastProgress) return;
      lastProgress = progress;
      const activeRow = Math.min(rowCount - 1, Math.floor(progress + 0.5));

      scenes.forEach((scene, index) => {
        const row = Math.floor(index / cardsPerRow);
        const relative = row - progress;
        const depth = Math.min(3, Math.abs(relative));
        const y = relative >= 0 ? `${(Math.pow(relative, 1.08) * 100).toFixed(2)}%` : `${(-depth * 15).toFixed(1)}px`;
        const scale = relative >= 0 ? 1 - Math.min(0.08, relative * 0.035) : 1 - depth * 0.018;
        const copyOpacity = Math.max(0, Math.min(1, 1 - Math.abs(relative) * 0.75));
        const copyY = Math.max(0, relative) * 16;
        scene.style.transform = `translate3d(0, ${y}, 0) scale(${scale.toFixed(4)})`;
        const content = sceneContents[index];
        if (content) {
          content.style.opacity = copyOpacity.toFixed(3);
          content.style.transform = `translateY(${copyY.toFixed(1)}px)`;
        }
        const inactive = row !== activeRow;
        if (scene.inert !== inactive) scene.inert = inactive;
        const hiddenValue = String(inactive);
        if (scene.getAttribute('aria-hidden') !== hiddenValue) scene.setAttribute('aria-hidden', hiddenValue);
      });
    };
    const scheduleStackUpdate = (): void => {
      if (stackEnabled && !stackFrame) stackFrame = window.requestAnimationFrame(updateStack);
    };

    const enableStack = (): void => {
      clearStack();
      if (reducedMotion.matches || scenes.length < 2) return;

      const header = document.querySelector<HTMLElement>('.header');
      const stickyTop = Math.max(88, (header?.offsetHeight ?? 66) + 20);
      const narrowViewport = window.matchMedia('(max-width: 559px)').matches;
      const contactFab = document.querySelector<HTMLElement>('.contact-fab');
      const fabStyles = contactFab ? window.getComputedStyle(contactFab) : null;
      const fabRect = contactFab?.getBoundingClientRect();
      const fabHeight = Math.max(
        Number.parseFloat(fabStyles?.minHeight ?? '') || 58,
        fabRect?.height ?? 0,
      );
      const estimatedSafeInset = narrowViewport ? 34 : 0;
      const fabBottom = Math.max(
        Number.parseFloat(fabStyles?.bottom ?? '') || 18,
        fabRect?.height ? window.innerHeight - fabRect.bottom : estimatedSafeInset,
      );
      const bottomClearance = Math.max(32, fabHeight + fabBottom + 12);
      cardsPerRow = narrowViewport ? 1 : 2;
      rowCount = Math.ceil(scenes.length / cardsPerRow);
      if (rowCount < 2) return;
      const naturalCardHeight = Math.max(...scenes.map((scene) => {
        const card = scene.querySelector<HTMLElement>('[data-team-card]');
        return card ? Math.max(card.offsetHeight, card.scrollHeight) : 0;
      }));
      const safeTop = stickyTop + 12;
      const safeBottom = window.innerHeight - bottomClearance;
      const availableHeight = Math.max(1, safeBottom - safeTop);
      if (!naturalCardHeight) return;
      // If the full card cannot fit between the navbar and floating CTA, retain
      // the readable natural-flow grid instead of shrinking or clipping it.
      if (naturalCardHeight > availableHeight) return;
      const stageHeight = naturalCardHeight;
      const stageTop = safeTop + (availableHeight - stageHeight) / 2;

      stepDistance = Math.min(
        availableHeight,
        Math.max(180, Math.min(620, Math.max(availableHeight * 0.52, stageHeight * 0.88))),
      );
      const stackTravel = stepDistance * (rowCount - 1);
      track.style.setProperty('--team-stack-total-height', `${(stageHeight + stackTravel).toFixed(0)}px`);
      stage.style.setProperty('--team-stage-height', `${stageHeight.toFixed(0)}px`);
      stage.style.setProperty('--team-stack-top', `${stageTop.toFixed(1)}px`);
      scenes.forEach((scene, index) => {
        const column = index % cardsPerRow;
        const row = Math.floor(index / cardsPerRow);
        // Later rows stay above earlier cards throughout their entrance.
        scene.style.zIndex = String(1000 + row);
        scene.style.setProperty('--team-stack-right', column === 0 ? '12px' : 'calc(50% + 12px)');
      });
      root.classList.add('is-stack-ready');
      this.stackReady.set(true);

      stackEnabled = true;
      // Measure the track, not its sticky child, so restoring a page mid-stack
      // preserves the right member and progress.
      stackStart = track.getBoundingClientRect().top + window.scrollY - stageTop;
      updateStack();
    };

    const onResize = (): void => {
      // Mobile browser chrome expands/collapses by changing viewport height
      // while the user scrolls. Rebuilding the stack then can disable it on a
      // short viewport or reset its progress. Only rebuild after width changes.
      if (Math.abs(window.innerWidth - configuredWidth) < 1) return;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        configuredWidth = window.innerWidth;
        enableStack();
      }, 120);
    };

    const onMotionPreferenceChange = (): void => enableStack();
    reducedMotion.addEventListener('change', onMotionPreferenceChange);
    window.addEventListener('scroll', scheduleStackUpdate, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    enableStack();
    disposers.push(() => {
      reducedMotion.removeEventListener('change', onMotionPreferenceChange);
      window.removeEventListener('scroll', scheduleStackUpdate);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(resizeTimer);
      if (stackFrame) window.cancelAnimationFrame(stackFrame);
      clearStack();
    });

    for (const scene of scenes) {
      const card = scene.querySelector<HTMLElement>('[data-team-card]');
      if (!card) continue;
      const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
      const updateTilt = (clientX: number, clientY: number): void => {
        const bounds = scene.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const x = Math.max(-1, Math.min(1, ((clientX - bounds.left) / bounds.width - 0.5) * 2));
        const y = Math.max(-1, Math.min(1, ((clientY - bounds.top) / bounds.height - 0.5) * 2));
        card.style.setProperty('--card-rx', `${(-y * 2.5).toFixed(2)}deg`);
        card.style.setProperty('--card-ry', `${(x * 4).toFixed(2)}deg`);
        card.style.setProperty('--card-light-x', `${(50 + x * 35).toFixed(1)}%`);
        card.style.setProperty('--card-light-y', `${(50 + y * 35).toFixed(1)}%`);
        card.style.setProperty('--card-shadow-x', `${(-x * 8).toFixed(2)}px`);
      };
      const updatePointer = (event: PointerEvent): void => {
        if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
        updateTilt(event.clientX, event.clientY);
      };
      // Mouse events provide a lightweight fallback for browsers/devices where
      // Pointer Events do not consistently reach transformed, stacked cards.
      const updateMouse = (event: MouseEvent): void => {
        if (!finePointer.matches || reducedMotion.matches) return;
        updateTilt(event.clientX, event.clientY);
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
      const engageMouse = (): void => {
        if (finePointer.matches) engage();
      };
      const resetMouse = (): void => {
        if (finePointer.matches) reset();
      };
      const onFocusOut = (event: FocusEvent): void => {
        if (!scene.contains(event.relatedTarget as Node | null)) reset();
      };

      scene.addEventListener('pointerenter', engage);
      scene.addEventListener('pointermove', updatePointer, { passive: true });
      scene.addEventListener('pointerleave', reset);
      scene.addEventListener('mouseenter', engageMouse);
      scene.addEventListener('mousemove', updateMouse, { passive: true });
      scene.addEventListener('mouseleave', resetMouse);
      scene.addEventListener('focusin', engage);
      scene.addEventListener('focusout', onFocusOut);
      disposers.push(() => {
        scene.removeEventListener('pointerenter', engage);
        scene.removeEventListener('pointermove', updatePointer);
        scene.removeEventListener('pointerleave', reset);
        scene.removeEventListener('mouseenter', engageMouse);
        scene.removeEventListener('mousemove', updateMouse);
        scene.removeEventListener('mouseleave', resetMouse);
        scene.removeEventListener('focusin', engage);
        scene.removeEventListener('focusout', onFocusOut);
      });
    }
    const cleanup = (): void => {
      if (teamMotionCleanups.get(root) !== cleanup) return;
      teamMotionCleanups.delete(root);
      disposers.forEach((dispose) => dispose());
    };
    teamMotionCleanups.set(root, cleanup);
    this.destroyRef.onDestroy(cleanup);
  }
}
