import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { HasUnsavedChanges, unsavedChangesGuard } from './unsaved-changes-guard';

describe('unsavedChangesGuard', () => {
  let dialogOpenCount: number;

  const executeGuard = (component: HasUnsavedChanges) =>
    TestBed.runInInjectionContext(() => unsavedChangesGuard(
      component,
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
      {} as RouterStateSnapshot,
    ));

  beforeEach(() => {
    dialogOpenCount = 0;

    TestBed.configureTestingModule({
      providers: [{
        provide: MatDialog,
        useValue: {
          open: () => {
            dialogOpenCount += 1;
            return { afterClosed: () => of(true) };
          },
        },
      }],
    });
  });

  it('allows navigation without opening a dialog when there are no changes', () => {
    const result = executeGuard({ hasUnsavedChanges: () => false });

    expect(result).toBe(true);
    expect(dialogOpenCount).toBe(0);
  });

  it('opens a confirmation dialog when there are unsaved changes', () => {
    executeGuard({ hasUnsavedChanges: () => true });

    expect(dialogOpenCount).toBe(1);
  });
});
