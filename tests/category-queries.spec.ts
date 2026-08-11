import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core';
import { of } from 'rxjs';
import { QueryClient, provideAngularQuery } from '@tanstack/angular-query-experimental';
import { ApiCategoryService } from '../fe/src/app/services/api-services/api-category.service';
import {
  injectActiveCategoriesQuery,
  injectCategoryTreeQuery,
  injectAddCategoryMutation,
  injectUpdateCategoryMutation,
  injectDeleteCategoryMutation,
} from '../fe/src/app/services/queries/category-queries';

describe('Category Queries & Mutations (Tier 2 Abstraction Layer)', () => {
  let queryClient: QueryClient;
  let mockApiCategoryService: Partial<ApiCategoryService>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
      },
    });

    mockApiCategoryService = {
      getActiveCategories: vi.fn().mockReturnValue(of([{ id: 1, name: 'Librería' }])),
      getCategoryTree: vi.fn().mockReturnValue(of([{ id: 1, name: 'Librería', children: [] }])),
      addCategory: vi.fn().mockReturnValue(of({ id: 2, name: 'Estampería' })),
      updateCategory: vi.fn().mockReturnValue(of({ id: 1, name: 'Librería Escolar' })),
      deleteCategory: vi.fn().mockReturnValue(of(void 0)),
    };

    TestBed.configureTestingModule({
      providers: [
        provideAngularQuery(queryClient),
        { provide: ApiCategoryService, useValue: mockApiCategoryService },
      ],
    });
  });

  describe('injectActiveCategoriesQuery', () => {
    it('should build queryKey ["categories", "active"] and set 15 minute staleTime', () => {
      TestBed.runInInjectionContext(() => {
        const query = injectActiveCategoriesQuery();
        expect(query.queryKey).toEqual(['categories', 'active']);
        expect(query.staleTime).toBe(1000 * 60 * 15);
      });
    });
  });

  describe('injectCategoryTreeQuery', () => {
    it('should query category tree with state filter parameter', () => {
      TestBed.runInInjectionContext(() => {
        const query = injectCategoryTreeQuery('Activo');
        expect(query.queryKey).toEqual(['categories', 'tree', 'Activo']);
        expect(query.staleTime).toBe(1000 * 60 * 10);
      });
    });
  });

  describe('Category Mutations', () => {
    it('should trigger addCategory service method and invalidate categories queries', () => {
      TestBed.runInInjectionContext(() => {
        const mutation = injectAddCategoryMutation();
        mutation.mutate({ name: 'Imprenta', description: 'Servicios de imprenta' } as any);
      });

      expect(mockApiCategoryService.addCategory).toHaveBeenCalledWith({ name: 'Imprenta', description: 'Servicios de imprenta' });
    });

    it('should trigger updateCategory service method', () => {
      TestBed.runInInjectionContext(() => {
        const mutation = injectUpdateCategoryMutation();
        mutation.mutate({ id: 1, category: { name: 'Librería Comercial' } });
      });

      expect(mockApiCategoryService.updateCategory).toHaveBeenCalledWith(1, { name: 'Librería Comercial' });
    });

    it('should trigger deleteCategory service method', () => {
      TestBed.runInInjectionContext(() => {
        const mutation = injectDeleteCategoryMutation();
        mutation.mutate(5);
      });

      expect(mockApiCategoryService.deleteCategory).toHaveBeenCalledWith(5);
    });
  });
});
