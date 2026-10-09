import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AutoFocusDirective } from './auto-focus-directive';

@Component({
  imports: [AutoFocusDirective],
  template: '<input appAutoFocusDirective>',
})
class TestHost {}

describe('AutoFocusDirective', () => {
  it('focuses its host element after initialization', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(TestHost);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const focusSpy = vi.spyOn(input, 'focus');

    fixture.detectChanges();
    vi.runAllTimers();

    const directive = fixture.debugElement.children[0].injector.get(AutoFocusDirective);
    expect(directive).toBeTruthy();
    expect(focusSpy).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
