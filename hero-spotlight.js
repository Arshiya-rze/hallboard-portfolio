(() => {
  "use strict";

  const hero = document.querySelector(".hero");

  if (!hero) return;

  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hardwareConcurrency = navigator.hardwareConcurrency || 8;
  const deviceMemory = navigator.deviceMemory || 8;
  const lowPowerDevice = hardwareConcurrency <= 4 || deviceMemory <= 4;
  const state = {
    targetX: hero.clientWidth * 0.52,
    targetY: hero.clientHeight * 0.58,
    currentX: hero.clientWidth * 0.52,
    currentY: hero.clientHeight * 0.58,
    lastInteraction: 0,
    visible: true,
    frameId: 0,
    lastFrameTime: 0,
  };

  hero.classList.toggle("is-low-power", lowPowerDevice);
  hero.classList.toggle("is-reduced-motion", reducedMotion.matches);

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const setTargetFromPointer = (event) => {
    if (event.pointerType === "mouse" && event.buttons > 0) return;

    const rect = hero.getBoundingClientRect();
    state.targetX = clamp(event.clientX - rect.left, 0, rect.width);
    state.targetY = clamp(event.clientY - rect.top, 0, rect.height);
    state.lastInteraction = performance.now();
    hero.classList.add("has-interacted");

    if (reducedMotion.matches) {
      state.currentX = state.targetX;
      state.currentY = state.targetY;
      renderPosition();
    }
  };

  const renderPosition = () => {
    hero.style.setProperty("--spot-x", `${state.currentX.toFixed(1)}px`);
    hero.style.setProperty("--spot-y", `${state.currentY.toFixed(1)}px`);
  };

  const animate = (time) => {
    state.frameId = 0;

    if (!state.visible || document.hidden) return;

    const minimumFrameGap = lowPowerDevice ? 32 : 0;

    if (time - state.lastFrameTime >= minimumFrameGap) {
      const idleOnTouch = coarsePointer.matches && time - state.lastInteraction > 1800;

      if (idleOnTouch && !reducedMotion.matches) {
        const width = hero.clientWidth;
        const height = hero.clientHeight;
        state.targetX = width * (0.5 + Math.sin(time * 0.00032) * 0.24);
        state.targetY = height * (0.56 + Math.cos(time * 0.00025) * 0.13);
      }

      const smoothing = reducedMotion.matches ? 1 : coarsePointer.matches ? 0.085 : 0.1;
      state.currentX += (state.targetX - state.currentX) * smoothing;
      state.currentY += (state.targetY - state.currentY) * smoothing;
      renderPosition();
      state.lastFrameTime = time;
    }

    state.frameId = requestAnimationFrame(animate);
  };

  const startAnimation = () => {
    if (!state.frameId && state.visible && !document.hidden) {
      state.frameId = requestAnimationFrame(animate);
    }
  };

  hero.addEventListener("pointerdown", setTargetFromPointer, { passive: true });
  hero.addEventListener("pointermove", setTargetFromPointer, { passive: true });

  window.addEventListener(
    "resize",
    () => {
      state.targetX = clamp(state.targetX, 0, hero.clientWidth);
      state.targetY = clamp(state.targetY, 0, hero.clientHeight);
      state.currentX = clamp(state.currentX, 0, hero.clientWidth);
      state.currentY = clamp(state.currentY, 0, hero.clientHeight);
    },
    { passive: true }
  );

  reducedMotion.addEventListener?.("change", (event) => {
    hero.classList.toggle("is-reduced-motion", event.matches);
  });

  const observer = new IntersectionObserver(
    ([entry]) => {
      state.visible = entry.isIntersecting;

      if (state.visible) {
        startAnimation();
      } else if (state.frameId) {
        cancelAnimationFrame(state.frameId);
        state.frameId = 0;
      }
    },
    { threshold: 0.01 }
  );

  observer.observe(hero);

  document.addEventListener("visibilitychange", startAnimation);

  const menuToggle = document.querySelector("#menu-toggle");
  const menuButton = document.querySelector(".hamburger");
  const menuLinks = document.querySelectorAll("#primary-nav a");

  const syncMenuState = () => {
    if (!menuToggle || !menuButton) return;
    const isOpen = menuToggle.checked;
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "بستن منوی اصلی" : "باز کردن منوی اصلی");
  };

  menuToggle?.addEventListener("change", syncMenuState);
  menuButton?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    menuToggle.checked = !menuToggle.checked;
    syncMenuState();
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (!menuToggle) return;
      menuToggle.checked = false;
      syncMenuState();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !menuToggle?.checked) return;
    menuToggle.checked = false;
    syncMenuState();
    menuButton?.focus();
  });

  const initServicesSlider = () => {
    const slider = document.querySelector("[data-services-slider]");
    const viewport = slider?.querySelector(".services-viewport");
    const track = slider?.querySelector(".services-grid");
    const prevButton = slider?.querySelector("[data-slider-prev]");
    const nextButton = slider?.querySelector("[data-slider-next]");
    const dotsWrap = slider?.querySelector("[data-slider-dots]");
    const cards = Array.from(track?.children || []);

    if (!slider || !viewport || !track || cards.length < 2) return;

    let activeIndex = 0;
    let autoplayId = 0;
    let scrollTimer = 0;

    const getPerView = () => {
      if (window.matchMedia("(min-width: 1180px)").matches) return 3;
      if (window.matchMedia("(min-width: 768px)").matches) return 2;
      return 1;
    };

    const getMaxIndex = () => Math.max(0, cards.length - getPerView());

    const getNearestIndex = () => {
      const scrollLeft = viewport.scrollLeft;
      return cards.reduce((nearest, card, index) => {
        const currentDistance = Math.abs(card.offsetLeft - scrollLeft);
        const nearestDistance = Math.abs(cards[nearest].offsetLeft - scrollLeft);
        return currentDistance < nearestDistance ? index : nearest;
      }, 0);
    };

    const updateDots = () => {
      dotsWrap?.querySelectorAll(".services-dot").forEach((dot, index) => {
        const isActive = index === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-current", isActive ? "true" : "false");
      });
    };

    const renderDots = () => {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";

      for (let index = 0; index <= getMaxIndex(); index += 1) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "services-dot";
        dot.setAttribute("aria-label", `رفتن به اسلاید ${index + 1}`);
        dot.addEventListener("click", () => goTo(index));
        dotsWrap.append(dot);
      }

      updateDots();
    };

    const goTo = (index, behavior = "smooth") => {
      const maxIndex = getMaxIndex();
      activeIndex = index > maxIndex ? 0 : index < 0 ? maxIndex : index;
      viewport.scrollTo({
        left: cards[activeIndex].offsetLeft,
        behavior: reducedMotion.matches ? "auto" : behavior,
      });
      updateDots();
    };

    const stopAutoplay = () => {
      window.clearInterval(autoplayId);
      autoplayId = 0;
    };

    const startAutoplay = () => {
      if (autoplayId || reducedMotion.matches) return;
      autoplayId = window.setInterval(() => {
        if (document.hidden) return;
        goTo(activeIndex + 1);
      }, 4200);
    };

    prevButton?.addEventListener("click", () => goTo(activeIndex - 1));
    nextButton?.addEventListener("click", () => goTo(activeIndex + 1));

    viewport.addEventListener(
      "scroll",
      () => {
        window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(() => {
          activeIndex = Math.min(getNearestIndex(), getMaxIndex());
          updateDots();
        }, 80);
      },
      { passive: true }
    );

    slider.addEventListener("pointerenter", stopAutoplay);
    slider.addEventListener("pointerleave", startAutoplay);
    slider.addEventListener("focusin", stopAutoplay);
    slider.addEventListener("focusout", startAutoplay);
    slider.addEventListener("pointerdown", stopAutoplay, { passive: true });
    slider.addEventListener("pointerup", startAutoplay, { passive: true });
    slider.addEventListener("pointercancel", startAutoplay, { passive: true });

    window.addEventListener(
      "resize",
      () => {
        renderDots();
        goTo(Math.min(activeIndex, getMaxIndex()), "auto");
      },
      { passive: true }
    );

    reducedMotion.addEventListener?.("change", (event) => {
      if (event.matches) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    renderDots();
    startAutoplay();
  };

  const initTechTabs = () => {
    const tabs = Array.from(document.querySelectorAll("[data-tech-target]"));
    const panels = Array.from(document.querySelectorAll("[data-tech-panel]"));

    if (!tabs.length || !panels.length) return;

    const activate = (target) => {
      tabs.forEach((tab) => {
        const isActive = tab.dataset.techTarget === target;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
      });

      panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.techPanel === target);
      });
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => activate(tab.dataset.techTarget));
    });
  };

  initServicesSlider();
  initTechTabs();

  renderPosition();
  startAnimation();
})();
