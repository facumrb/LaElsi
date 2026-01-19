import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpresionesPageComponent } from './impresiones-page.component';

describe('ImpresionesPageComponent', () => {
  let component: ImpresionesPageComponent;
  let fixture: ComponentFixture<ImpresionesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpresionesPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpresionesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
