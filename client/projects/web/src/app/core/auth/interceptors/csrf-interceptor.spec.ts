import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { BrowserStorage } from '../../platform/browser-storage';
import { AuthSessionService } from '../services/auth-session-service';
import { csrfInterceptor } from './csrf-interceptor';

describe('csrfInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => csrfInterceptor(req, next));
  let storedToken: string | null;
  let tokenRequestCount: number;
  let forwardedRequest: HttpRequest<unknown>;

  beforeEach(() => {
    storedToken = null;
    tokenRequestCount = 0;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthSessionService,
          useValue: {
            getCsrfToken$: () => {
              tokenRequestCount += 1;
              return of({ requestToken: 'new-token' });
            },
          },
        },
        {
          provide: BrowserStorage,
          useValue: {
            sessionGetItem: () => storedToken,
            sessionSetItem: (_key: string, value: string) => (storedToken = value),
          },
        },
      ],
    });
  });

  const execute = async (request: HttpRequest<unknown>): Promise<void> => {
    await firstValueFrom(
      interceptor(request, (forwarded) => {
        forwardedRequest = forwarded;
        return of(new HttpResponse({ status: 200 }));
      }),
    );
  };

  it('does not attach a token to an external request', async () => {
    storedToken = 'existing-token';

    await execute(new HttpRequest('POST', 'https://third-party.example/submit', {}));

    expect(forwardedRequest.headers.has('X-XSRF-TOKEN')).toBe(false);
    expect(tokenRequestCount).toBe(0);
  });

  it('does not fetch a token for a safe API request', async () => {
    await execute(new HttpRequest('GET', `${environment.apiUrl}profile`));

    expect(forwardedRequest.headers.has('X-XSRF-TOKEN')).toBe(false);
    expect(tokenRequestCount).toBe(0);
  });

  it('attaches a stored token to PATCH API requests', async () => {
    storedToken = 'existing-token';

    await execute(new HttpRequest('PATCH', `${environment.apiUrl}profile`, {}));

    expect(forwardedRequest.headers.get('X-XSRF-TOKEN')).toBe('existing-token');
    expect(tokenRequestCount).toBe(0);
  });

  it('fetches, stores, and attaches a missing token for unsafe API requests', async () => {
    await execute(new HttpRequest('POST', `${environment.apiUrl}profile`, {}));

    expect(storedToken).toBe('new-token');
    expect(forwardedRequest.headers.get('X-XSRF-TOKEN')).toBe('new-token');
    expect(tokenRequestCount).toBe(1);
  });
});
