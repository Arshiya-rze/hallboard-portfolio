import { booleanAttribute, Directive, effect, ElementRef, inject, input } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
})
export class AutoFocusDirective {
  readonly shouldFocus = input(true, {
    alias: 'appAutoFocusDirective',
    transform: booleanAttribute,
  });

  private readonly _elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    effect((onCleanup) => {
      if (!this.shouldFocus()) {
        return;
      }

      const focusTimer = setTimeout(() => this._elementRef.nativeElement.focus());

      onCleanup(() => clearTimeout(focusTimer));
    });
  }
}
