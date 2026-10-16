import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
} from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapExclamationTriangle } from '@ng-icons/bootstrap-icons';
import { CloseModalButtonComponent } from '@shared/components/buttons/close-modal-button/close-modal-button.component';

@Component({
  selector: 'app-confirm-delete-modal',
  imports: [A11yModule, NgIconComponent, CloseModalButtonComponent],
  viewProviders: [
    provideIcons({
      bootstrapExclamationTriangle,
    }),
  ],
  templateUrl: './confirm-delete-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteModalComponent {
  entityName = input.required<string>();
  entityType = input<string>('registro');
  canDeactivate = input<boolean>(true);
  isDeactivated = input<boolean>(false);
  confirmDelete = output<void>();
  confirmDeactivate = output<void>();
  close = output<void>();

  onClose(): void {
    this.close.emit();
  }

  onConfirmDelete(): void {
    this.confirmDelete.emit();
  }

  onConfirmDeactivate(): void {
    this.confirmDeactivate.emit();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.onClose();
  }
}
