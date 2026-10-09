import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiLoadingProgressBar } from './ui-loading-progress-bar';

describe('UiLoadingProgressBar', () => {
  let component: UiLoadingProgressBar;
  let fixture: ComponentFixture<UiLoadingProgressBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiLoadingProgressBar],
    }).compileComponents();

    fixture = TestBed.createComponent(UiLoadingProgressBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
