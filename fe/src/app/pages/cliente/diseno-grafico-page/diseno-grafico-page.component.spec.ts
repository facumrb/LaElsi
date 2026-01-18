import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisenoGraficoPageComponent } from './diseno-grafico-page.component';

describe('DisenoGraficoPageComponent', () => {
  let component: DisenoGraficoPageComponent;
  let fixture: ComponentFixture<DisenoGraficoPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisenoGraficoPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisenoGraficoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
