import { Directive, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Directive({
  selector: '[appClearControlFieldByClick]',
  host: {
    '(click)': 'onClick()',
  },
})
export class ClearControlFieldByClickDirective {
  readonly control = input.required<AbstractControl>({
    alias: 'appClearControlFieldByClick',
  });

  onClick(): void {
    const control = this.control();

    if (control.value !== '') {
      control.setValue('');
      control.markAsDirty();
      control.markAsTouched();
    }
  }
}