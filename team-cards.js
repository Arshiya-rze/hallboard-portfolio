(() => {
  "use strict";

  const hoverPointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector("header.header");
  const clamp = (value) => Math.max(-1, Math.min(1, value));
  const motionProperties = [
    "--card-rx", "--card-ry", "--card-light-x", "--card-light-y",
    "--card-shadow-x", "--card-shadow-y", "--portrait-x", "--portrait-y",
    "--portrait-light-x", "--portrait-light-y",
  ];
  const controllers = [];
  const observedCards = new WeakMap();
  let viewportFrame = 0;

  // One template and one interaction controller for every configured member.
  // Unconfigured cards (and browsers without JS) retain their static portrait.
  const portraitTemplate = document.querySelector("#team-portrait-template");
  const enhancePortrait = (card) => {
    if (!card.dataset.portraitSrc || !portraitTemplate) return;
    const originalStage = card.querySelector(".team-card-visual");
    const originalPhoto = originalStage?.querySelector("img");
    if (!originalPhoto) return;
    const stage = portraitTemplate.content.firstElementChild.cloneNode(true);
    const photo = originalPhoto.cloneNode(true);
    photo.className = "living-portrait-image living-portrait-photo";
    stage.querySelector("[data-portrait-photo-slot]").replaceWith(photo);
    stage.querySelector("[data-portrait-image]").dataset.src = card.dataset.portraitSrc;
    const nameId = card.getAttribute("aria-labelledby");
    stage.id = nameId + "-portrait";
    const button = stage.querySelector("[data-portrait-toggle]");
    button.setAttribute("aria-controls", stage.id);
    button.setAttribute("aria-describedby", nameId);
    if (card.dataset.portraitMask) {
      const mask = new URL(card.dataset.portraitMask, document.baseURI);
      card.style.setProperty("--portrait-mask", "url(" + JSON.stringify(mask.href) + ")");
    }
    originalStage.replaceWith(stage);
    card.classList.add("team-card--living");
    card.setAttribute("data-living-portrait", "");
  };

  const visibilityObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) observedCards.get(entry.target)?.reset();
      });
    })
    : null;

  const preloadObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observedCards.get(entry.target)?.loadPortrait();
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "500px" })
    : null;

  document.querySelectorAll("[data-team-scene]").forEach((scene) => {
    const card = scene.querySelector("[data-team-card]");
    if (!card) return;
    enhancePortrait(card);

    const stage = card.querySelector(".living-portrait");
    const image = card.querySelector("[data-portrait-image]");
    const button = card.querySelector("[data-portrait-toggle]");
    const label = card.querySelector("[data-portrait-label]");
    const hasPortrait = card.hasAttribute("data-living-portrait") && stage && image && button && label;
    const target = { x: 0, y: 0 };
    const position = { x: 0, y: 0 };
    let hovered = false;
    let focused = false;
    let pressed = false;
    let requested = false;
    let ready = false;
    let portraitActive = false;
    let loading = null;
    let frame = 0;
    let previousTime = 0;
    let arrivalTime = null;
    let leavingTimer = 0;

    const updateViewport = () => {
      if (!hasPortrait) return;
      if (reducedMotion.matches) {
        card.style.setProperty("--portrait-pop", "0");
        return;
      }
      if (!requested && !portraitActive) return;
      const safeTop = Math.max(12, (header?.getBoundingClientRect().bottom ?? 0) + 8);
      const available = scene.getBoundingClientRect().top - safeTop;
      card.style.setProperty("--portrait-pop", Math.max(0, Math.min(1, available / 38)).toFixed(3));
    };

    const renderEngagement = () => {
      const engaged = hovered || focused || pressed || portraitActive;
      card.classList.toggle("is-card-engaged", engaged);
      scene.classList.toggle("is-card-engaged", engaged);
      card.classList.toggle("is-card-pressed", pressed);
    };

    const renderMotion = () => {
      const { x, y } = position;
      card.style.setProperty("--card-rx", `${(-y * 4).toFixed(2)}deg`);
      card.style.setProperty("--card-ry", `${(x * 6).toFixed(2)}deg`);
      card.style.setProperty("--card-light-x", `${(50 + x * 45).toFixed(1)}%`);
      card.style.setProperty("--card-light-y", `${(50 + y * 45).toFixed(1)}%`);
      card.style.setProperty("--card-shadow-x", `${(-x * 12).toFixed(2)}px`);
      card.style.setProperty("--card-shadow-y", `${(18 - y * 8).toFixed(2)}px`);
      card.style.setProperty("--portrait-x", `${(x * 6).toFixed(2)}px`);
      card.style.setProperty("--portrait-y", `${(y * 3).toFixed(2)}px`);
      card.style.setProperty("--portrait-light-x", `${(50 + x * 30).toFixed(1)}%`);
      card.style.setProperty("--portrait-light-y", `${(35 + y * 20).toFixed(1)}%`);
    };

    const resetMotion = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      arrivalTime = null;
      target.x = target.y = position.x = position.y = 0;
      motionProperties.forEach((property) => card.style.removeProperty(property));
    };

    // Time-based easing feels the same on 60/120 Hz screens and sleeps at rest.
    const animate = (time) => {
      frame = 0;
      if (reducedMotion.matches || document.hidden) {
        resetMotion();
        return;
      }

      const elapsed = previousTime ? Math.min(time - previousTime, 50) : 16;
      previousTime = time;
      const progress = arrivalTime === null ? 1 : Math.min((time - arrivalTime) / 650, 1);
      const arrival = Math.sin(progress * Math.PI);
      if (progress === 1) arrivalTime = null;
      const x = clamp(target.x - arrival * 0.32);
      const y = clamp(target.y + arrival * 0.38);
      const ease = 1 - Math.exp(-elapsed / 90);
      position.x += (x - position.x) * ease;
      position.y += (y - position.y) * ease;
      const moving = Math.abs(x - position.x) + Math.abs(y - position.y) > 0.001;
      if (!moving && arrivalTime === null) {
        position.x = x;
        position.y = y;
      }
      renderMotion();

      if (moving || arrivalTime !== null) {
        frame = requestAnimationFrame(animate);
      } else {
        previousTime = 0;
      }
    };

    const scheduleMotion = () => {
      if (!frame && !reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(animate);
    };

    const renderPortrait = () => {
      if (!hasPortrait) return;
      const nextActive = requested && ready;
      if (nextActive) {
        updateViewport();
        clearTimeout(leavingTimer);
        leavingTimer = 0;
        scene.classList.remove("is-portrait-leaving");
      } else if (portraitActive && !reducedMotion.matches) {
        // Keep the fading silhouette above neighbouring cards until it disappears.
        scene.classList.add("is-portrait-leaving");
        leavingTimer = window.setTimeout(() => {
          scene.classList.remove("is-portrait-leaving");
          leavingTimer = 0;
        }, 650);
      }
      if (nextActive && !portraitActive && !hovered && !reducedMotion.matches) {
        arrivalTime = performance.now();
        scheduleMotion();
      }
      portraitActive = nextActive;
      card.classList.toggle("is-portrait-active", portraitActive);
      button.setAttribute("aria-pressed", String(portraitActive));
      label.textContent = portraitActive ? "عکس اصلی" : "کاراکتر سه‌بعدی";
      renderEngagement();
    };

    const loadPortrait = () => {
      if (!hasPortrait || loading) return loading;
      const source = image.dataset.src;
      if (!source) return null;
      image.src = source;
      const decoded = typeof image.decode === "function"
        ? image.decode()
        : new Promise((resolve, reject) => {
          if (image.complete) {
            image.naturalWidth ? resolve() : reject();
          } else {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", reject, { once: true });
          }
        });
      // The original stays visible until the replacement has actually decoded.
      loading = decoded.then(() => {
        ready = true;
        button.hidden = false;
        renderPortrait();
      }).catch(() => {
        ready = requested = false;
        button.hidden = true;
        renderPortrait();
      });
      return loading;
    };

    const setPortrait = (value) => {
      if (!hasPortrait) return;
      requested = value;
      if (value) loadPortrait();
      else arrivalTime = null;
      renderPortrait();
      if (!hovered) {
        target.x = target.y = 0;
        scheduleMotion();
      }
    };

    const reset = () => {
      hovered = focused = pressed = requested = false;
      resetMotion();
      renderPortrait();
      renderEngagement();
    };

    const updatePointer = (event) => {
      if (!hovered || event.pointerType !== "mouse" || event.buttons || reducedMotion.matches) return;
      // The scene never tilts, so transforming the card cannot move the input plane.
      const rect = scene.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      target.x = clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2);
      target.y = clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2);
      scheduleMotion();
    };

    scene.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse" || !hoverPointer.matches) return;
      hovered = true;
      arrivalTime = null;
      renderEngagement();
      updatePointer(event);
      setPortrait(true);
    });
    scene.addEventListener("pointermove", updatePointer, { passive: true });
    scene.addEventListener("pointerleave", (event) => {
      pressed = false;
      if (event.pointerType === "mouse") {
        hovered = false;
        target.x = target.y = 0;
        setPortrait(false);
        scheduleMotion();
      }
      renderEngagement();
    });
    scene.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" || event.isPrimary === false) return;
      pressed = true;
      renderEngagement();
    }, { passive: true });
    scene.addEventListener("focusin", () => {
      focused = true;
      renderEngagement();
    });
    scene.addEventListener("focusout", (event) => {
      if (scene.contains(event.relatedTarget)) return;
      focused = false;
      setPortrait(false);
      renderEngagement();
    });

    if (hasPortrait) {
      // Hover only activates on entry: clicking “original” stays off until re-entry.
      button.addEventListener("click", () => setPortrait(!requested));
      if (preloadObserver) preloadObserver.observe(scene);
      else loadPortrait();
    }

    const controller = {
      scene, reset, resetMotion, loadPortrait, updateViewport,
      needsViewportUpdate: () => requested || portraitActive,
      release: () => {
        if (!pressed) return;
        pressed = false;
        renderEngagement();
      },
    };
    controllers.push(controller);
    observedCards.set(scene, controller);
    visibilityObserver?.observe(scene);
    if (hasPortrait) {
      observedCards.set(stage, controller);
      visibilityObserver?.observe(stage);
    }
  });

  if (!controllers.length) return;

  // Scroll/resize work is coalesced into one frame, and only while a portrait is open.
  const scheduleViewportUpdate = () => {
    if (viewportFrame || !controllers.some((card) => card.needsViewportUpdate())) return;
    viewportFrame = requestAnimationFrame(() => {
      viewportFrame = 0;
      controllers.forEach((card) => card.updateViewport());
    });
  };

  window.addEventListener("scroll", scheduleViewportUpdate, { passive: true, capture: true });
  window.addEventListener("resize", scheduleViewportUpdate, { passive: true });

  document.addEventListener("pointerup", () => controllers.forEach((card) => card.release()), { passive: true });
  document.addEventListener("pointercancel", () => controllers.forEach((card) => card.release()), { passive: true });
  document.addEventListener("click", (event) => {
    controllers.forEach((card) => {
      if (!card.scene.contains(event.target)) card.reset();
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") controllers.forEach((card) => card.reset());
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(viewportFrame);
      viewportFrame = 0;
      controllers.forEach((card) => card.reset());
    }
  });
  window.addEventListener("blur", () => controllers.forEach((card) => card.reset()));
  hoverPointer.addEventListener("change", () => controllers.forEach((card) => card.reset()));
  reducedMotion.addEventListener("change", () => controllers.forEach((card) => {
    card.resetMotion();
    card.updateViewport();
  }));
})();
