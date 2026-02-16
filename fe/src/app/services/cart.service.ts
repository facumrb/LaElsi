import { Injectable, signal, computed } from '@angular/core';
import { ICartItem } from '@models/cart.model';
import { IApiProduct } from '@models/product.model';

@Injectable({
    providedIn: 'root',
})
export class CartService {
    private readonly STORAGE_KEY = 'laelsi_cart';

    // Usamos señales para una reactividad moderna
    private cartItemsSignal = signal<ICartItem[]>(this.loadFromStorage());

    // Selectores
    items = computed(() => this.cartItemsSignal());

    totalItems = computed(() =>
        this.cartItemsSignal().reduce((acc, item) => acc + item.quantity, 0)
    );

    totalAmount = computed(() =>
        this.cartItemsSignal().reduce((acc, item) => {
            const price = item.product.prices?.find(p => p.isCurrent)?.amount || 0;
            return acc + (price * item.quantity);
        }, 0)
    );

    constructor() { }

    private loadFromStorage(): ICartItem[] {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    private saveToStorage(items: ICartItem[]) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
        this.cartItemsSignal.set(items);
    }

    addToCart(product: IApiProduct, quantity: number = 1) {
        const currentItems = [...this.cartItemsSignal()];
        const existingIndex = currentItems.findIndex(item => item.product.id === product.id);

        if (existingIndex !== -1) {
            currentItems[existingIndex].quantity += quantity;
        } else {
            currentItems.push({ product, quantity });
        }

        this.saveToStorage(currentItems);
    }

    updateQuantity(productId: number, quantity: number) {
        let currentItems = [...this.cartItemsSignal()];
        const index = currentItems.findIndex(item => item.product.id === productId);

        if (index !== -1) {
            if (quantity <= 0) {
                currentItems.splice(index, 1);
            } else {
                currentItems[index].quantity = quantity;
            }
            this.saveToStorage(currentItems);
        }
    }

    removeFromCart(productId: number) {
        const currentItems = this.cartItemsSignal().filter(item => item.product.id !== productId);
        this.saveToStorage(currentItems);
    }

    clearCart() {
        this.saveToStorage([]);
    }
}
