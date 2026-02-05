import { TableActionsComponent } from '@admin/components/table-actions/table-actions.component';
import { Component, input, output } from '@angular/core';
import { IApiCategory } from '@models/category.model';
import Swal from 'sweetalert2';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapSearch, bootstrapInbox } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-categories-list',
  imports: [TableActionsComponent, NgIconComponent],
  viewProviders: provideIcons({ bootstrapSearch, bootstrapInbox }),
  templateUrl: './categories-list.component.html',
})
export class CategoriesListComponent {
  categories = input.required<IApiCategory[]>();
  onEdit = output<IApiCategory>();
  onDelete = output<IApiCategory>();
  isFilterActive = input<boolean>(false);

  viewProducts(category: IApiCategory) {
    if (!category.products || category.products.length === 0) return;

    const listaHtml = category.products
      .map((product) => `<li class="mb-1"><b>${product.name}</b></li>`)
      .join('');

    Swal.fire({
      title: `Productos en ${category.name}`,
      html: `
      <ol class="list-decimal text-left pl-6 space-y-2 mt-4 text-sm text-gray-700 max-h-60 overflow-y-auto border border-gray-200 p-4 rounded-md">
        ${listaHtml}
      </ol>
    `,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3d4494',
      width: '400px',
    });
  }
}
