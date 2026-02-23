import { HttpClient } from '@angular/common/http';
import { AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError, distinctUntilChanged } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

/**
 * Validador asíncrono genérico para verificar la unicidad de campos en el backend.
 *
 * @param entity Nombre de la entidad (ej: 'Admin', 'Client', 'Product')
 * @param field Nombre del campo a validar (ej: 'email', 'username', 'dni')
 * @param http Instancia de HttpClient
 * @param excludeId ID opcional a excluir (útil en ediciones)
 * @returns AsyncValidatorFn
 */
export function uniqueFieldValidator(
  entity: string,
  field: string,
  http: HttpClient,
  excludeId?: number
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value || control.pristine) {
      return of(null);
    }

    // Usamos un timer para implementar debounceTime manualmente en el validador asíncrono
    // Esto evita peticiones excesivas mientras el usuario escribe.
    return timer(400).pipe(
      switchMap(() => {
        const value = control.value;
        const url = `${environment.apiUrl}/validate-unique`;
        let params: any = { entity, field, value };

        if (excludeId) {
          params.excludeId = excludeId;
        }

        return http.get<any>(url, { params }).pipe(
          map((res) => {
            // Si available es true, devolvemos null (válido)
            // Si available es false, devolvemos el error { [field + 'Taken']: true }
            return res.data.available ? null : { [`${field}Taken`]: true };
          }),
          catchError(() => of(null)) // En caso de error de red, dejamos pasar
        );
      })
    );
  };
}
