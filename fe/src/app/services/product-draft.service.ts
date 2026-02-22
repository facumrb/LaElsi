import { Injectable } from '@angular/core';

export interface IProductDraft {
  formValue: any;
  isEditMode: boolean;
  productId: number | null;
  photos: any[];
  photosToDeleteIds: number[];
  returnUrl: string;
}

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
