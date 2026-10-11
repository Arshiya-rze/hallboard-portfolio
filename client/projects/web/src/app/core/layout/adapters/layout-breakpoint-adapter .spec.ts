import { TestBed } from '@angular/core/testing';

import { LayoutBreakpointAdapter } from './layout-breakpoint-adapter ';

describe('BreakpointObserverService', () => {
  let service: LayoutBreakpointAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutBreakpointAdapter);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
