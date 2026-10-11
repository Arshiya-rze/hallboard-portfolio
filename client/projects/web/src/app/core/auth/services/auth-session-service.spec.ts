import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthSessionService } from './auth-session-service';
import { ApiClient } from '../../http/api-client';
import { BrowserStorage } from '../../platform/browser-storage';

describe('AuthSessionService', () => {
  let service: AuthSessionService;
  let sessionClearCount: number;

  beforeEach(() => {
    sessionClearCount = 0;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ApiClient,
          useValue: { postNoBody: () => of(null) },
        },
        {
          provide: BrowserStorage,
          useValue: { sessionClear: () => sessionClearCount += 1 },
        },
        {
          provide: Router,
          useValue: { navigate: () => Promise.resolve(true) },
        },
      ],
    });
    service = TestBed.inject(AuthSessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('clears stale session state when reload returns no user', () => {
    service.setCurrentUser({ rolesStr: ['user'] });

    service.reloadLoggedInUser().subscribe();

    expect(service.loggedInUserSig()).toBeUndefined();
    expect(sessionClearCount).toBe(1);
  });
});
