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
  laptopViewport: boolean;
  narrow: boolean;
  headerBottom: number;
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
    const symbol = hero?.querySelector<HTMLElement>('[data-film-symbol]');
    const symbolImage = symbol?.querySelector<HTMLElement>('.hero-film-symbol-image');
    const beam = hero?.querySelector<HTMLElement>('.hero-film-beam');
    const wordmark = browser?.querySelector<HTMLElement>('.hero-browser-wordmark');
    const scrollMeter = hero?.querySelector<HTMLElement>('.hero-scroll-meter i');
    const copySteps = Array.from(hero?.querySelectorAll<HTMLElement>('[data-copy-step]') ?? []);
    const scrollHint = hero?.querySelector<HTMLElement>('[data-hero-scroll-hint]');
    if (!shell || !hero || !browser || !content || !symbol || !symbolImage || !beam || !wordmark || !scrollMeter || !scrollHint) return;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? { matches: false };
    const isNarrowViewport = (): boolean => window.matchMedia?.('(max-width: 767px)')?.matches ?? window.innerWidth <= 767;
    const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
    const mix = (from: number, to: number, amount: number): number => from + (to - from) * amount;
    const smooth = (from: number, to: number, value: number): number => {
      const amount = clamp((value - from) / (to - from), 0, 1);
      return amount * amount * (3 - 2 * amount);
    };

    let progress = 0;
    let renderedProgress: number | null = null;
    let renderedCopy = -1;
    let hintIsHidden: boolean | null = null;
    let shellTop = 0;
    let shellEnd = 0;
    let frame = 0;
    let transitionFrame = 0;
    let previousFrame = 0;
    let manuallyScrolled = false;
    let dimensions: SceneDimensions;
    let measuredViewportWidth = window.innerWidth;
    const header = document.querySelector<HTMLElement>('.header');
    const introEnd = 0.7;
    let stage: 'desktop' | 'mobile' = 'desktop';
    let transitioning = false;
    let touchStartY: number | null = null;
    let touchStartedInHero = false;
    let touchCaptured = false;
    let touchStageChanged = false;
    const inlineStyleCache = new WeakMap<HTMLElement, Map<string, string>>();

    const setInlineStyle = (element: HTMLElement, property: string, value: string): void => {
      let values = inlineStyleCache.get(element);
      if (!values) {
        values = new Map<string, string>();
        inlineStyleCache.set(element, values);
      }
      if (values.get(property) === value) return;
      values.set(property, value);
      element.style.setProperty(property, value);
    };

    const measure = (): SceneDimensions => {
      // Read layout only at initialization / a real viewport resize, never
      // from an animation frame or high-frequency gesture handler.
      shellTop = shell.getBoundingClientRect().top + window.scrollY;
      shellEnd = shellTop + shell.offsetHeight - window.innerHeight;
      const width = hero.clientWidth || window.innerWidth;
      const height = hero.clientHeight || window.innerHeight;
      const narrow = isNarrowViewport();
      const laptopViewport = !narrow && width >= 768 && height <= 760;
      const compactness = narrow ? clamp((height - 520) / 220, 0, 1) : clamp((height - 560) / 340, 0, 1);
      const desktopHeight = narrow
        ? Math.max(332, Math.min(height * 0.54, (width - 28) / 1.12))
        : Math.min(height * (laptopViewport ? 0.73 : 0.76), 650);
      const desktopWidth = narrow
        ? Math.max(260, width - 28)
        : Math.min(width * (laptopViewport ? 0.88 : 0.9), laptopViewport ? 1120 : 1200, desktopHeight * (laptopViewport ? 1.78 : 1.82));
      const mobileWidth = narrow
        ? Math.min(320, width - 64)
        : laptopViewport ? clamp(width * 0.27, 320, 360) : clamp(width * 0.3, 340, 410);
      const mobileHeight = height * (narrow
        ? 0.78 + 0.08 * clamp((720 - height) / 170, 0, 1)
        : laptopViewport ? 0.84 : 0.79);
      const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
      return { width, height, desktopWidth, mobileWidth, desktopHeight, mobileHeight, compactness, laptopViewport, narrow, headerBottom };
    };

    dimensions = measure();

    const setProgress = (value: number, force = false): void => {
      progress = clamp(value, 0, 1);
      if (!force && renderedProgress !== null && Math.abs(progress - renderedProgress) < 0.0005) return;
      renderedProgress = progress;
      const narrow = dimensions.narrow;
      const markReveal = smooth(0.23, 0.35, progress);
      const browserReveal = smooth(0.35, 0.63, progress);
      const pageReveal = smooth(0.555, 0.69, progress);
      const travel = smooth(0.4, 0.64, progress);
      const mobile = smooth(0.7, 0.995, progress);
      const activeCopy = mobile >= 0.5 ? 2 : 0;
      const browserScale = 0.025 + browserReveal * 0.975;
      const frameWidth = mix(dimensions.desktopWidth, dimensions.mobileWidth, mobile);
      const frameHeight = mix(dimensions.desktopHeight, dimensions.mobileHeight, mobile);
      // Write visual properties on their consumers. Updating inherited custom
      // properties on the hero invalidates styles across the entire scene.
      setInlineStyle(scrollMeter, 'transform', `scaleX(${(manuallyScrolled ? clamp((progress - introEnd) / (1 - introEnd), 0, 1) : 0).toFixed(4)})`);
      const hintOpacity = reducedMotion.matches ? 1 : manuallyScrolled ? 1 - smooth(introEnd, introEnd + 0.14, progress) : 1;
      setInlineStyle(scrollHint, 'opacity', hintOpacity.toFixed(3));
      const nextHintIsHidden = hintOpacity < 0.15;
      if (hintIsHidden !== nextHintIsHidden) {
        scrollHint.setAttribute('aria-hidden', String(nextHintIsHidden));
        hintIsHidden = nextHintIsHidden;
      }
      setInlineStyle(symbolImage, 'clip-path', `inset(${((1 - markReveal) * 50).toFixed(2)}% 0)`);
      setInlineStyle(symbol, 'opacity', smooth(0.2, 0.26, progress).toFixed(3));
      setInlineStyle(beam, 'opacity', (1 - smooth(0.1, 0.21, progress)).toFixed(3));
      setInlineStyle(beam, 'transform', `translate(-50%, -50%) scaleX(${mix(0.34, 1, smooth(0.005, 0.055, progress)).toFixed(3)})`);
      setInlineStyle(browser, 'opacity', browserReveal.toFixed(3));
      setInlineStyle(browser, 'transform', `translate(-50%, -50%) scale(${browserScale.toFixed(4)})`);
      setInlineStyle(content, 'opacity', pageReveal.toFixed(3));
      setInlineStyle(content, 'transform', narrow
        ? `translate(-50%, ${mix(14, 0, pageReveal).toFixed(1)}px)`
        : `translate(-50%, calc(-50% + ${mix(14, 0, pageReveal).toFixed(1)}px))`);
      setInlineStyle(wordmark, 'opacity', smooth(0.555, 0.645, progress).toFixed(3));

      if (activeCopy !== renderedCopy) {
        copySteps.forEach((step, index) => {
          const active = index === activeCopy;
          setInlineStyle(step, '--copy-opacity', active ? '1' : '0');
          setInlineStyle(step, '--copy-shift', active ? '0px' : '10px');
          step.inert = !active;
          step.setAttribute('aria-hidden', String(!active));
        });
        renderedCopy = activeCopy;
      }

      setInlineStyle(browser, 'width', `${frameWidth.toFixed(1)}px`);
      setInlineStyle(browser, 'height', `${frameHeight.toFixed(1)}px`);
      const browserCenterY = (Math.max(0, dimensions.headerBottom) + dimensions.height) / 2;
      setInlineStyle(browser, 'top', `${browserCenterY.toFixed(1)}px`);
      setInlineStyle(browser, '--mobile-layout', mobile.toFixed(3));
      setInlineStyle(browser, '--browser-radius', `${mix(25, 48, mobile).toFixed(1)}px`);
      setInlineStyle(browser, '--screen-radius', `${mix(13, 39, mobile).toFixed(1)}px`);
      setInlineStyle(browser, '--screen-inset-x', `${mix(15, 10, mobile).toFixed(1)}px`);
      setInlineStyle(browser, '--screen-inset-top', `${mix(15, 14, mobile).toFixed(1)}px`);
      setInlineStyle(browser, '--screen-inset-bottom', `${mix(25, 14, mobile).toFixed(1)}px`);
      setInlineStyle(browser, '--chrome-height', `${mix(32, 34, mobile).toFixed(1)}px`);
      const desktopHeader = narrow ? 46 : mix(64, 82, dimensions.compactness);
      setInlineStyle(browser, '--site-header-height', `${mix(desktopHeader, 64, mobile).toFixed(1)}px`);
      const contentTop = dimensions.laptopViewport
        ? mix(50, 47, mobile)
        : mix(mix(47, 54, dimensions.compactness), 53, mobile);
      setInlineStyle(browser, '--content-top', `${contentTop.toFixed(1)}%`);
      setInlineStyle(browser, '--footer-inset', `${mix(28, 14, mobile).toFixed(1)}px`);
      setInlineStyle(browser, '--footer-size', 'var(--font-size-label)');
      setInlineStyle(browser, '--camera-width', `${mix(5, 44, mobile).toFixed(1)}px`);
      setInlineStyle(browser, '--camera-height', `${mix(5, 8, mobile).toFixed(1)}px`);
      // Give the CTA more room in the short initial frame on phones, then
      // restore the footer inset as the frame grows into the mobile device.
      const initialFooterBottom = narrow ? 4 : mix(12, 16, dimensions.compactness);
      setInlineStyle(browser, '--footer-bottom', `${mix(initialFooterBottom, 16, mobile).toFixed(1)}px`);
      const finalInset = narrow && dimensions.width <= 360 ? 18 : 24;
      setInlineStyle(browser, '--page-inset', `${mix(narrow ? 24 : 68, finalInset, mobile).toFixed(1)}px`);
      const titleSize = narrow ? (dimensions.width <= 360 ? 16 : 18) : mix(28, 40, dimensions.compactness);
      setInlineStyle(browser, '--page-title-leading', narrow ? mix(1.35, 1.55, mobile).toFixed(3) : '1.5');
      // Keep copy proportional to the smaller frame on phone viewports.
      const mobileTitleSize = narrow ? (dimensions.width <= 360 ? 18 : 20) : 25;
      setInlineStyle(browser, '--page-title-size', `${(mix(titleSize, mobileTitleSize, mobile) / 16).toFixed(3)}rem`);
      setInlineStyle(browser, '--page-support-size', 'var(--font-size-body)');
      setInlineStyle(browser, '--brand-size', `${(mix(narrow ? 15 : 17, 14, mobile) / 16).toFixed(3)}rem`);
      setInlineStyle(browser, '--cta-width', `${mix(188, 204, mobile).toFixed(1)}px`);
      setInlineStyle(browser, '--accent-gap', `${mix(narrow ? 6 : mix(12, 23, dimensions.compactness), 18, mobile).toFixed(1)}px`);
      setInlineStyle(browser, '--support-gap', `${mix(narrow ? 6 : mix(8, 12, dimensions.compactness), 10, mobile).toFixed(1)}px`);
      const ctaGap = dimensions.laptopViewport
        ? mix(16, 12, mobile)
        : mix(narrow ? 8 : mix(14, 28, dimensions.compactness), 23, mobile);
      setInlineStyle(browser, '--cta-gap', `${ctaGap.toFixed(1)}px`);
      const ctaLift = dimensions.laptopViewport ? mix(0, -30, mobile) : 0;
      setInlineStyle(browser, '--cta-lift', `${ctaLift.toFixed(1)}px`);
      const brandInset = mix(narrow ? 22 : clamp(dimensions.width * 0.04, 22, 48), 22, mobile);
      setInlineStyle(browser, '--brand-inset', `${brandInset.toFixed(1)}px`);
      const targetX = frameWidth / 2 - mix(15, 10, mobile) - brandInset - 14;
      const targetY = browserCenterY - frameHeight / 2 + mix(15, 14, mobile) + mix(32, 34, mobile) + mix(desktopHeader, 64, mobile) / 2 - dimensions.height / 2;
      const scaleToHeader = mix(1, 0.215, travel) * mix(1, browserScale, travel * 0.58);
      setInlineStyle(symbol, 'transform', `translate(calc(-50% + ${(targetX * travel).toFixed(1)}px), calc(-50% + ${(targetY * travel).toFixed(1)}px)) scale(${scaleToHeader.toFixed(4)})`);
      const contentIsInert = pageReveal < 0.45;
      if (content.inert !== contentIsInert) content.inert = contentIsInert;
      setInlineStyle(browser, 'pointer-events', pageReveal > 0.45 ? 'auto' : 'none');
    };

    const animateIntro = (time: number): void => {
      frame = 0;
      if (document.hidden || manuallyScrolled || reducedMotion.matches) return;
      if (!previousFrame) previousFrame = time;
      const elapsed = Math.max(0, time - previousFrame);
      previousFrame = time;
      setProgress(Math.min(introEnd, progress + (elapsed / 2800) * introEnd));
      if (progress < introEnd) {
        frame = window.requestAnimationFrame(animateIntro);
      }
    };

    const isHeroActive = (): boolean =>
      window.scrollY >= shellTop - 1 && window.scrollY <= shellEnd + 1;
    const canCaptureDirection = (direction: number): boolean =>
      isHeroActive() && !reducedMotion.matches
      && ((direction > 0 && (stage === 'desktop' || transitioning)) || (direction < 0 && stage === 'mobile'));

    const animateStage = (target: number): void => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      if (transitionFrame) window.cancelAnimationFrame(transitionFrame);
      const from = progress;
      const startedAt = performance.now();
      const duration = dimensions.narrow ? 820 : 620;
      transitioning = true;
      const tick = (time: number): void => {
        const amount = clamp((time - startedAt) / duration, 0, 1);
        const eased = amount * amount * (3 - 2 * amount);
        setProgress(mix(from, target, eased));
        if (amount < 1) {
          transitionFrame = window.requestAnimationFrame(tick);
          return;
        }
        transitionFrame = 0;
        transitioning = false;
      };
      transitionFrame = window.requestAnimationFrame(tick);
    };

    const handleScrollGesture = (direction: number): void => {
      if (!canCaptureDirection(direction) || transitioning) return;
      manuallyScrolled = true;
      stage = direction > 0 ? 'mobile' : 'desktop';
      animateStage(direction > 0 ? 1 : introEnd);
    };

    const onWheel = (event: WheelEvent): void => {
      if (event.ctrlKey || event.deltaY === 0) return;
      const direction = Math.sign(event.deltaY);
      if (!canCaptureDirection(direction)) return;
      event.preventDefault();
      // Start immediately, without waiting for wheel/trackpad momentum to end.
      // Capture only the morph; subsequent downward input scrolls natively.
      if (!transitioning) handleScrollGesture(direction);
    };

    const onTouchStart = (event: TouchEvent): void => {
      touchStartY = event.touches.length === 1 ? event.touches[0]?.clientY ?? null : null;
      touchStageChanged = false;
      touchStartedInHero = touchStartY !== null && isHeroActive();
      touchCaptured = touchStartedInHero && transitioning && !reducedMotion.matches;
    };
    const onTouchMove = (event: TouchEvent): void => {
      if (touchStartY === null || !touchStartedInHero || event.touches.length !== 1) return;
      const nextY = event.touches[0]?.clientY;
      if (nextY === undefined || reducedMotion.matches) return;
      const distance = touchStartY - nextY;
      // Cancel native scrolling before the browser starts panning, and keep
      // the triggering swipe captured even after the morph finishes.
      const direction = Math.sign(distance);
      if (!touchCaptured && direction !== 0 && canCaptureDirection(direction)) touchCaptured = true;
      if (!touchCaptured) return;
      event.preventDefault();
      if (Math.abs(distance) > 28 && !transitioning && !touchStageChanged && canCaptureDirection(direction)) {
        touchStageChanged = true;
        handleScrollGesture(direction);
      }
    };
    const onTouchEnd = (): void => {
      touchStartY = null;
      touchStartedInHero = false;
      touchCaptured = false;
      touchStageChanged = false;
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!isHeroActive() || reducedMotion.matches) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('a, button, input, textarea, select, [contenteditable="true"]')) return;
      const direction = ['ArrowDown', 'PageDown', ' '].includes(event.key) ? 1 : event.key === 'ArrowUp' || event.key === 'PageUp' ? -1 : 0;
      if (!direction || !canCaptureDirection(direction)) return;
      event.preventDefault();
      if (!transitioning) handleScrollGesture(direction);
    };
    const onResize = (): void => {
      // Toolbar movement must not relayout the scene during a mobile swipe.
      if (isNarrowViewport() && window.innerWidth === measuredViewportWidth) return;
      measuredViewportWidth = window.innerWidth;
      dimensions = measure();
      setProgress(progress, true);
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
      stage = 'mobile';
      setProgress(1);
    } else {
      setProgress(0);
      frame = window.requestAnimationFrame(animateIntro);
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (frame) window.cancelAnimationFrame(frame);
      if (transitionFrame) window.cancelAnimationFrame(transitionFrame);
    });
  }
}
