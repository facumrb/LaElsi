import { Injectable } from '@angular/core';
import { IProductDraft } from '@models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductDraftService {
  private draft: IProductDraft | null = null;

  setDraft(draft: IProductDraft) {
    this.draft = draft;
  }

  getDraft(): IProductDraft | null {
    return this.draft;
  }

  clearDraft() {
    this.draft = null;
  }

  hasDraft(): boolean {
    return this.draft !== null;
  }
}
