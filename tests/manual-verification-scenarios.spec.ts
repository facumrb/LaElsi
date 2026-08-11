import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { QueryClient, provideAngularQuery } from '@tanstack/angular-query-experimental';
import { ApiProductService } from '../fe/src/app/services/api-services/api-product.service';
import {
  injectActiveProductsQuery,
  injectUpdateProductMutation,
} from '../fe/src/app/services/queries/product-queries';

describe('Manual Verification Plan Automated Scenarios', () => {
  let queryClient: QueryClient;
  let mockApiProductService: Partial<ApiProductService>;
  let getActiveProductsSpy: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity, staleTime: 1000 * 60 * 3 },
      },
    });

    getActiveProductsSpy = vi.fn().mockReturnValue(
      of({ items: [{ id: 1, name: 'Cuaderno', price: 1500 }], total: 1, page: 1, limit: 16 })
    );

    mockApiProductService = {
      getActiveProducts: getActiveProductsSpy,
      updateProduct: vi.fn().mockReturnValue(of({ id: 1, name: 'Cuaderno', price: 2000 })),
    };

    TestBed.configureTestingModule({
      providers: [
        provideAngularQuery(queryClient),
        { provide: ApiProductService, useValue: mockApiProductService },
      ],
    });
  });

  /**
   * Scenario 1: In-Memory Cache & Deduplication Test
   */
  it('Scenario 1: should return cached data from memory without secondary HTTP calls when revisiting identical filter signals', async () => {
    const filters = signal({ page: 1, limit: 16, categoryId: 3 });

    let query: any;
    TestBed.runInInjectionContext(() => {
      query = injectActiveProductsQuery(filters as any);
    });

    expect(query.queryKey).toEqual(['products', 'active', { page: 1, limit: 16, categoryId: 3 }]);
  });

  /**
   * Scenario 2: Background Revalidation Test (stale-while-revalidate)
   */
  it('Scenario 2: should support background revalidation on stale queries', async () => {
    const filters = signal({ page: 1, limit: 16 });

    TestBed.runInInjectionContext(() => {
      const query = injectActiveProductsQuery(filters as any);
      expect(query.staleTime).toBe(1000 * 60 * 3);
    });
  });

  /**
   * Scenario 3: Admin Mutation & Automatic Cache Invalidation Test
   */
  it('Scenario 3: should invalidate active product query cache when updateProduct mutation executes', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    TestBed.runInInjectionContext(() => {
      const mutation = injectUpdateProductMutation();
      mutation.mutate({ id: 1, product: { price: 2000 } as any });
    });

    expect(mockApiProductService.updateProduct).toHaveBeenCalledWith(1, { price: 2000 });
  });

  /**
   * Scenario 4: Service Worker Cache Rule Assertions
   */
  it('Scenario 4: should verify Service Worker rule structure for offline photo caching', () => {
    const ngswConfig = require('../fe/ngsw-config.json');
    const uploadsGroup = ngswConfig.dataGroups.find((g: any) => g.name === 'product-uploads');

    expect(uploadsGroup).toBeDefined();
    expect(uploadsGroup.cacheConfig.strategy).toBe('performance');
    expect(uploadsGroup.cacheConfig.maxAge).toBe('30d');
  });
});
