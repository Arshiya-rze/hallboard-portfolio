import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { Confirm } from '../../ui/modals/confirm/confirm';
import { MatDialog } from '@angular/material/dialog';
import { map } from 'rxjs';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (
  component,
) => {
  const dialog = inject(MatDialog);

  if (!component.hasUnsavedChanges()) {
    return true;
  }

  const dialogRef = dialog.open(Confirm, {
    disableClose: true
  });

  return dialogRef.afterClosed().pipe(
    map((confirmed: boolean | undefined) => confirmed === true)
  );
};

/* USE-CASE
======================================
  
COMPONENT:
  readonly userEditFg = this.fb.group({
    name: [''],
    email: [''],
  });

  readonly anotherForm = this.fb.group(...


  hasUnsavedChanges(): boolean {
    return this.profileForm.dirty || this.anotherForm.dirty;
  }

  save(): void {
    // Save the form...

    // Prevent the dialog after a successful save.
    this.userEditFg.markAsPristine();
  }
  
________________________
ROUTE:
  {
    path: 'users/:id/edit',
    loadComponent: () =>
      import('./features/users/user-edit/user-edit').then(
        (m) => m.UserEdit,
      ),
    canDeactivate: [unsavedChangesGuard],
  }

*/