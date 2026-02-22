import {
  Component,
  input,
  output,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CurrencyPipe, DatePipe, DOCUMENT } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapX,
  bootstrapPerson,
  bootstrapEnvelope,
  bootstrapPhone,
} from '@ng-icons/bootstrap-icons';
import { IApiOrder } from '@models/order.model';
import { environment } from 'src/environments/environment';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';

@Component({
  selector: 'app-order-detail-modal',
  imports: [NgIconComponent, CurrencyPipe, DatePipe, ClickOutsideDirective],
  viewProviders: [
    provideIcons({
      bootstrapX,
      bootstrapPerson,
      bootstrapEnvelope,
      bootstrapPhone,
    }),
  ],
  templateUrl: './order-detail-modal.component.html',
})
export class OrderDetailModalComponent implements OnInit, OnDestroy {
  order = input.required<IApiOrder>();
  showClientInfo = input<boolean>(false); // Opcional: mostrar info de contacto del cliente
  close = output<void>();

  private document = inject(DOCUMENT);
  productImagesUrl = environment.productImagesUrl;

  ngOnInit() {
    this.document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    this.document.body.style.overflow = '';
  }

  onClose() {
    this.close.emit();
  }
}
