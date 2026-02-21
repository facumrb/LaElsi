import { Component, EventEmitter, input, Output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapXLg } from '@ng-icons/bootstrap-icons';
import { IApiOrder } from '@models/order.model';
import { environment } from 'src/environments/environment';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';

@Component({
  selector: 'app-profile-order-modal',
  imports: [NgIconComponent, CurrencyPipe, DatePipe, ClickOutsideDirective],
  viewProviders: [
    provideIcons({
      bootstrapXLg,
    }),
  ],
  templateUrl: './profile-order-modal.component.html',
})
export class ProfileOrderModalComponent {
  order = input.required<IApiOrder>();
  @Output() close = new EventEmitter<void>();

  productImagesUrl = environment.productImagesUrl;

  onClose() {
    this.close.emit();
  }
}
