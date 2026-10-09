import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InputFormatDirective } from './input-format-directive';

@Component({
  imports: [InputFormatDirective],
  template: '<input appInputFormatDir="uppercase">',
})
class TestHost {}

describe('FormatLettersDirective', () => {
  it('should create an instance', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const directive = fixture.debugElement.children[0].injector.get(InputFormatDirective);
    expect(directive).toBeTruthy();
  });
});
