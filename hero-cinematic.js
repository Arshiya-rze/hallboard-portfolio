(() => {
  "use strict";

  const shell = document.querySelector("[data-hero-film-shell]");
  const hero = shell?.querySelector("[data-cinematic-hero]");
  const browser = hero?.querySelector("[data-film-browser]");
  const symbol = hero?.querySelector("[data-film-symbol]");
  const content = hero?.querySelector("[data-browser-content]");
  const copySteps = [...(hero?.querySelectorAll("[data-copy-step]") ?? [])];
  const scrollHint = hero?.querySelector("[data-hero-scroll-hint]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!shell || !hero || !browser || !symbol || !content) return;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, value) => {
    const t = clamp((value - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };

  const introEnd = 0.70;
  const introDuration = 2800;
  let progress = 0;
  let manual = false;
  let visible = false;
  let rafId = 0;
  let previousFrame = 0;
  let previousY = window.scrollY;
  let anchorY = window.scrollY;
  let anchorProgress = 0;
  let scrollDistance = 1;
  let narrowViewport = window.matchMedia("(max-width: 767px)").matches;

  const measureScene = () => {
    const width = hero.clientWidth || window.innerWidth;
    const height = hero.clientHeight || window.innerHeight;
    narrowViewport = window.matchMedia("(max-width: 767px)").matches;
    const compactness = narrowViewport
      ? clamp((height - 520) / 220, 0, 1)
      : clamp((height - 560) / 340, 0, 1);
    const desktopHeight = Math.min(height * 0.76, 650);
    const desktopWidth = narrowViewport
      ? Math.max(260, width - 28)
      : Math.min(width * 0.9, 1200, desktopHeight * 1.82);
    const mobileWidth = narrowViewport
      ? Math.max(250, width - 44)
      : clamp(width * 0.3, 340, 410);
    const mobileHeight = height * (narrowViewport
      ? 0.78 + 0.08 * clamp((720 - height) / 170, 0, 1)
      : 0.79);
    return { width, height, desktopWidth, mobileWidth, desktopHeight, mobileHeight, compactness };
  };

  let dimensions = measureScene();

  const setProgress = (value) => {
    progress = clamp(value, 0, 1);
    const markReveal = smooth(0.23, 0.35, progress);
    const browserReveal = smooth(0.35, 0.63, progress);
    const pageReveal = smooth(0.555, 0.69, progress);
    const travel = smooth(0.40, 0.64, progress);
    const copyOne = smooth(0.70, 0.75, progress);
    const copyTwo = smooth(0.80, 0.85, progress);
    const copyWeights = [1 - copyOne, copyOne * (1 - copyTwo), copyTwo];
    const activeCopy = copyTwo >= 0.5 ? 2 : copyOne >= 0.5 ? 1 : 0;
    const mobile = smooth(0.90, 0.995, progress);
    const browserScale = 0.025 + browserReveal * 0.975;
    const frameWidth = mix(dimensions.desktopWidth, dimensions.mobileWidth, mobile);
    const frameHeight = mix(dimensions.desktopHeight, dimensions.mobileHeight, mobile);

    hero.style.setProperty("--film-progress", progress.toFixed(4));
    const scrollProgress = manual ? clamp((progress - introEnd) / (1 - introEnd), 0, 1) : 0;
    const hintOpacity = reducedMotion.matches ? 1 : manual ? 1 - smooth(introEnd, introEnd + 0.14, progress) : 1;
    hero.style.setProperty("--hero-scroll-progress", scrollProgress.toFixed(4));
    hero.style.setProperty("--hero-scroll-hint-opacity", hintOpacity.toFixed(3));
    if (scrollHint) scrollHint.setAttribute("aria-hidden", hintOpacity < 0.15 ? "true" : "false");
    hero.style.setProperty("--mark-inset", `${((1 - markReveal) * 50).toFixed(2)}%`);
    hero.style.setProperty("--mark-opacity", smooth(0.20, 0.26, progress).toFixed(3));
    hero.style.setProperty("--beam-opacity", (1 - smooth(0.10, 0.21, progress)).toFixed(3));
    hero.style.setProperty("--beam-scale", mix(0.34, 1, smooth(0.005, 0.055, progress)).toFixed(3));
    hero.style.setProperty("--browser-opacity", browserReveal.toFixed(3));
    hero.style.setProperty("--browser-scale", browserScale.toFixed(4));
    hero.style.setProperty("--page-reveal", pageReveal.toFixed(3));
    hero.style.setProperty("--wordmark-reveal", smooth(0.555, 0.645, progress).toFixed(3));
    hero.style.setProperty("--mobile-layout", mobile.toFixed(3));
    hero.style.setProperty("--content-lift", `${mix(14, 0, pageReveal).toFixed(1)}px`);
    copyWeights.forEach((weight, index) => {
      const step = copySteps[index];
      if (!step) return;
      step.style.setProperty("--copy-opacity", weight.toFixed(3));
      step.style.setProperty("--copy-shift", `${mix(10, 0, weight).toFixed(1)}px`);
      step.inert = index !== activeCopy;
      step.setAttribute("aria-hidden", index === activeCopy ? "false" : "true");
    });

    browser.style.width = `${frameWidth.toFixed(1)}px`;
    browser.style.height = `${frameHeight.toFixed(1)}px`;
    browser.style.setProperty("--mobile-layout", mobile.toFixed(3));
    browser.style.setProperty("--browser-radius", `${mix(25, 48, mobile).toFixed(1)}px`);
    browser.style.setProperty("--screen-radius", `${mix(13, 39, mobile).toFixed(1)}px`);
    browser.style.setProperty("--screen-inset-x", `${mix(15, 10, mobile).toFixed(1)}px`);
    browser.style.setProperty("--screen-inset-top", `${mix(15, 14, mobile).toFixed(1)}px`);
    browser.style.setProperty("--screen-inset-bottom", `${mix(25, 14, mobile).toFixed(1)}px`);
    browser.style.setProperty("--chrome-height", `${mix(32, 34, mobile).toFixed(1)}px`);
    const compactness = dimensions.compactness;
    const desktopHeaderHeight = mix(64, 82, compactness);
    browser.style.setProperty("--site-header-height", `${mix(desktopHeaderHeight, 64, mobile).toFixed(1)}px`);
    browser.style.setProperty("--content-top", `${mix(mix(47, 54, compactness), 53, mobile).toFixed(1)}%`);
    browser.style.setProperty("--footer-inset", `${mix(28, 14, mobile).toFixed(1)}px`);
    browser.style.setProperty("--footer-size", `${mix(10, 9, mobile).toFixed(1)}px`);
    browser.style.setProperty("--camera-width", `${mix(5, 44, mobile).toFixed(1)}px`);
    browser.style.setProperty("--camera-height", `${mix(5, 8, mobile).toFixed(1)}px`);
    browser.style.setProperty("--footer-bottom", `${mix(mix(12, 16, compactness), 16, mobile).toFixed(1)}px`);
    const finalInset = narrowViewport && dimensions.width <= 360 ? 18 : 24;
    browser.style.setProperty("--page-inset", `${mix(narrowViewport ? 24 : 68, finalInset, mobile).toFixed(1)}px`);
    const desktopTitleSize = narrowViewport ? mix(28, 32, compactness) : mix(31, 46, compactness);
    const desktopSupportSize = narrowViewport ? mix(12.5, 14, compactness) : mix(12.5, 16, compactness);
    browser.style.setProperty("--page-title-size", `${mix(desktopTitleSize, 29, mobile).toFixed(1)}px`);
    browser.style.setProperty("--page-support-size", `${mix(desktopSupportSize, 13.5, mobile).toFixed(1)}px`);
    browser.style.setProperty("--brand-size", `${mix(narrowViewport ? 15 : 17, 14, mobile).toFixed(1)}px`);
    browser.style.setProperty("--cta-width", `${mix(188, 204, mobile).toFixed(1)}px`);
    browser.style.setProperty("--accent-gap", `${mix(mix(12, 23, compactness), 18, mobile).toFixed(1)}px`);
    browser.style.setProperty("--support-gap", `${mix(mix(8, 12, compactness), 10, mobile).toFixed(1)}px`);
    browser.style.setProperty("--cta-gap", `${mix(mix(14, 28, compactness), 23, mobile).toFixed(1)}px`);
    browser.style.setProperty("--brand-inset", `${mix(narrowViewport ? 22 : clamp(dimensions.width * 0.04, 22, 48), 22, mobile).toFixed(1)}px`);

    // Compute the logo-slot endpoint from frame geometry to avoid per-frame layout reads.
    const brandInset = mix(narrowViewport ? 22 : clamp(dimensions.width * 0.04, 22, 48), 22, mobile);
    const screenInsetX = mix(15, 10, mobile);
    const screenInsetTop = mix(15, 14, mobile);
    const chromeHeight = mix(32, 34, mobile);
    const siteHeaderHeight = mix(desktopHeaderHeight, 64, mobile);
    const targetX = frameWidth / 2 - screenInsetX - brandInset - 14;
    const targetY = dimensions.height * 0.02 + screenInsetTop + chromeHeight + siteHeaderHeight / 2 - frameHeight / 2;
    const scaleToHeader = mix(1, 0.215, travel) * mix(1, browserScale, travel * 0.58);

    hero.style.setProperty("--mark-x", `${(targetX * travel).toFixed(1)}px`);
    hero.style.setProperty("--mark-y", `${(targetY * travel).toFixed(1)}px`);
    hero.style.setProperty("--mark-scale", scaleToHeader.toFixed(4));
    content.inert = pageReveal < 0.45;
    browser.style.pointerEvents = pageReveal > 0.45 ? "auto" : "none";
  };

  const updateScrollDistance = () => {
    scrollDistance = Math.max(1, shell.offsetHeight - window.innerHeight);
  };

  const progressForScroll = (y) => {
    if (y >= anchorY) {
      const remaining = Math.max(1, scrollDistance - anchorY);
      return anchorProgress + ((y - anchorY) / remaining) * (1 - anchorProgress);
    }
    return anchorY > 0 ? anchorProgress * y / anchorY : anchorProgress;
  };

  const getScrollProgress = (y) => clamp(progressForScroll(y), introEnd, 1);
  const storyStops = [introEnd, 0.75, 0.85, 1];
  let requestedProgress = null;

  const nextStoryStop = (from, direction) => {
    if (direction > 0) return storyStops.find((stop) => stop > from + 0.005) ?? null;
    for (let index = storyStops.length - 1; index >= 0; index -= 1) {
      if (storyStops[index] < from - 0.005) return storyStops[index];
    }
    return null;
  };

  const beginManualScroll = () => {
    if (manual || reducedMotion.matches) return;
    manual = true;
    anchorY = previousY;
    anchorProgress = Math.max(progress, introEnd);
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
    previousFrame = 0;
  };

  const moveToStoryStop = (target) => {
    beginManualScroll();
    requestedProgress = target;
    const remainingProgress = Math.max(0.001, 1 - anchorProgress);
    const remainingScroll = Math.max(1, scrollDistance - anchorY);
    const top = anchorY + ((target - anchorProgress) / remainingProgress) * remainingScroll;
    window.scrollTo({
      top: clamp(top, 0, scrollDistance),
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  };

  const requestFrame = () => {
    if (rafId || !visible || document.hidden) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      if (manual) {
        setProgress(getScrollProgress(window.scrollY));
        if (requestedProgress !== null && Math.abs(progress - requestedProgress) < 0.005) {
          requestedProgress = null;
        }
      } else animateIntro(performance.now());
    });
  };

  const animateIntro = (time) => {
    rafId = 0;
    if (!visible || document.hidden || manual || reducedMotion.matches) return;
    if (!previousFrame) previousFrame = time;
    const delta = Math.min(50, Math.max(0, time - previousFrame));
    previousFrame = time;
    setProgress(Math.min(introEnd, progress + delta / introDuration * introEnd));
    if (progress < introEnd) rafId = window.requestAnimationFrame(animateIntro);
  };

  const onScroll = () => {
    const currentY = window.scrollY;
    if (!manual && !reducedMotion.matches) {
      beginManualScroll();
    }
    previousY = currentY;
    if (manual) requestFrame();
  };

  let wheelConsumed = false;
  let wheelResetTimer = 0;
  const onWheel = (event) => {
    if (!visible || !shell.contains(event.target) || event.ctrlKey || reducedMotion.matches || !event.deltaY) return;

    if (wheelConsumed) {
      event.preventDefault();
    } else {
      const base = requestedProgress ?? Math.max(progress, introEnd);
      const target = nextStoryStop(base, Math.sign(event.deltaY));
      if (target === null) return;
      event.preventDefault();
      wheelConsumed = true;
      moveToStoryStop(target);
    }

    window.clearTimeout(wheelResetTimer);
    wheelResetTimer = window.setTimeout(() => { wheelConsumed = false; }, 380);
  };

  let touchStartY = null;
  let touchDirection = 0;
  let touchCaptured = false;
  const onTouchStart = (event) => {
    if (!visible || !shell.contains(event.target) || reducedMotion.matches || event.touches.length !== 1) return;
    touchStartY = event.touches[0].clientY;
    touchDirection = 0;
    touchCaptured = false;
  };
  const onTouchMove = (event) => {
    if (touchStartY === null || event.touches.length !== 1) return;
    const delta = touchStartY - event.touches[0].clientY;
    if (Math.abs(delta) < 18) return;
    const direction = Math.sign(delta);
    const base = requestedProgress ?? Math.max(progress, introEnd);
    if (nextStoryStop(base, direction) === null) return;
    event.preventDefault();
    touchDirection = direction;
    touchCaptured = true;
  };
  const onTouchEnd = () => {
    if (touchCaptured && touchDirection) {
      const base = requestedProgress ?? Math.max(progress, introEnd);
      const target = nextStoryStop(base, touchDirection);
      if (target !== null) moveToStoryStop(target);
    }
    touchStartY = null;
    touchDirection = 0;
    touchCaptured = false;
  };

  const onResize = () => {
    updateScrollDistance();
    dimensions = measureScene();
    if (manual && !reducedMotion.matches) {
      setProgress(getScrollProgress(window.scrollY));
    } else {
      setProgress(progress);
    }
  };

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
      previousFrame = 0;
      return;
    }
    if (reducedMotion.matches) {
      setProgress(narrowViewport ? 1 : 0.69);
    } else if (manual) {
      requestFrame();
    } else if (!rafId && progress < introEnd) {
      rafId = window.requestAnimationFrame(animateIntro);
    } else {
      setProgress(progress);
    }
  }, { threshold: 0.01 });

  const onMotionChange = (event) => {
    hero.classList.toggle("is-reduced-motion", event.matches);
    updateScrollDistance();
    dimensions = measureScene();
    if (event.matches) {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
      manual = true;
      requestedProgress = null;
      setProgress(narrowViewport ? 1 : 0.69);
    } else {
      manual = false;
      anchorProgress = 0;
      anchorY = window.scrollY;
      previousY = window.scrollY;
      previousFrame = 0;
      setProgress(0);
      if (visible) rafId = window.requestAnimationFrame(animateIntro);
    }
  };

  hero.classList.add("is-ready");
  hero.classList.toggle("is-reduced-motion", reducedMotion.matches);
  updateScrollDistance();
  dimensions = measureScene();
  if (reducedMotion.matches) {
    manual = true;
    setProgress(narrowViewport ? 1 : 0.69);
  } else if (window.scrollY > 1) {
    manual = true;
    anchorY = 0;
    anchorProgress = 0;
    setProgress(Math.max(introEnd, clamp(window.scrollY / scrollDistance, 0, 1)));
  } else {
    setProgress(0);
  }

  observer.observe(shell);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  document.addEventListener("visibilitychange", requestFrame);
  reducedMotion.addEventListener?.("change", onMotionChange);
})();
