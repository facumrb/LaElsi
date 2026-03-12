import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estado',
})
export class EstadoPipe implements PipeTransform {
  transform(deletedAt: string | null | undefined): string {
    return deletedAt ? 'Inactivo' : 'Activo';
  }
}
