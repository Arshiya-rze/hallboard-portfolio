import { NgOptimizedImage } from '@angular/common';
import { afterNextRender, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';

@Component({
  selector: 'app-projects-section',
  imports: [NgOptimizedImage],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects {
  protected readonly projectDots = signal<number[]>([]);
  protected readonly activeProject = signal(0);
  protected readonly previewImage = signal('assets/projects/persiankhab-home-extracted.png');
  protected readonly previewWidth = signal(1517);
  protected readonly previewHeight = signal(1037);
  protected readonly previewAlt = signal('پیش‌نمایش پروژه');
  protected readonly previewUrl = signal('https://persiankhab.hallboard.ir/');
  protected readonly previewActionContact = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private previewContactTrigger: HTMLAnchorElement | null = null;

  constructor() {
    afterNextRender(() => this.initializeSliderAndDialogs());
  }

  protected goToProject(index: number): void {
    const viewport = this.host.nativeElement.querySelector<HTMLElement>('.projects-viewport');
    const track = this.host.nativeElement.querySelector<HTMLElement>('[data-projects-track]');
    const cards = Array.from(track?.children ?? []) as HTMLElement[];
    if (!viewport || !cards.length) return;
    const maxIndex = Math.max(0, cards.length - this.projectsPerView());
    const nextIndex = Math.max(0, Math.min(index, maxIndex));
    this.activeProject.set(nextIndex);
    viewport.scrollTo({ left: cards[nextIndex]?.offsetLeft ?? 0, behavior: this.reducedMotion() ? 'auto' : 'smooth' });
  }

  private initializeSliderAndDialogs(): void {
    const root = this.host.nativeElement;
    const observationTarget = root.querySelector<HTMLElement>('.projects-section') ?? root;
    const viewport = root.querySelector<HTMLElement>('.projects-viewport');
    const track = root.querySelector<HTMLElement>('[data-projects-track]');
    const cards = Array.from(track?.children ?? []) as HTMLElement[];
    const detailsDialogs = Array.from(root.querySelectorAll<HTMLDialogElement>('.project-dialog'));
    const imageDialog = root.querySelector<HTMLDialogElement>('#project-image-preview');
    if (!viewport || !track || !cards.length) return;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
    const prefersReducedMotion = (): boolean => reducedMotion?.matches ?? false;
    let autoplay = 0;
    let scrollTimer = 0;
    let resizeFrame = 0;
    let touch: { id: number; x: number; y: number; index: number; dragged: boolean } | null = null;
    let suppressClickUntil = 0;
    let isVisible = false;
    let manualInteraction = false;
    let imageOpener: HTMLElement | null = null;
    const dialogOpeners = new WeakMap<HTMLDialogElement, HTMLElement>();

    const perView = (): number => this.projectsPerView();
    const maxIndex = (): number => Math.max(0, cards.length - perView());
    const nearestIndex = (): number => cards.reduce((nearest, card, index) => {
      const distance = Math.abs(card.offsetLeft - viewport.scrollLeft);
      const nearestDistance = Math.abs((cards[nearest]?.offsetLeft ?? 0) - viewport.scrollLeft);
      return distance < nearestDistance ? index : nearest;
    }, 0);
    const updateDots = (): void => {
      const index = Math.min(nearestIndex(), maxIndex());
      this.activeProject.set(index);
    };
    const stopAutoplay = (): void => {
      window.clearInterval(autoplay);
      autoplay = 0;
    };
    const startAutoplay = (): void => {
      if (autoplay || prefersReducedMotion() || manualInteraction || !isVisible || maxIndex() === 0) return;
      autoplay = window.setInterval(() => {
        if (!document.hidden) this.goToProject((this.activeProject() + 1) % (maxIndex() + 1));
      }, 7000);
    };
    const disableAutoplay = (): void => {
      manualInteraction = true;
      stopAutoplay();
    };
    const scrollListener = (): void => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(updateDots, 80);
    };
    const goPrevious = (): void => this.goToProject(this.activeProject() + 1 > maxIndex() ? 0 : this.activeProject() + 1);
    const goNext = (): void => this.goToProject(this.activeProject() - 1 < 0 ? maxIndex() : this.activeProject() - 1);
    const previousButton = root.querySelector<HTMLButtonElement>('[data-project-prev]');
    const nextButton = root.querySelector<HTMLButtonElement>('[data-project-next]');
    const dialogListeners = detailsDialogs.map((dialog) => {
      const onDialogClick = (event: MouseEvent): void => {
        if (event.target === dialog) dialog.close();
      };
      const onDialogClose = (): void => dialogOpeners.get(dialog)?.focus({ preventScroll: true });
      dialog.addEventListener('click', onDialogClick);
      dialog.addEventListener('close', onDialogClose);
      return (): void => {
        dialog.removeEventListener('click', onDialogClick);
        dialog.removeEventListener('close', onDialogClose);
      };
    });
    const onImageDialogClick = (event: MouseEvent): void => {
      if (event.target === imageDialog) imageDialog?.close();
    };
    const onImageDialogClose = (): void => {
      imageOpener?.focus({ preventScroll: true });
      imageOpener = null;
    };
    imageDialog?.addEventListener('click', onImageDialogClick);
    imageDialog?.addEventListener('close', onImageDialogClose);
    const onRootClick = (event: MouseEvent): void => {
      const target = event.target as Element;
      if (performance.now() < suppressClickUntil && target.closest('[data-project-image-open]')) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const visual = target.closest<HTMLButtonElement>('[data-project-image-open]');
      if (visual && imageDialog) {
        const image = visual.querySelector<HTMLImageElement>('img');
        const card = visual.closest<HTMLElement>('.project-card');
        const projectName = card?.querySelector<HTMLElement>('.project-body h3')?.textContent?.trim() ?? 'پروژه';
        const projectAction = card?.querySelector<HTMLAnchorElement>('.project-actions a') ?? null;
        const projectLink = projectAction?.getAttribute('href') ?? '#';
        if (image) {
          this.previewImage.set(image.getAttribute('ngsrc') ?? image.currentSrc ?? image.src);
          this.previewWidth.set(image.naturalWidth || Number(image.getAttribute('width')) || 1280);
          this.previewHeight.set(image.naturalHeight || Number(image.getAttribute('height')) || 720);
        }
        this.previewAlt.set(image?.alt || projectName);
        this.previewUrl.set(projectLink);
        this.previewActionContact.set(projectAction?.hasAttribute('data-contact-open') ?? false);
        this.previewContactTrigger = projectAction?.hasAttribute('data-contact-open') ? projectAction : null;
        imageOpener = visual;
        this.openDialog(imageDialog);
      }
      const details = target.closest<HTMLButtonElement>('.project-details-trigger');
      if (details) {
        const dialogId = details.getAttribute('aria-controls');
        const dialog = dialogId ? document.getElementById(dialogId) as HTMLDialogElement | null : null;
        if (dialog) {
          dialogOpeners.set(dialog, details);
          this.openDialog(dialog);
        }
      }
      const visit = target.closest<HTMLAnchorElement>('.project-image-dialog-visit');
      if (visit && this.previewActionContact()) {
        event.preventDefault();
        const action = this.previewContactTrigger;
        imageDialog?.close();
        window.setTimeout(() => action?.click(), 0);
      }
      const close = target.closest<HTMLButtonElement>('.project-dialog-close, .project-image-dialog-close');
      if (close) close.closest('dialog')?.close();
    };
    const onPointerCancel = (): void => { touch = null; };
    const onPointerDown = (): void => disableAutoplay();
    const onWheel = (): void => disableAutoplay();
    const onFocusIn = (): void => disableAutoplay();
    const motionAllowed = (window.matchMedia?.('(hover: hover) and (pointer: fine)')?.matches ?? false)
      && !prefersReducedMotion()
      && (navigator.hardwareConcurrency || 8) > 4;
    const cardMotionListeners = motionAllowed ? cards.map((card) => {
      const onPointerMove = (event: PointerEvent): void => {
        const bounds = card.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 7;
        const y = (0.5 - (event.clientY - bounds.top) / bounds.height) * 7;
        card.style.setProperty('--tilt-x', `${x.toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${y.toFixed(2)}deg`);
      };
      const onPointerLeave = (): void => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      };
      card.addEventListener('pointermove', onPointerMove, { passive: true });
      card.addEventListener('pointerleave', onPointerLeave);
      return (): void => {
        card.removeEventListener('pointermove', onPointerMove);
        card.removeEventListener('pointerleave', onPointerLeave);
      };
    }) : [];
    previousButton?.addEventListener('click', goPrevious);
    nextButton?.addEventListener('click', goNext);
    viewport.addEventListener('scroll', scrollListener, { passive: true });
    root.addEventListener('pointerdown', onPointerDown, { passive: true });
    root.addEventListener('wheel', onWheel, { passive: true });
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('click', onRootClick);

    const onTouchStart = (event: PointerEvent): void => {
      if (event.pointerType !== 'touch' || !event.isPrimary) return;
      touch = { id: event.pointerId, x: event.clientX, y: event.clientY, index: Math.min(nearestIndex(), maxIndex()), dragged: false };
      disableAutoplay();
    };
    const onTouchMove = (event: PointerEvent): void => {
      if (!touch || event.pointerId !== touch.id) return;
      const dx = event.clientX - touch.x;
      const dy = event.clientY - touch.y;
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) touch.dragged = true;
    };
    const onTouchEnd = (event: PointerEvent): void => {
      if (!touch || event.pointerId !== touch.id) return;
      const deltaX = event.clientX - touch.x;
      const deltaY = event.clientY - touch.y;
      const wasDragged = touch.dragged;
      const startIndex = touch.index;
      touch = null;
      if (wasDragged && Math.abs(deltaX) > Math.max(32, viewport.clientWidth * 0.08) && Math.abs(deltaX) > Math.abs(deltaY)) {
        suppressClickUntil = performance.now() + 400;
        this.goToProject(startIndex + (deltaX < 0 ? 1 : -1));
      }
    };
    viewport.addEventListener('pointerdown', onTouchStart, { passive: true });
    viewport.addEventListener('pointermove', onTouchMove, { passive: true });
    viewport.addEventListener('pointerup', onTouchEnd, { passive: true });
    viewport.addEventListener('pointercancel', onPointerCancel, { passive: true });

    const visibility = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      isVisible = entry?.isIntersecting ?? false;
      if (isVisible) startAutoplay();
      else stopAutoplay();
    }, { threshold: 0.08 });
    visibility?.observe(observationTarget);
    const onResize = (): void => {
      if (resizeFrame) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        const pages = Math.max(1, maxIndex() + 1);
        this.projectDots.set(Array.from({ length: pages }, (_, index) => index));
        this.goToProject(Math.min(this.activeProject(), maxIndex()));
      });
    };
    window.addEventListener('resize', onResize, { passive: true });
    const onMotionChange = (): void => prefersReducedMotion() ? stopAutoplay() : startAutoplay();
    reducedMotion?.addEventListener('change', onMotionChange);
    this.destroyRef.onDestroy(() => {
      stopAutoplay();
      window.clearTimeout(scrollTimer);
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      visibility?.disconnect();
      window.removeEventListener('resize', onResize);
      reducedMotion?.removeEventListener('change', onMotionChange);
      viewport.removeEventListener('scroll', scrollListener);
      viewport.removeEventListener('pointercancel', onPointerCancel);
      viewport.removeEventListener('pointerdown', onTouchStart);
      viewport.removeEventListener('pointermove', onTouchMove);
      viewport.removeEventListener('pointerup', onTouchEnd);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('click', onRootClick);
      imageDialog?.removeEventListener('click', onImageDialogClick);
      imageDialog?.removeEventListener('close', onImageDialogClose);
      dialogListeners.forEach((dispose) => dispose());
      cardMotionListeners.forEach((dispose) => dispose());
      previousButton?.removeEventListener('click', goPrevious);
      nextButton?.removeEventListener('click', goNext);
    });
    this.projectDots.set(Array.from({ length: Math.max(1, maxIndex() + 1) }, (_, index) => index));
  }

  private openDialog(dialog: HTMLDialogElement): void {
    if (!dialog.open && typeof dialog.showModal === 'function') dialog.showModal();
  }

  private projectsPerView(): number {
    if (typeof window === 'undefined') return 1;
    if (window.matchMedia?.('(min-width: 1025px)')?.matches ?? window.innerWidth >= 1025) return 3;
    if (window.matchMedia?.('(min-width: 768px)')?.matches ?? window.innerWidth >= 768) return 2;
    return 1;
  }

  private reducedMotion(): boolean {
    return typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false);
  }
}
