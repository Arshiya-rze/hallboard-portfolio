import { TestBed } from '@angular/core/testing';

import { LoadingService } from '../services/loading-service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('stays loading until every concurrent request has finished', () => {
    service.show();
    service.show();

    service.hide();
    expect(service.isLoadingSig()).toBe(true);

    service.hide();
    expect(service.isLoadingSig()).toBe(false);
  });

  it('does not underflow when hide is called without a pending request', () => {
    service.hide();

    expect(service.isLoadingSig()).toBe(false);
  });
});
