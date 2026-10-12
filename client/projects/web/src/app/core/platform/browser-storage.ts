import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Service } from '@angular/core';

@Service()
export class BrowserStorage {
    private readonly _platformId = inject(PLATFORM_ID);

    //#region Local
    localSetItem<T>(key: string, valueObject: T): void {
        if (isPlatformBrowser(this._platformId)) {
            localStorage.setItem(key, JSON.stringify(valueObject));
        }
    }

    localGetItem<T>(key: string): T | null {
        if (isPlatformBrowser(this._platformId)) {
            const valueStr: string | null = localStorage.getItem(key);

            return valueStr === null ? null : JSON.parse(valueStr) as T;
        }

        return null;
    }

    localRemoveItem(key: string): void {
        if (isPlatformBrowser(this._platformId)) {
            localStorage.removeItem(key);
        }
    }

    localClear(): void {
        if (isPlatformBrowser(this._platformId)) {
            localStorage.clear();
        }
    }

    localLength(): number | null {
        return isPlatformBrowser(this._platformId) ? localStorage.length : null;
    }

    localKey(index: number): string | null {
        return isPlatformBrowser(this._platformId) ? localStorage.key(index) : null;
    }
    //#endregion Local

    //#region Session
    sessionSetItem<T>(key: string, valueObject: T): void {
        if (isPlatformBrowser(this._platformId)) {
            sessionStorage.setItem(key, JSON.stringify(valueObject));
        }
    }

    sessionGetItem<T>(key: string): T | null {
        if (isPlatformBrowser(this._platformId)) {
            const valueStr: string | null = sessionStorage.getItem(key);

            return valueStr === null ? null : JSON.parse(valueStr) as T;
        }

        return null;
    }

    sessionRemoveItem(key: string): void {
        if (isPlatformBrowser(this._platformId)) {
            sessionStorage.removeItem(key);
        }
    }

    sessionClear(): void {
        if (isPlatformBrowser(this._platformId)) {
            sessionStorage.clear();
        }
    }

    sessionLength(): number | null {
        return isPlatformBrowser(this._platformId) ? sessionStorage.length : null;
    }

    sessionKey(index: number): string | null {
        return isPlatformBrowser(this._platformId) ? sessionStorage.key(index) : null;
    }
    //#endregion Session
}
