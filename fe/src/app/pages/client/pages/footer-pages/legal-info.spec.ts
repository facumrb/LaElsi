import { describe, expect, it } from 'vitest';
import { LEGAL_INFO } from './legal-info';

// La versión viaja al servidor al registrarse (supabase/functions/_shared/usuarios.ts la valida
// con ^\d{4}-\d{2}-\d{2}$) y se muestra en las páginas legales: las dos tienen que coincidir.
describe('LEGAL_INFO', () => {
  it('la versión tiene el formato AAAA-MM-DD que exige el servidor', () => {
    expect(LEGAL_INFO.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('la fecha que se muestra es la misma que la versión', () => {
    const [year, month, day] = LEGAL_INFO.version.split('-').map(Number);
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];

    expect(LEGAL_INFO.lastUpdate).toBe(`${day} de ${meses[month - 1]} de ${year}`);
  });

  it('los datos opcionales, si están cargados, no traen espacios sobrantes', () => {
    for (const valor of [LEGAL_INFO.legalName, LEGAL_INFO.cuit, LEGAL_INFO.contactEmail]) {
      expect(valor).toBe(valor.trim());
    }
  });
});
