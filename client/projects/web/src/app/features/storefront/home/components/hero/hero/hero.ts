import { afterNextRender, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

interface SceneDimensions {
  width: number;
  height: number;
  desktopWidth: number;
  mobileWidth: number;
  desktopHeight: number;
  mobileHeight: number;
  compactness: number;
}

@Component({
  selector: 'app-hero-section',
  imports: [NgOptimizedImage],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class HeroSection {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => this.initializeStory());
  }

  private initializeStory(): void {
    const shell = this.host.nativeElement.querySelector<HTMLElement>('[data-hero-film-shell]');
    const hero = shell?.querySelector<HTMLElement>('[data-cinematic-hero]');
    const browser = hero?.querySelector<HTMLElement>('[data-film-browser]');
    const content = hero?.querySelector<HTMLElement>('[data-browser-content]');
    const copySteps = Array.from(hero?.querySelectorAll<HTMLElement>('[data-copy-step]') ?? []);
    const scrollHint = hero?.querySelector<HTMLElement>('[data-hero-scroll-hint]');
    if (!shell || !hero || !browser || !content) return;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? { matches: false };
    const isNarrowViewport = (): boolean => window.matchMedia?.('(max-width: 767px)')?.matches ?? window.innerWidth <= 767;
    const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
    const mix = (from: number, to: number, amount: number): number => from + (to - from) * amount;
    const smooth = (from: number, to: number, value: number): number => {
      const amount = clamp((value - from) / (to - from), 0, 1);
      return amount * amount * (3 - 2 * amount);
    };

    let progress = 0;
    let frame = 0;
    let scrollFrame = 0;
    let transitionFrame = 0;
    let previousFrame = 0;
    let manuallyScrolled = false;
    let transitionActive = false;
    let transitionStartedAt = 0;
    let transitionFrom = 0;
    let transitionTo = 1;
    let touchStartY: number | null = null;
    let dimensions: SceneDimensions;
    const introEnd = 0.7;
    const transitionDuration = 620;

    const measure = (): SceneDimensions => {
      const width = hero.clientWidth || window.innerWidth;
      const height = hero.clientHeight || window.innerHeight;
      const narrow = isNarrowViewport();
      const compactness = narrow ? clamp((height - 520) / 220, 0, 1) : clamp((height - 560) / 340, 0, 1);
      const desktopHeight = Math.min(height * 0.76, 650);
      const desktopWidth = narrow ? Math.max(260, width - 28) : Math.min(width * 0.9, 1200, desktopHeight * 1.82);
      const mobileWidth = narrow ? Math.max(250, width - 44) : clamp(width * 0.3, 340, 410);
      const mobileHeight = height * (narrow ? 0.78 + 0.08 * clamp((720 - height) / 170, 0, 1) : 0.79);
      return { width, height, desktopWidth, mobileWidth, desktopHeight, mobileHeight, compactness };
    };

    dimensions = measure();

    const setProgress = (value: number): void => {
      progress = clamp(value, 0, 1);
      const narrow = isNarrowViewport();
      const markReveal = smooth(0.23, 0.35, progress);
      const browserReveal = smooth(0.35, 0.63, progress);
      const pageReveal = smooth(0.555, 0.69, progress);
      const travel = smooth(0.4, 0.64, progress);
      const mobile = smooth(0.9, 0.995, progress);
      const activeCopy = mobile >= 0.5 ? 2 : 0;
      const browserScale = 0.025 + browserReveal * 0.975;
      const frameWidth = mix(dimensions.desktopWidth, dimensions.mobileWidth, mobile);
      const frameHeight = mix(dimensions.desktopHeight, dimensions.mobileHeight, mobile);
      const set = (name: string, value: string): void => hero.style.setProperty(name, value);

      set('--film-progress', progress.toFixed(4));
      set('--hero-scroll-progress', (manuallyScrolled ? clamp((progress - introEnd) / (1 - introEnd), 0, 1) : 0).toFixed(4));
      const hintOpacity = reducedMotion.matches ? 1 : manuallyScrolled ? 1 - smooth(introEnd, introEnd + 0.14, progress) : 1;
      set('--hero-scroll-hint-opacity', hintOpacity.toFixed(3));
      scrollHint?.setAttribute('aria-hidden', hintOpacity < 0.15 ? 'true' : 'false');
      set('--mark-inset', `${((1 - markReveal) * 50).toFixed(2)}%`);
      set('--mark-opacity', smooth(0.2, 0.26, progress).toFixed(3));
      set('--beam-opacity', (1 - smooth(0.1, 0.21, progress)).toFixed(3));
      set('--beam-scale', mix(0.34, 1, smooth(0.005, 0.055, progress)).toFixed(3));
      set('--browser-opacity', browserReveal.toFixed(3));
      set('--browser-scale', browserScale.toFixed(4));
      set('--page-reveal', pageReveal.toFixed(3));
      set('--wordmark-reveal', smooth(0.555, 0.645, progress).toFixed(3));
      set('--mobile-layout', mobile.toFixed(3));
      set('--content-lift', `${mix(14, 0, pageReveal).toFixed(1)}px`);

      copySteps.forEach((step, index) => {
        const active = index === activeCopy;
        step.style.setProperty('--copy-opacity', active ? '1' : '0');
        step.style.setProperty('--copy-shift', active ? '0px' : '10px');
        step.inert = !active;
        step.setAttribute('aria-hidden', String(!active));
      });

      browser.style.width = `${frameWidth.toFixed(1)}px`;
      browser.style.height = `${frameHeight.toFixed(1)}px`;
      browser.style.setProperty('--mobile-layout', mobile.toFixed(3));
      browser.style.setProperty('--browser-radius', `${mix(25, 48, mobile).toFixed(1)}px`);
      browser.style.setProperty('--screen-radius', `${mix(13, 39, mobile).toFixed(1)}px`);
      browser.style.setProperty('--screen-inset-x', `${mix(15, 10, mobile).toFixed(1)}px`);
      browser.style.setProperty('--screen-inset-top', `${mix(15, 14, mobile).toFixed(1)}px`);
      browser.style.setProperty('--screen-inset-bottom', `${mix(25, 14, mobile).toFixed(1)}px`);
      browser.style.setProperty('--chrome-height', `${mix(32, 34, mobile).toFixed(1)}px`);
      const desktopHeader = mix(64, 82, dimensions.compactness);
      browser.style.setProperty('--site-header-height', `${mix(desktopHeader, 64, mobile).toFixed(1)}px`);
      browser.style.setProperty('--content-top', `${mix(mix(47, 54, dimensions.compactness), 53, mobile).toFixed(1)}%`);
      browser.style.setProperty('--footer-inset', `${mix(28, 14, mobile).toFixed(1)}px`);
      browser.style.setProperty('--footer-size', `${mix(10, 9, mobile).toFixed(1)}px`);
      browser.style.setProperty('--camera-width', `${mix(5, 44, mobile).toFixed(1)}px`);
      browser.style.setProperty('--camera-height', `${mix(5, 8, mobile).toFixed(1)}px`);
      browser.style.setProperty('--footer-bottom', `${mix(mix(12, 16, dimensions.compactness), 16, mobile).toFixed(1)}px`);
      const finalInset = narrow && dimensions.width <= 360 ? 18 : 24;
      browser.style.setProperty('--page-inset', `${mix(narrow ? 24 : 68, finalInset, mobile).toFixed(1)}px`);
      const titleSize = narrow ? mix(28, 32, dimensions.compactness) : mix(31, 46, dimensions.compactness);
      const supportSize = narrow ? mix(12.5, 14, dimensions.compactness) : mix(12.5, 16, dimensions.compactness);
      browser.style.setProperty('--page-title-size', `${mix(titleSize, 29, mobile).toFixed(1)}px`);
      browser.style.setProperty('--page-support-size', `${mix(supportSize, 13.5, mobile).toFixed(1)}px`);
      browser.style.setProperty('--brand-size', `${mix(narrow ? 15 : 17, 14, mobile).toFixed(1)}px`);
      browser.style.setProperty('--cta-width', `${mix(188, 204, mobile).toFixed(1)}px`);
      browser.style.setProperty('--accent-gap', `${mix(mix(12, 23, dimensions.compactness), 18, mobile).toFixed(1)}px`);
      browser.style.setProperty('--support-gap', `${mix(mix(8, 12, dimensions.compactness), 10, mobile).toFixed(1)}px`);
      browser.style.setProperty('--cta-gap', `${mix(mix(14, 28, dimensions.compactness), 23, mobile).toFixed(1)}px`);
      const brandInset = mix(narrow ? 22 : clamp(dimensions.width * 0.04, 22, 48), 22, mobile);
      browser.style.setProperty('--brand-inset', `${brandInset.toFixed(1)}px`);
      const targetX = frameWidth / 2 - mix(15, 10, mobile) - brandInset - 14;
      const targetY = dimensions.height * 0.02 + mix(15, 14, mobile) + mix(32, 34, mobile) + mix(desktopHeader, 64, mobile) / 2 - frameHeight / 2;
      const scaleToHeader = mix(1, 0.215, travel) * mix(1, browserScale, travel * 0.58);
      set('--mark-x', `${(targetX * travel).toFixed(1)}px`);
      set('--mark-y', `${(targetY * travel).toFixed(1)}px`);
      set('--mark-scale', scaleToHeader.toFixed(4));
      content.inert = pageReveal < 0.45;
      browser.style.pointerEvents = pageReveal > 0.45 ? 'auto' : 'none';
    };

    const animateIntro = (time: number): void => {
      frame = 0;
      if (document.hidden || manuallyScrolled || reducedMotion.matches) return;
      if (!previousFrame) previousFrame = time;
      const elapsed = Math.max(0, time - previousFrame);
      previousFrame = time;
      setProgress(Math.min(introEnd, progress + (elapsed / 2800) * introEnd));
      if (progress < introEnd) frame = window.requestAnimationFrame(animateIntro);
    };

    const sceneEnd = (): number => {
      const sceneTop = shell.getBoundingClientRect().top + window.scrollY;
      return sceneTop + shell.offsetHeight - window.innerHeight;
    };
    const sceneStart = (): number => shell.getBoundingClientRect().top + window.scrollY;
    let startY = sceneStart();
    let endY = sceneEnd();
    const updateFromScroll = (): void => {
      if (!manuallyScrolled) return;
      const span = Math.max(1, endY - startY);
      const scrollProgress = clamp((window.scrollY - startY) / span, 0, 1);
      setProgress(introEnd + scrollProgress * (1 - introEnd));
    };
    const animateTransition = (time: number): void => {
      const amount = clamp((time - transitionStartedAt) / transitionDuration, 0, 1);
      const eased = amount * amount * (3 - 2 * amount);
      setProgress(transitionFrom + (transitionTo - transitionFrom) * eased);
      if (amount < 1 && transitionActive) {
        transitionFrame = window.requestAnimationFrame(animateTransition);
        return;
      }
      transitionFrame = 0;
      transitionActive = false;
    };
    const cancelTransition = (): void => {
      if (transitionFrame) window.cancelAnimationFrame(transitionFrame);
      transitionFrame = 0;
      transitionActive = false;
      updateFromScroll();
    };
    const finishTransition = (): void => {
      if (transitionFrame) window.cancelAnimationFrame(transitionFrame);
      transitionFrame = 0;
      transitionActive = false;
      setProgress(transitionTo);
    };
    const beginTransition = (targetProgress: number): void => {
      if (transitionActive || Math.abs(progress - targetProgress) < 0.001 || reducedMotion.matches) return;
      manuallyScrolled = true;
      transitionActive = true;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      startY = sceneStart();
      endY = sceneEnd();
      transitionFrom = progress;
      transitionTo = targetProgress;
      transitionStartedAt = performance.now();

      // Move the document to the sticky scene's end immediately, then animate
      // only the artwork. Native smooth scrolling is interruptible by wheel
      // input in Safari and can leave the old scroll lock active indefinitely.
      window.scrollTo({ top: targetProgress > introEnd ? endY : startY, behavior: 'instant' });
      transitionFrame = window.requestAnimationFrame(animateTransition);
    };
    const onWheel = (event: WheelEvent): void => {
      if (!shell.contains(event.target as Node) || event.ctrlKey || reducedMotion.matches) return;
      if (event.deltaY < 0) {
        if (transitionActive) cancelTransition();
        if (progress > introEnd + 0.001) {
          event.preventDefault();
          beginTransition(introEnd);
        }
        return;
      }
      if (event.deltaY === 0) return;
      if (transitionActive) {
        if (transitionTo > introEnd) {
          // If the next scroll arrives before the morph finishes, complete it
          // and let that same gesture continue into the following section.
          finishTransition();
          return;
        }
        event.preventDefault();
        cancelTransition();
        beginTransition(1);
      } else if (progress < 1) {
        event.preventDefault();
        beginTransition(1);
      }
    };
    const onTouchStart = (event: TouchEvent): void => {
      const startedInsideScene = event.target instanceof Node && shell.contains(event.target);
      touchStartY = startedInsideScene && event.touches.length === 1 ? event.touches[0]?.clientY ?? null : null;
    };
    const onTouchMove = (event: TouchEvent): void => {
      if (touchStartY === null || event.touches.length !== 1 || reducedMotion.matches) return;
      const nextY = event.touches[0]?.clientY;
      if (nextY === undefined) return;
      const delta = touchStartY - nextY;
      if (transitionActive && delta > 8 && transitionTo > introEnd) {
        finishTransition();
        return;
      }
      const reversedDuringTransition = transitionActive && (
        delta < -8 && transitionTo > introEnd || delta > 8 && transitionTo <= introEnd + 0.001
      );
      if (reversedDuringTransition) cancelTransition();
      if ((delta > 8 && progress < 1) || (delta < -8 && progress > introEnd)) event.preventDefault();
    };
    const onTouchEnd = (event: TouchEvent): void => {
      const endTouchY = event.changedTouches[0]?.clientY;
      if (touchStartY !== null && endTouchY !== undefined) {
        const delta = touchStartY - endTouchY;
        if (delta > 8 && progress < 1) beginTransition(1);
        else if (delta < -8 && progress > introEnd) beginTransition(introEnd);
      }
      touchStartY = null;
    };
    const onScroll = (): void => {
      if (transitionActive || scrollFrame) return;
      if (!manuallyScrolled && window.scrollY > startY + 1) {
        manuallyScrolled = true;
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        startY = sceneStart();
        endY = sceneEnd();
      }
      if (!manuallyScrolled) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        updateFromScroll();
      });
    };
    const onResize = (): void => {
      dimensions = measure();
      if (manuallyScrolled) {
        startY = sceneStart();
        endY = sceneEnd();
        if (!transitionActive) updateFromScroll();
      }
      setProgress(progress);
    };
    const onVisibilityChange = (): void => {
      if (!document.hidden && !manuallyScrolled && !reducedMotion.matches && progress < introEnd && !frame) {
        previousFrame = 0;
        frame = window.requestAnimationFrame(animateIntro);
      }
    };

    hero.classList.add('is-ready');
    hero.classList.toggle('is-reduced-motion', reducedMotion.matches);
    if (reducedMotion.matches) {
      manuallyScrolled = true;
      setProgress(isNarrowViewport() ? 1 : introEnd);
    } else if (window.scrollY > 0) {
      manuallyScrolled = true;
      startY = sceneStart();
      endY = sceneEnd();
      setProgress(introEnd + clamp((window.scrollY - startY) / Math.max(1, endY - startY), 0, 1) * (1 - introEnd));
    } else {
      setProgress(0);
      frame = window.requestAnimationFrame(animateIntro);
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (frame) window.cancelAnimationFrame(frame);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      if (transitionFrame) window.cancelAnimationFrame(transitionFrame);
    });
  }
}
