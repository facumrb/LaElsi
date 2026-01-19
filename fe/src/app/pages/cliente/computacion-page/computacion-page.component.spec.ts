import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComputacionPageComponent } from './computacion-page.component';

describe('ComputacionPageComponent', () => {
  let component: ComputacionPageComponent;
  let fixture: ComponentFixture<ComputacionPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComputacionPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComputacionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
