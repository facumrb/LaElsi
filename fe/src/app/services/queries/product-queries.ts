import { inject, Signal } from '@angular/core';
import {
  injectMutation,
  injectQuery,
  injectQueryClient,
} from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { ApiProductService } from '../api-services/api-product.service';
import {
  IApiProduct,
  ICreateProduct,
  IUpdateProduct,
} from '../../models/product.model';

export interface IProductQueryFilters {
  query?: string;
  state?: string;
  categoryId?: number;
  stockFilter?: string;
  brand?: string;
  priceOrder?: string;
  popularityOrder?: string;
  page?: number;
  limit?: number;
}

/**
 * Reactive query for active products (Public Storefront)
 */
export function injectActiveProductsQuery(
  filtersSignal: Signal<IProductQueryFilters>
) {
  const apiProductService = inject(ApiProductService);

  return injectQuery(() => {
    const filters = filtersSignal();
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 16;

    return {
      queryKey: ['products', 'active', filters],
      queryFn: () => {
        if (filters.query) {
          return firstValueFrom(
            apiProductService.searchProducts(filters.query, page, limit, {
              brand: filters.brand,
              priceOrder: filters.priceOrder,
              popularityOrder: filters.popularityOrder,
            })
          );
        }
        if (filters.categoryId && filters.categoryId !== 0) {
          return firstValueFrom(
            apiProductService.getActiveProductsByCategory(
              filters.categoryId,
              page,
              limit,
              {
                brand: filters.brand,
                priceOrder: filters.priceOrder,
                popularityOrder: filters.popularityOrder,
              }
            )
          );
        }
        return firstValueFrom(apiProductService.getActiveProducts(page, limit));
      },
      staleTime: 1000 * 60 * 3, // 3 minutes
    };
  });
}

/**
 * Reactive query for all products (Admin Panel)
 */
export function injectAllProductsQuery(
  filtersSignal: Signal<IProductQueryFilters>
) {
  const apiProductService = inject(ApiProductService);

  return injectQuery(() => {
    const filters = filtersSignal();
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 16;

    return {
      queryKey: ['products', 'all', filters],
      queryFn: () =>
        firstValueFrom(
          apiProductService.getAllProducts(page, limit, {
            query: filters.query,
            state: filters.state,
            categoryId: filters.categoryId,
            stockFilter: filters.stockFilter,
          })
        ),
      staleTime: 1000 * 60 * 2, // 2 minutes
    };
  });
}

/**
 * Reactive query for a single active product detail
 */
export function injectActiveProductDetailQuery(idSignal: Signal<number>) {
  const apiProductService = inject(ApiProductService);

  return injectQuery(() => {
    const id = idSignal();
    return {
      queryKey: ['products', 'detail', id],
      queryFn: () => firstValueFrom(apiProductService.getActiveProductById(id)),
      enabled: id > 0,
      staleTime: 1000 * 60 * 5, // 5 minutes
    };
  });
}

/**
 * Mutation for adding a new product
 */
export function injectAddProductMutation() {
  const apiProductService = inject(ApiProductService);
  const queryClient = injectQueryClient();

  return injectMutation(() => ({
    mutationFn: (newProduct: ICreateProduct) =>
      firstValueFrom(apiProductService.addProduct(newProduct)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  }));
}

/**
 * Mutation for updating an existing product
 */
export function injectUpdateProductMutation() {
  const apiProductService = inject(ApiProductService);
  const queryClient = injectQueryClient();

  return injectMutation(() => ({
    mutationFn: ({ id, product }: { id: number; product: IUpdateProduct }) =>
      firstValueFrom(apiProductService.updateProduct(id, product)),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'detail', id] });
    },
  }));
}

/**
 * Mutation for deleting a product
 */
export function injectDeleteProductMutation() {
  const apiProductService = inject(ApiProductService);
  const queryClient = injectQueryClient();

  return injectMutation(() => ({
    mutationFn: (id: number) =>
      firstValueFrom(apiProductService.deleteProduct(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  }));
}

/**
 * Mutation for bulk price changes
 */
export function injectBulkPriceMutation() {
  const apiProductService = inject(ApiProductService);
  const queryClient = injectQueryClient();

  return injectMutation(() => ({
    mutationFn: ({
      productIds,
      adjustmentType,
      adjustmentValue,
      roundingRule,
    }: {
      productIds: number[];
      adjustmentType: string;
      adjustmentValue: number;
      roundingRule?: string;
    }) =>
      firstValueFrom(
        apiProductService.applyBulkPriceChange(
          productIds,
          adjustmentType,
          adjustmentValue,
          roundingRule
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  }));
}

/**
 * Query for global best sellers (Home Page)
 */
export function injectBestSellersQuery(limit: number = 10) {
  const apiProductService = inject(ApiProductService);

  return injectQuery(() => ({
    queryKey: ['products', 'best-sellers', limit],
    queryFn: () => firstValueFrom(apiProductService.getBestSellers(limit)),
    staleTime: 1000 * 60 * 10, // 10 minutes — best sellers change less frequently
  }));
}

/**
 * Query for best sellers by category (Home Page carousels)
 */
export function injectBestSellersByCategoryQuery(
  categoryIdSignal: Signal<number>,
  limit: number = 10
) {
  const apiProductService = inject(ApiProductService);

  return injectQuery(() => {
    const categoryId = categoryIdSignal();
    return {
      queryKey: ['products', 'best-sellers', 'category', categoryId, limit],
      queryFn: () =>
        firstValueFrom(apiProductService.getBestSellersByCategory(categoryId, limit)),
      enabled: categoryId > 0,
      staleTime: 1000 * 60 * 10, // 10 minutes
    };
  });
}

