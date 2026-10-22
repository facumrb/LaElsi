import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { FooterComponent } from './footer.component';

// Google exige que la política de privacidad esté enlazada desde el inicio, y la Res. 424/2020
// que el botón de arrepentimiento sea accesible desde ahí.
describe('FooterComponent: enlaces legales', () => {
  function enlaces(): string[] {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a')).map(
      (a) => a.getAttribute('href') ?? '',
    );
  }

  it('enlaza la Política de Privacidad, los Términos y el botón de arrepentimiento', () => {
    const hrefs = enlaces();

    expect(hrefs).toContain('/privacidad');
    expect(hrefs).toContain('/terminos');
    expect(hrefs).toContain('/arrepentimiento');
  });
});
