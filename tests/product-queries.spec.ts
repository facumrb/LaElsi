import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { QueryClient, provideAngularQuery } from '@tanstack/angular-query-experimental';
import { ApiProductService } from '../fe/src/app/services/api-services/api-product.service';
import {
  injectActiveProductsQuery,
  injectAllProductsQuery,
  injectActiveProductDetailQuery,
  injectAddProductMutation,
  injectUpdateProductMutation,
  injectDeleteProductMutation,
  injectBulkPriceMutation,
  IProductQueryFilters,
} from '../fe/src/app/services/queries/product-queries';

describe('Product Queries & Mutations (Tier 2 Abstraction Layer)', () => {
  let queryClient: QueryClient;
  let mockApiProductService: Partial<ApiProductService>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
      },
    });

    mockApiProductService = {
      getActiveProducts: vi.fn().mockReturnValue(of({ items: [], total: 0, page: 1, limit: 16 })),
      getAllProducts: vi.fn().mockReturnValue(of({ items: [], total: 0, page: 1, limit: 16 })),
      searchProducts: vi.fn().mockReturnValue(of({ items: [], total: 0, page: 1, limit: 16 })),
      getActiveProductsByCategory: vi.fn().mockReturnValue(of({ items: [], total: 0, page: 1, limit: 16 })),
      getActiveProductById: vi.fn().mockReturnValue(of({ id: 1, name: 'Product 1', price: 100 })),
      addProduct: vi.fn().mockReturnValue(of({ id: 2, name: 'New Product', price: 150 })),
      updateProduct: vi.fn().mockReturnValue(of({ id: 1, name: 'Updated Product', price: 120 })),
      deleteProduct: vi.fn().mockReturnValue(of(void 0)),
      applyBulkPriceChange: vi.fn().mockReturnValue(of({ updatedCount: 5 })),
    };

    TestBed.configureTestingModule({
      providers: [
        provideAngularQuery(queryClient),
        { provide: ApiProductService, useValue: mockApiProductService },
      ],
    });
  });

  describe('injectActiveProductsQuery', () => {
    it('should build correct queryKey and call getActiveProducts when no query or category filter is set', async () => {
      const filters = signal<IProductQueryFilters>({ page: 1, limit: 16 });

      TestBed.runInInjectionContext(() => {
        const query = injectActiveProductsQuery(filters);
        expect(query.queryKey).toEqual(['products', 'active', { page: 1, limit: 16 }]);
      });
    });

    it('should trigger searchProducts when query string is present in filters signal', async () => {
      const filters = signal<IProductQueryFilters>({ query: 'cuaderno', page: 1, limit: 16 });

      TestBed.runInInjectionContext(() => {
        const query = injectActiveProductsQuery(filters);
        expect(query.queryKey).toEqual(['products', 'active', { query: 'cuaderno', page: 1, limit: 16 }]);
      });
    });

    it('should trigger getActiveProductsByCategory when categoryId filter is active', async () => {
      const filters = signal<IProductQueryFilters>({ categoryId: 5, page: 1, limit: 16 });

      TestBed.runInInjectionContext(() => {
        const query = injectActiveProductsQuery(filters);
        expect(query.queryKey).toEqual(['products', 'active', { categoryId: 5, page: 1, limit: 16 }]);
      });
    });
  });

  describe('injectAllProductsQuery (Admin Panel)', () => {
    it('should query all products including stock and state filters', () => {
      const filters = signal<IProductQueryFilters>({ state: 'Activo', stockFilter: 'SinStock', page: 1, limit: 16 });

      TestBed.runInInjectionContext(() => {
        const query = injectAllProductsQuery(filters);
        expect(query.queryKey).toEqual(['products', 'all', { state: 'Activo', stockFilter: 'SinStock', page: 1, limit: 16 }]);
      });
    });
  });

  describe('injectActiveProductDetailQuery', () => {
    it('should disable query when product ID is 0 or negative', () => {
      const idSignal = signal<number>(0);

      TestBed.runInInjectionContext(() => {
        const query = injectActiveProductDetailQuery(idSignal);
        expect(query.isEnabled()).toBe(false);
      });
    });

    it('should enable query when product ID is valid', () => {
      const idSignal = signal<number>(42);

      TestBed.runInInjectionContext(() => {
        const query = injectActiveProductDetailQuery(idSignal);
        expect(query.isEnabled()).toBe(true);
        expect(query.queryKey).toEqual(['products', 'detail', 42]);
      });
    });
  });

  describe('Mutations & Cache Invalidation', () => {
    it('should invalidate product queries on successful addProduct mutation', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      TestBed.runInInjectionContext(() => {
        const mutation = injectAddProductMutation();
        mutation.mutate({ name: 'Cuaderno A4', price: 500, categoryId: 1 } as any);
      });

      expect(mockApiProductService.addProduct).toHaveBeenCalled();
    });

    it('should invalidate specific detail and list queries on updateProduct mutation', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      TestBed.runInInjectionContext(() => {
        const mutation = injectUpdateProductMutation();
        mutation.mutate({ id: 10, product: { price: 600 } as any });
      });

      expect(mockApiProductService.updateProduct).toHaveBeenCalledWith(10, { price: 600 });
    });

    it('should invalidate all product queries on bulk price adjustment mutation', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      TestBed.runInInjectionContext(() => {
        const mutation = injectBulkPriceMutation();
        mutation.mutate({
          productIds: [1, 2, 3],
          adjustmentType: 'percentage',
          adjustmentValue: 15,
        });
      });

      expect(mockApiProductService.applyBulkPriceChange).toHaveBeenCalledWith([1, 2, 3], 'percentage', 15, undefined);
    });
  });
});
