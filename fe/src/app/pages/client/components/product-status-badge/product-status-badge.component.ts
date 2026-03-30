import { Component, computed, input } from '@angular/core';
import { ProductState } from '@models/product.model';

@Component({
  selector: 'app-product-status-badge',
  templateUrl: './product-status-badge.component.html',
})
export class ProductStatusBadgeComponent {
  state = input.required<ProductState>();
  stock = input.required<number>();
  showStock = input<boolean>(false);

  /**
   * 'badge': Estilo compacto para tarjetas o listados.
   * 'banner': Estilo ancho completo para la página de producto.
   * 'overlay': Estilo con fondo oscuro para superponer en imágenes.
   */
  mode = input<'badge' | 'banner' | 'overlay'>('badge');

  status = computed(() => {
    const s = this.state();
    const st = this.stock();
    const isPaused = s === ProductState.Inactivo;
    const isOutOfStock = s === ProductState.Activo && st <= 0;
    const m = this.mode();

    let classes =
      'transition-all duration-300 flex items-center justify-center ';

    if (m === 'banner') {
      classes += 'w-full py-3 px-4 rounded-xl border text-sm font-bold ';
    } else if (m === 'overlay') {
      classes +=
        'px-4 py-1.5 rounded-md shadow-sm text-xs font-bold tracking-widest ';
    } else {
      classes += 'px-2.5 py-1 rounded-lg border text-[11px] font-black ';
    }

    if (isPaused) {
      classes += 'bg-gray-100 text-gray-500 border-gray-200';
    } else if (isOutOfStock) {
      if (m === 'overlay') {
        classes += 'bg-gray-800 text-white';
      } else {
        classes += 'bg-red-50 text-red-700 border-red-200';
      }
    } else {
      classes += 'bg-green-50 text-green-700 border-green-200';
    }

    return { isPaused, isOutOfStock, classes };
  });
}
