import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibreriaPageComponent } from './libreria-page.component';

describe('LibreriaPageComponent', () => {
  let component: LibreriaPageComponent;
  let fixture: ComponentFixture<LibreriaPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibreriaPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibreriaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
