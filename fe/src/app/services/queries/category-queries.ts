import { inject } from '@angular/core';
import {
  injectMutation,
  injectQuery,
  injectQueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { ApiCategoryService } from '../api-services/api-category.service';
import { ICreateCategory, IUpdateCategory } from '../../models/category.model';

/**
 * Reactive query for active categories (Public Storefront & Dropdowns)
 */
export function injectActiveCategoriesQuery() {
  const apiCategoryService = inject(ApiCategoryService);

  return injectQuery(() => ({
    queryKey: ['categories', 'active'],
    queryFn: () => firstValueFrom(apiCategoryService.getActiveCategories()),
    staleTime: 1000 * 60 * 15, // 15 minutes fresh
  }));
}

/**
 * Reactive query for category tree (Admin Panel & Navigation)
 */
export function injectCategoryTreeQuery(state?: string) {
  const apiCategoryService = inject(ApiCategoryService);

  return injectQuery(() => ({
    queryKey: ['categories', 'tree', state ?? 'all'],
    queryFn: () => firstValueFrom(apiCategoryService.getCategoryTree(state)),
    staleTime: 1000 * 60 * 10, // 10 minutes fresh
  }));
}

/**
 * Mutation for adding a new category
 */
export function injectAddCategoryMutation() {
  const apiCategoryService = inject(ApiCategoryService);
  const queryClient = injectQueryClient();

  return injectMutation(() => ({
    mutationFn: (newCategory: ICreateCategory) =>
      firstValueFrom(apiCategoryService.addCategory(newCategory)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  }));
}

/**
 * Mutation for updating a category
 */
export function injectUpdateCategoryMutation() {
  const apiCategoryService = inject(ApiCategoryService);
  const queryClient = injectQueryClient();

  return injectMutation(() => ({
    mutationFn: ({ id, category }: { id: number; category: IUpdateCategory }) =>
      firstValueFrom(apiCategoryService.updateCategory(id, category)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  }));
}

/**
 * Mutation for deleting a category
 */
export function injectDeleteCategoryMutation() {
  const apiCategoryService = inject(ApiCategoryService);
  const queryClient = injectQueryClient();

  return injectMutation(() => ({
    mutationFn: (id: number) =>
      firstValueFrom(apiCategoryService.deleteCategory(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  }));
}
