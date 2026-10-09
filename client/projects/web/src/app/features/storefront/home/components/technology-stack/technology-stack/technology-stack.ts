import { NgOptimizedImage } from '@angular/common';
import { afterNextRender, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';

@Component({
  selector: 'app-technology-stack-section',
  imports: [NgOptimizedImage],
  templateUrl: './technology-stack.html',
  styleUrl: './technology-stack.scss',
})
export class TechnologyStack {
  protected readonly activeCategory = signal('frontend');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => this.initializeTabs());
  }

  private initializeTabs(): void {
    const root = this.host.nativeElement.querySelector<HTMLElement>('.tech-stack');
    if (!root) return;
    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-tech-target]'));
    const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-tech-panel]'));
    if (!tabs.length || !panels.length) return;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
    const prefersReducedMotion = (): boolean => reducedMotion?.matches ?? false;
    let timer = 0;
    let paused = false;
    let manualInteraction = false;
    let visible = false;
    const activate = (target: string): void => {
      this.activeCategory.set(target);
      tabs.forEach((tab) => {
        const active = tab.dataset['techTarget'] === target;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      panels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset['techPanel'] === target));
    };
    const stop = (): void => {
      window.clearInterval(timer);
      timer = 0;
    };
    const start = (): void => {
      stop();
      if (!visible || paused || manualInteraction || prefersReducedMotion() || document.hidden) return;
      timer = window.setInterval(() => {
        const current = tabs.findIndex((tab) => tab.dataset['techTarget'] === this.activeCategory());
        activate(tabs[(current + 1) % tabs.length]?.dataset['techTarget'] ?? 'frontend');
      }, 4000);
    };
    const onClick = (event: Event): void => {
      const target = (event.target as Element).closest<HTMLButtonElement>('[data-tech-target]');
      if (!target || !root.contains(target)) return;
      const category = target.dataset['techTarget'];
      if (!category) return;
      activate(category);
      manualInteraction = true;
      stop();
    };
    const onPointerEnter = (): void => { paused = true; stop(); };
    const onPointerLeave = (): void => { paused = false; start(); };
    const onFocusIn = (): void => { paused = true; stop(); };
    const onFocusOut = (event: FocusEvent): void => {
      if (!root.contains(event.relatedTarget as Node | null)) {
        paused = false;
        start();
      }
    };
    root.addEventListener('click', onClick);
    root.addEventListener('pointerenter', onPointerEnter);
    root.addEventListener('pointerleave', onPointerLeave);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    const visibility = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible) start();
      else stop();
    }, { threshold: 0.12 });
    visibility?.observe(root);
    const onMotionChange = (): void => prefersReducedMotion() ? stop() : start();
    const onVisibilityChange = (): void => document.hidden ? stop() : start();
    reducedMotion?.addEventListener('change', onMotionChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    this.destroyRef.onDestroy(() => {
      stop();
      visibility?.disconnect();
      root.removeEventListener('click', onClick);
      root.removeEventListener('pointerenter', onPointerEnter);
      root.removeEventListener('pointerleave', onPointerLeave);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
      reducedMotion?.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    });
  }
}
