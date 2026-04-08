import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
} from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapChevronLeft, bootstrapChevronRight } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [NgIconComponent],
  viewProviders: [
    provideIcons({
      bootstrapChevronLeft,
      bootstrapChevronRight,
    }),
  ],
  template: `
    @if (totalPages > 1) {
      <div class="flex items-center justify-center gap-2 mt-8 mb-4">
        <!-- Botón Anterior -->
        <button
          (click)="onPageChange(currentPage - 1)"
          [disabled]="currentPage === 1"
          class="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          <ng-icon name="bootstrapChevronLeft" class="text-lg"></ng-icon>
        </button>

        <!-- Números de Página -->
        @for (page of visiblePages(); track page) {
          @if (page === -1) {
            <span class="flex items-center justify-center w-10 h-10 text-gray-400">...</span>
          } @else {
            <button
              (click)="onPageChange(page)"
              [class]="
                page === currentPage
                  ? 'flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-600 text-white font-medium shadow-sm transition-colors'
                  : 'flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors'
              "
            >
              {{ page }}
            </button>
          }
        }

        <!-- Botón Siguiente -->
        <button
          (click)="onPageChange(currentPage + 1)"
          [disabled]="currentPage === totalPages"
          class="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          <ng-icon name="bootstrapChevronRight" class="text-lg"></ng-icon>
        </button>
      </div>
    }
  `,
})
export class PaginationComponent {
  @Input({ required: true }) currentPage!: number;
  @Input({ required: true }) totalPages!: number;
  @Output() pageChange = new EventEmitter<number>();

  /**
   * Computed property que genera la lógica de las páginas con puntos suspensivos (...)
   * si hay muchísimas páginas, mostrando siempre la primera, la última, y las cercanas al centro.
   */
  visiblePages = computed(() => {
    const current = this.currentPage;
    const total = this.totalPages;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (current > 3) pages.push(-1); // -1 representa "..."

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) pages.push(-1); // -1 representa "..."

    pages.push(total);

    return pages;
  });

  onPageChange(page: number) {
    if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }
}
