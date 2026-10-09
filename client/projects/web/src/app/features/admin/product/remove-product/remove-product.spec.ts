import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoveProduct } from './remove-product';

describe('RemoveProduct', () => {
  let component: RemoveProduct;
  let fixture: ComponentFixture<RemoveProduct>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemoveProduct],
    }).compileComponents();

    fixture = TestBed.createComponent(RemoveProduct);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
