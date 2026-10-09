import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiLoadingSpinner } from './ui-loading-spinner';

describe('UiLoadingSpinner', () => {
  let component: UiLoadingSpinner;
  let fixture: ComponentFixture<UiLoadingSpinner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiLoadingSpinner],
    }).compileComponents();

    fixture = TestBed.createComponent(UiLoadingSpinner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
