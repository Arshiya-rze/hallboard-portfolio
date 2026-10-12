import { afterNextRender, Directive, DestroyRef, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  host: {
    class: 'scroll-reveal',
  },
})
export class ScrollRevealDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => this.observeReveal());
  }

  private observeReveal(): void {
    const target = this.element.nativeElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;

    const bounds = target.getBoundingClientRect();
    if (bounds.top < window.innerHeight * 0.9) return;

    target.classList.add('scroll-reveal-pending');
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      target.classList.remove('scroll-reveal-pending');
      target.classList.add('scroll-reveal-visible');
      observer.disconnect();
    }, { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });

    observer.observe(target);
    const onMotionPreferenceChange = (): void => {
      if (!reducedMotion.matches) return;
      observer.disconnect();
      target.classList.remove('scroll-reveal-pending');
      target.classList.add('scroll-reveal-visible');
    };
    reducedMotion.addEventListener('change', onMotionPreferenceChange);
    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      reducedMotion.removeEventListener('change', onMotionPreferenceChange);
    });
  }
}
