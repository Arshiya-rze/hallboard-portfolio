import { Component, inject } from '@angular/core';
import { LayoutBreakpointAdapter } from '../../../adapters/layout-breakpoint-adapter ';
import { LoggedInUser } from '../../../../auth/models/logged-in-user-model';
import { BrowserStorage } from '../../../../platform/browser-storage';

@Component({
  selector: 'app-sidebar',
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  isMobileViewSig = inject(LayoutBreakpointAdapter).isMobileViewSig;
  private readonly _browserStorage = inject(BrowserStorage);

  showName(): void {
    if (this.isMobileViewSig()) {
      console.log('This is a mobile size');
    }
  }

  getLoggedInUser(): void {
    const loggedInUser: LoggedInUser | null = this._browserStorage.localGetItem('loggedInUser');
  }
}
