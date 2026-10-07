(() => {
  "use strict";

  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hardwareConcurrency = navigator.hardwareConcurrency || 8;
  const deviceMemory = navigator.deviceMemory || 8;
  const lowPowerDevice = hardwareConcurrency <= 4 || deviceMemory <= 4;

  const header = document.querySelector(".header");
  const heroShell = document.querySelector("[data-hero-film-shell]");
  const menuToggle = document.querySelector("#menu-toggle");
  const menuButton = document.querySelector(".hamburger");
  const menuLinks = document.querySelectorAll("#primary-nav a");
  let stickyFrameId = 0;
  let brandScrollAnchor = Math.max(0, window.scrollY);

  const updateHeaderStickiness = () => {
    stickyFrameId = 0;
    const scrollY = Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight));
    const shellTop = heroShell
      ? heroShell.getBoundingClientRect().top + scrollY
      : 0;
    const heroStickyEnd = heroShell
      ? shellTop + heroShell.offsetHeight - window.innerHeight
      : 0;
    const hasScrolled = scrollY > 18;
    const hidingOverHero = hasScrolled && scrollY < heroStickyEnd - 1;

    header?.classList.toggle("is-hero-hidden", hidingOverHero);
    header?.classList.toggle("is-sticky", hasScrolled && !hidingOverHero);
    if (hidingOverHero && menuToggle?.checked) {
      menuToggle.checked = false;
      menuButton?.setAttribute("aria-expanded", "false");
      menuButton?.setAttribute("aria-label", "باز کردن منوی اصلی");
    }

    // Accumulate small movements; avoid flicker from trackpad jitter and bounce.
    if (scrollY <= 24) {
      header?.classList.remove("is-brand-expanded");
      brandScrollAnchor = scrollY;
    } else if (Math.abs(scrollY - brandScrollAnchor) >= 12) {
      header?.classList.toggle("is-brand-expanded", scrollY > brandScrollAnchor);
      brandScrollAnchor = scrollY;
    }
  };

  const requestHeaderStickinessUpdate = () => {
    if (stickyFrameId) return;
    stickyFrameId = requestAnimationFrame(updateHeaderStickiness);
  };

  updateHeaderStickiness();
  window.addEventListener("scroll", requestHeaderStickinessUpdate, { passive: true });
  window.addEventListener("resize", requestHeaderStickinessUpdate, { passive: true });

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
    let manualInteraction = false;

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

    const disableAutoplay = () => {
      manualInteraction = true;
      stopAutoplay();
    };

    const startAutoplay = () => {
      if (manualInteraction || autoplayId || reducedMotion.matches) return;
      autoplayId = window.setInterval(() => {
        if (document.hidden) return;
        goTo(activeIndex + 1);
      }, 2000);
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
    slider.addEventListener("focusin", disableAutoplay);
    slider.addEventListener("focusout", startAutoplay);
    slider.addEventListener("pointerdown", disableAutoplay, { passive: true });
    slider.addEventListener("pointerup", startAutoplay, { passive: true });
    slider.addEventListener("pointercancel", startAutoplay, { passive: true });
    slider.addEventListener("click", disableAutoplay);
    slider.addEventListener("keydown", disableAutoplay);
    slider.addEventListener("wheel", disableAutoplay, { passive: true });

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
    const techStack = document.querySelector(".tech-stack");

    if (!tabs.length || !panels.length || !techStack) return;

    let activeIndex = Math.max(
      0,
      tabs.findIndex((tab) => tab.classList.contains("is-active"))
    );
    let autoplayId = 0;
    let isPaused = false;
    let manualInteraction = false;

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

    const stopAutoplay = () => {
      if (autoplayId) {
        window.clearInterval(autoplayId);
        autoplayId = 0;
      }
    };

    const disableAutoplay = () => {
      manualInteraction = true;
      stopAutoplay();
    };

    const startAutoplay = () => {
      stopAutoplay();

      if (reducedMotion.matches || isPaused || manualInteraction || document.hidden) return;

      autoplayId = window.setInterval(() => {
        activeIndex = (activeIndex + 1) % tabs.length;
        activate(tabs[activeIndex].dataset.techTarget);
      }, 2500);
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        activeIndex = tabs.indexOf(tab);
        activate(tab.dataset.techTarget);
        disableAutoplay();
      });
      tab.addEventListener("pointerdown", disableAutoplay, { passive: true });
      tab.addEventListener("keydown", disableAutoplay);
    });

    techStack.addEventListener("pointerenter", () => {
      isPaused = true;
      stopAutoplay();
    });
    techStack.addEventListener("pointerleave", () => {
      isPaused = false;
      startAutoplay();
    });
    document.addEventListener("visibilitychange", startAutoplay);
    reducedMotion.addEventListener?.("change", startAutoplay);

    startAutoplay();
  };

  const initProjectsSlider = () => {
    const slider = document.querySelector("[data-projects-slider]");
    const viewport = slider?.querySelector(".projects-viewport");
    const track = slider?.querySelector("[data-projects-track]");
    const prevButton = slider?.querySelector("[data-project-prev]");
    const nextButton = slider?.querySelector("[data-project-next]");
    const dotsWrap = slider?.querySelector("[data-projects-dots]");
    const cards = Array.from(track?.children || []);

    if (!slider || !viewport || !track || cards.length < 2) return;

    let activeIndex = 0;
    let autoplayId = 0;
    let scrollTimer = 0;
    let isVisible = false;
    let touchGesture = null;
    let suppressClickUntil = 0;

    const getPerView = () => {
      if (window.matchMedia("(min-width: 1025px)").matches) return 3;
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

    const updateControls = () => {
      const maxIndex = getMaxIndex();
      const canSlide = maxIndex > 0;

      prevButton?.toggleAttribute("disabled", !canSlide);
      nextButton?.toggleAttribute("disabled", !canSlide);

      dotsWrap?.querySelectorAll(".project-dot").forEach((dot, index) => {
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
        dot.className = "project-dot";
        dot.setAttribute("aria-label", `رفتن به پروژه ${index + 1}`);
        dot.addEventListener("click", () => goTo(index));
        dotsWrap.append(dot);
      }

      updateControls();
    };

    const goTo = (index, behavior = "smooth") => {
      const maxIndex = getMaxIndex();
      activeIndex = index > maxIndex ? 0 : index < 0 ? maxIndex : index;

      viewport.scrollTo({
        left: cards[activeIndex].offsetLeft,
        behavior: reducedMotion.matches ? "auto" : behavior,
      });

      updateControls();
    };

    const stopAutoplay = () => {
      window.clearInterval(autoplayId);
      autoplayId = 0;
    };

    const startAutoplay = () => {
      if (autoplayId || reducedMotion.matches || getMaxIndex() === 0 || !isVisible) return;

      autoplayId = window.setInterval(() => {
        if (!document.hidden) goTo(activeIndex + 1);
      }, 7000);
    };

    prevButton?.addEventListener("click", () => goTo(activeIndex + 1));
    nextButton?.addEventListener("click", () => goTo(activeIndex - 1));

    // Native touch momentum can cross several mandatory snap points in one
    // swipe. Treat each horizontal touch gesture as exactly one carousel step.
    viewport.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "touch" || !event.isPrimary) return;
      touchGesture = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        dragged: false,
      };
      activeIndex = Math.min(getNearestIndex(), getMaxIndex());
      stopAutoplay();
    }, { passive: true });

    viewport.addEventListener("pointermove", (event) => {
      if (!touchGesture || event.pointerId !== touchGesture.pointerId) return;
      const deltaX = event.clientX - touchGesture.startX;
      const deltaY = event.clientY - touchGesture.startY;
      if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
        touchGesture.dragged = true;
      }
    }, { passive: true });

    viewport.addEventListener("pointerup", (event) => {
      if (!touchGesture || event.pointerId !== touchGesture.pointerId) return;
      const { startX, startY, dragged } = touchGesture;
      touchGesture = null;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      const swipeThreshold = Math.max(32, viewport.clientWidth * 0.08);

      if (dragged && Math.abs(deltaX) >= swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
        suppressClickUntil = performance.now() + 400;
        goTo(activeIndex + (deltaX < 0 ? 1 : -1));
      }
    }, { passive: true });

    viewport.addEventListener("pointercancel", () => {
      touchGesture = null;
    }, { passive: true });

    viewport.addEventListener("click", (event) => {
      if (performance.now() > suppressClickUntil) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    viewport.addEventListener(
      "scroll",
      () => {
        window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(() => {
          activeIndex = Math.min(getNearestIndex(), getMaxIndex());
          updateControls();
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

    const projectsObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;

        if (isVisible) {
          startAutoplay();
        } else {
          stopAutoplay();
        }
      },
      { threshold: 0.12 }
    );

    projectsObserver.observe(slider);
    renderDots();
  };

  const initProjectDialogs = () => {
    document.querySelectorAll(".project-details-trigger[aria-controls]").forEach((trigger) => {
      const dialog = document.getElementById(trigger.getAttribute("aria-controls"));
      if (!(dialog instanceof HTMLDialogElement)) return;

      trigger.addEventListener("click", () => dialog.showModal());
      dialog.querySelector(".project-dialog-close")?.addEventListener("click", () => dialog.close());
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
      dialog.addEventListener("close", () => trigger.focus({ preventScroll: true }));
    });
  };

  const initProjectImagePreview = () => {
    const dialog = document.querySelector("#project-image-preview");
    const image = dialog?.querySelector(".project-image-dialog-image");
    const title = dialog?.querySelector("#project-image-preview-title");
    const closeButton = dialog?.querySelector(".project-image-dialog-close");
    const visitButton = dialog?.querySelector(".project-image-dialog-visit");
    if (!(dialog instanceof HTMLDialogElement) || !image || !title || !visitButton) return;

    let opener = null;
    let contactAction = null;
    document.querySelectorAll("[data-project-image-open]").forEach((button) => {
      button.addEventListener("click", () => {
        const source = button.querySelector("img");
        if (!source) return;
        opener = button;
        const card = button.closest("[data-project-card]");
        const projectAction = card?.querySelector(".project-actions a");
        image.src = source.currentSrc || source.src;
        image.alt = source.alt;
        title.textContent = card?.querySelector(".project-body h3")?.textContent.trim() || "پیش‌نمایش پروژه";
        contactAction = projectAction?.hasAttribute("data-contact-open") ? projectAction : null;
        visitButton.href = projectAction?.href || "#";
        visitButton.textContent = contactAction ? "درخواست دمو ↗" : "مشاهده پروژه ↗";
        if (contactAction) {
          visitButton.removeAttribute("target");
          visitButton.removeAttribute("rel");
        } else {
          visitButton.target = projectAction?.target || "_blank";
          visitButton.rel = projectAction?.rel || "noopener";
        }
        dialog.showModal();
      });
    });
    visitButton.addEventListener("click", (event) => {
      if (!contactAction) return;
      event.preventDefault();
      const action = contactAction;
      contactAction = null;
      dialog.close();
      window.setTimeout(() => action.click(), 0);
    });
    closeButton?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => opener?.focus({ preventScroll: true }));
  };

  const initProjectCards = () => {
    const cards = Array.from(document.querySelectorAll("[data-project-card]"));

    if (!cards.length || coarsePointer.matches || reducedMotion.matches || lowPowerDevice) return;

    cards.forEach((card) => {
      card.addEventListener(
        "pointermove",
        (event) => {
          const rect = card.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width - 0.5) * 7;
          const y = (0.5 - (event.clientY - rect.top) / rect.height) * 7;
          card.style.setProperty("--tilt-x", `${x.toFixed(2)}deg`);
          card.style.setProperty("--tilt-y", `${y.toFixed(2)}deg`);
        },
        { passive: true }
      );

      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
      });
    });
  };

  initServicesSlider();
  initTechTabs();
  initProjectsSlider();
  initProjectDialogs();
  initProjectImagePreview();
  initProjectCards();

})();
