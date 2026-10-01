(() => {
  "use strict";

  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hardwareConcurrency = navigator.hardwareConcurrency || 8;
  const deviceMemory = navigator.deviceMemory || 8;
  const lowPowerDevice = hardwareConcurrency <= 4 || deviceMemory <= 4;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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
    const techStack = document.querySelector(".tech-stack");

    if (!tabs.length || !panels.length || !techStack) return;

    let activeIndex = Math.max(
      0,
      tabs.findIndex((tab) => tab.classList.contains("is-active"))
    );
    let autoplayId = 0;
    let isPaused = false;

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

    const startAutoplay = () => {
      stopAutoplay();

      if (reducedMotion.matches || isPaused || document.hidden) return;

      autoplayId = window.setInterval(() => {
        activeIndex = (activeIndex + 1) % tabs.length;
        activate(tabs[activeIndex].dataset.techTarget);
      }, 2500);
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        activeIndex = tabs.indexOf(tab);
        activate(tab.dataset.techTarget);
        startAutoplay();
      });
    });

    techStack.addEventListener("pointerenter", () => {
      isPaused = true;
      stopAutoplay();
    });
    techStack.addEventListener("pointerleave", () => {
      isPaused = false;
      startAutoplay();
    });
    techStack.addEventListener("focusin", () => {
      isPaused = true;
      stopAutoplay();
    });
    techStack.addEventListener("focusout", (event) => {
      if (!techStack.contains(event.relatedTarget)) {
        isPaused = false;
        startAutoplay();
      }
    });
    document.addEventListener("visibilitychange", startAutoplay);
    reducedMotion.addEventListener?.("change", startAutoplay);

    startAutoplay();
  };

  const initEngineeringExperience = () => {
    const section = document.querySelector("[data-engineering-experience]");

    if (!section) return;

    const title = section.querySelector("[data-story-title]");
    const description = section.querySelector("[data-story-description]");
    const nodes = Array.from(section.querySelectorAll("[data-story-node]"));
    const pills = Array.from(section.querySelectorAll("[data-stage-pill]"));
    const visual = section.querySelector("[data-engineering-visual]");
    const nodeInfo = section.querySelector("[data-node-info]");
    const nodeInfoTitle = nodeInfo?.querySelector("strong");
    const nodeInfoText = nodeInfo?.querySelector("span");

    const stageContent = [
      {
        title: "ما ایده‌ها را به محصولات دیجیتال تبدیل می‌کنیم",
        description: "امن، سریع و مقیاس‌پذیر می‌سازیم؛ با کد تمیز و همراهی تا پس از انتشار.",
      },
      {
        title: "تحلیل و طراحی",
        description: "قبل از توسعه، مسئله، مسیر محصول، اولویت‌ها و معماری اولیه را دقیق و قابل تصمیم‌گیری می‌کنیم.",
      },
      {
        title: "مهندسی و توسعه",
        description: "فرانت‌اند و بک‌اند مثل دو لایه هماهنگ از یک محصول واحد ساخته می‌شوند؛ سریع، تمیز و قابل توسعه.",
      },
      {
        title: "ساخت سیستم‌های مقیاس‌پذیر",
        description: "داده، زیرساخت، استقرار و مانیتورینگ از ابتدا برای رشد پایدار محصول طراحی می‌شوند.",
      },
      {
        title: "از ایده تا محصول",
        description: "در پایان، همه قابلیت‌ها به یک اکوسیستم دیجیتال متصل تبدیل می‌شوند؛ آماده استفاده واقعی و رشد کسب‌وکار.",
      },
    ];

    let frameId = 0;
    let visible = false;
    let activeStage = 0;
    let copyTimer = 0;
    let activeNode = null;

    const canUseWebGL = () => {
      try {
        const canvas = document.createElement("canvas");
        return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
      } catch {
        return false;
      }
    };

    section.classList.toggle("is-low-power", lowPowerDevice);
    section.classList.toggle("is-reduced-motion", reducedMotion.matches);
    section.classList.toggle("no-webgl", !canUseWebGL());

    const getStageFromProgress = (progress) => {
      if (progress < 0.18) return 0;
      if (progress < 0.38) return 1;
      if (progress < 0.62) return 2;
      if (progress < 0.82) return 3;
      return 4;
    };

    const updateNodeInfo = (node) => {
      if (!node || !nodeInfoTitle || !nodeInfoText) return;

      activeNode?.classList.remove("is-active");
      activeNode = node;
      activeNode.classList.add("is-active");
      section.classList.add("is-inspecting");
      nodeInfoTitle.textContent = node.dataset.nodeTitle || "قابلیت مهندسی";
      nodeInfoText.textContent = node.dataset.nodeDescription || "";
    };

    const resetNodeInfo = () => {
      activeNode?.classList.remove("is-active");
      activeNode = null;
      section.classList.remove("is-inspecting");

      if (nodeInfoTitle && nodeInfoText) {
        nodeInfoTitle.textContent = "موتور محصول دیجیتال";
        nodeInfoText.textContent = "با اسکرول، اکوسیستم مهندسی کامل هالبورد فعال می‌شود.";
      }
    };

    const applyStage = (stage) => {
      if (stage === activeStage) return;

      section.classList.remove(`story-stage-${activeStage}`);
      section.classList.add(`story-stage-${stage}`);
      activeStage = stage;

      nodes.forEach((node) => {
        const nodeStage = Number(node.dataset.storyStage || 0);
        const isVisible = stage > 0 && nodeStage <= stage;
        node.classList.toggle("is-visible", isVisible);

        if (!isVisible && node === activeNode) {
          resetNodeInfo();
        }
      });

      pills.forEach((pill) => {
        pill.classList.toggle("is-active", Number(pill.dataset.stagePill || 0) === stage);
      });

      window.clearTimeout(copyTimer);
      section.classList.add("is-copy-changing");

      copyTimer = window.setTimeout(() => {
        if (title) title.textContent = stageContent[stage].title;
        if (description) description.textContent = stageContent[stage].description;
        section.classList.remove("is-copy-changing");
      }, reducedMotion.matches ? 0 : 130);
    };

    const render = () => {
      frameId = 0;

      if (!visible || document.hidden) return;

      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp(-rect.top / scrollable, 0, 1);

      section.style.setProperty("--story-progress", progress.toFixed(3));
      section.style.setProperty("--story-progress-width", `${(progress * 100).toFixed(1)}%`);
      section.style.setProperty("--story-spin", `${(progress * 120).toFixed(1)}deg`);
      section.style.setProperty("--story-conic-opacity", (0.35 + progress * 0.5).toFixed(3));
      section.style.setProperty("--story-orbit-opacity", (0.34 + progress * 0.32).toFixed(3));
      section.style.setProperty("--story-core-scale", (0.9 + progress * 0.14).toFixed(3));
      section.style.setProperty("--story-particle-opacity", (0.22 + progress * 0.72).toFixed(3));
      section.style.setProperty("--story-info-shift", `${(12 - progress * 10).toFixed(1)}px`);
      applyStage(getStageFromProgress(progress));

      if (!reducedMotion.matches) {
        frameId = requestAnimationFrame(render);
      }
    };

    const start = () => {
      if (!frameId && visible && !document.hidden) {
        frameId = requestAnimationFrame(render);
      }
    };

    const stop = () => {
      if (!frameId) return;
      cancelAnimationFrame(frameId);
      frameId = 0;
    };

    nodes.forEach((node) => {
      if (!coarsePointer.matches) {
        node.addEventListener("pointerenter", () => updateNodeInfo(node));
      }

      node.addEventListener("focus", () => updateNodeInfo(node));
      node.addEventListener("click", () => updateNodeInfo(node));
    });

    section.addEventListener("pointerleave", resetNodeInfo);
    section.addEventListener("focusout", (event) => {
      if (!section.contains(event.relatedTarget)) resetNodeInfo();
    });

    if (!coarsePointer.matches && !lowPowerDevice && visual) {
      visual.addEventListener(
        "pointermove",
        (event) => {
          const rect = visual.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width - 0.5) * 5.5;
          const y = (0.5 - (event.clientY - rect.top) / rect.height) * 5.5;
          section.style.setProperty("--parallax-x-deg", `${x.toFixed(2)}deg`);
          section.style.setProperty("--parallax-y-deg", `${y.toFixed(2)}deg`);
        },
        { passive: true }
      );

      visual.addEventListener("pointerleave", () => {
        section.style.setProperty("--parallax-x-deg", "0deg");
        section.style.setProperty("--parallax-y-deg", "0deg");
      });
    }

    const storyObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          start();
        } else {
          stop();
        }
      },
      { threshold: 0.03 }
    );

    storyObserver.observe(section);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });

    window.addEventListener(
      "scroll",
      () => {
        if (visible && reducedMotion.matches && !frameId) {
          frameId = requestAnimationFrame(render);
        }
      },
      { passive: true }
    );

    reducedMotion.addEventListener?.("change", (event) => {
      section.classList.toggle("is-reduced-motion", event.matches);
      if (event.matches) {
        stop();
        render();
      } else {
        start();
      }
    });

    applyStage(0);
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
  initEngineeringExperience();
  initProjectsSlider();
  initProjectDialogs();
  initProjectImagePreview();
  initProjectCards();

})();
