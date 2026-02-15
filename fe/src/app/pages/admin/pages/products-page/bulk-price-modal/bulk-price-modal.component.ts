import { Component, inject, input, output, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
    bootstrapCurrencyDollar,
    bootstrapX,
    bootstrapEye,
    bootstrapArrowClockwise,
    bootstrapExclamationTriangle
} from '@ng-icons/bootstrap-icons';
import { ApiProductService } from '@services/api-product.service';
import { AlertService } from '@shared/alert.service';
import { ApiErrorService } from '@shared/api-error.service';

@Component({
    selector: 'app-bulk-price-modal',
    standalone: true,
    imports: [CommonModule, NgIconComponent, CurrencyPipe],
    viewProviders: [
        provideIcons({
            bootstrapCurrencyDollar,
            bootstrapX,
            bootstrapEye,
            bootstrapArrowClockwise,
            bootstrapExclamationTriangle
        })
    ],
    templateUrl: './bulk-price-modal.component.html'
})
export class BulkPriceModalComponent {
    private _apiService = inject(ApiProductService);
    private _alertService = inject(AlertService);
    private _errorService = inject(ApiErrorService);

    productIds = input.required<number[]>();

    close = output<void>();
    success = output<void>();

    adjustmentType = signal<'percentage' | 'fixed'>('percentage');
    adjustmentValue = signal<number>(0);
    roundingRule = signal<string>('nearest-integer');

    previewData = signal<any[]>([]);
    loadingPreview = signal(false);
    loadingApply = signal(false);

    hasErrors = computed(() => this.previewData().some(item => !item.isValid));
    allInvalid = computed(() => this.previewData().length > 0 && this.previewData().every(item => !item.isValid));

    setAdjustmentType(type: 'percentage' | 'fixed') {
        this.adjustmentType.set(type);
        this.previewData.set([]); // Limpiar preview si cambia la configuración
    }

    onValueChange(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.adjustmentValue.set(Number(value) || 0);
    }

    onRoundingChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        this.roundingRule.set(value);
    }

    getPreview() {
        if (this.productIds().length === 0) return;

        this.loadingPreview.set(true);
        this._apiService.previewBulkPriceChange(
            this.productIds(),
            this.adjustmentType(),
            this.adjustmentValue(),
            this.roundingRule()
        ).subscribe({
            next: (data) => {
                this.previewData.set(data);
                this.loadingPreview.set(false);
            },
            error: (err) => {
                this._errorService.handle(err, 'generar la vista previa');
                this.loadingPreview.set(false);
            }
        });
    }

    onApply() {
        if (this.allInvalid()) return;

        this._alertService.confirmDelete('Se actualizarán los precios de los productos válidos.').then(confirm => {
            if (confirm) {
                this.loadingApply.set(true);
                this._apiService.applyBulkPriceChange(
                    this.productIds(),
                    this.adjustmentType(),
                    this.adjustmentValue(),
                    this.roundingRule()
                ).subscribe({
                    next: (res) => {
                        this._alertService.toast(`Actualización completada: ${res.updatedCount} productos actualizados.`, 'success');
                        this.loadingApply.set(false);
                        this.success.emit();
                    },
                    error: (err) => {
                        this._errorService.handle(err, 'aplicar los cambios de precio');
                        this.loadingApply.set(false);
                    }
                });
            }
        });
    }

    closeOnBackdrop(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            this.close.emit();
        }
    }
}
