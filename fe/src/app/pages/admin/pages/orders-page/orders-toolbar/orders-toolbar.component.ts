import { Component, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapSearch, bootstrapX } from '@ng-icons/bootstrap-icons';

@Component({
    selector: 'app-orders-toolbar',
    imports: [NgIconComponent, FormsModule],
    viewProviders: provideIcons({
        bootstrapSearch,
        bootstrapX,
    }),
    templateUrl: './orders-toolbar.component.html',
})
export class OrdersToolbarComponent {
    searchQuery = model.required<string>();
}
