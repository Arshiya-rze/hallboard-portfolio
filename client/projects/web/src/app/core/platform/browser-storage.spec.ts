import { TestBed } from '@angular/core/testing';

import { BrowserStorage } from './browser-storage';

describe('BrowserStorage', () => {
  let service: BrowserStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BrowserStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
