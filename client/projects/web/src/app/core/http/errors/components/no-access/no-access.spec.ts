import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoAccess } from './no-access';

describe('NoAccess', () => {
  let component: NoAccess;
  let fixture: ComponentFixture<NoAccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoAccess],
    }).compileComponents();

    fixture = TestBed.createComponent(NoAccess);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
