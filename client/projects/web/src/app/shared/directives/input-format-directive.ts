import { Directive, ElementRef, inject, input } from '@angular/core';

type InputFormat = 'uppercase' | 'lowercase';

@Directive({
  selector: '[appInputFormat]',
  host: {
    '(blur)': 'onBlur()',
  },
})
export class InputFormatDirective {
  private readonly elRef = inject<ElementRef<HTMLInputElement>>(ElementRef);

  readonly format = input<InputFormat>('lowercase', {
    alias: 'appInputFormat',
  });

  onBlur(): void {
    const input = this.elRef.nativeElement;
    const value = input.value;
    const format = this.format();

    input.value =
      format === 'uppercase'
        ? value.toUpperCase()
        : value.toLowerCase();
  }
}