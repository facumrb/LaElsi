import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estado',
  standalone: true
})
export class EstadoPipe implements PipeTransform {
  transform(deletedAt: string | null | undefined): string {
    return deletedAt ? 'Inactivo' : 'Activo';
  }
}
