import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapChevronLeft,
  bootstrapChevronRight,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-pagination',
  imports: [NgIconComponent],
  templateUrl: './pagination.component.html',
  viewProviders: [
    provideIcons({
      bootstrapChevronLeft,
      bootstrapChevronRight,
    }),
  ],
})
export class PaginationComponent {
  private el = inject(ElementRef);

  currentPage = input.required<number>();
  totalPages = input.required<number>();
  pageChange = output<number>();

  // Genera la lógica de las páginas con puntos suspensivos (...)
  // si hay muchísimas páginas, mostrando siempre la primera, la última, y las cercanas al centro.
  visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
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
    if (page !== this.currentPage() && page >= 1 && page <= this.totalPages()) {
      const scrollable = this.findScrollableParent(this.el.nativeElement);

      if (scrollable && scrollable.scrollTop > 0) {
        scrollable.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => this.pageChange.emit(page), 250);
      } else if (!scrollable && window.scrollY > 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => this.pageChange.emit(page), 250);
      } else {
        this.pageChange.emit(page);
      }
    }
  }

  private findScrollableParent(element: HTMLElement): HTMLElement | null {
    let parent = element.parentElement;
    while (parent) {
      const style = getComputedStyle(parent);
      const overflow = style.overflowY;
      if (overflow === 'auto' || overflow === 'scroll') {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }
}
