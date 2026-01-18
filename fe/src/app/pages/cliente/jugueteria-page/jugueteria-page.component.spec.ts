import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JugueteriaPageComponent } from './jugueteria-page.component';

describe('JugueteriaPageComponent', () => {
  let component: JugueteriaPageComponent;
  let fixture: ComponentFixture<JugueteriaPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JugueteriaPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JugueteriaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
