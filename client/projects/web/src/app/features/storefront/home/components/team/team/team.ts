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
    const platform = stage.querySelector<HTMLElement>('.team-stack-art');
    const title = root.querySelector<HTMLElement>('#team-title');

    // Hydration may recreate the component while retaining the server DOM.
    // Retire the previous controller before taking ownership of this section.
    teamMotionCleanups.get(root)?.();

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const disposers: Array<() => void> = [];
    let stackFrame = 0;
    let stackEnabled = false;
    let mobileStack = false;
    const renderedTransforms = new WeakMap<HTMLElement, string>();
    let stepDistance = 0;
    let titleFadeDistance = 1;
    let stackStart = 0;
    let lastProgress = -1;
    let configuredWidth = window.innerWidth;
    let configuredHeight = window.innerHeight;
    let resizeTimer = 0;
    let rowCount = scenes.length;
    let cardsPerRow = 1;

    const clearStack = (): void => {
      stackEnabled = false;
      lastProgress = -1;
      platform?.style.removeProperty('opacity');
      title?.style.removeProperty('opacity');
      this.stackReady.set(false);
      root.classList.remove('is-stack-ready', 'is-stack-fitting');
      root.style.removeProperty('--team-title-top');
      root.style.removeProperty('--team-visual-height');
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
        renderedTransforms.delete(scene);
        scene.style.removeProperty('z-index');
      });
    };

    const updateStack = (): void => {
      stackFrame = 0;
      if (!stackEnabled) return;
      const scrollY = window.scrollY;
      // Continue fading after card progress reaches its cap: this is when
      // the final card leaves its sticky position and the section scrolls out.
      if (title) {
        const exitDistance = scrollY - (stackStart + stepDistance * (rowCount - 1));
        const fade = Math.max(0, Math.min(1, exitDistance / titleFadeDistance));
        const opacity = (1 - fade * fade * (3 - 2 * fade)).toFixed(3);
        if (!title.style.opacity || Number(title.style.opacity) !== Number(opacity)) {
          title.style.opacity = opacity;
        }
      }
      const rawProgress = Math.max(0, Math.min(rowCount - 1, (scrollY - stackStart) / stepDistance));
      // Keep the visuals directly tied to the scroll position. Extra easing
      // here creates perceived input lag, especially with touch/trackpad input.
      const progress = rawProgress;
      if (progress === lastProgress) return;
      lastProgress = progress;
      // Fade during the last part of the final row's arrival. The same scroll
      // progress restores the platform naturally when scrolling back up.
      if (platform) {
        const fade = Math.max(0, Math.min(1, (progress - (rowCount - 1 - 0.4)) / 0.4));
        const opacity = (1 - fade * fade * (3 - 2 * fade)).toFixed(3);
        if (!platform.style.opacity || Number(platform.style.opacity) !== Number(opacity)) {
          platform.style.opacity = opacity;
        }
      }
      const activeRow = Math.min(rowCount - 1, Math.floor(progress + 0.5));

      scenes.forEach((scene, index) => {
        const row = Math.floor(index / cardsPerRow);
        const relative = row - progress;
        // Mobile cards only translate: completed rows stay still while the
        // incoming row covers them. Never rescale or independently move text.
        const depth = Math.min(3, Math.abs(relative));
        const y = mobileStack
          ? `${(Math.max(0, Math.min(1.1, relative)) * 100).toFixed(3)}%`
          : relative >= 0 ? `${(Math.pow(relative, 1.08) * 100).toFixed(2)}%` : `${(-depth * 15).toFixed(1)}px`;
        const scale = relative >= 0 ? 1 - Math.min(0.08, relative * 0.035) : 1 - depth * 0.018;
        const transform = mobileStack
          ? `translate3d(0, ${y}, 0)`
          : `translate3d(0, ${y}, 0) scale(${scale.toFixed(4)})`;
        if (renderedTransforms.get(scene) !== transform) {
          scene.style.transform = transform;
          renderedTransforms.set(scene, transform);
        }
        // Both the current and incoming mobile cards have exposed controls.
        // Inert would block the incoming button until the halfway threshold,
        // then disable the still-visible controls on the preceding card.
        const inactive = mobileStack
          ? row < Math.floor(progress) || row >= progress + 1
          : row !== activeRow;
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
      mobileStack = window.matchMedia('(max-width: 767px)').matches;
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
      // Match the mobile stack's full-width card geometry while measuring.
      cardsPerRow = mobileStack ? 1 : 2;
      rowCount = Math.ceil(scenes.length / cardsPerRow);
      if (rowCount < 2) return;
      root.classList.add('is-stack-fitting');
      const measureCardHeight = (): number => Math.max(...scenes.map((scene) => {
        const card = scene.querySelector<HTMLElement>('[data-team-card]');
        return card ? Math.max(card.offsetHeight, card.scrollHeight) : 0;
      }));
      let naturalCardHeight = measureCardHeight();
      const titleHeight = root.querySelector<HTMLElement>('#team-title')?.offsetHeight ?? 0;
      // On mobile the heading scrolls away, leaving room for readable bios.
      const safeTop = stickyTop + (mobileStack ? 0 : titleHeight + 16);
      const safeBottom = window.innerHeight - bottomClearance;
      const availableHeight = Math.max(1, safeBottom - safeTop);
      if (!naturalCardHeight) {
        root.classList.remove('is-stack-fitting');
        return;
      }
      // Longer bios or a shorter viewport should use some of the portrait's
      // space before falling back to the grid. Never shrink or clip the copy.
      if (naturalCardHeight > availableHeight) {
        const visual = scenes[0].querySelector<HTMLElement>('.team-card-visual');
        const visualHeight = visual?.offsetHeight ?? 0;
        const fittedHeight = Math.max(mobileStack ? 80 : 120, visualHeight - (naturalCardHeight - availableHeight) - 2);
        if (visualHeight > fittedHeight) {
          root.style.setProperty('--team-visual-height', `${fittedHeight.toFixed(0)}px`);
          naturalCardHeight = measureCardHeight();
        }
        // Very short screens retain the readable, natural-flow layout.
        if (naturalCardHeight > availableHeight) {
          root.style.removeProperty('--team-visual-height');
          root.classList.remove('is-stack-fitting');
          return;
        }
      }
      const stageHeight = naturalCardHeight;
      titleFadeDistance = Math.min(160, stageHeight * 0.4);
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
      root.style.setProperty('--team-title-top', `${stickyTop}px`);
      root.classList.remove('is-stack-fitting');
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
      // short viewport or reset its progress. On desktop, height changes are
      // real window resizes and must retry the fit check.
      const sameWidth = Math.abs(window.innerWidth - configuredWidth) < 1;
      if (sameWidth && (mobileStack || window.innerHeight === configuredHeight)) return;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        configuredWidth = window.innerWidth;
        configuredHeight = window.innerHeight;
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

      scene.addEventListener('pointerenter', engageMouse);
      scene.addEventListener('pointermove', updatePointer, { passive: true });
      scene.addEventListener('pointerleave', reset);
      scene.addEventListener('mouseenter', engageMouse);
      scene.addEventListener('mousemove', updateMouse, { passive: true });
      scene.addEventListener('mouseleave', resetMouse);
      scene.addEventListener('focusin', engage);
      scene.addEventListener('focusout', onFocusOut);
      disposers.push(() => {
        scene.removeEventListener('pointerenter', engageMouse);
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
