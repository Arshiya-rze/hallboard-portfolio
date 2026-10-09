import { afterNextRender, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';

@Component({
  selector: 'app-services-section',
  imports: [],
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class Services {
  protected readonly serviceDots = signal<number[]>([]);
  protected readonly activeService = signal(0);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => this.initializeSlider());
  }

  protected goToService(index: number): void {
    const viewport = this.host.nativeElement.querySelector<HTMLElement>('.services-viewport');
    const track = this.host.nativeElement.querySelector<HTMLElement>('.services-grid');
    const cards = Array.from(track?.children ?? []) as HTMLElement[];
    if (!viewport || !cards.length) return;
    const maxIndex = Math.max(0, cards.length - this.servicesPerView());
    const nextIndex = Math.max(0, Math.min(index, maxIndex));
    this.activeService.set(nextIndex);
    viewport.scrollTo({ left: cards[nextIndex]?.offsetLeft ?? 0, behavior: this.prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  private initializeSlider(): void {
    const root = this.host.nativeElement;
    const observationTarget = root.querySelector<HTMLElement>('.what-we-do') ?? root;
    const viewport = root.querySelector<HTMLElement>('.services-viewport');
    const track = root.querySelector<HTMLElement>('.services-grid');
    const cards = Array.from(track?.children ?? []) as HTMLElement[];
    if (!viewport || !track || !cards.length) return;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
    const prefersReducedMotion = (): boolean => reducedMotion?.matches ?? false;
    const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('.services-dot'));
    let autoplay = 0;
    let scrollTimer = 0;
    let visible = false;
    let paused = false;
    let manualInteraction = false;

    const perView = (): number => this.servicesPerView();
    const maxIndex = (): number => Math.max(0, cards.length - perView());
    const nearestIndex = (): number => cards.reduce((nearest, card, index) => {
      const distance = Math.abs(card.offsetLeft - viewport.scrollLeft);
      return distance < Math.abs((cards[nearest]?.offsetLeft ?? 0) - viewport.scrollLeft) ? index : nearest;
    }, 0);
    const syncIndex = (index: number): void => {
      const bounded = Math.max(0, Math.min(index, maxIndex()));
      this.activeService.set(bounded);
      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === bounded;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', String(active));
      });
    };
    const stop = (): void => {
      window.clearInterval(autoplay);
      autoplay = 0;
    };
    const start = (): void => {
      if (autoplay || !visible || paused || manualInteraction || prefersReducedMotion() || maxIndex() === 0) return;
      autoplay = window.setInterval(() => {
        if (!document.hidden) this.goToService((this.activeService() + 1) % (maxIndex() + 1));
      }, 4000);
    };
    const disable = (): void => {
      manualInteraction = true;
      stop();
    };
    const onScroll = (): void => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => syncIndex(Math.min(nearestIndex(), maxIndex())), 80);
    };
    const previous = (): void => this.goToService(this.activeService() >= maxIndex() ? 0 : this.activeService() + 1);
    const next = (): void => this.goToService(this.activeService() <= 0 ? maxIndex() : this.activeService() - 1);
    const previousButton = root.querySelector<HTMLButtonElement>('[data-slider-prev]');
    const nextButton = root.querySelector<HTMLButtonElement>('[data-slider-next]');
    const onPointerEnter = (): void => { paused = true; stop(); };
    const onPointerLeave = (): void => { paused = false; start(); };
    const onPointerDown = (): void => disable();
    const onWheel = (): void => disable();
    const onFocusIn = (): void => disable();
    previousButton?.addEventListener('click', previous);
    nextButton?.addEventListener('click', next);
    viewport.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('pointerenter', onPointerEnter);
    root.addEventListener('pointerleave', onPointerLeave);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('pointerdown', onPointerDown, { passive: true });
    root.addEventListener('wheel', onWheel, { passive: true });

    const visibility = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible) start();
      else stop();
    }, { threshold: 0.12 });
    visibility?.observe(observationTarget);
    const onResize = (): void => {
      this.serviceDots.set(Array.from({ length: maxIndex() + 1 }, (_, index) => index));
      this.goToService(Math.min(this.activeService(), maxIndex()));
    };
    const onMotionChange = (): void => prefersReducedMotion() ? stop() : start();
    window.addEventListener('resize', onResize, { passive: true });
    reducedMotion?.addEventListener('change', onMotionChange);
    this.serviceDots.set(Array.from({ length: maxIndex() + 1 }, (_, index) => index));
    this.destroyRef.onDestroy(() => {
      stop();
      window.clearTimeout(scrollTimer);
      visibility?.disconnect();
      window.removeEventListener('resize', onResize);
      reducedMotion?.removeEventListener('change', onMotionChange);
      viewport.removeEventListener('scroll', onScroll);
      root.removeEventListener('pointerenter', onPointerEnter);
      root.removeEventListener('pointerleave', onPointerLeave);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('wheel', onWheel);
      previousButton?.removeEventListener('click', previous);
      nextButton?.removeEventListener('click', next);
    });
  }

  private servicesPerView(): number {
    if (typeof window === 'undefined') return 1;
    if (window.matchMedia?.('(min-width: 1180px)')?.matches ?? window.innerWidth >= 1180) return 3;
    if (window.matchMedia?.('(min-width: 768px)')?.matches ?? window.innerWidth >= 768) return 2;
    return 1;
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false);
  }
}
