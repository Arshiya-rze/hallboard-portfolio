import { computed, Service, signal } from '@angular/core';

@Service()
export class LoadingService {
    private readonly pendingRequestCountSig = signal(0);

    // Used in LoadingOverlay
    readonly isLoadingSig = computed(() => this.pendingRequestCountSig() > 0);

    // Used in LoadingInterceptor
    show(): void {
        this.pendingRequestCountSig.update(count => count + 1);
    }

    hide(): void {
        this.pendingRequestCountSig.update(count => Math.max(0, count - 1));
    }
}

/* USE_CASE:
@if (loadingService.isLoading()) {
      <app-loading-overlay />
    }
*/

/* HANDLES THIS SCENARIO:
1. Request A starts → loading is shown.
2. Request B starts → loading remains shown.
3. Request A finishes → a boolean-based hide() would incorrectly hide it.
4. Request B is still running.
*/
