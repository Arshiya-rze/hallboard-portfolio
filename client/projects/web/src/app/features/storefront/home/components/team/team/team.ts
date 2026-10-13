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
  protected readonly stackStageMode = signal<'normal' | 'fixed' | 'released'>('normal');

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
    let lastActiveRow = -1;
    let stageMode: 'normal' | 'fixed' | 'released' = 'normal';
    let configuredWidth = window.innerWidth;
    let resizeTimer = 0;
    let rowCount = scenes.length;
    let cardsPerRow = 1;
    let stageLeft = 0;
    let stageWidth = 0;

    const clearStack = (): void => {
      stackEnabled = false;
      lastProgress = -1;
      lastActiveRow = -1;
      stageMode = 'normal';
      this.stackReady.set(false);
      this.stackStageMode.set('normal');
      root.classList.remove('is-stack-ready');
      track.style.removeProperty('--team-stack-travel');
      track.style.removeProperty('--team-stack-total-height');
      stage.style.removeProperty('--team-stage-height');
      stage.style.removeProperty('--team-stack-top');
      stage.style.removeProperty('--team-stage-left');
      stage.style.removeProperty('--team-stage-width');
      stage.style.removeProperty('--team-stage-release-top');
      stage.classList.remove('is-fixed', 'is-released');
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
      const stackTravel = stepDistance * (rowCount - 1);
      const nextStageMode = scrollY < stackStart
        ? 'normal'
        : scrollY < stackStart + stackTravel
          ? 'fixed'
          : 'released';
      if (nextStageMode !== stageMode) {
        this.stackStageMode.set(nextStageMode);
        stage.classList.toggle('is-fixed', nextStageMode === 'fixed');
        stage.classList.toggle('is-released', nextStageMode === 'released');
        stageMode = nextStageMode;
      }

      const rawProgress = Math.max(0, Math.min(rowCount - 1, (scrollY - stackStart) / stepDistance));
      // Keep the visuals directly tied to the scroll position. Extra easing
      // here creates perceived input lag, especially with touch/trackpad input.
      const progress = rawProgress;
      if (progress === lastProgress) return;
      lastProgress = progress;
      const activeRow = Math.min(rowCount - 1, Math.floor(progress + 0.5));

      if (activeRow !== lastActiveRow) {
        scenes.forEach((scene, index) => {
          const row = Math.floor(index / cardsPerRow);
          scene.style.zIndex = String(1000 - Math.abs(row - activeRow) * 100 + (row <= activeRow ? 1 : 0));
        });
        lastActiveRow = activeRow;
      }

      scenes.forEach((scene, index) => {
        const row = Math.floor(index / cardsPerRow);
        const relative = row - progress;
        const depth = Math.min(3, Math.abs(relative));
        const y = relative >= 0 ? `${(Math.pow(relative, 1.08) * 100).toFixed(2)}%` : `${(-depth * 15).toFixed(1)}px`;
        const scale = relative >= 0 ? 1 - Math.min(0.08, relative * 0.035) : 1 - depth * 0.018;
        const copyOpacity = Math.max(0, Math.min(1, 1 - Math.abs(relative) * 1.65));
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
      const bottomClearance = narrowViewport ? 24 : 32;
      cardsPerRow = narrowViewport ? 1 : 2;
      rowCount = Math.ceil(scenes.length / cardsPerRow);
      if (rowCount < 2) return;
      const naturalCardHeight = Math.max(...scenes.map((scene) => scene.querySelector<HTMLElement>('[data-team-card]')?.offsetHeight ?? 0));
      const minimumStageTop = stickyTop + 12;
      const availableHeight = Math.max(1, window.innerHeight - minimumStageTop - bottomClearance);
      // Keep the stack enabled in short mobile browser viewports too. Let the
      // card use the available stage height instead of falling back to a list.
      const stageHeight = Math.min(naturalCardHeight, availableHeight);
      if (!naturalCardHeight) return;
      // Center the stage in the viewport, while keeping it clear of the sticky
      // navigation and the lower viewport edge on short screens.
      const stageTop = Math.max(minimumStageTop, (window.innerHeight - stageHeight) / 2);

      stepDistance = Math.max(220, Math.min(620, window.innerHeight * (narrowViewport ? 0.46 : 0.58)));
      const stackTravel = stepDistance * (rowCount - 1);
      track.style.setProperty('--team-stack-travel', `${stackTravel.toFixed(0)}px`);
      track.style.setProperty('--team-stack-total-height', `${(stageHeight + stackTravel).toFixed(0)}px`);
      stage.style.setProperty('--team-stage-height', `${stageHeight.toFixed(0)}px`);
      stage.style.setProperty('--team-stack-top', `${stageTop.toFixed(1)}px`);
      stage.style.setProperty('--team-stage-release-top', `${stackTravel.toFixed(0)}px`);
      scenes.forEach((scene, index) => {
        const column = index % cardsPerRow;
        scene.style.setProperty('--team-stack-right', column === 0 ? '0px' : 'calc(50% + 12px)');
      });
      root.classList.add('is-stack-ready');
      this.stackReady.set(true);

      const bounds = track.getBoundingClientRect();
      stageLeft = bounds.left;
      stageWidth = bounds.width;
      stage.style.setProperty('--team-stage-left', `${stageLeft.toFixed(1)}px`);
      stage.style.setProperty('--team-stage-width', `${stageWidth.toFixed(1)}px`);
      stackEnabled = true;
      stackStart = stage.getBoundingClientRect().top + window.scrollY - stageTop;
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
      const updatePointer = (event: PointerEvent): void => {
        if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
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
    const cleanup = (): void => {
      if (teamMotionCleanups.get(root) !== cleanup) return;
      teamMotionCleanups.delete(root);
      disposers.forEach((dispose) => dispose());
    };
    teamMotionCleanups.set(root, cleanup);
    this.destroyRef.onDestroy(cleanup);
  }
}
