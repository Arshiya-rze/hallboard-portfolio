import { afterNextRender, Component, DestroyRef, ElementRef, inject } from '@angular/core';

@Component({
  selector: 'app-contact-dialog',
  imports: [],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class ContactDialog {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => this.initializeDialog());
  }

  private initializeDialog(): void {
    const dialog = this.host.nativeElement.querySelector<HTMLDialogElement>('#contact-dialog');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    let opener: HTMLElement | null = null;
    let pointerStartedOutside = false;
    const triggers = Array.from(document.querySelectorAll<HTMLElement>('[data-contact-open]'));
    triggers.forEach((trigger) => {
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-controls', dialog.id);
    });

    const openFromLink = (event: MouseEvent): void => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as Element;
      const link = target.closest<HTMLElement>('[data-contact-open]');
      if (!link) return;
      event.preventDefault();
      opener = link;
      if (!dialog.open) dialog.showModal();
      document.documentElement.classList.add('contact-modal-open');
    };
    const activateFromKeyboard = (event: KeyboardEvent): void => {
      if (event.key !== ' ') return;
      const target = event.target as Element;
      const trigger = target.closest<HTMLElement>('[data-contact-open]');
      if (!trigger) return;
      event.preventDefault();
      trigger.click();
    };
    const close = (): void => dialog.close();
    const onPointerDown = (event: PointerEvent): void => {
      const bounds = dialog.getBoundingClientRect();
      pointerStartedOutside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
    };
    const onClick = (event: MouseEvent): void => {
      if (!pointerStartedOutside) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
    };
    const onClose = (): void => {
      document.documentElement.classList.remove('contact-modal-open');
      opener?.focus({ preventScroll: true });
      opener = null;
    };
    document.addEventListener('click', openFromLink);
    document.addEventListener('keydown', activateFromKeyboard);
    dialog.querySelector('[data-contact-close]')?.addEventListener('click', close);
    dialog.addEventListener('pointerdown', onPointerDown);
    dialog.addEventListener('click', onClick);
    dialog.addEventListener('close', onClose);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('click', openFromLink);
      document.removeEventListener('keydown', activateFromKeyboard);
      dialog.querySelector('[data-contact-close]')?.removeEventListener('click', close);
      dialog.removeEventListener('pointerdown', onPointerDown);
      dialog.removeEventListener('click', onClick);
      dialog.removeEventListener('close', onClose);
      document.documentElement.classList.remove('contact-modal-open');
    });
  }
}
