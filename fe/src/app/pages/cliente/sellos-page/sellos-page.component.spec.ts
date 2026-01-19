import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellosPageComponent } from './sellos-page.component';

describe('SellosPageComponent', () => {
  let component: SellosPageComponent;
  let fixture: ComponentFixture<SellosPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellosPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SellosPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
