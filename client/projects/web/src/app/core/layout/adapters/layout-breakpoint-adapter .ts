import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { inject, Service, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Service()
export class LayoutBreakpointAdapter {
  private breakpointObserver = inject(BreakpointObserver);
  private readonly _isMobileViewSig: WritableSignal<boolean> = signal<boolean>(false);

  // Read this from components: `isMobileViewSig()`
  readonly isMobileViewSig = this._isMobileViewSig.asReadonly();

  constructor() {
    this.setBreakpointObserver();
  }

  private setBreakpointObserver(): void {
    this.breakpointObserver
      .observe('(min-width: 51rem)') // include iPad/tablet
      .pipe(takeUntilDestroyed())
      .subscribe((bPS: BreakpointState) => {
        this._isMobileViewSig.set(!bPS.matches);
      });
  }
}
